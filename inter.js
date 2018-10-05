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
	const spread = Symbol(spread);
	class Subscription {
		constructor(fn) {
			const success = new Pipe(),
			      error = new Pipe();
			fn(success.send, error.send);
			this.then = (successFn, errorFn) => new Subscription((sFn, eFn) => {
				if (successFn instanceof Function) {
					success.receive((...data) => {
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
					success.receive(sFn);
				}
				if (errorFn instanceof Function) {
					error.receive((...data) => {
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
					error.receive(eFn);
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
