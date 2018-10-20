offer((function() {
	class Pipe {
		constructor(fn) {
			const out = [];
			this.send = (...data) => out.forEach(o => o(...data));
			this.receive = fn => {
				if (fn instanceof Function) {
					out.push(fn);
				} else if (fn !== null && fn !== undefined) {
					throw new TypeError("pipe.receive requires function type");
				}
			};
		}
	};
	const spread = Symbol("spread"),
	      subs = new WeakMap();
	class Subscription {
		constructor(fn) {
			const success = new Pipe(),
			      error = new Pipe();
			fn(success.send, error.send);
			subs.set([success.receive, error.receive]);
		}
		then(successFn, errorFn) {
			if (!subs.has(this)) {
				throw new TypeError("method not called on valid Subscription object");
			}
			const [success, error] = subs.get(this);
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
			return this.then(null, errorFn);
		}
		finally(afterFn) {
			const aFn = (...data) => {
				afterFn();
				return Object.defineProperty(data, spread, {});
			};
			return this.then(aFn, aFn);
		}
	};
	return Object.freeze({Pipe, Subscription});
}()));
