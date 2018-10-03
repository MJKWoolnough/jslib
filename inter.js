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
	class Subscription {
		constructor(fn) {
			const success = new Pipe(),
			      error = new Pipe();
			fn(success.send, error.send);
			this.then = (successFn, errorFn) => new Subscription((sFn, eFn) => {
				if (successFn instanceof Function) {
					success.receive((...data) => {
						try {
							sFn(successFn(...data));
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
							errorFn(...data);
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
			return this.then(afterFn, afterFn);
		}
	};
	return Object.freeze({Pipe, Subscription});
}()));
