/**
 * The settings module exports convenience classes around the {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage | window.localStorage} API.
 *
 * @module settings
 */

const s = Symbol("s");

/**
 * The unexported Setting class is extended by the various typed child Setting classes.
 *
 * All methods return `this` to allow for method chaining.
 *
 * @typeParam T
 */
class Setting {
	#name;
	#value;
	#fns = [];
	constructor(name, value) {
		this.#name = name;
		this.#value = value;
	}
	/** The name of the setting. */
	get name() { return this.#name; }
	/** The value of the setting, type defined by the child class. */
	get value() { return this.#value; }
	[s](v) {
		return v + "";
	}
	/**
	 * Sets a new value to a Setting.
	 *
	 * @param {T} v The value to set.
	 *
	 * @return {this} Returns this for easy chaining.
	 */
	set(v) {
		const old = this.#value,
		      sv = this[s](this.#value = v);
		if (this.#value !== old || this.#value instanceof Object) {
			if (sv === null) {
				window.localStorage.removeItem(this.#name);
			} else {
				window.localStorage.setItem(this.#name, sv);
			}
			for (const fn of this.#fns) {
				fn(v);
			}
		}
		return this;
	}
	/**
	 * Removes the setting from localStorage.
	 *
	 * @return {this} Returns this for easy chaining.
	 */
	remove() {
		window.localStorage.removeItem(this.#name);
		return this;
	}
	/**
	 * The wait method takes a function to be called on every setting value change. It will be immediately called with the current value.
	 *
	 * @param {(value: T) => void} fn Callback function to be called whenever value is set, in addition to being immediately called with the current value.
	 *
	 * @return {this} Returns this for easy chaining.
	 */
	wait(fn) {
		fn(this.#value);
		this.#fns.push(fn);
		return this;
	}
}

/**
 * The BoolSetting class `constructor` just takes a name, and otherwise just extends the base {@link Setting} class with the `boolean` type.
 */
export class BoolSetting extends Setting {
	/**
	 * The BoolSetting class `constructor` just takes a name, and otherwise just extends the base {@link Setting} class with the `boolean` type.
	 *
	 * The default value is `false`.
	 *
	 * @param {string} name Setting name.
	 */
	constructor(name) {
		super(name, window.localStorage.getItem(name) !== null);
	}
	[s](b) {
		return b ? "" : null;
	}
}

/** Class for storing Integer values. */
export class IntSetting extends Setting {
	#min;
	#max;
	/**
	 * The IntSetting class extends the `constructor` of {@link Setting} to, in addition to the string name and optional number starting value, take optional min and max numbers to be used for validation.
	 *
	 * The validation will make sure that values set are integers and satisfy the follow inequality:
	 *
	 * `min <= value <= max`
	 *
	 * Otherwise this class just extends the base {@link Setting} class with the `number` type.
	 *
	 * @param {string} name            Setting name.
	 * @param {number} [starting=0]    Default Value.
	 * @param {number} [min=-Infinity] Minimum valid value.
	 * @param {number} [max=Infinity]  Maximum valid value.
	 */
	constructor(name, starting = 0, min = -Infinity, max = Infinity) {
		const n = parseInt(window.localStorage.getItem(name) ?? "");
		super(name, isNaN(n) || n < min || n > max ? starting : n);
		this.#min = min;
		this.#max = max;
	}
	/**
	 * This method acts as the base class, but will first validate that the number is within the bounds specified in the constructor.
	 *
	 * @param {number} v The number to be validated and set.
	 *
	 * @return {this} Returns `this` for easy chaining.
	 */
	set(v) {
		return Number.isInteger(v) && v >= this.#min && v <= this.#max ? super.set(v) : this;
	}
}

/**
 * Class for storing Number values.
 */
export class NumberSetting extends Setting {
	#min;
	#max;
	/**
	 * The NumberSetting class extends the `constructor` of {@link Setting} to, in addition to the string name and optional number starting value, take optional min and max numbers to be used for validation.
	 *
	 * The validation will make sure that values set satisfy the follow inequality:
	 *
	 * `min <= value <= max`
	 *
	 * Otherwise this class just extends the base {@link Setting} class with the `number` type.
	 *
	 * @param {string} name            Setting name.
	 * @param {number} [starting=0]    Default Value.
	 * @param {number} [min=-Infinity] Minimum valid value.
	 * @param {number} [max=Infinity]  Maximum valid value.
	 */
	constructor(name, starting = 0, min = -Infinity, max = Infinity) {
		const n = parseFloat(window.localStorage.getItem(name) ?? "");
		super(name, isNaN(n) || n < min || n > max ? starting : n);
		this.#min = min;
		this.#max = max;
	}
	/**
	 * This method acts as the base class, but will first validate that the number is within the bounds specified in the constructor.
	 *
	 * @param {number} v The number to be validated and set.
	 *
	 * @return {this} Returns `this` for easy chaining.
	 */
	set(v) {
		return v >= this.#min && v <= this.#max ? super.set(v) : this;
	}
}

/**
 * Class for storing String values.
 */
export class StringSetting extends Setting {
	constructor(name, starting = "") {
		super(name, window.localStorage.getItem(name) ?? starting);
	}
}

/**
 * Class for storing JSON values.
 *
 * @typedef T
 */
export class JSONSetting extends Setting {
	/**
	 * The JSONSetting class extends the `constructor` of [Setting](#settings_setting) to, in addition to the string name and default starting value, takes a required validator function to confirm the retrieved value is of type `T`.
	 *
	 * Otherwise this class just extends the base [Setting](#settings_setting) class with the `T` type.
	 *
	 * @param {string} name            Setting name.
	 * @param {T} starting             Default value.
	 * @param {(v: unknown) => v is T} validator A validator Function.
	 */
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
	/**
	 * This method will save any changes made to the stored `value` object, without having to re-set it.
	 *
	 * @return {this} Returns `this` for easy chaining.
	 */
	save() {
		this.set(this.value);
		return this;
	}
	[s](v) {
		return JSON.stringify(v);
	}
}
