import {Bound} from './bind.js';
import {Subscription} from './inter.js';

const restore = Symbol("restore"),
      goodValue = Symbol("good"),
      badValue = Symbol("bad");

class StateBound extends Bound {
	#name;
	#s;
	#sFn;
	#eFn;
	#def;
	#last;
	#checker;
	constructor(name, v, checker) {
		super(v);

		const [s, sFn, eFn, cFn] = Subscription.bind();

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
	set value(v) {
		state.set(this.#name, v === this.#def ? "" : JSON.stringify(v));

		if (debounceSet === -1) {
			debounceSet = setTimeout(addStateToURL);
		}

		this[goodValue](v);
	}
	[restore](newState) {
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
	[goodValue](v) {
		super.value = v;
		this.#sFn(v);
	}
	[badValue](v) {
		this.#eFn(v);
	}
	when(successFn, errorFn) {
		return this.#s.when(successFn, errorFn);
	}
	catch(errorFn) {
		return this.#s.catch(errorFn);
	}
	finally(afterFn) {
		return this.#s.finally(afterFn);
	}
	cancel() {
		this.#s.cancel();
	}
}

let debounceSet = -1;

const state = new Map(),
      subscribed = new Map(),
      getStateFromURL = () => {
	state.clear();

	for (const [key, value] of new URLSearchParams(window.location.search)) {
		state.set(key, value);
	}
      },
      addStateToURL = () => {
	const query = [];

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

window.addEventListener("click", e => {
	let target = e.target;
	while (target && !(target instanceof HTMLAnchorElement || target instanceof HTMLAreaElement || target instanceof SVGAElement)) {
		target = target.parentNode;
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

export const goto = href => {
	if (href.startsWith("?")) {
		history.pushState(Date.now(), "", href);
		getStateFromURL();
		processState();

		return true;
	}

	return false;
},
subscribe = (name, value, checker) => {
	if (subscribed.has(name)) {
		throw new Error(`key (${name}) already exists`);
	}

	return new StateBound(name, value, checker);
},
setParam = (name, val) => {
	const s = subscribed.get(name);

	if (!s) {
		return;
	}

	s.value = val;
};
