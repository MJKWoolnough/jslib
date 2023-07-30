export type TypeGuardOf<T> = T extends (v: unknown) => v is infer U ? U : never;

type OR<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> | OR<Rest> : never;
type AND<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> & AND<Rest> : never;

const spreadable = Symbol("spread"),
      asSpreadable = {
	[spreadable]: true
      }

export const makeSpreadable = <T extends (v: unknown) => v is any>(tg: T) => {
	return Object.assign(tg, {
		*[Symbol.iterator]() {
			yield Object.assign((v: unknown): v is TypeGuardOf<T> => tg(v), asSpreadable);
		}
	});
},
Bool = <T extends boolean>(d?: T) => makeSpreadable((v: unknown): v is T => typeof v === "boolean" && (d === undefined || v === d)),
Str = (r?: RegExp) => makeSpreadable((v: unknown): v is string => typeof v === "string" && (r === undefined || r.test(v))),
Undefined = () => makeSpreadable((v: unknown): v is undefined => v === undefined),
Null = () => makeSpreadable((v: unknown): v is null => v === null),
Num = (min = -Infinity, max = Infinity) => makeSpreadable((v: unknown): v is number => typeof v === "number" && v >= min && v <= max),
Int = (min = -Infinity, max = Infinity) => makeSpreadable((v: unknown): v is number => typeof v === "number" && (v|0) === v &&  v >= min && v <= max),
BigInt = (min?: bigint, max?: bigint) => makeSpreadable((v: unknown): v is bigint => typeof v === "bigint" && (min === undefined || v >= min) && (max === undefined || v <= max)),
Sym = () => makeSpreadable((v: unknown): v is Symbol => typeof v === "symbol"),
Val = <const T>(val: T) => makeSpreadable((v: unknown): v is T => v === val),
Arr = <T>(t?: (v: unknown) => v is T) => makeSpreadable((v: unknown): v is Array<T> => {
	if (!(v instanceof Array)) {
		return false;
	}

	if (t) {
		for (const e of v) {
			if (!t(e)) {
				return false;
			}
		}
	}

	return true;
}),
Tuple = <const T extends readonly ((v: unknown) => v is any)[]>(...t: T) => makeSpreadable((v: unknown): v is {-readonly [K in keyof T]: TypeGuardOf<T[K]>;} => {
	if (!(v instanceof Array)) {
		return false;
	}

	if (t.length === 0) {
		return v.length === 0;
	}

	const lastIsSpread = spreadable in t[t.length];

	let pos = 0;

	for (const tg of t) {
		if (lastIsSpread && pos === t.length) {
			for (; pos < v.length; pos++) {
				if (!tg(v[pos])) {
					return false;
				}
			}
		} else {
			if (tg(v[pos++])) {
				return false;
			}
		}
	}

	return true;
}),
Obj = <T extends {[K: string]: (v: unknown) => v is any}>(t?: T) => makeSpreadable((v: unknown): v is {[K in keyof T]: TypeGuardOf<T[K]>;} => {
	if (!(v instanceof Object)) {
		return false;
	}

	if (t) {
		for (const [k, e] of Object.entries(v)) {
			const tg = t[k];

			if (tg && !tg(e)) {
				return false;
			}
		}
	}

	return true;
}),
Rec = <K extends (v: unknown) => v is keyof any, V extends (v: unknown) => v is any>(key: K, value: V) => (v: unknown): v is Record<TypeGuardOf<K>, TypeGuardOf<V>> => {
	if (!(v instanceof Object)) {
		return false;
	}

	for (const k of Reflect.ownKeys(v)) {
		if (!key(k) || !value(v[k as keyof typeof v])) {
			return false;
		}
	}

	return true;
},
Or = <T extends readonly ((v: unknown) => v is any)[]>(...tgs: T) => makeSpreadable((v: unknown): v is OR<T> => {
	for (const tg of tgs) {
		if (tg(v)) {
			return true;
		}
	}

	return false;
}),
And = <T extends readonly ((v: unknown) => v is any)[]>(...tgs: T) => makeSpreadable((v: unknown): v is AND<T> => {
	for (const tg of tgs) {
		if (!tg(v)) {
			return false;
		}
	}

	return true;
});
