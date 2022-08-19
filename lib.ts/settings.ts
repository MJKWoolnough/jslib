abstract class Setting<T> {
	#name: string;
	#value: T;
	#fns: ((value: T) => void)[] = [];
	constructor(name: string, value: T) {
		this.#name = name;
		this.#value = value;
	}
	get name() { return this.#name; }
	get value() { return this.#value; }
	s(v: T): string | null {
		return v + "";
	}
	set(v: T) {
		const old = this.#value,
		      s = this.s(this.#value = v);
		if (this.#value !== old || this.#value instanceof Object) {
			if (s === null) {
				window.localStorage.removeItem(this.#name);
			} else {
				window.localStorage.setItem(this.#name, s);
			}
			for (const fn of this.#fns) {
				fn(v);
			}
		}
		return this;
	}
	remove() {
		window.localStorage.removeItem(this.#name);
		return this;
	}
	wait(fn: (value: T) => void) {
		fn(this.#value);
		this.#fns.push(fn);
		return this;
	}
}

export class BoolSetting extends Setting<boolean> {
	constructor(name: string) {
		super(name, window.localStorage.getItem(name) !== null);
	}
	s(b: boolean) {
		return b ? "" : null;
	}
}

export class IntSetting extends Setting<number> {
	#min: number;
	#max: number;
	constructor(name: string, starting = 0, min = -Infinity, max = Infinity) {
		const n = parseInt(window.localStorage.getItem(name) ?? "");
		super(name, isNaN(n) || n < min || n > max ? starting : n);
		this.#min = min;
		this.#max = max;
	}
	set(v: number) {
		return Number.isInteger(v) && v >= this.#min && v <= this.#max ? super.set(v) : this;
	}
}

export class NumberSetting extends Setting<number> {
	#min: number;
	#max: number;
	constructor(name: string, starting = 0, min = -Infinity, max = Infinity) {
		const n = parseFloat(window.localStorage.getItem(name) ?? "");
		super(name, isNaN(n) || n < min || n > max ? starting : n);
		this.#min = min;
		this.#max = max;
	}
	set(v: number) {
		return v >= this.#min && v <= this.#max ? super.set(v) : this;
	}
}

export class StringSetting extends Setting<string> {
	constructor(name: string, starting = "") {
		super(name, window.localStorage.getItem(name) ?? starting);
	}
}

export class JSONSetting<T> extends Setting<T> {
	constructor(name: string, starting: T, validator: (v: any) => v is T) {
		const s = window.localStorage.getItem(name);
		let value = starting;
		if (s) {
			try {
				const v = JSON.parse(s);
				if (validator(v)) {
					value = v;
				}
			} catch {}
		}
		super(name, value);
	}
	s(v: T) {
		return JSON.stringify(v);
	}
}
