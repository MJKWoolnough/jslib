import {Bound} from './bind.js';
import {Subscription} from './inter.js';

type CheckerFn<T> = (v: unknown) => v is T;

let debounceSet = -1;

const restore = Symbol("restore"),
      goodValue = Symbol("good"),
      badValue = Symbol("bad"),
      state = new Map<string, string>(),
      subscribed = new Map<string, StateBound<any>>(),
      getStateFromURL = () => {
	state.clear();

	for (const [key, value] of new URLSearchParams(window.location.search)) {
		state.set(key, value);
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
      processState = () => {
	for (const [key, sb] of subscribed) {
		sb[restore](state.get(key) ?? "");
	}
      };

class StateBound<T> extends Bound<T> {
	#name: string;
	#s: Subscription<T>;
	#sFn: (data: T) => void;
	#eFn: (data: string) => void;
	#def: T;
	#last: string;
	#checker?: (v: any) => v is T;
	constructor(name: string, v: T, checker?: (v: any) => v is T) {
		super(v);

		const [s, sFn, eFn, cFn] = Subscription.bind<T>();

		this.#def = v;
		this.#last = JSON.stringify(v);
		this.#name = name;
		this.#s = s;
		this.#sFn = sFn;
		this.#eFn = eFn;
		this.#checker = checker;

		subscribed.set(name, this);
		cFn(() => subscribed.delete(name));

		setTimeout(() => {
			const s = state.get(name);

			if (s) {
				this[restore](s);
			} else {
				sFn(v);
			}
		});
	}

	get name() {
		return this.#name;
	}
	get value() {
		return super.value;
	}
	set value(v: T) {
		state.set(this.#name, v === this.#def ? "" : JSON.stringify(v));

		if (debounceSet === -1) {
			debounceSet = setTimeout(addStateToURL);
		}

		this[goodValue](v);
	}
	[restore](newState: string) {
		if (newState === this.#last) {
			return;
		}

		if (newState && this.#checker && !this.#checker(newState)) {
			this.#eFn(newState);
		} else {
			try {
				const v = newState ? JSON.parse(newState) : this.#def;

				super.value = v;
				this.#sFn(v);
			} catch {
				this.#eFn(newState ?? "");
			}
		}
	}
	[goodValue](v: T) {
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
		throw new Error(`key (${name}) already exists`);
	}

	return new StateBound(name, value, checker);
},
setParam = (name: string, val: string) => {
	const s = subscribed.get(name);

	if (!s) {
		return;
	}

	s.value = val;
};
