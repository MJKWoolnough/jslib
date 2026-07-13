/**
 * This module contains a function that allows for simple wrapping of functions to be used in a Worker thread.
 *
 * @module worker
 */
/** */

type FnInit = [number, string];
type FnCall = [number, number, unknown[]];
type MessageData = FnInit | FnCall;
type Message = Omit<MessageEvent, "data"> & {data: MessageData};
type Response = Omit<MessageEvent, "data"> & {data: [number, unknown]};

const toURL = (js: string) => URL.createObjectURL(new Blob([js], {"type": "application/javascript"})),
script = toURL("(" + (() => {
	const fns = new Map<number, Function>(),
	      buf: FnCall[] = [],
	      handleFn = (fn: Function, cID: number, args: unknown[]) => {
		try {
			postMessage([cID, fn(...args)]);
		} catch (e) {
			postMessage([-cID, e]);
		}
	      },
	      isFnInit = (md: MessageData): md is FnInit => md[0] < 0;

	addEventListener("message", ({data}: Message) => {
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
	      calls = new Map<number, [Function, Function]>();

	w.addEventListener("message", ({data: [cID, ret]}: Response) => {
		const callID = Math.abs(cID),
		      fn = calls.get(callID);

		if (fn) {
			calls.delete(callID);
			fn[+(cID < 0)](ret);
		}
	});

	let callID = 0,
	    fns = 0;

	return <T extends (...args: any[]) => any>(fn: T) => {
		const fnID = ++fns;

		w.postMessage([-fnID, toURL("export default " + fn.toString())]);

		return (...args: Parameters<T>) => new Promise<Awaited<ReturnType<T>>>((sFn, eFn) => {
			const cID = ++callID;

			calls.set(cID, [sFn, eFn]);
			w.postMessage([fnID, cID, args]);
		});
	}
};
