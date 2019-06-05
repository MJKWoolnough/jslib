type sendFn = (...data: any[]) => void;
type receiveFn = (...data: any[]) => void;
type receiveFns = (fn: receiveFn) => void;

export class Pipe {
	send: sendFn;
	receive: receiveFns;
	constructor() {
		const out: sendFn[] = [];
		this.send = (...data) => out.forEach(o => o(...data));
		this.receive = (fn: receiveFn) => {
			if (fn instanceof Function) {
				out.push(fn);
			} else if (fn !== null && fn !== undefined) {
				throw new TypeError("pipe.receive requires function type");
			}
		}
	}
}

const spread = Symbol("spread"),
      subs = new WeakMap<Subscription, [receiveFn, receiveFn]>();

type promiseFn = (...data: any) => any;

export class Subscription {
	constructor(fn: (successFn: sendFn, errorFn: sendFn) => void) {
		const success = new Pipe(),
		      error = new Pipe();
		fn(success.send, error.send);
		subs.set(this, [success.receive, error.receive]);
	}
	then(successFn?: promiseFn, errorFn?: promiseFn) {
		const rfn = subs.get(this);
		if (rfn === undefined) {
			throw new TypeError("method not called on valid Subscription object");
		}
		const [success, error] = rfn;
		return new Subscription((sFn, eFn) => {
			if (successFn instanceof Function) {
				success((...data: any[]) => {
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
				error((...data: any[]) => {
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
	catch(errorFn: promiseFn) {
		return Subscription.prototype.then.call(this, undefined, errorFn);
	}
	finally(afterFn: () => void) {
		const aFn = (...data: any[]) => {
			afterFn();
			return Object.defineProperty(data, spread, {});
		};
		return Subscription.prototype.then.call(this, aFn, aFn);
	}
}
