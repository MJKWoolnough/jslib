export class Pipe<T> {
	send: (data: T) => void;
	receive: (fn: (data: T) => void) => void;
	constructor() {
		const out: ((data: T) => void)[] = [];
		this.send = (data: T) => out.forEach(o => o(data));
		this.receive = (fn: (...data: T[]) => void) => {
			if (fn instanceof Function) {
				out.push(fn);
			} else if (fn !== null && fn !== undefined) {
				throw new TypeError("pipe.receive requires function type");
			}
		}
	}
}

const subs = new WeakMap<Subscription<any>, [(fn: (data: any) => void) => void, (fn: (data: any) => void) => void]>();

export class Subscription<T> {
	constructor(fn: (successFn: (data: T) => void, errorFn: (data: any) => void) => void) {
		const success = new Pipe<T>(),
		      error = new Pipe<any>();
		fn(success.send, error.send);
		subs.set(this, [success.receive, error.receive]);
	}
	then<TResult1 = T, TResult2 = never>(successFn?: ((data: T) => TResult1) | undefined | null, errorFn?: ((data: any) => TResult2) | undefined | null) {
		const rfn = subs.get(this);
		if (rfn === undefined) {
			throw new TypeError("method not called on valid Subscription object");
		}
		const [success, error] = rfn;
		return new Subscription<TResult1>((sFn: (data: TResult1) => void, eFn: (data: any) => void) => {
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
		});
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
}
