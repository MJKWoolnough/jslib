class Setting {
	#name;
	#value;
	#fns = [];
	constructor(name, value) {
		this.#name = name;
		this.#value = value;
	}
	get name() { return this.#name; }
	get value() { return this.#value; }
	s(v) {
		return v + "";
	}
	set(v) {
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
	wait(fn) {
		fn(this.#value);
		this.#fns.push(fn);
		return this;
	}
}

export class BoolSetting extends Setting {
	constructor(name) {
		super(name, window.localStorage.getItem(name) !== null);
	}
	s(b) {
		return b ? "" : null;
	}
}

export class IntSetting extends Setting {
	#min;
	#max;
	constructor(name, starting = 0, min = -Infinity, max = Infinity) {
		const n = parseInt(window.localStorage.getItem(name) ?? "");
		super(name, isNaN(n) || n < min || n > max ? starting : n);
		this.#min = min;
		this.#max = max;
	}
	set(v) {
		return Number.isInteger(v) && v >= this.#min && v <= this.#max ? super.set(v) : this;
	}
}

export class NumberSetting extends Setting {
	#min;
	#max;
	constructor(name, starting = 0, min = -Infinity, max = Infinity) {
		const n = parseFloat(window.localStorage.getItem(name) ?? "");
		super(name, isNaN(n) || n < min || n > max ? starting : n);
		this.#min = min;
		this.#max = max;
	}
	set(v) {
		return v >= this.#min && v <= this.#max ? super.set(v) : this;
	}
}

export class StringSetting extends Setting {
	constructor(name, starting = "") {
		super(name, window.localStorage.getItem(name) ?? starting);
	}
}

export class JSONSetting extends Setting {
	constructor(name, starting, validator) {
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
	s(v) {
		return JSON.stringify(v);
	}
}
