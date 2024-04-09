import {Binding} from './bind.js';

class StorageBound<T> extends Binding<T> {
	#name: string;
	#typeguard: (v: unknown) => v is T;
	#default: T;

	constructor(name: string, value: T, typeguard: (v: unknown) => v is T) {
		super(value);

		this.#name = name;
		this.#default = value;
		this.#typeguard = typeguard;
	}

	get value() {
		return super.value;
	}

	set(value: T) {
		super.value = value;
	}
}
