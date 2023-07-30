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
Bool = () => makeSpreadable((v: unknown): v is boolean => typeof v === "boolean"),
Str = () => makeSpreadable((v: unknown): v is string => typeof v === "string"),
Undefined = () => makeSpreadable((v: unknown): v is undefined => v === undefined),
Null = () => makeSpreadable((v: unknown): v is null => v === null),
Num = () => makeSpreadable((v: unknown): v is number => typeof v === "number"),
BigInt = () => makeSpreadable((v: unknown): v is bigint => typeof v === "bigint"),
Sym = () => makeSpreadable((v: unknown): v is Symbol => typeof v === "symbol"),
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
