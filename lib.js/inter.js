export class Pipe {
	#out = new Set();
	send(data) {
		for (const o of this.#out) {
			o(data);
		}
	}
	receive(fn) {
		if (fn instanceof Function) {
			this.#out.add(fn);
		} else if (fn !== null && fn !== undefined) {
			throw new TypeError("pipe.receive requires function type");
		}
	}
	remove(fn) {
		return this.#out.delete(fn);
	}
	bind() {
		return [data => this.send(data), fn => this.receive(fn), fn => this.cancel(fn)];
	}
}

export class Requester {
	#responder;
	request(...data) {
		const r = this.#responder;
		if (r === undefined) {
			throw new Error("no responder set");
		} else if (r instanceof Function) {
			return r(...data);
		}
		return r;
	}
	responder(f) {
		this.#responder = f;
	}
}

export class Subscription {
	#success;
	#error;
	#cancel = () => {};
	#cancelBind;
	constructor(fn) {
		const [successSend, successReceive] = new Pipe().bind(),
		      [errorSend, errorReceive] = new Pipe().bind();
		fn(successSend, errorSend, data => this.#cancel = data);
		this.#success = successReceive;
		this.#error = errorReceive;
	}
	then(successFn, errorFn) {
		const s = new Subscription((sFn, eFn, cFn) => {
			this.#success(successFn instanceof Function ? data => {
				try {
					sFn(successFn(data));
				} catch (e) {
					eFn(e);
				}
			} : sFn);
			this.#error(errorFn instanceof Function ? data => {
				try {
					sFn(errorFn(data));
				} catch (e) {
					eFn(e);
				}
			} : eFn);
			cFn(this.#cancelBind ?? (this.#cancelBind = () => this.#cancel()));
		});
		s.#cancelBind = s.#cancel;
		return s;
	}
	cancel() {
		this.#cancel();
	}
	catch(errorFn) {
		return this.then(undefined, errorFn);
	}
	finally(afterFn) {
		return this.then(data => (afterFn(), data), error => {
			afterFn();
			throw error;
		});
	}
	splitCancel() {
		const [successSend, successReceive, successRemove] = new Pipe().bind(),
		      [errorSend, errorReceive, errorRemove] = new Pipe().bind();
		this.then(successSend, errorSend);
		return () => new Subscription((sFn, eFn, cancelFn) => {
			successReceive(sFn);
			errorReceive(eFn);
			cancelFn(() => {
				successRemove(sFn);
				errorRemove(eFn);
			});
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
	static canceller(...subs) {
		return () => {
			for (const s of subs) {
				s.cancel();
			}
		}
	}
}

export class WaitGroup {
	#waits = 0;
	#done = 0;
	#errors = 0;
	#update = new Pipe();
	#complete = new Pipe();
	add() {
		this.#waits++;
		this.#updateWG();
	}
	done() {
		this.#done++;
		this.#updateWG();
	}
	error() {
		this.#errors++;
		this.#updateWG();
	}
	onUpdate(fn) {
		this.#update.receive(fn);
		return () => this.#update.remove(fn);
	}
	onComplete(fn) {
		this.#complete.receive(fn);
		return () => this.#complete.remove(fn);
	}
	#updateWG() {
		const data = {
			"waits": this.#waits,
			"done": this.#done,
			"errors": this.#errors
		};
		this.#update.send(data);
		if (this.#done + this.#errors === this.#waits) {
			this.#complete.send(data);
		}
	}
}
