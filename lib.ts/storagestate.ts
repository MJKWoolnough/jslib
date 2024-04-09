import {Binding} from './bind.js';

class StorageBound<T> extends Binding<T> {
	#storage: Storage;
	#name: string;
	#typeguard: (v: unknown) => v is T;
	#default: T;

	constructor(storage: Storage, name: string, value: T, typeguard: (v: unknown) => v is T) {
		const val = JSON.parse(storage.getItem(name) ?? "");

		super(typeguard(val) ? val : value);

		this.#storage = storage;
		this.#name = name;
		this.#default = value;
		this.#typeguard = typeguard;
	}

	get name() {
		return this.#name;
	}

	get value() {
		return super.value;
	}

	set(value: T) {
		this.#storage.setItem(this.#name, JSON.stringify(super.value = value));
	}
}
