type MessageData = [number, number | string, unknown[]];
type Message = Omit<MessageEvent, "data"> & {data: MessageData};

const script = URL.createObjectURL(new Blob(["(" + (() => {
	const fns = new Map<number, Function>(),
	      buf: MessageData[] = [],
	      handleFn = (md: MessageData) => {
		try {
			postMessage([md[1], fns.get(md[0]).apply(null, md[2])]);
		} catch (e) {
			postMessage([-md[1], e]);
		}
	      };

	addEventListener("message", (e: Message) => {
		if (e.data[0] < 0) {
			import(URL.createObjectURL(new Blob(["export default "+ e.data[1]], {"type": "application/javascript"})))
			.then(({"default": fn}) => {
				fns.set(-e.data[0], fn);

				for (const data of buf) {
					handleFn(data);
				}

				buf.splice(0, buf.length);
			});
		} else if (!fns.has(e.data[0])) {
			buf.push(e.data);
		} else {
			handleFn(e.data);
		}
	});
}).toString() + ")()"], {"type": "application/javascript"}));

export default () => {
	const w = new Worker(script, {"type": "module"}),
	      calls = new Map<number, [Function, Function]>();

	w.addEventListener("message", (e: Message) => calls.get(Math.abs(e.data[0]))[+(e.data[0] < 0)](e.data[1]));

	let callID = 0,
	    fns = 0;

	return <T extends (...args: any[]) => any>(fn: T) => {
		const fnID = ++fns;

		w.postMessage([-fnID, fn.toString()]);

		return (...args: Parameters<T>) => new Promise<Awaited<ReturnType<T>>>((sFn, eFn) => {
			const cID = ++callID;

			calls.set(cID, [sFn, eFn]);
			w.postMessage([fnID, cID, args]);
		});
	}
};
