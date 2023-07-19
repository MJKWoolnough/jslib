import {Bound} from './bind.js';
import {Subscription} from './inter.js';

let debounceSet = -1;

const restore = Symbol("restore"),
      state = new Map(),
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
			query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
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

class SubBound extends Bound {
	#sub;
	constructor(v, sub) {
		super(v);

		(this.#sub = sub).when(v => super.value = v);
	}
	get value() {
		return super.value;
	}
	when(successFn, errorFn) {
		let val = undefined;

		const sub = this.#sub.when(successFn ? v => val = successFn(v) : undefined, errorFn ? v => val = errorFn(v) : undefined);

		return new SubBound(val, sub);
	}
	catch(errorFn) {
		return this.when(undefined, errorFn);
	}
	finally(afterFn) {
		return new SubBound(this.value, this.#sub.finally(afterFn));
	}
	cancel() {
		this.#sub.cancel();
	}
}

class StateBound extends SubBound {
	#name;
	#sFn;
	#eFn;
	#def;
	#last;
	#checker;
	constructor(name, v, checker) {
		const [sub, sFn, eFn, cFn] = Subscription.bind();

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

		this.#sFn(v);
	}
	[restore](newState) {
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
}

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
	const url = new URL(href, window.location + "");
	if (url.host === window.location.host && url.pathname === window.location.pathname) {
		history.pushState(Date.now(), "", url);
		getStateFromURL();
		processState();

		return true;
	}

	return false;
},
setParam = (name, val) => {
	const s = subscribed.get(name);

	if (!s) {
		return;
	}

	s.value = val;
};

export default (name, value, checker) => {
	if (subscribed.has(name)) {
		throw new Error(`key (${name}) already exists`);
	}

	return new StateBound(name, value, checker);
};
