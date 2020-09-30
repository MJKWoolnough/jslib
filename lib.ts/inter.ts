export class Pipe<T> {
	send: (data: T) => void;
	receive: (fn: (data: T) => void) => void;
	remove: (fn: (data: T) => void) => void;
	constructor() {
		const out: ((data: T) => void)[] = [];
		this.send = (data: T) => out.forEach(o => o(data));
		this.receive = (fn: (data: T) => void) => {
			if (fn instanceof Function) {
				out.push(fn);
			} else if (fn !== null && fn !== undefined) {
				throw new TypeError("pipe.receive requires function type");
			}
		};
		this.remove = (fn: (data: T) => void) => {
			for (let i = 0; i < out.length; i++) {
				if (out[i] === fn) {
					out.splice(i, 1);
					continue;
				}
			}
		};
	}
}

export class Requester<T, U extends any[] = any[]> {
	request: (...data: U) => T;
	responder: <V = ((...data: U) => T) | T>(f: ((...data: U) => T) | T) => void;
	constructor() {
		let r: ((...data: U) => T) | T;
		this.request = (...data: U) => {
			if (r === undefined) {
				throw new Error("no responder set");
			} else if (r instanceof Function) {
				return r(...data);
			}
			return r;
		};
		this.responder = (f: ((...data: U) => T) | T) => r = f;
	}
}

const subs = new WeakMap<Subscription<any>, [(fn: (data: any) => void) => void, (fn: (data: any) => void) => void, (data: void) => void]>();

export class Subscription<T> {
	constructor(fn: (successFn: (data: T) => void, errorFn: (data: any) => void, cancelFn: (data: (data: void) => void) => void) => void) {
		const success = new Pipe<T>(),
		      error = new Pipe<any>(),
		      cancel = new Pipe<void>();
		fn(success.send, error.send, cancel.receive);
		subs.set(this, [success.receive, error.receive, cancel.send]);
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
	finally(afterFn?: () => void | undefined | null): Subscription<T> {
		const aFn = (data: T) => {
			if (afterFn) {
				afterFn()
			}
			return data;
		};
		return this.then(aFn, aFn);
	}
	static merge<T>(...subs: Subscription<T>[]) {
		return new Subscription<T>((success: (data: T) => void, error: (data: any) => void, cancel: (data: (data: void) => void) => void) => {
			for (const s of subs) {
				s.then(success, error);
			}
			cancel(Subscription.canceller(...subs));
		});
	}
	static canceller(...subs: canceller[]) {
		return () => subs.forEach(s => s.cancel());
	}
}

interface canceller {
	cancel: () => void;
}
