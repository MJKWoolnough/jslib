import {Binding} from './bind.js';
import {setAndReturn} from './misc.js';

class StorageBound extends Binding {
	#storage;
	#name;
	#typeguard;
	#default;

	static #listeners = new Map();

	static {
		window.addEventListener("storage", e => StorageBound.#updateValues(e.storageArea, e.key, parseJSON(e.newValue ?? "")));
	}

	static #updateValues = (storageArea, key, val) => {
		for (const l of StorageBound.#listeners.get(storageArea) ?? []) {
			if (l.#name === key && val !== l.value) {
				l.#set(l.#typeguard(val) ? val : l.#default);
			}
		}
	}

	constructor(storage, name, value, typeguard) {
		const val = parseJSON(storage.getItem(name) ?? "");

		super(typeguard(val) ? val : value);

		this.#storage = storage;
		this.#name = name;
		this.#default = value;
		this.#typeguard = typeguard;

		(StorageBound.#listeners.get(storage) ?? setAndReturn(StorageBound.#listeners, storage, [])).push(this);
	}

	get name() {
		return this.#name;
	}

	get value() {
		return super.value;
	}
	
	#set(value) {
		super.value = value;
	}

	set value(value) {
		this.#set(value);

		StorageBound.#updateValues(this.#storage, this.#name, value);
		this.#storage.setItem(this.#name, JSON.stringify(value));
	}
}

const parseJSON = val => {
	try {
		const v = JSON.parse(val);

		return v;
	} catch {
		return null;
	}
}

export const bindLocalStorage = (name, value, typeguard = _ => true) => new StorageBound(window.localStorage, name, value, typeguard),
bindSessionStorage = (name, value, typeguard = _ => true) => new StorageBound(window.sessionStorage, name, value, typeguard);
