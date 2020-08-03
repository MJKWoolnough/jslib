export class Pipe {
	constructor() {
		const out = [];
		this.send = data => out.forEach(o => o(data));
		this.receive = fn => {
			if (fn instanceof Function) {
				out.push(fn);
			} else if (fn !== null && fn !== undefined) {
				throw new TypeError("pipe.receive requires function type");
			}
		}
	}
}

export class Requester {
	constructor() {
		let r;
		this.request = (...data) => {
			if (r) {
				return r(...data);
			}
			throw new Error("no responder set");
		};
		this.responder = fn => {
			if (!(fn instanceof Function)) {
				throw new TypeError("Requester.responder requires function type");
			}
			r = fn;
		};
	}
}


const subs = new WeakMap();

export class Subscription {
	constructor(fn) {
		const success = new Pipe(),
		      error = new Pipe(),
		      cancel = new Pipe();
		fn(success.send, error.send, cancel.receive);
		subs.set(this, [success.receive, error.receive, cancel.send]);
	}
	then(successFn, errorFn) {
		const rfn = subs.get(this);
		if (rfn === undefined) {
			throw new TypeError("method not called on valid Subscription object");
		}
		const [success, error, cancel] = rfn;
		return new Subscription((sFn, eFn, cFn) => {
			if (successFn instanceof Function) {
				success(data => {
					try {
						sFn(successFn(data));
					} catch (e) {
						eFn(e);
					}
				});
			} else {
				success(sFn);
			}
			if (errorFn instanceof Function) {
				error(data => {
					try {
						eFn(errorFn(data));
					} catch (e) {
						eFn(e);
					}
				});
			} else {
				error(eFn);
			}
			cFn(cancel);
		});
	}
	cancel() {
		const rfn = subs.get(this);
		if (rfn === undefined) {
			throw new TypeError("method not called on valid Subscription object");
		}
		const [,, cancel] = rfn;
		cancel();
	}
	catch(errorFn) {
		return this.then(undefined, errorFn);
	}
	finally(afterFn) {
		const aFn = data => {
			afterFn();
			data;
		};
		return this(aFn, aFn);
	}
	static canceller(...subs) {
		return () => subs.forEach(s => s.cancel());
	}
}
