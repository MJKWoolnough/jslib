export type TypeGuardOf<T> = T extends (v: unknown) => v is infer U ? U : never;

type OR<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> | OR<Rest> : never;
type AND<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> & AND<Rest> : never;

export const Bool = () => (v: unknown): v is boolean => typeof v === "boolean",
Str = () => (v: unknown): v is string => typeof v === "string",
Undefined = () => (v: unknown): v is undefined => v === undefined,
Null = () => (v: unknown): v is null => v === null,
Num = () => (v: unknown): v is number => typeof v === "number",
BigInt = () => (v: unknown): v is bigint => typeof v === "bigint",
Sym = () => (v: unknown): v is Symbol => typeof v === "symbol",
Arr = <T>(t?: (v: unknown) => v is T) => (v: unknown): v is Array<T> => {
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
},
Obj = <T extends {[K: string]: (v: unknown) => v is any}>(t?: T) => (v: unknown): v is {[K in keyof T]: TypeGuardOf<T[K]>;} => {
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
},
Or = <T extends readonly ((v: unknown) => v is any)[]>(...tgs: T) => (v: unknown): v is OR<T> => {
	for (const tg of tgs) {
		if (tg(v)) {
			return true;
		}
	}

	return false;
},
And = <T extends readonly ((v: unknown) => v is any)[]>(...tgs: T) => (v: unknown): v is AND<T> => {
	for (const tg of tgs) {
		if (!tg(v)) {
			return false;
		}
	}

	return true;
};
