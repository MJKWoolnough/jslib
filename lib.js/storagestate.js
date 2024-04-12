/**
 * The storagestate module is used to create {@link bind:Binding | Binding}s that bind to Storage objects.
 *
 * @module storagestate
 * @requires module:bind
 * @requires module:misc
 */
/** */

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

	static #updateValues(storageArea, key, val) {
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

export const
/**
 * This function creates a {@link binding:Binding | Binding} that retrieves it's value from localStorage, and stores it's value in localStorage when set.
 *
 * The value automatically updates when another localStorage Binding Object with the same name is updated, or when the localStorage is set from another browsing context.
 *
 * @typedef T
 * @param {string}                 name        The key used to store and retrieve from localStorage.
 * @param {T}                      value       The default value that is used when a value retrieved from localStorage doesn't succeed the TypeGuard check.
 * @param {(v: unknown) => v is T} [typeguard] A TypeGuard to confirm the parsed value is of the correct type.
 *
 * @returns {Binding<T>}
 */
bindLocalStorage = (name, value, typeguard = _ => true) => new StorageBound(window.localStorage, name, value, typeguard),
/**
 * This function creates a {@link binding:Binding | Binding} that retrieves it's value from sessionStorage, and stores it's value in sessionStorage when set.
 *
 * The value automatically updates when another sessionStorage Binding Object with the same name is updated, or when the sessionStorage is set from another browsing context.
 *
 * @typedef T
 * @param {string}                 name        The key used to store and retrieve from sessionStorage.
 * @param {T}                      value       The default value that is used when a value retrieved from sessionStorage doesn't succeed the TypeGuard check.
 * @param {(v: unknown) => v is T} [typeguard] A TypeGuard to confirm the parsed value is of the correct type.
 *
 * @returns {Binding<T>}
 */
bindSessionStorage = (name, value, typeguard = _ => true) => new StorageBound(window.sessionStorage, name, value, typeguard);
