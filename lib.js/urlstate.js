import {Subscription} from './inter.js';

let debounceSet = -1;

const state = new Map(),
      getStateFromURL = () => {
	state.clear();

	for (const [key, value] of new URLSearchParams(window.location.search)) {
		state.set(key, JSON.parse(value));
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

	state.set(name, subscribed.get(name)[3] = def === newState ? "" : newState);
	
	if (debounceSet === -1) {
		debounceSet = setTimeout(addStateToURL);
	}
      },
      restoreState = (sFn, eFn, def, newState, checker) => {
		if (newState && checker && !checker(newState)) {
			eFn(newState);
		} else {
			sFn(newState ? JSON.parse(newState) : def);
		}
      },
      processState = () => {
	for (const [key, [sFn, eFn, def, last, checker]] of subscribed) {
		const newState = state.get(key);

		if (newState === last) {
			continue;
		}

		restoreState(sFn, eFn, def, newState, checker);
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
	const url = new URL(href, window.location + "");

	if (url.host === window.location.host && url.port === window.location.pathname) {
		history.pushState(Date.now(), "", url + "");

		return true;
	}

	return false;
},
subscribe = (name, value, checker) => {
	if (subscribed.has(name)) {
		return null;
	}

	const [s, sFn, eFn, cFn] = Subscription.bind(),
	      defStr = JSON.stringify(value);

	subscribed.set(name, [sFn, eFn, value, defStr, checker]);

	cFn(() => subscribed.delete(name));

	setTimeout(restoreState, 0, sFn, eFn, value, state.has(name) ? state.get(name) : defStr, checker);

	return [s, v => {
		setState(name, JSON.stringify(v), defStr);
		sFn(v);
	}];
},
setParam = (name, val) => {
	if (!subscribed.has(name)) {
		return;
	}

	setState(name, val, subscribed.get(name)?.[3] ?? "");
	setTimeout(processState);
};
