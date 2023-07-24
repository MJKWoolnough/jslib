import {Binding} from './bind.js';

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
			query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
		}
	}

	const queryStr = query.join("&");

	if (queryStr !== window.location.search.slice(1)) {
		window.history.pushState(Date.now(), "", "?" + queryStr);
	}

	debounceSet  = -1;
      },
      jsonCodec = {
	encode(v) {
		return JSON.stringify(v);
	},
	decode(v) {
		return JSON.parse(v);
	}
      };

class StateBound extends Binding {
	static {
		window.addEventListener("popstate", () => {
			getStateFromURL();

			StateBound.#processState();
		});
	}

	#name;
	#def;
	#last;
	#checker;
	#codec;
	constructor(name, v, checker = () => true, codec) {
		super(v);

		this.#def = v;
		this.#last = codec.encode(v);
		this.#name = name;
		this.#checker = checker;
		this.#codec = codec;

		subscribed.set(name, this);

	}
	get name() {
		return this.#name;
	}
	get value() {
		return super.value;
	}
	set value(v) {
		state.set(this.#name, v === this.#def ? "" : this.#codec.encode(v));

		if (debounceSet === -1) {
			debounceSet = setTimeout(addStateToURL);
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

getStateFromURL();

export const goto = StateBound.goto,
setParam = (name, val) => {
	const s = subscribed.get(name);

	if (s) {
		s.value = val;
	}
};

export default (name, value, checker) => {
	if (subscribed.has(name)) {
		throw new Error(`key (${name}) already exists`);
	}

	return new StateBound(name, value, checker, jsonCodec);
};
