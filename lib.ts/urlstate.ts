import {Bound} from './bind.js';
import {Subscription} from './inter.js';

const badValue = Symbol("bad");

class StateBound<T> extends Bound<T> {
	#name: string;
	#s: Subscription<T>;
	#sFn: (data: T) => void;
	#eFn: (data: string) => void;
	constructor(name: string, v: T, cancel: () => void) {
		super(v);

		const [s, sFn, eFn, cFn] = Subscription.bind<T>();

		this.#name = name;
		this.#s = s;
		this.#sFn = sFn;
		this.#eFn = eFn;
		cFn(cancel);
	}

	get name() {
		return this.#name;
	}
	set value(v: T) {
		super.value = v;
		this.#sFn(v);
	}
	[badValue](v: string) {
		this.#eFn(v);
	}
	when<TResult1 = T, TResult2 = never>(successFn?: ((data: T) => TResult1) | null, errorFn?: ((data: any) => TResult2) | null) {
		return this.#s.when(successFn, errorFn);
	}
	catch<TResult = never>(errorFn: (data: any) => TResult) {
		return this.#s.catch(errorFn);
	}
	finally(afterFn: () => void) {
		return this.#s.finally(afterFn);
	}
	cancel() {
		this.#s.cancel();
	}
}

type CheckerFn<T> = (v: unknown) => v is T;

let debounceSet = -1;

const state = new Map<string, string>(),
      getStateFromURL = () => {
	state.clear();

	for (const [key, value] of new URLSearchParams(window.location.search)) {
		state.set(key, JSON.parse(value));
	}
      },
      addStateToURL = () => {
	const query: string[] = [];

	for (const [key, value] of state) {
		if (value) {
			query.push(`${key}=${encodeURIComponent(value)}`);
		}
	}

	const queryStr = query.join("&");

	if (queryStr !== window.location.search.slice(1)) {
		window.history.pushState(Date.now(), "", "?" + queryStr);
	}

	debounceSet  = -1;
      },
      setState = (name: string, newState: string, def: string) => {
	const existingState = state.get(name);

	if (existingState === newState) {
		return;
	}

	state.set(name, subscribed.get(name)![2] = def === newState ? "" : newState);
	
	if (debounceSet === -1) {
		debounceSet = setTimeout(addStateToURL);
	}
      },
      restoreState = <T>(sb: StateBound<T>, def: T, newState?: string, checker?: CheckerFn<T>) => {
		if (newState && checker && !checker(newState)) {
			sb[badValue](newState);
		} else {
			sb.value = (newState ? JSON.parse(newState) : def);
		}
      },
      processState = () => {
	for (const [key, [sb, def, last, checker]] of subscribed) {
		const newState = state.get(key);

		if (newState === last) {
			continue;
		}

		restoreState(sb, def, newState, checker);
	}
      },
      subscribed = new Map<string, [StateBound<any>, any, string, undefined | CheckerFn<any>]>();

window.addEventListener("click", (e: Event) => {
	let target = e.target as Element | null;
	while (target && !(target instanceof HTMLAnchorElement || target instanceof HTMLAreaElement || target instanceof SVGAElement)) {
		target = target.parentNode as Element;
	}

	const href = target?.getAttribute("href");

	if (href && goto(href)) {
		e.preventDefault();
	}
});

window.addEventListener("popstate", () => {
	getStateFromURL();

	processState();
});

getStateFromURL();

export const goto = (href: string) => {
	if (href.startsWith("?")) {
		history.pushState(Date.now(), "", href);
		getStateFromURL();
		processState();

		return true;
	}

	return false;
},
subscribe = <T>(name: string, value: T, checker?: CheckerFn<T>) => {
	if (subscribed.has(name)) {
		return null;
	}

	const s = new StateBound(name, value, () => subscribed.delete(name)),
	      defStr = JSON.stringify(value);

	subscribed.set(name, [s, value, defStr, checker]);

	setTimeout(restoreState, 0, s, value, state.has(name) ? state.get(name) : defStr, checker);

	return s
},
setParam = (name: string, val: string) => {
	if (!subscribed.has(name)) {
		return;
	}

	setState(name, val, subscribed.get(name)?.[2] ?? "");
	setTimeout(processState);
};
