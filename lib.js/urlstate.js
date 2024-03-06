/**
 * The urlstate module provides classes to create {@link module:bind | Binding}s that store and retrieve data from the URL query string.
 *
 * @module urlstate
 * @requires module:bind
 * @requires module:inter
 */
/** */

import {Binding} from './bind.js';
import {Subscription} from './inter.js';

/**
 * This class allows for custom encoding and decoding to state in the URL query.
 */
export class Codec {
	#encoder;
	#decoder;

	/**
	 * The constructor creates a new Codec to be used for encode/decode.
	 *
	 * @param {(v: any) => string} encoder Used to encode arbitrary values to strings.
	 * @param {(v: string) => any} decoder Used to decode strings into values. Can throw errors for invalid strings.
	 */
	constructor(encoder, decoder) {
		this.#encoder = encoder;
		this.#decoder = decoder;
	}

	encode(v) {
		return this.#encoder(v);
	}

	decode(v) {
		return this.#decoder(v);
	}

	/**
	 * This method creates a new StateBound object, bound to the given name.
	 *
	 * It is recommended to use a checker function, and the {@link module:typeguard} module can aid with that.
	 *
	 * @param {string} name              Name to be used for the URL param.
	 * @param {T}      value             Default value for the state.
	 * @param {(v: T) => v is T} checker Function to confirm valid values.
	 *
	 * @return {StateBound<T>}
	 */
	bind(name, value, checker) {
		if (subscribed.has(name)) {
			throw new Error(`key (${name}) already exists`);
		}

		return new StateBound(name, value, this, checker);
	}
}

let debounceSet = false;

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
			query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
		}
	}

	const queryStr = query.join("&");

	if (queryStr !== window.location.search.slice(1)) {
		window.history.pushState(Date.now(), "", "?" + queryStr);
	}

	debounceSet = false;
      },
      jsonCodec = new Codec(v => {
		if (v === undefined) {
			return "";
		}

		return JSON.stringify(v);
      }, v => {
		if (v === "") {
			return undefined;
		}

		return JSON.parse(v);
      }),
      [urlChanged, setURLChanged] = Subscription.bind<number>(3);

/**
 * StateBound extends a {@link bind:Binding} to get and set state from and to the URL.
 */
class StateBound extends Binding {
	static {
		window.addEventListener("popstate", () => {
			getStateFromURL();

			StateBound.#processState();
		});

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

		getStateFromURL();

		queueMicrotask(() => setURLChanged(history.state ?? 0));
	}

	#name;
	#def;
	#last;
	#checker;
	#codec;
	constructor(name, v, codec, checker = _ => true) {
		super(v);

		this.#def = v;
		this.#last = codec.encode(v);
		this.#name = name;
		this.#checker = checker;
		this.#codec = codec;

		subscribed.set(name, this);

		const newState = state.get(name);

		if (newState !== undefined) {
			this.#restore(newState);
		}
	}
	get name() {
		return this.#name;
	}
	get value() {
		return super.value;
	}
	set value(v) {
		super.value = v;

		state.set(this.#name, v === this.#def ? "" : this.#codec.encode(v));

		if (!debounceSet) {
			debounceSet = true;
			queueMicrotask(addStateToURL);
		}
	}
	#restore(newState) {
		if (newState === this.#last) {
			return;
		}

		let v;

		try {
			v = this.#codec.decode(newState);

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

		queueMicrotask(() => setURLChanged(history.state ?? 0));
	}

	static goto(href) {
		const url = new URL(href, window.location + "");
		if (url.host === window.location.host && url.pathname === window.location.pathname) {
			history.pushState(Date.now(), "", url);
			getStateFromURL();
			StateBound.#processState();

			return true;
		}

		return false;
	}

	static setParam(name, val) {
		const s = subscribed.get(name);

		if (s) {
			s.#restore(val);
		}

		state.set(name, val);

		if (!debounceSet) {
			debounceSet = true;
			queueMicrotask(addStateToURL);
		}
	}
}

export const
/**
 * This function processes the passed URL and, if it matches the current path, process the state from the query string.
 *
 * @param {string} href New URL to go to.
 *
 * @return {boolean} Returns true if href matches current path, false otherwise.
 */
goto = href => StateBound.goto(href),
/**
 * This function sets the named state to the given value, which will be parsed by the StateBound object.
 *
 * @param {string} name  The name to be set.
 * @param {string} value The string version of the value to be set.
 */
setParam = (name, value) => StateBound.setParam(name, value),
/**
 * This functions transforms the current state to a search query.
 *
 * @param {Record<string, string>} [withVals] Additional key/value pairs to add to the URL. Will overwrite existing values.
 * @param {string[]} [without]                State keys to filter from the URL.
 *
 * @return {string} The generated query string.
 */
toURL = (withVals, without) => {
	const params = {};

	for (const [key, val] of state) {
		if (val && !without?.includes(key)) {
			params[key] = val;
		}
	}

	if (withVals) {
		Object.assign(params, withVals);
	}

	let url = [];

	for (const [key, value] of Object.entries(params)) {
		url.push(`${key}=${value}`);
	}

	return "?" + url.join("&");
};

/**
 * This value is a {@link inter:Subscription | Subscription} that fires whenever the URL changes.
 *
 * The Subscription is fired with the current `history.state` value, which should be the timestamp of when that URL was generated.
 */
export {urlChanged};

/**
 * This default export creates a new StateBound object, bound to the given name, that uses JSON for encoding an decoding.
 *
 * It is recommended to use a checker function, and the {@link module:typeguard} module can aid with that.
 *
 * @param {string} name              Name to be used for the URL param.
 * @param {T}      value             Default value for the state.
 * @param {(v: T) => v is T} checker Function to confirm valid values.
 *
 * @return {StateBound<T>}
 */
export default (name, value, checker) => jsonCodec.bind(name, value, checker);
