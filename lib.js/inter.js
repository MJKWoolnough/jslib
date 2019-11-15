"use strict";

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

const subs = new WeakMap();

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
		});
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
}
