let throwErrors = false;

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
		return v => this.throw(v);
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
      };

export const asTypeGuard = tg => STypeGuard.from(tg),
Bool = d => STypeGuard.from(v => throwOrReturn(typeof v === "boolean" && (d === undefined || v === d), "boolean")),
Str = r => STypeGuard.from(v => throwOrReturn(typeof v === "string" && (r === undefined || r.test(v)), "string")),
Undefined = () => STypeGuard.from(v => throwOrReturn(v === undefined, "undefined")),
Null = () => STypeGuard.from(v => throwOrReturn(v === null, "null")),
Num = (min = -Infinity, max = Infinity) => STypeGuard.from(v => throwOrReturn(typeof v === "number" && v >= min && v <= max, "number")),
Int = (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => STypeGuard.from(v => throwOrReturn(typeof v === "number" && Number.isInteger(v) &&  v >= min && v <= max, "integer")),
BigInt = (min, max) => STypeGuard.from(v => throwOrReturn(typeof v === "bigint" && (min === undefined || v >= min) && (max === undefined || v <= max), "bigint")),
Sym = () => STypeGuard.from(v => throwOrReturn(typeof v === "symbol", "symbol")),
Val = val => STypeGuard.from(v => throwOrReturn(v === val, "value")),
Any = () => STypeGuard.from(_ => true),
Arr = t => STypeGuard.from(v => {
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

	return STypeGuard.from(v => {
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
Obj = t => STypeGuard.from(v => {
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
Rec = (key, value) => STypeGuard.from(v => {
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
Or = (...tgs) => STypeGuard.from(v => {
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
And = (...tgs) => STypeGuard.from(v => {
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
MapType = (key, value) => STypeGuard.from(v => {
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
SetType = t => STypeGuard.from(v => {
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
}),
Class = t => STypeGuard.from(v => throwOrReturn(v instanceof t, "class"));
