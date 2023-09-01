/**
 * The inter module provides classes to aid with communication between otherwise unrelated modules.
 *
 * @module inter
 */
/** */

/*
 * This type is used by the {@link WaitGroup} Class to return information.
 */
export type WaitInfo = {
	/** The number of complete tasks. */
	done: number;
	/** The number of failed tasks. */
	errors: number;
	/** The total number of registered tasks. */
	waits: number;
}

type PipeWithDefault<T> = readonly [Pipe<T>, T];

type PipeRetArr<T extends readonly unknown[] | []> = {
	-readonly [K in keyof T]: T[K] extends PipeWithDefault<infer U> ? U : T[K] extends Pipe<infer V> ? V | undefined : T[K];
}

/** This type represents any type that implements the various methods required to be considered a Subscription for the purposes of Subscription.merge and Subscription.any. */
export type SubscriptionType<T> = {
	when<TResult1 = T, TResult2 = never>(successFn?: ((data: T) => TResult1) | null, errorFn?: ((data: any) => TResult2) | null): SubscriptionType<TResult1 | TResult2>;
	catch<TResult = never>(errorFn: (data: any) => TResult): SubscriptionType<T | TResult>;
	finally(afterFn: () => void): SubscriptionType<T>;
	cancel(): void;
}

/** The Subscribed type returns the resolution type of the passed Subscription. Subscribed<Subscription<T>> returns T. */
export type Subscribed<T> = T extends SubscriptionType<infer U> ? U : never;

type SubscriptionWithDefault<T> = readonly [SubscriptionType<T>, T];

type SubscriptionRetArr<T extends readonly unknown[] | []> = {
	-readonly [K in keyof T]: T[K] extends SubscriptionWithDefault<infer U> ? U : Subscribed<T[K]> | undefined;
}

const isPipeWithDefault = (v: unknown): v is PipeWithDefault<any> => v instanceof Array && v.length === 2 && v[0] instanceof Pipe,
      isSubscriptionWithDefault = (v: unknown): v is SubscriptionWithDefault<any> => v instanceof Array && v.length === 2 && v[0] instanceof Subscription;

/**
 * The Pipe Class is used to pass values to multiple registered functions.
 */
