"use strict";

export class Pipe {
	constructor() {
		const out = [];
		this.send = (...data) => out.forEach(o => o(...data));
		this.receive = fn => {
			if (fn instanceof Function) {
				out.push(fn);
			} else if (fn !== null && fn !== undefined) {
				throw new TypeError("pipe.receive requires function type");
			}
		}
	}
}

const spread = Symbol("spread"),
      subs = new WeakMap();

export class Subscription {
	constructor(fn) {
		const success = new Pipe(),
		      error = new Pipe();
		fn(success.send, error.send);
		subs.set(this, [success.receive, error.receive]);
	}
	then(successFn, errorFn) {
		const rfn = subs.get(this);
		if (rfn === undefined) {
			throw new TypeError("method not called on valid Subscription object");
		}
		const [success, error] = rfn;
		return new Subscription((sFn, eFn) => {
			if (successFn instanceof Function) {
				success((...data) => {
					try {
						const ret = successFn(...data);
						if (ret instanceof Array && ret.hasOwnProperty(spread)) {
							sFn(...ret);
						} else {
							sFn(ret);
						}
					} catch (e) {
						eFn(e);
					}
				});
			} else {
				success(sFn);
			}
			if (errorFn instanceof Function) {
				error((...data) => {
					try {
						const ret = errorFn(...data);
						if (ret instanceof Array && ret.hasOwnProperty(spread)) {
							eFn(...ret);
						}
					} catch (e) {
						eFn(e);
					}
				});
			} else {
				error(eFn);
			}
		});
	}
	catch(errorFn) {
		return Subscription.prototype.then.call(this, undefined, errorFn);
	}
	finally(afterFn) {
		const aFn = (...data) => {
			afterFn();
			return Object.defineProperty(data, spread, {});
		};
		return Subscription.prototype.then.call(this, aFn, aFn);
	}
}
