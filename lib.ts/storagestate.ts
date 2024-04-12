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

class StorageBound<T> extends Binding<T> {
	#storage: Storage;
	#name: string;
	#typeguard: (v: unknown) => v is T;
	#default: T;

	static #listeners = new Map<Storage, StorageBound<any>[]>();

	static {
		window.addEventListener("storage", e => StorageBound.#updateValues(e.storageArea, e.key, parseJSON(e.newValue ?? "")));
	}

	static #updateValues(storageArea: Storage | null, key: string | null, val: any) {
		for (const l of StorageBound.#listeners.get(storageArea!) ?? []) {
			if (l.#name === key && val !== l.value) {
				l.#set(l.#typeguard(val) ? val : l.#default);
			}
		}
	}

	constructor(storage: Storage, name: string, value: T, typeguard: (v: unknown) => v is T) {
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
	
	#set(value: T) {
		super.value = value;
	}

	set value(value: T) {
		this.#set(value);

		StorageBound.#updateValues(this.#storage, this.#name, value);
		this.#storage.setItem(this.#name, JSON.stringify(value));
	}
}

const parseJSON = (val: string) => {
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
bindLocalStorage = <T>(name: string, value: NoInfer<T>, typeguard: (v: unknown) => v is T = (_: unknown): _ is any => true) => new StorageBound(window.localStorage, name, value, typeguard),
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
bindSessionStorage = <T>(name: string, value: NoInfer<T>, typeguard: (v: unknown) => v is T = (_: unknown): _ is any => true) => new StorageBound(window.sessionStorage, name, value, typeguard);