export class Pipe<T> {
	#out: ((data: T) => void)[] = [];
	/** The field contains the number of functions currently registered on the Pipe. */
	get length() { return this.#out.length }
	/**
	 * This function sends the data passed to any functions registered on the Pipe.
	 *
	 * Exceptions thrown be any receivers are ignored.
	 *
	 * @param {T} data The data to be sent.
	 */
	send(data: T) {
		for (const fn of this.#out) {
			try {
				fn(data);
			} finally {}
		}
	}
	/**
	 * The passed function will be registered on the Pipe and will receive any future values sent along it.
	 *
	 * NB: The same function can be set multiple times, and will be for each time it is set.
	 *
	 * @param {(data: T) => void} fn The Function to be registered.
	 */
	receive(fn: (data: T) => void) {
		if (fn instanceof Function) {
			this.#out.push(fn);
		} else if (fn !== null && fn !== undefined) {
			throw new TypeError("pipe.receive requires function type");
		}
	}
	/**
	 * The passed function will be unregistered from the Pipe and will no longer receive values sent along it.
	 *
	 * NB: If the function is registered multiple times, only a single entry will be unregistered.
	 *
	 * @param {(data: T) => void} fn The Function to be removed.
	 */
	remove(fn: (data: T) => void) {
		for (const [i, afn] of this.#out.entries()) {
			if (afn === fn) {
				this.#out.splice(i, 1);
				return;
			}
		}
	}
	/**
	 * This method returns an Array of functions bound to the send, receive, and remove methods of the Pipe Class. The bindmask determines which methods are bound.
	 *
	 * |  Mask Bit Value  |  Method  |
	 * |------------------|----------|
	 * | 1                | {@link Pipe.send | send} |
	 * | 2                | {@link Pipe.receive | receive} |
	 * | 4                | {@link Pipe.remove | remove} |
	 *
	 * @param {1 | 2 | 3 | 4 | 5 | 6 | 7} [bindmask] The bitmask to determine which functions are bound.
	 *
	 * @return {[((data: T) => void) | undefined, ((fn: (data: T) => void) => void) | undefined, ((fn: (data: T) => void) => void) | undefined]} An Array containing the selected bound functions in the format: [*send bound function*,  *receive bound function*, *remove bound function*].
	*/
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

	/**
	 * This method calls the passed function with the values retrieved from the passed pipes and values.
	 *
	 * @param {Function} cb         The function that will be called with the values from all of the pipes.
	 * @param {...(Pipe | [Pipe, any] | any)} pipes The pipes or values to combine and pass to the callback function. A Pipe can be combined with an initial value in a tuple.
	 *
	 * @return {Function} Cancel function to stop the pipes being merged.
	 */
	static any<const T extends readonly (Pipe<unknown> | PipeWithDefault<unknown> | unknown)[] | []>(cb: (v: PipeRetArr<T>) => void, ...pipes: T): () => void {
		let debounce = -1;

		const defs = pipes.map(p => p instanceof Pipe ? undefined : isPipeWithDefault(p) ? p[1] : p) as PipeRetArr<T>,
		      cancels: (() => void)[] = [];

		for (const [n, p] of pipes.entries()) {
			if (p instanceof Pipe || isPipeWithDefault(p)) {
				const pipe = (p instanceof Array ? p[0] : p),
				      fn = (v: any) => {
					defs[n] = v;

					if (debounce === -1) {
						debounce = setTimeout(() => {
							cb(defs);
							debounce = -1;
						});
					}
				      };


				pipe.receive(fn);
				cancels.push(() => pipe.remove(fn));
			}
		}

		return () => {
			for (const fn of cancels) {
				fn();
			}
		};
	}
}

/** The Requester Class is used to allow a server to set a function or value for multiple clients to query. */
export class Requester<T, U extends any[] = any[]> {
	#responder?: ((...data: U) => T) | T;
	/**
	 * The request method sends data to a set responder and receives a response. Will throw an error if no responder is set.
	 *
	 * @param {...U} data The data to be sent to the responder.
	 *
	 * @return {T} The data returned from the responder.
	 */
	request(...data: U): T {
		const r = this.#responder;
		if (r === undefined) {
			throw new Error("no responder set");
		} else if (r instanceof Function) {
			return r(...data);
		}
		return r;
	}
	/*
	 * The responder method sets either the function that will respond to any request, or the value that will be the response to any request.
	 *
	 * @param {((...data: U) => T) | T} f The data that will be returned, or the Function that will deal with the request and return data.
	 */
	responder(f: ((...data: U) => T) | T) {
		this.#responder = f;
	}
}

/**
 * The Subscription Class is similar to the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} class, but any success and error functions can be called multiple times.
 */
export class Subscription<T> implements SubscriptionType<T> {
	#success: (fn: (data: T) => void) => void;
	#error: (fn: (data: any) => void) => void;
	#cancel?: () => void;
	#cancelBind?: () => void;
	/**
	 * The constructor of the Subscription class takes a function that receives success, error, and cancel functions.
	 *
	 * The success function can be called multiple times and will send any params in the call on to any 'when' functions.
	 *
	 * The error function can be called multiple times and will send any params in the call on to any 'catch' functions.
	 *
	 * The cancel function can be called at any time with a function to deal with any cancel signals generated by this Subscription object, or any child Subscription objects.
	 *
	 * @param {(successFn: (data: T) => void, errorFn: (data: any) => void, cancelFn: (data: () => void) => void) => void} fn The Function that receives the success, error, and cancel Functions.
	 */
	constructor(fn: (successFn: (data: T) => void, errorFn: (data: any) => void, cancelFn: (data: () => void) => void) => void) {
		const [successSend, successReceive] = new Pipe<T>().bind(3),
		      errPipe = new Pipe<any>(),
		      [, errorReceive] = errPipe.bind(2);
		fn(successSend, (err: any) => {
			if (errPipe.length) {
				errPipe.send(err);
			} else {
				throw err;
			}
		}, (fn: () => void) => this.#cancel = fn);
		this.#success = successReceive;
		this.#error = errorReceive;
	}
	/**
	 * This  method act similarly to the then method of the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} class, except that it can be activated multiple times.
	 *
	 * @param {((data: T) => TResult1) | null} [successFn] The Function to be called on a success.
	 * @param {((data: any) => TResult2) | null} [errorFn] The Function to be called on an error.
	 *
	 * @return {Subscription} A new Subscription that continues the Subscription chain.
	 */
	when<TResult1 = T, TResult2 = never>(successFn?: ((data: T) => TResult1) | null, errorFn?: ((data: any) => TResult2) | null): Subscription<TResult1 | TResult2> {
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
		s.#cancelBind = s.#cancel = this.#cancelBind ??= () => this.#cancel?.();
		return s;
	}
	/** This method sends a signal up the Subscription chain to the cancel function set during the construction of the original Subscription. */
	cancel() {
		this.#cancel?.();
	}
	/**
	 * The catch method act similarly to the catch method of the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} class, except that it can be activated multiple times.
	 *
	 * @param {(data: any) => TResult} errorFn A Function to be called when the Subscription throws an error.
	 *
	 * @return {Subscription} A new Subscription that can respond to the output of the supplied Function.
	 */
	catch<TResult = never>(errorFn: (data: any) => TResult): Subscription<T | TResult> {
		return this.when(undefined, errorFn);
	}
	/**
	 * The finally method act similarly to the finally method of the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} class, except that it can be activated multiple times.
	 *
	 * @param {() => void} afterFn A Function that will be called whenever this Subscription is activated.
	 *
	 * @return {Subscription} A new Subscription that responds to the output of the parent Subscription Object.
	 */
	finally(afterFn: () => void): Subscription<T> {
		return this.when((data: T) => (afterFn(), data), (error: any) => {
			afterFn();
			throw error;
		});
	}
	/**
	 * This method creates a break in the cancel signal chain, so that any cancel signal simply removes that Subscription from it's parent.
	 *
	 * @param {boolean} [cancelOnEmpty] When true, will send an actual cancel signal all the way up the chain when called on the last split child.
	 *
	 * @return {() => Subscription} A Function that returns a new Subscription with the cancel signal intercepted.
	 */
	splitCancel(cancelOnEmpty: boolean = false): () => Subscription<T> {
		const [successSend, successReceive, successRemove] = new Pipe<T>().bind(),
		      [errorSend, errorReceive, errorRemove] = new Pipe<any>().bind();
		let n = 0;
		this.when(successSend, errorSend);
		return () => new Subscription<T>((sFn, eFn, cancelFn) => {
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
	/**
	 * The merge static method combines any number of Subscription objects into a single subscription, so that all parent success and catch calls are combined, and any cancel signal will be sent to all parents.
	 *
	 * @param {...SubscriptionType} subs The Subscriptions to be merged.
	 *
	 * @return {Subscription} The merged Subscription Object.
	 */
	static merge<T>(...subs: SubscriptionType<T>[]): Subscription<T> {
		return new Subscription<T>((success: (data: T) => void, error: (data: any) => void, cancel: (data: () => void) => void) => {
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
	/**
	 *
	 * This method combines the passed in Subscriptions into a single Subscription that fires whenever any of the passed Subscriptions do. The data passed to the success function is an array of the latest value from each of the Subscriptions.
	 *
	 * Initial data for a Subscription can be set by putting the Subscription in a tuple with the default value as the second element (SubscriptionWithDefault).
	 * 
	 * If no default is specified, the default is undefined.
	 * 
	 * NB: The combined Subscription will fire in the next event loop, in order to collect all simultaneous changes.
	 *
	 * @param {...(SubscriptionType | [SubscriptionType, any])} subs The subscriptions to be merged, and with an option default type in a tuple.
	 *
	 * @return {Subscription} The combined Subscription that will fire when any of the passed subscriptions fire.
	 */
	static any<const T extends readonly (SubscriptionType<unknown> | SubscriptionWithDefault<unknown> | unknown)[] | []>(...subs: T): Subscription<SubscriptionRetArr<T>> {
		let debounce = -1;

		const [s, sFn, eFn, cFn] = Subscription.bind<SubscriptionRetArr<T>>(),
		      defs = subs.map(s => s instanceof Subscription ? undefined : isSubscriptionWithDefault(s) ? s[1] : s) as SubscriptionRetArr<T>;

		for (const [n, s] of subs.entries()) {
			if (s instanceof Subscription || isSubscriptionWithDefault(s)) {
				(s instanceof Array ? s[0] : s).when((v: any) => {
					defs[n] = v;

					if (debounce === -1) {
						debounce = setTimeout(() => {
							sFn(defs);
							debounce = -1;
						});
					}
				}, eFn);
			}
		}

		cFn(() => {
			for (const s of subs) {
				if (s instanceof Subscription || isSubscriptionWithDefault(s)) {
					(s instanceof Array ? s[0] : s).cancel();
				}
			}
		});

		return s;
	}
	/**
	 * This method returns an Array of functions bound to the when, error, and cancel methods of the Subscription Class. The bindmask determines which methods are bound.
	 *
	 * |  Mask Bit Value  |  Method  |
	 * |------------------|----------|
	 * | 1                | {@link Subscription.when | when} |
	 * | 2                | {@link Subscription.error | error} |
	 * | 4                | {@link Subscription.cancel | cancel |
	 *
	 * @param {1 | 2 | 3 | 4 | 5 | 6 | 7} [bindmask] The bitmask to determine which functions are bound.
	 *
	 * @return {[Subscription<T>, ((data: T) => void) | undefined, ((data: any) => void) | undefiend, (data: () => void) => void) | undefined]} An Array containing the Subscription and the selected bound functions in the format: [Subscription<T>, *send bound function*,  *receive bound function*, *remove bound function*].
	 */
	static bind<T>(bindmask: 1): [Subscription<T>, (data: T) => void, undefined, undefined];
	static bind<T>(bindmask: 2): [Subscription<T>, undefined, (data: any) => void, undefined];
	static bind<T>(bindmask: 3): [Subscription<T>, (data: T) => void, (data: any) => void, undefined];
	static bind<T>(bindmask: 4): [Subscription<T>, undefined, undefined, (data: () => void) => void];
	static bind<T>(bindmask: 5): [Subscription<T>, (data: T) => void, undefined, (data: () => void) => void];
	static bind<T>(bindmask: 6): [Subscription<T>, undefined, (data: any) => void, (data: () => void) => void];
	static bind<T>(bindmask?: 7): [Subscription<T>, (data: T) => void, (data: any) => void, (data: () => void) => void];
	static bind<T>(bindmask: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 7) {
		let successFn: (data: T) => void,
		    errorFn: (data: any) => void,
		    cancelFn: (data: () => void) => void;
		const s = new Subscription<T>((sFn, eFn, cFn) => {
			successFn = sFn;
			errorFn = eFn;
			cancelFn = cFn;
		});
		return [s, bindmask&1 ? successFn! : undefined, bindmask&2 ? errorFn! : undefined, bindmask&4 ? cancelFn! : undefined];
	}
}

/** The WaitGroup Class is used to wait for multiple asynchronous tasks to complete. */
export class WaitGroup {
	#waits = 0;
	#done = 0;
	#errors = 0;
	#update = new Pipe<WaitInfo>();
	#complete = new Pipe<WaitInfo>();
	/** This method adds to the number of registered tasks. */
	add() {
		this.#waits++;
		this.#updateWG();
	}
	/** This method adds to the number of complete tasks. */
	done() {
		this.#done++;
		this.#updateWG();
	}
	/** This method adds to the number of failed tasks. */
	error() {
		this.#errors++;
		this.#updateWG();
	}
	/**
	 * This method registers a function to run whenever a task is added, completed, or failed.
	 *
	 * @param {(wi: WaitInfo) => void} fn The Function to call when any tasks are added, complete, or fail.
	 *
	 * @return {() => void} A function to unregister the supplied function.
	 */
	onUpdate(fn: (wi: WaitInfo) => void): () => void {
		this.#update.receive(fn);
		return () => this.#update.remove(fn);
	}
	/**
	 * This method registers a function to run when all registered tasks are complete, successfully or otherwise.
	 *
	 * @param {(wi: WaitInfo) => void} fn The Function to call when all tasks are finished.
	 *
	 * @return {() => void} A function to unregister the supplied function.
	 */
	onComplete(fn: (wi: WaitInfo) => void): () => void {
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

/** The Pickup Class is used to pass a single value to a single recipient. */
export class Pickup<T> {
	#data?: T;
	/**
	 * Used to set the value on the class.
	 *
	 * @param {T} d The data to set.
	 *
	 * @return {T} The data.
	 */
	set(d: T): T {
		return this.#data = d;
	}
	/*
	 * Used to retrieve the value if one has been set. It will return `undefined` if no value is currently set.
	 *
	 * Clears the data when it returns any.
	 *
	 * @returns {T | undefined}
	 */
	get() {
		const d = this.#data;
		this.#data = undefined;
		return d;
	}
}
