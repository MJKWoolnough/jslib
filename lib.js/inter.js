const pipes = new WeakMap(),
      requests = new WeakMap(),
      subs = new WeakMap();

export class Pipe {
	constructor() {
		pipes.set(this, []);
	}
	send(data) {
		const out = pipes.get(this);
		for (const o of out) {
			o(data);
		}
	}
	receive(fn) {
		if (fn instanceof Function) {
			pipes.get(this).push(fn);
		} else if (fn !== null && fn !== undefined) {
			throw new TypeError("pipe.receive requires function type");
		}
	}
	remove(fn) {
		const out = pipes.get(this);
		for (let i = 0; i < out.length; i++) {
			if (out[i] === fn) {
				out.splice(i, 1);
				continue;
			}
		}
	}
}

export class Requester {
	request(...data) {
		const r = requesters.get(this);
		if (r === undefined) {
			throw new Error("no responder set");
		} else if (r instanceof Function) {
			return r(...data);
		}
		return r;
	}
	responder(f) {
		requesters.set(this, f);
	}
}

export class Subscription {
	constructor(fn) {
		const success = new Pipe(),
		      error = new Pipe(),
		      cancel = new Pipe();
		fn(success.send.bind(success), error.send.bind(error), cancel.receive.bind(cancel));
		subs.set(this, [success.receive.bind(success), error.receive.bind(error), cancel.send.bind(cancel)]);
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
						sFn(errorFn(data));
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
		return this(data => (aFn(), data), error => {
			aFn();
			throw error;
		});
	}
	static merge(...subs) {
		return new Subscription((success, error, cancel) => {
			for (const s of subs) {
				s.then(success, error);
			}
			cancel(Subscription.canceller(...subs));
		});
	}
	static splitCancel(s) {
		const success = new Pipe(),
		      error = new Pipe();
		s.then(data => {
			success.send(data);
		}, err => {
			error.send(err);
		});
		return () => new Subscription((sFn, eFn, cancelFn) => {
			success.receive(sFn);
			error.receive(eFn);
			cancelFn(() => {
				success.remove(sFn);
				error.remove(eFn);
			});
		});
	}
	static canceller(...subs) {
		return () => subs.forEach(s => s.cancel());
	}
}
