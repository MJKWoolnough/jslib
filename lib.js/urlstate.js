import {Bound} from './bind.js';
import {Subscription} from './inter.js';

const badValue = Symbol("bad");

class StateBound extends Bound {
	#name;
	#s;
	#sFn;
	#eFn;
	constructor(name, v, cancel) {
		super(v);

		const [s, sFn, eFn, cFn] = Subscription.bind();

		this.#name = name;
		this.#s = s;
		this.#sFn = sFn;
		this.#eFn = eFn;
		cFn(cancel);
	}

	get name() {
		return this.#name;
	}
	get value() {
		return super.value;
	}
	set value(v) {
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
      setState = (name, newState, def) => {
	const existingState = state.get(name);

	if (existingState === newState) {
		return;
	}

	state.set(name, subscribed.get(name)[2] = def === newState ? "" : newState);
	
	if (debounceSet === -1) {
		debounceSet = setTimeout(addStateToURL);
	}
      },
      restoreState = (sb, def, newState, checker) => {
	if (newState && checker && !checker(newState)) {
		sb[badValue](newState);
	} else {
		try {
			sb.value = (newState ? JSON.parse(newState) : def);
		} catch {
			sb[badValue](newState ?? "");
		}
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
      subscribed = new Map();

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
		return null;
	}

	const s = new StateBound(name, value, () => subscribed.delete(name)),
	      defStr = JSON.stringify(value);

	subscribed.set(name, [s, value, defStr, checker]);

	setTimeout(restoreState, 0, s, value, state.has(name) ? state.get(name) : defStr, checker);

	return s
},
setParam = (name, val) => {
	if (!subscribed.has(name)) {
		return;
	}

	setState(name, val, subscribed.get(name)?.[2] ?? "");
	setTimeout(processState);
};
