offer((function() {
	class Pipe {
		constructor(fn) {
			const out = [];
			this.send = (...data) => out.forEach(o => o(data));
			this.receive = fn => {
				if (fn instanceof Function) {
					out.push.bind(out);
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
			this.then = (successFn, errorFn) => {
				success.receive(successFn);
				error.receive(errorFn);
				return this;
			};
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
