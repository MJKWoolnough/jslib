import {Subscription} from './inter.js';

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

	state.set(name, bound.get(name)![3] = def === newState ? "" : newState);
	
	if (debounceSet === -1) {
		debounceSet = setTimeout(addStateToURL);
	}
      },
      bound = new Map<string, [(v: any) => void, (e: any) => void, any, string, undefined | ((v: unknown) => v is any)]>();

window.addEventListener("popstate", () => {
	getStateFromURL();

	for (const [key, [sFn, eFn, def, last, checker]] of bound) {
		const newState = state.get(key);

		if (newState === last) {
			continue;
		}

		if (newState && checker && !checker(newState)) {
			eFn(newState);
		} else {
			sFn(newState ? JSON.parse(newState) : def);
		}
	}
});

getStateFromURL();

export default <T>(name: string, value: T, checker?: (v: unknown) => v is T) => {
	if (bound.has(name)) {
		return null;
	}

	const [s, sFn, eFn, cFn] = Subscription.bind<T>(),
	      defStr = JSON.stringify(value);

	bound.set(name, [sFn, eFn, value, defStr, checker]);

	cFn(() => bound.delete(name));

	setTimeout(() => sFn(state.has(name) ? JSON.parse(state.get(name)!) : value));

	return [s, (v: T) => {
		setState(name, v, defStr);
		sFn(v);
	}];
}
