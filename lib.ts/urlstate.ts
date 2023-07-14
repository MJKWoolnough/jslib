import {Subscription} from './inter.js';

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
      setState = <T>(name: string, value: T, def: string) => {
	const existingState = state.get(name),
	      newState = JSON.stringify(value);

	if (existingState === newState) {
		return;
	}

	state.set(name, subscribed.get(name)![3] = def === newState ? "" : newState);
	
	if (debounceSet === -1) {
		debounceSet = setTimeout(addStateToURL);
	}
      },
      restoreState = <T>(sFn: (v: T) => void, eFn: (v: any) => void, def: T, newState?: string, checker?: CheckerFn<T>) => {
		if (newState && checker && !checker(newState)) {
			eFn(newState);
		} else {
			sFn(newState ? JSON.parse(newState) : def);
		}
      },
      subscribed = new Map<string, [(v: any) => void, (e: any) => void, any, string, undefined | CheckerFn<any>]>();

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

	for (const [key, [sFn, eFn, def, last, checker]] of subscribed) {
		const newState = state.get(key);

		if (newState === last) {
			continue;
		}

		restoreState(sFn, eFn, def, newState, checker);
	}
});

getStateFromURL();

export const goto = (href: string) => {
	const url = new URL(href, window.location + "");

	if (url.host === window.location.host && url.port === window.location.pathname) {
		history.pushState(Date.now(), "", url + "");

		return true;
	}

	return false;
},
subscribe = <T>(name: string, value: T, checker?: CheckerFn<T>) => {
	if (subscribed.has(name)) {
		return null;
	}

	const [s, sFn, eFn, cFn] = Subscription.bind<T>(),
	      defStr = JSON.stringify(value);

	subscribed.set(name, [sFn, eFn, value, defStr, checker]);

	cFn(() => subscribed.delete(name));

	setTimeout(restoreState, 0, sFn, eFn, value, state.has(name) ? state.get(name) : defStr, checker);

	return [s, (v: T) => {
		setState(name, v, defStr);
		sFn(v);
	}];
};
