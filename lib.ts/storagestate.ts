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

	static #updateValues = (storageArea: Storage | null, key: string | null, val: any) => {
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

	set(value: T) {
		StorageBound.#updateValues(this.#storage, this.#name, value);
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

export const bindLocalStorage = <T>(name: string, value: NoInfer<T>, typeguard: (v: unknown) => v is T = (_: unknown): _ is any => true) => new StorageBound(window.localStorage, name, value, typeguard),
bindSessionStorage = <T>(name: string, value: NoInfer<T>, typeguard: (v: unknown) => v is T = (_: unknown): _ is any => true) => new StorageBound(window.sessionStorage, name, value, typeguard);
