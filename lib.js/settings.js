class Setting {
	#fns = [];
	constructor(name, value) {
		this.name = name;
		this.value = value;
	}
	s(v) {
		return v + "";
	}
	set(v) {
		const s = this.s(this.value = v);
		if (s === null) {
			window.localStorage.removeItem(this.name);
		} else {
			window.localStorage.setItem(this.name, s);
		}
		for (const fn of this.#fns) {
			fn(v);
		}
		return this;
	}
	remove() {
		window.localStorage.removeItem(this.name);
		return this;
	}
	wait(fn) {
		fn(this.value);
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
	constructor(name, starting = "0") {
		super(name, parseInt(window.localStorage.getItem(name) || starting));
	}
}

export class StringSetting extends Setting {
	constructor(name, starting = "") {
		super(name, window.localStorage.getItem(name) ?? starting);
	}
}

export class JSONSetting extends Setting {
	constructor(name, starting, validator) {
		super(name, starting);
		const s = window.localStorage.getItem(name);
		if (s) {
			try {
				const v = JSON.parse(s);
				if (validator(v)) {
					this.value = v;
				}
			} catch {}
		}
	}
	s(v) {
		return JSON.stringify(v);
	}
}
