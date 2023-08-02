let throwErrors = false;

class SpreadableTypeGuard extends Function {
	#spread;
	#throwable;

	static from(tg) {
		return Object.setPrototypeOf(tg, SpreadableTypeGuard.prototype);
	}

	throw() {
		throwErrors = true;

		this();

		throwErrors = false;
	}

	asThrowable() {
		return this.#throwable ??= () => this();
	}

	*[Symbol.iterator]() {
		yield this.#spread ??= SpreadTypeGuard.from<T>(this);
	}
}

class SpreadTypeGuard extends Function {
	static from(tg) {
		return Object.setPrototypeOf(tg, SpreadableTypeGuard.prototype);
	}
}

const noopTG = _ => true,
      throwOrReturn = (v, name, key, err) => {
	if (!v && throwErrors) {
		if (key != undefined && err) {
			throw new TypeError(`invalid value: ${name}[${key}]: ${err}`);
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
Int = (min = -Infinity, max = Infinity) => SpreadableTypeGuard.from(v => throwOrReturn(typeof v === "number" && (v|0) === v &&  v >= min && v <= max, "integer")),
BigInt = (min, max) => SpreadableTypeGuard.from(v => throwOrReturn(typeof v === "bigint" && (min === undefined || v >= min) && (max === undefined || v <= max), "bigint")),
Sym = () => SpreadableTypeGuard.from(v => throwOrReturn(typeof v === "symbol", "symbol")),
Val = val => SpreadableTypeGuard.from(v => throwOrReturn(v === val, "value")),
Any = () => SpreadableTypeGuard.from(_ => true),
Arr = t => SpreadableTypeGuard.from(v => {
	if (!(v instanceof Array)) {
		return throwOrReturn(false, "array");
	}

	let pos = 0;

	for (const e of v) {
		try {
			if (!t(e)) {
				return false;
			}
		} catch (err) {
			throwOrReturn(false, "array", pos, err.message);
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

	const spread = tgs.length < t.length ? t.length - tgs.length === 1 ? t[t.length - 1] : Or(...t.slice(tgs.length)) : noopTG;

	return SpreadableTypeGuard.from(v => {
		if (!(v instanceof Array)) {
			return throwOrReturn(false, "tuple");
		}

		let pos = 0;

		try {
			for (const tg of tgs) {
				if (!tg(v[pos])) {
					return false;
				}

				pos++;
			}

			if (pos < t.length) {
				for (; pos < v.length; pos++) {
					if (!spread(v[pos])) {
						return false;
					}
				}
			}
		} catch (err) {
			throwOrReturn(false, "tuple", pos, err.message);
		}

		return throwOrReturn(pos === t.length, "tuple");
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
				if (tg && !tg(e)) {
					return false;
				}
			} catch (err) {
				throwOrReturn(false, "object", k, err.message);
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
			if (!key(k)) {
				return false;
			}
		} catch (err) {
			throwOrReturn(false, "record-key", k, err.message);
		}

		try {
			if (!value(v[k])) {
				return false;
			}
		} catch (err) {
			throwOrReturn(false, "record", k, err.message);
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
		} catch (err) {
			errs.push(err.message);
		}
	}

	return throwOrReturn(false, "OR", "", errs.join(" | "));
}),
And = (...tgs) => SpreadableTypeGuard.from(v => {
	let pos = 0;

	for (const tg of tgs) {
		try {
			if (!tg(v)) {
				return false;
			}
		} catch (err) {
			throwOrReturn(false, "AND", pos, err.message);
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
			if (!key(k)) {
				return false;
			}
		} catch (err) {
			throwOrReturn(false, "map-key", k, err.message);
		}

		try {
			if (!value(val)) {
				return false;
			}
		} catch (err) {
			throwOrReturn(false, "map", k, err.message);
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
			if (!t(val)) {
				return false;
			}
		} catch (err) {
			throwOrReturn(false, "set", pos, err.message);
		}

		pos++;
	}

	return true;
});
