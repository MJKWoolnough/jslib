import type {SubscriptionType} from './inter.js';
import {Binding} from './bind.js';
import {Subscription} from './inter.js';

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

class SubBound<T> extends Binding<T> implements SubscriptionType<T> {
	#sub: Subscription<T>;
	constructor(v: T, sub: Subscription<T>) {
		super(v);

		(this.#sub = sub).when(v => super.value = v);
	}
	get value() {
		return super.value;
	}
	when<TResult1 = T, TResult2 = never>(successFn?: ((data: T) => TResult1) | null, errorFn?: ((data: any) => TResult2) | null): SubBound<TResult1 | TResult2> {
		let val: TResult1 | TResult2 = undefined!;

		const sub = this.#sub.when(successFn ? v => val = successFn(v) : undefined, errorFn ? v => val = errorFn(v) : undefined);

		return new SubBound(val, sub);
	}
	catch<TResult = never>(errorFn: (data: any) => TResult) {
		return this.when(undefined, errorFn);
	}
	finally(afterFn: () => void) {
		return new SubBound(this.value, this.#sub.finally(afterFn));
	}
	cancel() {
		this.#sub.cancel();
	}
}

class StateBound<T> extends SubBound<T> {
	static {
		window.addEventListener("popstate", () => {
			getStateFromURL();

			StateBound.#processState();
		});
	}

	#name: string;
	#sFn: (data: T) => void;
	#eFn: (data: string) => void;
	#def: T;
	#last: string;
	#checker?: (v: any) => v is T;
	constructor(name: string, v: T, checker?: (v: any) => v is T) {
		const [sub, sFn, eFn, cFn] = Subscription.bind<T>();

		super(v, sub);

		this.#def = v;
		this.#last = JSON.stringify(v);
		this.#name = name;
		this.#sFn = sFn;
		this.#eFn = eFn;
		this.#checker = checker;

		subscribed.set(name, this);
		cFn(() => subscribed.delete(name));

		setTimeout(() => {
			const s = state.get(name);

			if (s) {
				this.#restore(s);
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

		this.#sFn(v);
	}
	#restore(newState: string) {
		if (newState === this.#last) {
			return;
		}

		if (newState && this.#checker && !this.#checker(newState)) {
			this.#eFn(newState);
		} else {
			try {
				this.#sFn(newState ? JSON.parse(newState) : this.#def);
			} catch {
				this.#eFn(newState ?? "");
			}
		}
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
