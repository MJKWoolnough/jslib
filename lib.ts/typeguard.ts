export type TypeGuard<T> = (v: unknown) => v is T;

export type TypeGuardOf<T> = T extends TypeGuard<infer U> ? U : never;

type OR<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> | OR<Rest> : never;

type AND<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> & AND<Rest> : never;

let throwErrors = false;

class SpreadableTypeGuard<T> extends Function {
	#spread?: TypeGuard<T>;

	static from<T>(tg: TypeGuard<T>) {
		return Object.setPrototypeOf(tg, SpreadableTypeGuard.prototype) as TypeGuard<T> & SpreadableTypeGuard<T>;
	}

	throw(v: unknown): v is T {
		try {
			throwErrors = true;

			return this(v);
		} finally {
			throwErrors = false;
		}
	}

	*[Symbol.iterator]() {
		yield this.#spread ??= SpreadTypeGuard.from<T>(this);
	}
}

class SpreadTypeGuard extends Function {
	static from<T>(tg: SpreadableTypeGuard<T>) {
		return Object.setPrototypeOf(tg, SpreadableTypeGuard.prototype) as TypeGuard<T>;
	}
}

const noopTG = (_: unknown): _ is any => true,
      throwUnknownError = (v: boolean) => {
	if (!v && throwErrors) {
		throw new Error("unknown type error");
	}

	return v;
      },
      throwOrReturn = (v: boolean, name: string, key?: any, err?: string | Error) => {
	if (!v && throwErrors) {
		if (key !== undefined && err) {
			throw new TypeError(`invalid value: ${name}[${key}]: ${err instanceof Error ? err.message : err}`);
		}

		throw new TypeError(`invalid value: ${name}`);
	}

	return v;
      };

export const Bool = <T extends boolean>(d?: T) => SpreadableTypeGuard.from((v: unknown): v is T => throwOrReturn(typeof v === "boolean" && (d === undefined || v === d), "boolean")),
Str = (r?: RegExp) => SpreadableTypeGuard.from((v: unknown): v is string => throwOrReturn(typeof v === "string" && (r === undefined || r.test(v)), "string")),
Undefined = () => SpreadableTypeGuard.from((v: unknown): v is undefined => throwOrReturn(v === undefined, "undefined")),
Null = () => SpreadableTypeGuard.from((v: unknown): v is null => throwOrReturn(v === null, "null")),
Num = (min = -Infinity, max = Infinity) => SpreadableTypeGuard.from((v: unknown): v is number => throwOrReturn(typeof v === "number" && v >= min && v <= max, "number")),
Int = (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => SpreadableTypeGuard.from((v: unknown): v is number => throwOrReturn(typeof v === "number" && Number.isInteger(v) &&  v >= min && v <= max, "integer")),
BigInt = (min?: bigint, max?: bigint) => SpreadableTypeGuard.from((v: unknown): v is bigint => throwOrReturn(typeof v === "bigint" && (min === undefined || v >= min) && (max === undefined || v <= max), "bigint")),
Sym = () => SpreadableTypeGuard.from((v: unknown): v is Symbol => throwOrReturn(typeof v === "symbol", "symbol")),
Val = <const T>(val: T) => SpreadableTypeGuard.from((v: unknown): v is T => throwOrReturn(v === val, "value")),
Any = () => SpreadableTypeGuard.from(noopTG),
Arr = <T>(t: TypeGuard<T>) => SpreadableTypeGuard.from((v: unknown): v is Array<T> => {
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
			return throwOrReturn(false, "array", pos, err as Error);
		}

		pos++;
	}

	return true;
}),
Tuple = <const T extends readonly any[], const U extends {[K in keyof T]: TypeGuard<T[K]>} = {[K in keyof T]: TypeGuard<T[K]>}>(...t: U) => {
	const tgs: TypeGuard<any>[] = [];

	for (const tg of t) {
		if (tg instanceof SpreadTypeGuard) {
			break;
		}

		tgs.push(tg);
	}

	const spread = tgs.length < t.length ? t.length - tgs.length === 1 ? t[t.length - 1] : Or(...t.slice(tgs.length)) : noopTG;

	return SpreadableTypeGuard.from((v: unknown): v is {-readonly [K in keyof U]: TypeGuardOf<U[K]>;} => {
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

			for (; pos < v.length; pos++) {
				if (!throwUnknownError(spread(v[pos]))) {
					return false;
				}
			}
		} catch (err) {
			return throwOrReturn(false, "tuple", pos, err as Error);
		}

		return throwOrReturn(pos === t.length, "tuple");
	});
},
Obj = <T extends {}, U extends {[K in keyof T]: TypeGuard<T[K]>} = {[K in keyof T]: TypeGuard<T[K]>}>(t?: U) => SpreadableTypeGuard.from((v: unknown): v is {[K in keyof U]: TypeGuardOf<U[K]>;} => {
	if (!(v instanceof Object)) {
		return throwOrReturn(false, "object");
	}

	if (t) {
		for (const [k, e] of Object.entries(v)) {
			const tg = t[k as keyof typeof t];

			try {
				if (tg && !throwUnknownError(tg(e))) {
					return false;
				}
			} catch (err) {
				return throwOrReturn(false, "object", k, err as Error);
			}
		}
	}

	return true;
}),
Recur = <T>(tg: () => TypeGuard<T>) => {
	let ttg: TypeGuard<T>;

	return (v: unknown): v is T => (ttg ??= tg())(v);
},
Rec = <K extends TypeGuard<keyof any>, V extends TypeGuard<any>>(key: K, value: V) => SpreadableTypeGuard.from((v: unknown): v is Record<TypeGuardOf<K>, TypeGuardOf<V>> => {
	if (!(v instanceof Object)) {
		return throwOrReturn(false, "record");
	}

	for (const k of Reflect.ownKeys(v)) {
		try {
			if (!throwUnknownError(key(k))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "record-key", k, err as Error);
		}

		try {
			if (!throwUnknownError(value(v[k as keyof typeof v]))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "record", k, err as Error);
		}
	}

	return true;
}),
Or = <T extends readonly TypeGuard<any>[]>(...tgs: T) => SpreadableTypeGuard.from((v: unknown): v is OR<T> => {
	const errs: string[] = [];

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
And = <T extends readonly TypeGuard<any>[]>(...tgs: T) => SpreadableTypeGuard.from((v: unknown): v is AND<T> => {
	let pos = 0;

	for (const tg of tgs) {
		try {
			if (!throwUnknownError(tg(v))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "AND", pos, err as Error);
		}

		pos++;
	}

	return true;
}),
MapType = <K extends TypeGuard<any>, V extends TypeGuard<any>>(key: K, value: V) => SpreadableTypeGuard.from((v: unknown): v is Map<TypeGuardOf<K>, TypeGuardOf<V>> => {
	if (!(v instanceof Map)) {
		return throwOrReturn(false, "map");
	}

	for (const [k, val] of v) {
		try {
			if (!throwUnknownError(key(k))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "map-key", k, err as Error);
		}

		try {
			if (!throwUnknownError(value(val))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "map", k, err as Error);
		}
	}

	return true;
}),
SetType = <T>(t: TypeGuard<T>) => SpreadableTypeGuard.from((v: unknown): v is Set<T> => {
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
			return throwOrReturn(false, "set", pos, err as Error);
		}

		pos++;
	}

	return true;
});
