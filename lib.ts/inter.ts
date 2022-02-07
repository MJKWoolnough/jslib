export type WaitInfo = {
	waits: number;
	done: number;
	errors: number;
}

export class Pipe<T> {
	#out = new Map<(data: T) => void, number>();
	send(data: T) {
		for (const [o, n] of this.#out) {
			for (let i = 0; i < n; i++) {
				o(data);
			}
		}
	}
	receive(fn: (data: T) => void) {
		if (fn instanceof Function) {
			this.#out.set(fn, (this.#out.get(fn) ?? 0) + 1);
		} else if (fn !== null && fn !== undefined) {
			throw new TypeError("pipe.receive requires function type");
		}
	}
	remove(fn: (data: T) => void) {
		const n = (this.#out.get(fn) ?? 1) - 1;
		if (n) {
			this.#out.set(fn, n);
		} else {
			this.#out.delete(fn);
		}
	}
	bind(bindmask: 1): [(data: T) => void, undefined, undefined];
	bind(bindmask: 2): [undefined, (fn: (data: T) => void) => void, undefined];
	bind(bindmask: 3): [(data: T) => void, (fn: (data: T) => void) => void, undefined];
	bind(bindmask: 4): [undefined, undefined, (fn: (data: T) => void) => void];
	bind(bindmask: 5): [(data: T) => void, undefined, (fn: (data: T) => void) => void];
	bind(bindmask: 6): [undefined, (fn: (data: T) => void) => void, (fn: (data: T) => void) => void];
	bind(bindmask?: 7): [(data: T) => void, (fn: (data: T) => void) => void, (fn: (data: T) => void) => void];
	bind(bindmask: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 7) {
		return [bindmask&1 ? (data: T) => this.send(data) : undefined, bindmask&2 ? (fn: (data: T) => void) => this.receive(fn) : undefined, bindmask&4 ? (fn: (data: T) => void) => this.remove(fn) : undefined] as const;
	}
}

export class Requester<T, U extends any[] = any[]> {
	#responder?: ((...data: any) => any) | any;
	request(...data: U): T {
		const r = this.#responder;
		if (r === undefined) {
			throw new Error("no responder set");
		} else if (r instanceof Function) {
			return r(...data);
		}
		return r;
	}
	responder(f: ((...data: U) => T) | T) {
		this.#responder = f;
	}
}

export class Subscription<T> {
	#success: (fn: (data: T) => void) => void;
	#error: (fn: (data: any) => void) => void;
	#cancel?: () => void;
	#cancelBind?: () => void;
	constructor(fn: (successFn: (data: T) => void, errorFn: (data: any) => void, cancelFn: (data: () => void) => void) => void) {
		const [successSend, successReceive] = new Pipe<T>().bind(3),
		      [errorSend, errorReceive] = new Pipe<any>().bind(3);
		fn(successSend, errorSend, (fn: () => void) => this.#cancel = fn);
		this.#success = successReceive;
		this.#error = errorReceive;
	}
	then<TResult1 = T, TResult2 = never>(successFn?: ((data: T) => TResult1) | null, errorFn?: ((data: any) => TResult2) | null) {
		const s = new Subscription<TResult1 | TResult2>((sFn: (data: TResult1 | TResult2) => void, eFn: (data: any) => void) => {
			this.#success(successFn instanceof Function ? (data: T) => {
				try {
					sFn(successFn(data));
				} catch (e) {
					eFn(e);
				}
			} : sFn as any);
			this.#error(errorFn instanceof Function ? (data: any) => {
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
	catch<TResult = never>(errorFn: (data: any) => TResult): Subscription<T | TResult> {
		return this.then(undefined, errorFn);
	}
	finally(afterFn: () => void): Subscription<T> {
		return this.then((data: T) => (afterFn(), data), (error: any) => {
			afterFn();
			throw error;
		});
	}
	splitCancel() {
		const [successSend, successReceive, successRemove] = new Pipe<T>().bind(),
		      [errorSend, errorReceive, errorRemove] = new Pipe<any>().bind();
		this.then(successSend, errorSend);
		return () => new Subscription<T>((sFn, eFn, cancelFn) => {
			successReceive(sFn);
			errorReceive(eFn);
			cancelFn(() => {
				successRemove(sFn);
				errorRemove(eFn);
			});
		});
	}
	static merge<T>(...subs: Subscription<T>[]) {
		return new Subscription<T>((success: (data: T) => void, error: (data: any) => void, cancel: (data: () => void) => void) => {
			for (const s of subs) {
				s.then(success, error);
			}
			cancel(() => {
				for(const s of subs) {
					s.cancel();
				}
			});
		});
	}
}

export class WaitGroup {
	#waits = 0;
	#done = 0;
	#errors = 0;
	#update = new Pipe<WaitInfo>();
	#complete = new Pipe<WaitInfo>();
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
	onUpdate(fn: (wi: WaitInfo) => void) {
		this.#update.receive(fn);
		return () => this.#update.remove(fn);
	}
	onComplete(fn: (wi: WaitInfo) => void) {
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
