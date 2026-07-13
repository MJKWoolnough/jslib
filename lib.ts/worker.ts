type FnInit = [number, string];
type FnCall = [number, number, unknown[]];
type MessageData = FnInit | FnCall;
type Message = Omit<MessageEvent, "data"> & {data: MessageData};

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

	addEventListener("message", (e: Message) => {
		if (isFnInit(e.data)) {
			import(e.data[1] as string)
			.then(({"default": fn}) => {
				fns.set(-e.data[0], fn);

				for (const data of buf) {
					handleFn(fn, data[1], data[2]);
				}

				buf.splice(0, buf.length);
			});
		} else {
			const fn = fns.get(e.data[0]);

			if (fn) {
				handleFn(fn, e.data[1], e.data[2]);
			} else {
				buf.push(e.data);
			}
		}
	});
}).toString() + ")()");

export default () => {
	const w = new Worker(script, {"type": "module"}),
	      calls = new Map<number, [Function, Function]>();

	w.addEventListener("message", (e: Message) => calls.get(Math.abs(e.data[0]))![+(e.data[0] < 0)](e.data[1]));

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
