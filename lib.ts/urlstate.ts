import {Binding} from './bind.js';

type CheckerFn<T> = (v: unknown) => v is T;

let debounceSet = -1;

const state = new Map<string, string>(),
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
			query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
		}
	}

	const queryStr = query.join("&");

	if (queryStr !== window.location.search.slice(1)) {
		window.history.pushState(Date.now(), "", "?" + queryStr);
	}

	debounceSet  = -1;
      };

class StateBound<T> extends Binding<T> {
	static {
		window.addEventListener("popstate", () => {
			getStateFromURL();

			StateBound.#processState();
		});
	}

	#name: string;
	#def: T;
	#last: string;
	#checker: (v: any) => v is T;
	constructor(name: string, v: T, checker: (v: any) => v is T = (_: unknown): _ is T => true) {
		super(v);

		this.#def = v;
		this.#last = JSON.stringify(v);
		this.#name = name;
		this.#checker = checker;

		subscribed.set(name, this);

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
	}
	#restore(newState: string) {
		if (newState === this.#last) {
			return;
		}

		let v: T;

		try {
			v = JSON.parse(newState);

			if (!this.#checker(v)) {
				v = this.#def;
			}
		} catch(e) {
			v = this.#def;
		}

		super.value = v;
	}

	static #processState() {
		for (const [key, sb] of subscribed) {
			sb.#restore(state.get(key) ?? "");
		}
	}

	static goto(href: string) {
		const url = new URL(href, window.location + "");
		if (url.host === window.location.host && url.pathname === window.location.pathname) {
			history.pushState(Date.now(), "", url);
			getStateFromURL();
			StateBound.#processState();

			return true;
		}

		return false;
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

getStateFromURL();

export const goto = StateBound.goto,
setParam = (name: string, val: string) => {
	const s = subscribed.get(name);

	if (s) {
		s.value = val;
	}
};

export default <T>(name: string, value: T, checker?: CheckerFn<T>) => {
	if (subscribed.has(name)) {
		throw new Error(`key (${name}) already exists`);
	}

	return new StateBound(name, value, checker);
};
