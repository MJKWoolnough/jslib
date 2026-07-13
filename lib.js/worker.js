/**
 * This module contains a function that allows for simple wrapping of functions to be used in a Worker thread.
 *
 * @module worker
 */
/** */

const toURL = js => URL.createObjectURL(new Blob([js], {"type": "application/javascript"})),
script = toURL("(" + (() => {
	const fns = new Map(),
	      buf = [],
	      handleFn = (fn, cID, args) => {
		try {
			postMessage([cID, fn(...args)]);
		} catch (e) {
			postMessage([-cID, e]);
		}
	      },
	      isFnInit = md => md[0] < 0;

	addEventListener("message", ({data}) => {
		if (isFnInit(data)) {
			import(data[1])
			.then(({"default": fn}) => {
				fns.set(-data[0], fn);

				for (const data of buf) {
					handleFn(fn, data[1], data[2]);
				}

				buf.splice(0, buf.length);
			});
		} else {
			const fn = fns.get(data[0]);

			if (fn) {
				handleFn(fn, data[1], data[2]);
			} else {
				buf.push(data);
			}
		}
	});
}).toString() + ")()");

/**
 * This function initialises a new Worker thread, returning a function that registers functions with that thread.
 *
 * The returned function is a registration function that takes a user-supplied function and passes it to the Worker thread. The registration function returns a function that matches the signature of the user-supplied function, except that the return will be wrapped in a Promise.
 *
 * The user-supplied function must not be closed over variables that it references.
 */
export default () => {
	const w = new Worker(script, {"type": "module"}),
	      calls = new Map();

	w.addEventListener("message", ({data: [cID, ret]}) => {
		const callID = Math.abs(cID),
		      fn = calls.get(callID);

		if (fn) {
			calls.delete(callID);
			fn[+(cID < 0)](ret);
		}
	});

	let callID = 0,
	    fns = 0;

	return fn => {
		const fnID = ++fns;

		w.postMessage([-fnID, toURL("export default " + fn.toString())]);

		return (...args) => new Promise<Awaited<ReturnType<T>>>((sFn, eFn) => {
			const cID = ++callID;

			calls.set(cID, [sFn, eFn]);
			w.postMessage([fnID, cID, args]);
		});
	}
};
