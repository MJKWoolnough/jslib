/**
 * The typeguard module provides the building blocks for creating type-safe typeguards.
 *
 * The intent is to be able to create your types from the typeguards, instead of creating typeguards for a type.
 *
 * @module typeguard
 */
/** */

let throwErrors = false,
    allowUndefined = null,
    take = null;


const throwUnknownError = v => {
	if (!v && throwErrors) {
		throw new TypeError("unknown type error");
	}

	return v;
      },
      throwOrReturn = (v, name, key, err) => {
	if (!v && throwErrors) {
		throw new TypeError(`invalid value: ${name}` + (key !== undefined && err ? `[${key}]: ${err instanceof Error ? err.message : err}` : ""));
	}

	return v;
      },
      mods = () => {
	      const mods = [allowUndefined, take];

	      allowUndefined = null;
	      take = null;

	      return mods;
      };

/**
 * This type represents a typeguard of the given type.
 *
 * In addition to being a callable typeguard function, has the following methods:
 *
 * @method throw  Runs the underlying typeguard and will throw errors on type mismatch.
 * @method throws Returns a TypeGuard that will throw errors on failures.
 *
 * Lastly, TypeGuards can be spread in Tuple calls.
 *
 * @typedef {(v: unknown) => v is T} TypeGuard
 * */
class STypeGuard extends Function {
	static from(tg) {
		return Object.setPrototypeOf(tg, STypeGuard.prototype);
	}

	throw(v) {
		const oldThrows = throwErrors;

		try {
			throwErrors = true;

			return this(v);
		} finally {
			throwErrors = oldThrows;
		}
	}

	throws() {
		return asTypeGuard(v => this.throw(v));
	}

	*[Symbol.iterator]() {
		yield SpreadTypeGuard.from(this);
	}
}

class SpreadTypeGuard extends Function {
	static from(tg) {
		return Object.setPrototypeOf(tg, SpreadTypeGuard.prototype);
	}
}

export const
/**
 * This function gives a custom typeguard additional functionality, such as being able to optionally throw errors, and be spreadable.
 *
 * NB: All TypeGuards created by this package already have this functionality.
 *
 * @typeParam T
 *
 * @param {<T>(v: unknown) => v is T} tg The TypeGuard the functionality will be added to.
 *
 * @return {TypeGuard<T>} The passed in typeguard, with additional functionality.
 */
asTypeGuard = tg => STypeGuard.from(tg),
/**
 * The Bool function returns a TypeGuard that checks for boolean values, and takes an optional, specific boolean value to check against.
 *
 * @param {boolean} [d] Exact boolean to match against.
 *
 * @return {TypeGuard<boolean>}
 */
Bool = d => asTypeGuard(v => throwOrReturn(typeof v === "boolean" && (d === undefined || v === d), "boolean")),
/**
 * The Str function returns a TypeGuard that checks for string values, and takes an optional regex to confirm string format against.
 *
 * @param {regex} [r] Regexp to compare any strings against.
 *
 * @return {TypeGuard<string>}
 */
Str = r => asTypeGuard(v => throwOrReturn(typeof v === "string" && (r === undefined || r.test(v)), "string")),
/**
 * The Undefined function returns a TypeGuard that checks for `undefined`.
 *
 * @return {TypeGuard<undefined>}
 */
Undefined = () => asTypeGuard(v => throwOrReturn(v === undefined, "undefined")),
/**
 * The Null function returns a TypeGuard that checks for `null`.
 *
 * @return {TypeGuard<null>}
 */
Null = () => asTypeGuard(v => throwOrReturn(v === null, "null")),
/**
 * The Num function returns a TypeGuard that checks for numbers, and takes optionsl min and max (inclusive) values to range check.
 *
 * @param {number} min Minimum values for the number.
 * @param {number} max Maximum values for the number.
 *
 * @return {TypeGuard<number>}
 */
Num = (min = -Infinity, max = Infinity) => asTypeGuard(v => throwOrReturn(typeof v === "number" && v >= min && v <= max, "number")),
/**
 * The Int function returns a TypeGuard that checks for integers, and takes optionsl min and max (inclusive) values to range check.
 *
 * @param {number} min Minimum values for the integer.
 * @param {number} max Maximum values for the integer.
 *
 * @return {TypeGuard<number>}
 */
