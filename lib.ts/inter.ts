const pipes = new WeakMap<Pipe<any>, ((data: any) => void)[]>(),
      requesters = new WeakMap<Requester<any>, ((...data: any) => any) | any>(),
      subs = new WeakMap<Subscription<any>, [(fn: (data: any) => void) => void, (fn: (data: any) => void) => void, (data: void) => void]>();

export class Pipe<T> {
	constructor() {
		pipes.set(this, []);
	}
	send(data: T) {
		const out = pipes.get(this)!;
		for (const o of out) {
			o(data);
		}
	}
	receive(fn: (data: T) => void) {
		if (fn instanceof Function) {
			pipes.get(this)!.push(fn);
		} else if (fn !== null && fn !== undefined) {
			throw new TypeError("pipe.receive requires function type");
		}
	}
	remove(fn: (data: T) => void) {
		const out = pipes.get(this)!;
		for (let i = 0; i < out.length; i++) {
			if (out[i] === fn) {
				out.splice(i, 1);
				continue;
			}
		}
	}
}

export class Requester<T, U extends any[] = any[]> {
	request(...data: U): T {
		const r = requesters.get(this);
		if (r === undefined) {
			throw new Error("no responder set");
		} else if (r instanceof Function) {
			return r(...data);
		}
		return r;
	}
	responder(f: ((...data: U) => T) | T) {
		requesters.set(this, f);
	}
}

export class Subscription<T> {
	constructor(fn: (successFn: (data: T) => void, errorFn: (data: any) => void, cancelFn: (data: (data: void) => void) => void) => void) {
		const success = new Pipe<T>(),
		      error = new Pipe<any>(),
		      cancel = new Pipe<void>();
		fn(success.send.bind(success), error.send.bind(error), cancel.receive.bind(cancel));
		subs.set(this, [success.receive.bind(success), error.receive.bind(error), cancel.send.bind(cancel)]);
	}
	then<TResult1 = T, TResult2 = never>(successFn?: ((data: T) => TResult1) | undefined | null, errorFn?: ((data: any) => TResult2) | undefined | null) {
		const rfn = subs.get(this);
		if (rfn === undefined) {
			throw new TypeError("method not called on valid Subscription object");
		}
		const [success, error, cancel] = rfn;
		return new Subscription<TResult1>((sFn: (data: TResult1) => void, eFn: (data: any) => void, cFn: (data: (data: void) => void) => void) => {
			if (successFn instanceof Function) {
				success((data: T) => {
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
				error((data: any) => {
					try {
						eFn(errorFn(data));
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
		const rfn = subs.get(this);
		if (rfn === undefined) {
			throw new TypeError("method not called on valid Subscription object");
		}
		const [,, cancel] = rfn;
		cancel();
	}
	catch<TResult = never>(errorFn: ((data: any) => TResult) | undefined | null): Subscription<T | TResult> {
		return this.then(undefined, errorFn);
	}
	finally(afterFn: () => void): Subscription<T> {
		return this.then((data: T) => (afterFn(), data), (error: any) => {
			afterFn();
			throw error;
		});
	}
	static merge<T>(...subs: Subscription<T>[]) {
		return new Subscription<T>((success: (data: T) => void, error: (data: any) => void, cancel: (data: (data: void) => void) => void) => {
			for (const s of subs) {
				s.then(success, error);
			}
			cancel(Subscription.canceller(...subs));
		});
	}
	static splitCancel<T>(s: Subscription<T>): () => Subscription<T> {
		const success = new Pipe<T>(),
		      error = new Pipe<any>();
		s.then(data => {
			success.send(data);
		}, err => {
			error.send(err);
		});
		return () => new Subscription<T>((sFn, eFn, cancelFn) => {
			success.receive(sFn);
			error.receive(eFn);
			cancelFn(() => {
				success.remove(sFn);
				error.remove(eFn);
			});
		});
	}
	static canceller(...subs: canceller[]) {
		return () => subs.forEach(s => s.cancel());
	}
}

interface canceller {
	cancel: () => void;
}
