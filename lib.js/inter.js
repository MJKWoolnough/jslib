export class Pipe {
	#out = [];
	send(data) {
		for (const fn of this.#out) {
			fn(data);
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
		for (const [i, afn] of this.#out.entries()) {
			if (afn === fn) {
				this.#out.splice(i, 1);
				return;
			}
		}
	}
	bind(bindmask = 7) {
		return [bindmask&1 ? data => this.send(data) : undefined, bindmask&2 ? fn => this.receive(fn) : undefined, bindmask&4 ? fn => this.remove(fn) : undefined];
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
	#cancelBind;
	constructor(fn) {
		const [successSend, successReceive] = new Pipe().bind(3),
		      [errorSend, errorReceive] = new Pipe().bind(3);
		fn(successSend, errorSend, fn => this.#cancel = fn);
		this.#success = successReceive;
		this.#error = errorReceive;
	}
	when(successFn, errorFn) {
		const s = new Subscription((sFn, eFn) => {
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
		});
		s.#cancelBind = s.#cancel = this.#cancelBind ?? (this.#cancelBind = () => this.#cancel?.());
		return s;
	}
	cancel() {
		this.#cancel?.();
	}
	catch(errorFn) {
		return this.when(undefined, errorFn);
	}
	finally(afterFn) {
		return this.when(data => (afterFn(), data), error => {
			afterFn();
			throw error;
		});
	}
	splitCancel(cancelOnEmpty = false) {
		const [successSend, successReceive, successRemove] = new Pipe().bind(),
		      [errorSend, errorReceive, errorRemove] = new Pipe().bind();
		let n = 0;
		this.when(successSend, errorSend);
		return () => new Subscription((sFn, eFn, cancelFn) => {
			successReceive(sFn);
			errorReceive(eFn);
			n++;
			cancelFn(() => {
				successRemove(sFn);
				errorRemove(eFn);
				cancelFn(() => {});
				if (!--n && cancelOnEmpty) {
					this.cancel();
				}
			});
		});
	}
	static merge(...subs) {
		return new Subscription((success, error, cancel) => {
			for (const s of subs) {
				s.when(success, error);
			}
			cancel(() => {
				for(const s of subs) {
					s.cancel();
				}
			});
		});
	}
	static bind(bindmask = 7) {
		let successFn,
		    errorFn,
		    cancelFn;
		const s = new Subscription((sFn, eFn, cFn) => {
			successFn = sFn;
			errorFn = eFn;
			cancelFn = cFn;
		});
		return [s, bindmask&1 ? successFn : undefined, bindmask&2 ? errorFn : undefined, bindmask&4 ? cancelFn : undefined];
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
