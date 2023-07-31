export type TypeGuard<T> = (v: unknown) => v is T;

export type TypeGuardOf<T> = T extends TypeGuard<infer U> ? U : never;

type OR<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> | OR<Rest> : never;
type AND<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> & AND<Rest> : never;

const spreadable = Symbol("spread"),
      asSpreadable = {
	[spreadable]: true
      };

class SpreadableTypeGuard<T> extends Function {
	static from<T>(tg: TypeGuard<T>) {
		return Object.setPrototypeOf(tg, SpreadableTypeGuard) as TypeGuard<T> & SpreadableTypeGuard<T>;
	}

	*[Symbol.iterator]() {
		yield Object.assign((v: unknown): v is TypeGuardOf<T> => this(v), asSpreadable) as TypeGuard<T>;
	}
}

export const Bool = <T extends boolean>(d?: T) => SpreadableTypeGuard.from((v: unknown): v is T => typeof v === "boolean" && (d === undefined || v === d)),
Str = (r?: RegExp) => SpreadableTypeGuard.from((v: unknown): v is string => typeof v === "string" && (r === undefined || r.test(v))),
Undefined = () => SpreadableTypeGuard.from((v: unknown): v is undefined => v === undefined),
Null = () => SpreadableTypeGuard.from((v: unknown): v is null => v === null),
Num = (min = -Infinity, max = Infinity) => SpreadableTypeGuard.from((v: unknown): v is number => typeof v === "number" && v >= min && v <= max),
Int = (min = -Infinity, max = Infinity) => SpreadableTypeGuard.from((v: unknown): v is number => typeof v === "number" && (v|0) === v &&  v >= min && v <= max),
BigInt = (min?: bigint, max?: bigint) => SpreadableTypeGuard.from((v: unknown): v is bigint => typeof v === "bigint" && (min === undefined || v >= min) && (max === undefined || v <= max)),
Sym = () => SpreadableTypeGuard.from((v: unknown): v is Symbol => typeof v === "symbol"),
Val = <const T>(val: T) => SpreadableTypeGuard.from((v: unknown): v is T => v === val),
Any = () => SpreadableTypeGuard.from((_: unknown): _ is any => true),
Arr = <T>(t?: TypeGuard<T>) => SpreadableTypeGuard.from((v: unknown): v is Array<T> => {
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
Tuple = <const T extends readonly any[], const U extends {[K in keyof T]: TypeGuard<T[K]>} = {[K in keyof T]: TypeGuard<T[K]>}>(...t: U) => SpreadableTypeGuard.from((v: unknown): v is {-readonly [K in keyof U]: TypeGuardOf<U[K]>;} => {
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
Obj = <T extends {}, U extends {[K in keyof T]: TypeGuard<T[K]>} = {[K in keyof T]: TypeGuard<T[K]>}>(t?: U) => SpreadableTypeGuard.from((v: unknown): v is {[K in keyof U]: TypeGuardOf<U[K]>;} => {
	if (!(v instanceof Object)) {
		return false;
	}

	if (t) {
		for (const [k, e] of Object.entries(v)) {
			const tg = t[k as keyof typeof t];

			if (tg && !tg(e)) {
				return false;
			}
		}
	}

	return true;
}),
Recur = <T>(tg: () => TypeGuard<T>) => {
	let ttg: TypeGuard<T>;

	return (v: unknown): v is T => {
		return (ttg ??= tg())(v);
	};
},
Rec = <K extends TypeGuard<keyof any>, V extends TypeGuard<any>>(key: K, value: V) => SpreadableTypeGuard.from((v: unknown): v is Record<TypeGuardOf<K>, TypeGuardOf<V>> => {
	if (!(v instanceof Object)) {
		return false;
	}

	for (const k of Reflect.ownKeys(v)) {
		if (!key(k) || !value(v[k as keyof typeof v])) {
			return false;
		}
	}

	return true;
}),
Or = <T extends readonly TypeGuard<any>[]>(...tgs: T) => SpreadableTypeGuard.from((v: unknown): v is OR<T> => {
	for (const tg of tgs) {
		if (tg(v)) {
			return true;
		}
	}

	return false;
}),
And = <T extends readonly TypeGuard<any>[]>(...tgs: T) => SpreadableTypeGuard.from((v: unknown): v is AND<T> => {
	for (const tg of tgs) {
		if (!tg(v)) {
			return false;
		}
	}

	return true;
});