Int = (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => asTypeGuard(v => throwOrReturn(typeof v === "number" && Number.isInteger(v) && v >= min && v <= max, "integer")),
/**
 * The BigInt function returns a TypeGuard that checks for bigints, and takes optionsl min and max (inclusive) values to range check.
 *
 * @param {number} min Minimum values for the bigint.
 * @param {number} max Maximum values for the bigint.
 *
 * @return {TypeGuard<bigint>}
 */
BigInt = (min, max) => asTypeGuard(v => throwOrReturn(typeof v === "bigint" && (min === undefined || v >= min) && (max === undefined || v <= max), "bigint")),
/**
 * The Sym function returns a TypeGuard that checks for symbols.
 *
 * @return {TypeGuard<symbol>}
 */
Sym = () => asTypeGuard(v => throwOrReturn(typeof v === "symbol", "symbol")),
/**
 * The Val function returns a TypeGuard that checks for a specific value.
 *
 * @param {any} v The value to check against.
 *
 * @return {TypeGuard<any>}
 */
Val = val => asTypeGuard(v => throwOrReturn(v === val, "value")),
/**
 * The Any function returns a TypeGuard that allows any value.
 *
 * @return {TypeGuard<any>}
 */
Any = () => asTypeGuard(_ => true),
/**
 * The Arr function returns a TypeGuard that checks for an Array, running the given TypeGuard on each element.
 *
 * @param {TypeGuard<any>} t The TypeGuard to run on each element.
 *
 * @return {TypeGuard<any[]}
 */
Arr = t => asTypeGuard(v => {
	if (!(v instanceof Array)) {
		return throwOrReturn(false, "array");
	}

	mods();

	let pos = 0;

	for (const e of v) {
		try {
			if (!throwUnknownError(t(e))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "array", pos, err);
		}

		pos++;
	}

	return true;
}),
/**
 * The Tuple function returns a TypeGuard that checks for the given types in an array.
 *
 * @param {...TypeGuard<any>} The elements of the tuple. TypeGuards can be spread to allow for and unknown number of that type (follow the typescript rules for spreads).
 *
 * @return {TypeGuard<[]>}
 */
Tuple = (...t) => {
	const tgs = [];

	for (const tg of t) {
		if (tg instanceof SpreadTypeGuard) {
			break;
		}

		tgs.push(tg);
	}

	const spread = tgs.length < t.length ? t.length - tgs.length === 1 ? t[t.length - 1] : Or(...t.slice(tgs.length)) : undefined;

	return asTypeGuard(v => {
		if (!(v instanceof Array)) {
			return throwOrReturn(false, "tuple");
		}

		mods();

		let pos = 0;

		try {
			for (const tg of tgs) {
				if (!throwUnknownError(tg(v[pos]))) {
					return false;
				}

				pos++;
			}

			if (spread) {
				for (; pos < v.length; pos++) {
					if (!throwUnknownError(spread(v[pos]))) {
						return false;
					}
				}
			}
		} catch (err) {
			return throwOrReturn(false, "tuple", pos, err);
		}

		return throwOrReturn(pos === v.length, "tuple", "", "extra values");
	});
},
/**
 * The Obj function returns a TypeGuard that checks for an object type defined by the passed object of TypeGuards.
 *
 * @param {Record<keyof any, TypeGuard<any>} t The Object definition build from TypeGuards.
 *
 * @return {TypeGuard<Object>}
 */
Obj = t => asTypeGuard(v => {
	const [au, tk] = mods();

	if (!(v instanceof Object)) {
		return throwOrReturn(false, "object");
	}

	if (t) {
		for (const [k, tg] of Object.entries(t)) {
			if (tk) {
				if (!tk.includes(k)) {
					continue;
				}
			}

			const e = v[k];

			if (e === undefined) {
				if (au === true) {
					continue;
				} else if (au === false) {
					return throwOrReturn(false, "object", k, "required is undefined");
				}
			}

			try {
				if (!throwUnknownError(tg(e))) {
					return false;
				}
			} catch (err) {
				return throwOrReturn(false, "object", k, err);
			}
		}
	}

	return true;
}),
/**
 * The Part function takes an existing TypeGuard created by the Obj function and transforms it to allow any of the defined keys to not exist (or to be 'undefined').
 *
 * @param {TypeGuard<{}>} tg The TypeGuard created by a call to Obj.
 *
 * @return {TypeGuard<{}>}
 */
Part = tg => asTypeGuard(v => {
	allowUndefined ??= true;

	try {
		return tg(v);
	} finally {
		allowUndefined = null;
	}
}),
/**
 * The Req function takes an existing TypeGuard created by the Obj function and transforms it to require all of the defined keys to exist and to not be undefined.
 *
 * @param {TypeGuard<{}>} tg The TypeGuard created by a call to Obj.
 *
 * @return {TypeGuard<{}>}
 */
Req = tg => asTypeGuard(v => {
	allowUndefined ??= false;

	try {
		return tg(v);
	} finally {
		allowUndefined = null;
	}
}),
Take = (tg, ...keys) => asTypeGuard(v => {
	take = keys;

	try{
		return tg(v);
	} finally {
		take = null;
	}
}),
/**
 * The Recur function wraps an existing TypeGuard so it can be used recursively within within itself during TypeGuard creation. The base TypeGuard will need to have it's type specified manually when used this way.
 *
 * @param {TypeGuard<any>}
 *
 * @return {TypeGuard<any>}
 */
Recur = tg => {
	let ttg;

	return asTypeGuard(v => (ttg ??= tg())(v));
},
/**
 * The IntKey function returns a TypeGuard that checks for a string value that represents an integer. Intended to be used with Rec for integer key types.
 *
 * @return {TypeGuard<string>}
 */
IntKey = () => asTypeGuard(v => throwOrReturn(typeof v === "string" && parseInt(v) + "" === v, "IntKey")),
/**
 * The Rec function returns a TypeGuard that checks for an Object type where the keys and values are of the types specified.
 *
 * @param {TypeGuard<Exclude<keyof any, number>>} key The Key type.
 * @param {TypeGuard<any>} value                      The Value type.
 *
 * @return {Record<keyof any, any>}
 */
Rec = (key, value) => asTypeGuard(v => {
	if (!(v instanceof Object)) {
		return throwOrReturn(false, "record");
	}

	mods();

	for (const k of Reflect.ownKeys(v)) {
		try {
			if (!throwUnknownError(key(k))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "record-key", k, err);
		}

		try {
			if (!throwUnknownError(value(v[k]))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "record", k, err);
		}
	}

	return true;
}),
/**
 * The Or function returns a TypeGuard that checks a value matches against any of the given TypeGuards.
 *
 * @param {...TypeGuard<any>} ths A list of TypeGuards to match against.
 *
 * @return {TypeGuard<any>}
 */
Or = (...tgs) => asTypeGuard(v => {
	const errs = [],
	      [au, tk] = mods();

	for (const tg of tgs) {
		allowUndefined = au;
		take = tk;

		try {
			if (tg(v)) {
				return true;
			}

			throwUnknownError(false);
		} catch (err) {
			errs.push(err instanceof Error ? err.message : err + "");
		}
	}

	return throwOrReturn(false, "OR", "", errs.join(" | "));
}),
/**
 * The And function returns a TypeGuard that checks a value matches against all of the given TypeGuards.
 *
 * @param {...TypeGuard<any>} ths A list of TypeGuards to match against.
 *
 * @return {TypeGuard<any>}
 */
And = (...tgs) => asTypeGuard(v => {
	let pos = 0;

	const [au, tk] = mods();

	for (const tg of tgs) {
		allowUndefined = au;
		take = tk;

		try {
			if (!throwUnknownError(tg(v))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "AND", pos, err);
		}

		pos++;
	}

	return true;
}),
/**
 * The MapType function returns a TypeGuard that checks for an Map type where the keys and values are of the types specified.
 *
 * @param {TypeGuard<any>} key   The Key type.
 * @param {TypeGuard<any>} value The Value type.
 *
 * @return {Map<keyof any, any>}
 */
MapType = (key, value) => asTypeGuard(v => {
	if (!(v instanceof Map)) {
		return throwOrReturn(false, "map");
	}

	mods();

	for (const [k, val] of v) {
		try {
			if (!throwUnknownError(key(k))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "map-key", k, err);
		}

		try {
			if (!throwUnknownError(value(val))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "map", k, err);
		}
	}

	return true;
}),
/**
 * The SetType function returns a TypeGuard that checks for an Set type where the values are of the type specified.
 *
 * @param {TypeGuard<any>} value The Value type.
 *
 * @return {Set<any>}
 */
SetType = t => asTypeGuard(v => {
	if (!(v instanceof Set)) {
		return throwOrReturn(false, "set");
	}

	mods();

	let pos = 0;

	for (const val of v) {
		try {
			if (!throwUnknownError(t(val))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "set", pos, err);
		}

		pos++;
	}

	return true;
}),
/**
 * The Class function returns a TypeGuard that checks a value is of the class specified.
 *
 * @param {Class} c The class to check against.
 *
 * @return {TypeGuard<class>}
 */
Class = t => asTypeGuard(v => throwOrReturn(v instanceof t, "class")),
/**
 * The Func function returns a TypeGuard that checks a value is a function. An optional number of arguments can be specified as an additional check.
 *
 * @param {number} [args] Number of arguments that the function must have.
 *
 * @returns {TypeGuard<Function>}
 */
Func = args => asTypeGuard(v => throwOrReturn(v instanceof Function && (args === undefined || v.length === args), "Function"));
