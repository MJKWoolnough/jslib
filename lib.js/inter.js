export class Pipe {
	#out = [];
	send(data) {
		for (const o of this.#out) {
			o(data);
		}
	}
	receive(fn) {
		if (fn instanceof Function) {
			this.#out.push(fn);
		} else if (fn !== null && fn !== undefined) {
			throw new TypeError("pipe.receive requires function type");
		}
	}
	remove(fn) {
		const out = this.#out;
		for (let i = 0; i < out.length; i++) {
			if (out[i] === fn) {
				out.splice(i, 1);
				continue;
			}
		}
	}
	bind() {
		return [data => this.send(data), fn => this.receive(fn)];
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
	#cancel;
	constructor(fn, errorFn, cancelFn) {
		const [successSend, successReceive] = new Pipe().bind(),
		      [errorSend, errorReceive] = new Pipe().bind(),
		      [cancelSend, cancelReceive] = new Pipe().bind();
		fn(successSend, errorSend, cancelReceive);
		this.#success = successReceive;
		this.#error = errorReceive;
		this.#cancel = cancelSend;
	}
	then(successFn, errorFn) {
		const success = this.#success,
		      error = this.#error,
		      cancel = this.#cancel;
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
