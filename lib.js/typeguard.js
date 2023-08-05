let throwErrors = false;

class SpreadableTypeGuard extends Function {
	static from(tg) {
		return Object.setPrototypeOf(tg, SpreadableTypeGuard.prototype);
	}

	throw(v) {
		try {
			throwErrors = true;

			return this(v);
		} finally {
			throwErrors = false;
		}
	}

	*[Symbol.iterator]() {
		yield SpreadTypeGuard.from<T>(this);
	}
}

class SpreadTypeGuard extends Function {
	static from(tg) {
		return Object.setPrototypeOf(tg, SpreadTypeGuard.prototype);
	}

	static [Symbol.hasInstance](instance) {
		return instance.__proto__ === SpreadTypeGuard.prototype;
	}
}

const noopTG = _ => true,
      throwUnknownError = v => {
	if (!v && throwErrors) {
		throw new Error("unknown type error");
	}

	return v;
      },
      throwOrReturn = (v, name, key, err) => {
	if (!v && throwErrors) {
		if (key !== undefined && err) {
			throw new TypeError(`invalid value: ${name}[${key}]: ${err instanceof Error ? err.message : err}`);
		}

		throw new TypeError(`invalid value: ${name}`);
	}

	return v;
      };

export const Bool = d => SpreadableTypeGuard.from(v => throwOrReturn(typeof v === "boolean" && (d === undefined || v === d), "boolean")),
Str = r => SpreadableTypeGuard.from(v => throwOrReturn(typeof v === "string" && (r === undefined || r.test(v)), "string")),
Undefined = () => SpreadableTypeGuard.from(v => throwOrReturn(v === undefined, "undefined")),
Null = () => SpreadableTypeGuard.from(v => throwOrReturn(v === null, "null")),
Num = (min = -Infinity, max = Infinity) => SpreadableTypeGuard.from(v => throwOrReturn(typeof v === "number" && v >= min && v <= max, "number")),
Int = (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => SpreadableTypeGuard.from(v => throwOrReturn(typeof v === "number" && Number.isInteger(v) &&  v >= min && v <= max, "integer")),
BigInt = (min, max) => SpreadableTypeGuard.from(v => throwOrReturn(typeof v === "bigint" && (min === undefined || v >= min) && (max === undefined || v <= max), "bigint")),
Sym = () => SpreadableTypeGuard.from(v => throwOrReturn(typeof v === "symbol", "symbol")),
Val = val => SpreadableTypeGuard.from(v => throwOrReturn(v === val, "value")),
Any = () => SpreadableTypeGuard.from(noopTG),
Arr = t => SpreadableTypeGuard.from(v => {
	if (!(v instanceof Array)) {
		return throwOrReturn(false, "array");
	}

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
Tuple = (...t) => {
	const tgs = [];

	for (const tg of t) {
		if (tg instanceof SpreadTypeGuard) {
			break;
		}

		tgs.push(tg);
	}

	const spread = tgs.length < t.length ? t.length - tgs.length === 1 ? t[t.length - 1] : Or(...t.slice(tgs.length)) : undefined;

	return SpreadableTypeGuard.from(v => {
		if (!(v instanceof Array)) {
			return throwOrReturn(false, "tuple");
		}

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
Obj = t => SpreadableTypeGuard.from(v => {
	if (!(v instanceof Object)) {
		return throwOrReturn(false, "object");
	}

	if (t) {
		for (const [k, e] of Object.entries(v)) {
			const tg = t[k];

			try {
				if (tg && !throwUnknownError(tg(e))) {
					return false;
				}
			} catch (err) {
				return throwOrReturn(false, "object", k, err);
			}
		}
	}

	return true;
}),
Recur = tg => {
	let ttg;

	return v => (ttg ??= tg())(v);
},
Rec = (key, value) => SpreadableTypeGuard.from(v => {
	if (!(v instanceof Object)) {
		return throwOrReturn(false, "record");
	}

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
Or = (...tgs) => SpreadableTypeGuard.from(v => {
	const errs = [];

	for (const tg of tgs) {
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
And = (...tgs) => SpreadableTypeGuard.from(v => {
	let pos = 0;

	for (const tg of tgs) {
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
MapType = (key, value) => SpreadableTypeGuard.from(v => {
	if (!(v instanceof Map)) {
		return throwOrReturn(false, "map");
	}

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
SetType = t => SpreadableTypeGuard.from(v => {
	if (!(v instanceof Set)) {
		return throwOrReturn(false, "set");
	}

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
});
