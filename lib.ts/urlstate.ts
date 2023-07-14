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

	state.set(name, bound.get(name)![2] = def === newState ? "" : newState);
	
	if (debounceSet === -1) {
		debounceSet = setTimeout(addStateToURL);
	}
      },
      bound = new Map<string, [(v: any) => void, any, string]>();

window.addEventListener("popstate", () => {
	getStateFromURL();

	for (const [key, [fn, def, last]] of bound) {
		const newState = state.get(key);

		if (newState === last) {
			continue;
		}

		fn(newState ? JSON.parse(newState) : def);
	}
});

getStateFromURL();

export default <T>(name: string, value: T) => {
	if (bound.has(name)) {
		return null;
	}

	const [s, sFn,, cFn] = Subscription.bind<T>(5),
	      defStr = JSON.stringify(value);

	bound.set(name, [sFn, value, defStr]);

	cFn(() => bound.delete(name));

	setTimeout(() => sFn(state.has(name) ? JSON.parse(state.get(name)!) : value));

	return [s, (v: T) => {
		setState(name, v, defStr);
		sFn(v);
	}];
}
