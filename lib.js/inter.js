/**
 * The inter module provides classes to aid with communication between otherwise unrelated modules.
 *
 * @module inter
 */
/** */

/*
 * This type is used by the {@link WaitGroup} Class to return information.
 *
 * @typedef WaitInfo
 * @property {number} done The number of complete tasks.
 * @property {number} errors The number of failed tasks.
 * @property {number} waits The total number of registered tasks.
 */

const isPipeWithDefault = v => v instanceof Array && v.length === 2 && v[0] instanceof Pipe,
      isSubscriptionWithDefault = v => v instanceof Array && v.length === 2 && v[0] instanceof Subscription;

/**
 * The Pipe Class is used to pass values to multiple registered functions.
 */
export class Pipe {
	#out = [];
	/** The field contains the number of functions currently registered on the Pipe. */
	get length() { return this.#out.length }
	/**
	 * This function sends the data passed to any functions registered on the Pipe.
	 *
	 * Exceptions thrown be any receivers are ignored.
	 *
	 * @param {T} data The data to be sent.
	 */
	send(data) {
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
	receive(fn) {
		this.#out.push(fn);
	}
	/**
	 * The passed function will be unregistered from the Pipe and will no longer receive values sent along it.
	 *
	 * NB: If the function is registered multiple times, only a single entry will be unregistered.
	 *
	 * @param {(data: T) => void} fn The Function to be removed.
	 *
	 * @return {boolean} Returns true when a function is unregistered, false otherwise.
	 */
	remove(fn) {
		for (const [i, afn] of this.#out.entries()) {
			if (afn === fn) {
				this.#out.splice(i, 1);

				return true;
			}
		}

		return false;
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
	bind(bindmask = 7) {
		return [bindmask&1 ? data => this.send(data) : undefined, bindmask&2 ? fn => this.receive(fn) : undefined, bindmask&4 ? fn => this.remove(fn) : undefined];
	}
	/**
	 * This method calls the passed function with the values retrieved from the passed pipes and values.
	 *
	 * @param {Function} cb         The function that will be called with the values from all of the pipes.
	 * @param {...(Pipe | [Pipe, any] | any)} pipes The pipes or values to combine and pass to the callback function. A Pipe can be combined with an initial value in a tuple.
	 *
	 * @return {Function} Cancel function to stop the pipes being merged.
	 */
	static any(cb, ...pipes) {
		let debounce = false;

		const defs = pipes.map(p => p instanceof Pipe ? undefined : isPipeWithDefault(p) ? p[1] : p),
		      cancels = [];

		for (const [n, p] of pipes.entries()) {
			if (p instanceof Pipe || isPipeWithDefault(p)) {
				const pipe = (p instanceof Array ? p[0] : p),
				      fn = v => {
					defs[n] = v;

					if (!debounce) {
						debounce = true;
						queueMicrotask(() => {
							cb(defs);
							debounce = false;
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
export class Requester {
	#responder;
	/**
	 * The request method sends data to a set responder and receives a response. Will throw an error if no responder is set.
	 *
	 * @param {...U} data The data to be sent to the responder.
	 *
	 * @return {T} The data returned from the responder.
	 */
	request(...data) {
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
	responder(f) {
		this.#responder = f;
	}
}

/**
 * The Subscription Class is similar to the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} class, but any success and error functions can be called multiple times.
 */
export class Subscription {
	#success;
	#error;
	#cancel;
	#cancelBind;
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
	constructor(fn) {
		const [successSend, successReceive] = new Pipe().bind(3),
		      errPipe = new Pipe(),
		      [, errorReceive] = errPipe.bind(2);
		fn(successSend, err => {
			if (errPipe.length) {
				errPipe.send(err);
			} else {
				throw err;
			}
		}, fn => this.#cancel = fn);
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
	catch(errorFn) {
		return this.when(undefined, errorFn);
	}
	/**
	 * The finally method act similarly to the finally method of the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} class, except that it can be activated multiple times.
	 *
	 * @param {() => void} afterFn A Function that will be called whenever this Subscription is activated.
	 *
	 * @return {Subscription} A new Subscription that responds to the output of the parent Subscription Object.
	 */
	finally(afterFn) {
		return this.when(data => (afterFn(), data), error => {
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
	/**
	 * The merge static method combines any number of Subscription objects into a single subscription, so that all parent success and catch calls are combined, and any cancel signal will be sent to all parents.
	 *
	 * @param {...Subscription} subs The Subscriptions to be merged.
	 *
	 * @return {Subscription} The merged Subscription Object.
	 */
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
	 * @param {...(Subscription | [Subscription, any])} subs The subscriptions to be merged, and with an option default type in a tuple.
	 *
	 * @return {Subscription} The combined Subscription that will fire when any of the passed subscriptions fire.
	 */
	static any(...subs) {
		let debounce = false;

		const [s, sFn, eFn, cFn] = Subscription.bind(),
		      defs = subs.map(s => s instanceof Subscription ? undefined : isSubscriptionWithDefault(s) ? s[1] : s);

		for (const [n, s] of subs.entries()) {
			if (s instanceof Subscription || isSubscriptionWithDefault(s)) {
				(s instanceof Array ? s[0] : s).when(v => {
					defs[n] = v;

					if (!debounce) {
						debounce = true;
						queueMicrotask(() => {
							sFn(defs);
							debounce = false;
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

/** The WaitGroup Class is used to wait for multiple asynchronous tasks to complete. */
export class WaitGroup {
	#waits = 0;
	#done = 0;
	#errors = 0;
	#update = new Pipe();
	#complete = new Pipe();
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
	onUpdate(fn) {
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

/** The Pickup Class is used to pass a single value to a single recipient. */
export class Pickup {
	#data;
	/**
	 * Used to set the value on the class.
	 *
	 * @param {T} d The data to set.
	 *
	 * @return {T} The data.
	 */
	set(d) {
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
