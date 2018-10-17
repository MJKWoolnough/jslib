offer((async function() {
	const {Subscription} = await include("inter.js"),
	      {HTTPRequest, WS} = await include("conn.js"),
	      closedErr = Object.freeze(new Error("RPC Closed")),
	      nop = () => {},
	      Request = class {
		constructor() {
			this.success = nop;
			this.error = nop;
		}
		getPromise() {
			return new Promise((successFn, errorFn) => {
				this.success = successFn;
				this.error = errorFn;
			});
		}
		subscribed() {
			return false;
		}
	      },
	      AwaitRequest = class {
		constructor() {
			this.clearPromise()
			this.subscription = null;
			this.subscriptionSuccess = nop;
			this.subscriptionError = nop;
		}
		getPromise() {
			if (this.promise === null) {
				this.promise =  new Promise((successFn, errorFn) => {
					this.promiseSuccess = successFn;
					this.promiseError = errorFn;
				});
			}
			return this.promise;
		}
		getSubscription() {
			if (this.subscription === null) {
				this.subscription = new Subscription((successFn, errorFn) => {
					this.subscriptionSuccess = successFn;
					this.subscriptionError = errorFn;
				});
			}
			return this.subscription;
		}
		clearPromise() {
			this.promise = null;
			this.promiseSuccess = nop;
			this.promiseError = nop;
		}
		success(data) {
			this.promiseSuccess(data);
			this.clearPromise();
			this.subscriptionSuccess(data);
		}
		error(e) {
			this.promiseError(e);
			this.clearPromise();
			this.subscriptionError(e);
		}
		subscribed() {
			return this.subscription !== null;
		}
	      },
	      RequestHandler = class {
		constructor(sender) {
			this.closed = false;
			this.nextID = 0;
			this.requests = new Map();
			this.sender = sender;
		}
		handleMessage(e) {
			const data = JSON.parse(e.data),
			      id = parseInt(data["id"]);
			if (!this.requests.has(id)) {
				return;
			}
			const req = this.requests.get(id);
			if (data["error"] !== undefined && data["error"] !== null) {
				req.error(new Error(data["error"]));
			} else {
				req.success(data["result"]);
			}
			if (!req.subscribed()) {
				this.requests.delete(id)
			}
		}
		handleError(e) {
			if (!this.closed) {
				this.closed = true;
				if (e.hasOwnProperty("type") && e["type"] === "close") {
					const err = new Error("Closed: " + e.code);
					err.name = "closed";
					this.requests.forEach(r => r.error(err));
				} else {
					const err = e instanceof Error ? e : new Error("error");
					this.requests.forEach(r => r.error(err));
				}
				this.requests.clear();
			}
		}
		getRequest(id) {
			if (this.requests.has(id)) {
				return this.requests.get(id);
			}
			const r = id >= 0 ? new Request() : new AwaitRequest();
			this.requests.set(id, r);
			return r;
		}
		request(method, data = null) {
			if (this.closed) {
				return Promise.reject(closedErr);
			}
			this.sender(JSON.stringify({
				"method": method,
				"id": this.nextID,
				"params": [data]
			}));
			return this.getRequest(this.nextID++).getPromise();
		}
		await(id, keep = false) {
			if (this.closed) {
				return Promise.reject(closedErr);
			}
			if (id >= 0) {
				return Promise.reject(new Error("await IDs must be < 0"))
			}
			if (keep) {
				return this.getRequest(id).getSubscription();
			}
			return this.getRequest(id).getPromise();
		}
		close() {
			if (this.closed) {
				return false;
			}
			this.closed = true;
			this.requests.forEach(r => r.error(closedErr));
			return true;
		}
	      },
	      connectWS = function(path, allowXH, xhPing) {
		return WS(path).then(ws => {
			const rh = new RequestHandler(ws.send),
			      closer = function() {
				if (rh.close()) {
					ws.close();
				}
			      };
			ws.when(rh.handleMessage.bind(rh), rh.handleError.bind(rh));
			window.addEventListener("beforeunload", closer);
			return Object.freeze({
				"request": rh.request.bind(rh),
				"await": rh.await.bind(rh),
				"close": (...data) => {
					if (rh.close()) {
						ws.close(...data);
						window.removeEventListener("beforeunload", closer);
					}
				}
			});
		}, e => {
			if (allowXH) {
				return connectXH(path, xhPing);
			}
			return Promise.reject(e);
		});
	      },
	      connectXH = async function(path, xhPing) {
		const {split} = await include("json.js"),
		      todo = [],
		      sto = -1,
		      si = -1,
		      sender = function() {
			HTTPRequest(path, {
				"method": "POST",
				"type": "application/json",
				"repsonse": "text",
				"headers": headerID,
				"data": todo.join()
			}).then(responseText => split(responseText).forEach(data => rh.handleMessage({data}))).catch(rh.handleError);
			todo.splice(0, todo.length);
			sto = -1;
		      },
		      rh = new RequestHandler(function(msg) {
			todo.push(msg);
			if (sto === -1) {
				if (si !== -1) {
					window.clearInterval(si);
					si = window.setInterval(sender, xhPing);
				}
				sto = window.setTimeout(sender, 1);
			}
		      }),
		      headerID = Object.freeze({"X-RPCID": Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("")});
		return Promise.resolve(Object.freeze({
			"request": rh.request.bind(rh),
			"await": (id, keep = false) => {
				if (si === -1 && xhPing > 0) {
					si = window.setInterval(sender, xhPing);
				}
				return rh.await(id, keep)
			},
			"close": () => {
				if (rh.close() && sto !== -1) {
					window.clearTimeout(sto);
					sto = -1;
				}
			}
		}));
	      },
	      RPC = function(path, allowWS = true, allowXH = false, xhPing = 1000) {
		if (allowWS) {
			return connectWS(path, allowXH, xhPing);
		} else if (allowXH) {
			return connectXH(path, xhPing);
		}
		return Promise.reject(new Error("no connecion available"));
	      };
	return Object.freeze({RPC});
}()));
