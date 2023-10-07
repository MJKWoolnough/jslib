/**
 * The typeguard module provides the building blocks for creating type-safe typeguards.
 *
 * The intent is to be able to create your types from the typeguards, instead of creating typeguards for a type.
 *
 * @module typeguard
 * @requires module:misc
 */
/** */

import {setAndReturn} from './misc.js';

/** This Type retrieves the guarded type from a TypeGuard. */
export type TypeGuardOf<T> = T extends TypeGuard<infer U> ? U : never;

type OR<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> | OR<Rest> : never;

type AND<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? TypeGuardOf<U> & AND<Rest> : unknown;

type ORVals<T> = T extends readonly [first: infer U, ...rest: infer Rest] ? U | ORVals<Rest> : never;

type Template<S extends string, T> = T extends readonly [first: TypeGuard<string>, second: string, ...rest: infer U] ? Template<`${S}${TypeGuardOf<T[0]>}${T[1]}`, U> : S;

type AltTuple<T> = T extends readonly [tg: infer G, s: infer S, ...rest: infer Rest] ? [G, S] extends [TypeGuard<string>, string] ? readonly [G, S, ...AltTuple<Rest>] : never : readonly [];

type Deps = Record<string, string>;

type Aliases = {
	deps?: Deps;
}

type ObjectDefinition = readonly ["Object", Record<string | number | symbol, Definition>];

type AndOrDefinition = readonly ["Or" | "And", readonly Definition[]];

type PrimitiveOrValueDefinition = readonly ["", string, string?];

type TemplateOr = ["Or", readonly PrimitiveOrValueDefinition[]];

type TemplateData = [string, ...(string | PrimitiveOrValueDefinition | TemplateOr)[]];

type TemplateDefinition = readonly ["Template", TemplateData]

type Definition = PrimitiveOrValueDefinition | TemplateDefinition | readonly ["Array", Definition] | readonly ["Tuple", readonly Definition[], Definition?] | AndOrDefinition | ObjectDefinition | readonly ["Recur", string, Definition?] | readonly [Exclude<string, "Tuple" | "Array" | "Tuple" | "Or" | "And" | "Object" | "Recur">, Definition, Definition?] // Normal, Array, Tuple, Or/And, Object, Special

type DefinitionWithDeps = Definition & Aliases;

type StoredDefinition = Definition | (() => Definition);

let throwErrors = false,
    allowUndefined: boolean | null = null,
    take: (keyof any)[] | null = null,
    skip: (keyof any)[] | null = null,
    unknownTypes = 0;

const throwUnknownError = (v: boolean) => {
	if (!v && throwErrors) {
		throw new TypeError("unknown type error");
	}

	return v;
      },
      throwOrReturn = (v: boolean, name: string, key?: any, err?: any) => {
	if (!v && throwErrors) {
		throw new TypeError(`invalid value: ${name}` + (key !== undefined && err ? `[${key}]: ${err instanceof Error ? err.message : err}` : ""));
	}

	return v;
      },
      mods = () => {
	const mods = [allowUndefined, take, skip] as const;

	allowUndefined = null;
	take = null;
	skip = null;

	return mods;
      },
      resetMods = ([au, tk, s]: readonly [typeof allowUndefined, typeof take, typeof skip]) => () => {
	allowUndefined = au;
	take = tk;
	skip = s;
      },
      unknownStr = "unknown",
      [unknownDef, anyDef, numberDef, bigIntDef, stringDef, booleanDef, functionDef, symbolDef, neverDef, undefinedDef, nullDef, voidDef] = [unknownStr, "any", "number", "bigint", "string", "boolean", "Function", "symbol", "never", "undefined", "null", "void"].map(v => Object.freeze(["", v] as const)),
      definitions = new WeakMap<STypeGuard<any>, StoredDefinition>(),
      strings = new WeakMap<Definition, string>(),
      spreads = new WeakMap<SpreadTypeGuard, STypeGuard<any>>(),
      identifer = /^[_$\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*$/v,
      matchTemplate = (v: string, p: readonly (string | TypeGuard<string>)[]) => {
	const [tg, s, ...rest] = p as readonly [TypeGuard<string>, string, ...(string | TypeGuard<string>)[]];

	if (rest.length === 0) {
		if (v.endsWith(s) && tg(v.slice(0, v.length - s.length))) {
			return true;
		}

		return false;
	}

	for (let pos = 0; pos < v.length - s.length; pos++) {
		pos = v.indexOf(s, pos);
		if (pos < 0) {
			break;
		}

		if (tg(v.slice(0, pos)) && matchTemplate(v.slice(pos + s.length), rest)) {
			return true;
		}
	}

	return false;
      },
      filterObj = (def: Definition, fn: (key: string | number | symbol, val: Definition) => null | [typeof key, Definition]): Definition => {
	if (def[0] === "Object") {
		const obj: Record<string | number | symbol, Definition> = {};

		for (const [key, value] of Object.entries(def[1])) {
			const d = fn(key, value);

			if (d) {
				obj[d[0]] = d[1];
			}
		}

		return [def[0], obj] as ObjectDefinition;
	} else if (def[0] === "Or" || def[0] === "And") {
		return [def[0], (def[1] as Definition[]).map(d => d[0] === "Object" || d[0] === "Or" || d[0] == "And" ? filterObj(d, fn) : d)];
	}

	return def;
      },
      reduceAndOr = (andOr: "And" | "Or", tgs: readonly TypeGuard<any>[]): Definition => {
	const list: Definition[] = [],
	      simple = new Set();

	for (const tg of tgs) {
		const def = tg.def();

		if (def[0] === andOr) {
			for (const d of def[1] as Definition[]) {
				if (d[0] === "") {
					if (simple.has(d[1])) {
						continue
					}

					simple.add(d[1]);
				}

				list.push(d);
			}
		} else if ((def[0] !== "" || def[1] !== "never")) {
			if (def[0] === "") {
				if (simple.has(def[1])) {
					continue
				}

				simple.add(def[1]);
			}

			list.push(def);
		}
	}

	return list.length === 1 ? list[0] : list.length ? [andOr, list] : neverDef;
      },
      templateSafe = (s: string) => s.replaceAll("${", "\\${").replaceAll("`", "\\`"),
      toString = (def: Definition): string => strings.get(def) ?? setAndReturn(strings, def, defToString(def)),
      defToString = (def: Definition): string => {
	switch (def[0]) {
	case "":
	case "Recur":
		return typeof def[2] === "string" ? `${def[1]} /* ${def[2]} */` : def[1] as string;
	case "Template":
		return (def[1] as (string | PrimitiveOrValueDefinition)[]).reduce((s, d, n) => s + (n % 2 ? "${" + toString(d as PrimitiveOrValueDefinition) + "}" : templateSafe(d as string)), "`") + "`";
	case "Array":
		return (def[1][0] === "And" || def[1][0] === "Or" ? `(${toString(def[1])})` : toString(def[1])) + "[]";
	case "And":
	case "Or":
		return (def[1] as Definition[]).map(d => def[0] === "And" && d[0] === "Or" ? `(${toString(d)})` : toString(d)).join(def[0] === "And" ? " & " : " | ");
	case "Object":
		return (Object.entries(def[1]) as [string, Definition][]).filter(([k]) => typeof k === "string").map(([k, d]) => `	${k.match(identifer) ? k : JSON.stringify(k)}${(d[0] === "" && d[1] === "undefined") || d[0] === "Or" && (d[1] as Definition[]).some(e => e[0] === "" && e[1] === "undefined") ? "?" : ""}: ${toString(d).replaceAll("\n", "\n	")};\n`).reduce((t, e, n) => t + (!n ? "\n" : "") + e, "{")  + "}";
	case "Tuple":
		return "[" + (def[1] as Definition[]).map(toString).concat(def[2] ? "..." + (["Or", "And"].includes(def[2][0]) ? `(${toString(def[2])})` : toString(def[2])) + "[]" : []).join(", ") + "]";
	default:
		return `${def[0]}<${(def.slice(1) as Definition[]).map(toString).join(", ")}>`;
	}
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
 * */
export type TypeGuard<T> = STypeGuard<T> & ((v: unknown) => v is T);

class STypeGuard<T> extends Function {
	static from<T>(tg: (v: unknown) => v is T, def: StoredDefinition) {
		const tgFn = Object.setPrototypeOf(tg, STypeGuard.prototype) as TypeGuard<T>;

		definitions.set(tgFn, def);

		return tgFn;
	}

	throw(v: unknown): v is T {
		const oldThrows = throwErrors;

		try {
			throwErrors = true;

			return this(v);
		} finally {
			throwErrors = oldThrows;
		}
	}

	throws() {
		return asTypeGuard((v: unknown): v is T => this.throw(v), unknownDef);
	}

	*[Symbol.iterator]() {
		yield SpreadTypeGuard.from<T>(this);
	}

	def(): DefinitionWithDeps {
		const def = definitions.get(this) ?? unknownDef,
		      processed = def instanceof Function ? def() : def,
		      late = definitions.get(this);

		return late !== def && late instanceof Array && late[0] === "Recur" ? setAndReturn(definitions, this, Object.freeze(["Recur", late[1] as string, processed])) : processed !== def ? setAndReturn(definitions, this, Object.freeze(processed) as Definition) : processed;
	}

	toString(): string {
		return toString(this.def());
	}
}

class SpreadTypeGuard extends Function {
	static from<T>(tg: STypeGuard<T>) {
		const stg =  Object.setPrototypeOf((v: unknown): v is T => tg(v), SpreadTypeGuard.prototype) as TypeGuard<T>;

		spreads.set(stg, tg);

		return stg;
	}

	def() {
		return spreads.get(this)?.def() ?? unknownDef;
	}

	toString() {
		return spreads.get(this)?.toString() ?? unknownStr;
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
asTypeGuard = <T>(tg: (v: unknown) => v is T, def: StoredDefinition = unknownDef) => STypeGuard.from(tg, def),
/**
 * The Bool function returns a TypeGuard that checks for boolean values, and takes an optional, specific boolean value to check against.
 *
 * @param {boolean} [d] Exact boolean to match against.
 *
 * @return {TypeGuard<boolean>}
 */
Bool = <T extends boolean>(d?: T) => asTypeGuard((v: unknown): v is T => throwOrReturn(typeof v === "boolean" && (d === undefined || v === d), "boolean"), d !== undefined ? ["", d.toString()] : booleanDef),
/**
 * The Str function returns a TypeGuard that checks for string values, and takes an optional regex to confirm string format against.
 *
 * @param {regex} [r] Regexp to compare any strings against.
 *
 * @return {TypeGuard<string>}
 */
Str = (r?: RegExp) => asTypeGuard((v: unknown): v is string => throwOrReturn(typeof v === "string" && (r === undefined || r.test(v)), "string"), stringDef),
/**
 * The Tmpl function returns a TypeGuard that checks for template values.
 *
 * @param {string} first The Initial string part to match.
 * @param {(TypeGuard<string> | string)[]} ...s Remaining parts to match, must be an alternating list of TypeGuard<string> and string
 *
 * @return {TypeGuard<string>}
 */
Tmpl = <const S extends string, const T extends readonly (string | TypeGuard<string>)[]>(first: S, ...s: T extends AltTuple<T> ? T : never) => asTypeGuard((v: unknown): v is Template<S, T> => throwOrReturn(typeof v === "string" && v.startsWith(first) && matchTemplate(v.slice(first.length), s), "template"), () => {
	let rest: (string | TypeGuard<string>)[] = s.slice(),
	    justString = first === "";

	const vals: TemplateData = [first];

	while (rest.length) {
		const [tg, s, ...r] = rest as [TypeGuard<string>, string, ...(string | TypeGuard<string>)[]],
		      def = tg.def() as TemplateDefinition | PrimitiveOrValueDefinition | TemplateOr,
		      [typ, val] = def;

		rest = r;

		switch (typ) {
		case "Template":
			vals[vals.length - 1] += val[0];

			let dr = val.slice(1);

			while (dr.length) {
				const [d, ds, ...rest] = dr as [PrimitiveOrValueDefinition | TemplateOr, string, ...string[]];

				dr = rest;

				if (d[0] === "" && d[1] === "string" && vals.length > 1 && !vals[vals.length - 1]) {
					vals[vals.length - 1] = ds;
				} else {
					vals.push(d, ds);

					justString &&= d[0] === "" && d[1] === "string" && ds === "";
				}
			}

			vals[vals.length - 1] += s;
			break;
		case "Or":
			justString = false;

			vals.push(def, s);

			break;
		default:
			if (val.startsWith(`"`)) {
				vals[vals.length - 1] += JSON.parse(val) + s;

				justString = false;
			} else if (val === "string" && vals.length > 1 && !vals[vals.length - 1]) {
				vals[vals.length - 1] = s;
			} else {
				justString &&= val === "string";

				vals.push(def, s);
			}
		}

		justString &&= s === "";
	}

	return vals.length === 1 ? ["", JSON.stringify(vals[0])] : justString ? stringDef : ["Template", vals];
}),
/**
 * The Undefined function returns a TypeGuard that checks for `undefined`.
 *
 * @return {TypeGuard<undefined>}
 */
Undefined = () => asTypeGuard((v: unknown): v is undefined => throwOrReturn(v === undefined, "undefined"), undefinedDef),
/**
 * The Opt function returns a TypeGuard that checks for both the passed TypeGuard while allowing for it to be undefined.
 *
 * @typedef T
 *
 * @return {TypeGuard<T | undefined>}
 */
Opt = <T>(v: TypeGuard<T>) => Or(v, Undefined()),
/**
 * The Null function returns a TypeGuard that checks for `null`.
 *
 * @return {TypeGuard<null>}
 */
Null = () => asTypeGuard((v: unknown): v is null => throwOrReturn(v === null, "null"), nullDef),
/**
 * The Num function returns a TypeGuard that checks for numbers, and takes optional min and max (inclusive) values to range check.
 *
 * @param {number} min Minimum values for the number.
 * @param {number} max Maximum values for the number.
 *
 * @return {TypeGuard<number>}
 */
Num = (min = -Infinity, max = Infinity) => asTypeGuard((v: unknown): v is number => throwOrReturn(typeof v === "number" && v >= min && v <= max, "number"), min !== -Infinity ? ["", "number", `${min} <= n` + (max !== Infinity ? ` <= ${max}` : "")] : max !== Infinity ? ["", "number", `n <= ${max}`] : numberDef),
/**
 * The Int function returns a TypeGuard that checks for integers, and takes optional min and max (inclusive) values to range check.
 *
 * @param {number} min Minimum values for the integer.
 * @param {number} max Maximum values for the integer.
 *
 * @return {TypeGuard<number>}
 */
Int = (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => asTypeGuard((v: unknown): v is number => throwOrReturn(typeof v === "number" && Number.isInteger(v) && v >= min && v <= max, "integer"), min > Number.MIN_SAFE_INTEGER ? ["", "number", `${min} <= i` + (max < Number.MAX_SAFE_INTEGER ? ` <= ${max}` : "")] : max < Number.MAX_SAFE_INTEGER ? ["", "number", `i <= ${max}`] : numberDef),
/**
 * The BigInt function returns a TypeGuard that checks for bigints, and takes optional min and max (inclusive) values to range check.
 *
 * @param {number} min Minimum values for the bigint.
 * @param {number} max Maximum values for the bigint.
 *
 * @return {TypeGuard<bigint>}
 */
BigInt = (min?: bigint, max?: bigint) => asTypeGuard((v: unknown): v is bigint => throwOrReturn(typeof v === "bigint" && (min === undefined || v >= min) && (max === undefined || v <= max), "bigint"), min !== undefined ? ["", "bigint", `${min}n <= b` + (max != undefined ? ` <= ${max}n` : "")] : max != undefined ? ["", "bigint", `b <= ${max}n`] : bigIntDef),
/**
 * The Sym function returns a TypeGuard that checks for symbols.
 *
 * @return {TypeGuard<symbol>}
 */
Sym = () => asTypeGuard((v: unknown): v is symbol => throwOrReturn(typeof v === "symbol", "symbol"), symbolDef),
/**
 * The Val function returns a TypeGuard that checks for a specific, primitive value.
 *
 * @typedef {boolean | number | bigint | string | null | undefined} T
 *
 * @param {T} v The value to check against.
 *
 * @return {TypeGuard<T>}
 */
Val = <const T extends boolean | number | bigint | string | null | undefined>(val: T) => asTypeGuard((v: unknown): v is T => throwOrReturn(v === val, "value"), ["", typeof val === "bigint" ? val + "n" : val === undefined ? "undefined" : JSON.stringify(val)]),
/**
 * The Any function returns a TypeGuard that allows any value.
 *
 * @return {TypeGuard<any>}
 */
Any = () => asTypeGuard((_: unknown): _ is any => true, anyDef),
/**
 * The Unknown function returns a TypeGuard that allows any value, but types to `unknown`.
 *
 * @return {TypeGuard<unknown>}
 */
Unknown = () => asTypeGuard((_: unknown): _ is unknown => true, unknownDef),
/**
 * The Void function returns a TypeGuard that performs no check as the value is not intended to be used.
 *
 * @return {TypeGuard<void>}
 */
Void = () => asTypeGuard((_: unknown): _ is void => true, voidDef),
/**
 * The Arr function returns a TypeGuard that checks for an Array, running the given TypeGuard on each element.
 *
 * @param {TypeGuard<any>} t The TypeGuard to run on each element.
 *
 * @return {TypeGuard<any[]}
 */
Arr = <T>(t: TypeGuard<T>) => asTypeGuard((v: unknown): v is Array<T> => {
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
}, () => ["Array", t.def()]),
/**
 * The Tuple function returns a TypeGuard that checks for the given types in an array.
 *
 * @param {...TypeGuard<any>} The elements of the tuple. TypeGuards can be spread to allow for and unknown number of that type (follow the typescript rules for spreads).
 *
 * @return {TypeGuard<[]>}
 */
Tuple = <const T extends readonly any[], const U extends {[K in keyof T]: TypeGuard<T[K]>} = {[K in keyof T]: TypeGuard<T[K]>}>(...t: U) => {
	const tgs: TypeGuard<any>[] = [];

	for (const tg of t) {
		if (tg instanceof SpreadTypeGuard) {
			break;
		}

		tgs.push(tg);
	}

	const spread = tgs.length < t.length ? t.length - tgs.length === 1 ? t[t.length - 1] : Or(...t.slice(tgs.length)) : undefined;

	return asTypeGuard((v: unknown): v is {-readonly [K in keyof U]: TypeGuardOf<U[K]>;} => {
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
	}, () => spread ? ["Tuple", tgs.map(tg => tg.def()), spread.def()] : ["Tuple", tgs.map(tg => tg.def())]);
},
/**
 * The Obj function returns a TypeGuard that checks for an object type defined by the passed object of TypeGuards.
 *
 * @param {Record<keyof any, TypeGuard<any>} t The Object definition build from TypeGuards.
 *
 * @return {TypeGuard<Object>}
 */
Obj = <T extends {}, U extends {[K in keyof T]: TypeGuard<T[K]>} = {[K in keyof T]: TypeGuard<T[K]>}, R = {[K in keyof U as undefined extends TypeGuardOf<U[K]> ? never : K]: TypeGuardOf<U[K]>;} & {[K in keyof U as undefined extends TypeGuardOf<U[K]> ? K : never]?: TypeGuardOf<U[K]>;}>(t?: U) => asTypeGuard((v: unknown): v is {[K in keyof R]: R[K]} => {
	const [au, tk, s] = mods();

	if (!(v instanceof Object)) {
		return throwOrReturn(false, "object");
	}

	if (t) {
		for (const [k, tg] of Object.entries(t) as [keyof typeof v, TypeGuard<any>][]) {
			if (tk && !tk.includes(k) || s?.includes(k)) {
				continue;
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
}, () => ["Object", Object.fromEntries((Object.entries(t ?? {}) as [keyof U, TypeGuard<any>][]).map(([k, v]) => [k, v.def()]))]),
/**
 * The Part function takes an existing TypeGuard created by the Obj function and transforms it to allow any of the defined keys to not exist (or to be 'undefined').
 *
 * @param {TypeGuard<{}>} tg The TypeGuard created by a call to Obj.
 *
 * @return {TypeGuard<{}>}
 */
Part = <T extends {}>(tg: TypeGuard<T>) => asTypeGuard((v: unknown): v is {[K in keyof T]?: T[K]} => {
	allowUndefined ??= true;

	try {
		return tg(v);
	} finally {
		allowUndefined = null;
	}
}, () => filterObj(tg.def(), (k: string | number | symbol, v: Definition) => v[0] === "Or" ? [k, v] : [k, ["Or", [v, undefinedDef]]])),
/**
 * The Req function takes an existing TypeGuard created by the Obj function and transforms it to require all of the defined keys to exist and to not be undefined.
 *
 * @param {TypeGuard<{}>} tg The TypeGuard created by a call to Obj.
 *
 * @return {TypeGuard<{}>}
 */
Req = <T extends {}>(tg: TypeGuard<T>) => asTypeGuard((v: unknown): v is {[K in keyof T]-?: Exclude<T[K], undefined>} => {
	allowUndefined ??= false;

	try {
		return tg(v);
	} finally {
		allowUndefined = null;
	}
}, () => filterObj(tg.def(), (k: string | number | symbol, v: Definition) => {
	if (v[0] === "Or") {
		const left = (v[1] as Definition[]).filter(d => d[0] !== "" || d[1] !== "undefined");

		if (!left.length) {
			return null;
		}

		if (left.length === 1) {
			return [k, left[0]];
		}

		return [k, ["Or", left]];
	} else if (v[0] === "" && v[1] === "undefined") {
		return null;
	}

	return [k, v];
})),
/**
 * The Take function takes an existing TypeGuard create by the Obj function and transforms it to only check the keys passed into this function.
 *
 * @param {TypeGuard<{}>} tg tg   The TypeGuard created by a call to Obj.
 * @param {...(keyof any}[]} keys The list of keys to limit Object checking to.
 *
 * @return {TypeGuard<{}>}
 */
Take = <T extends {}, Keys extends (keyof T)[]>(tg: TypeGuard<T>, ...keys: Keys) => asTypeGuard((v: unknown): v is {[K in keyof T as K extends ORVals<Keys> ? K : never]: T[K]} => {
	take = take ? take.filter(k => keys.includes(k as keyof T)) : keys;

	try{
		return tg(v);
	} finally {
		take = null;
	}
}, () => filterObj(tg.def(), (k: string | number | symbol, v: Definition) => keys.includes(k as keyof T) ? [k, v] : null)),
/**
 * The Skip function takes an existing TypeGuard create by the Obj function and transforms it to not check the keys passed into this function.
 *
 * @param {TypeGuard<{}>} tg tg   The TypeGuard created by a call to Obj.
 * @param {...(keyof any}[]} keys The list of keys to be skipped within Obj checking.
 *
 * @return {TypeGuard<{}>}
 */
Skip = <T extends {}, Keys extends (keyof T)[]>(tg: TypeGuard<T>, ...keys: Keys) => asTypeGuard((v: unknown): v is {[K in keyof T as K extends ORVals<Keys> ? never : K]: T[K]} => {
	skip = skip ? [...skip, ...keys] : keys;

	try{
		return tg(v);
	} finally {
		skip = null;
	}
}, () => filterObj(tg.def(), (k: string | number | symbol, v: Definition) => keys.includes(k as keyof T) ? null : [k, v])),
/**
 * The Recur function wraps an existing TypeGuard so it can be used recursively within within itself during TypeGuard creation. The base TypeGuard will need to have it's type specified manually when used this way.
 *
 * @typedef T
 *
 * @param {() => TypeGuard<T>} tg    A closure that returns the recurring TypeGuard.
 * @param {string}             [str] Optional type name. If unspecified will be generated automatically from template: `type_${number}`
 *
 * @return {TypeGuard<T>}
 */
Recur = <T>(tg: () => TypeGuard<T>, str?: string) => {
	let ttg: TypeGuard<T>;
	const name = str ?? "type_"+unknownTypes++; // need to generate type name here

	return asTypeGuard((v: unknown): v is T => (ttg ??= tg())(v), () => setAndReturn(definitions, ttg ??= tg(), ["Recur", name]));
},
/**
 * The NumStr function returns a TypeGuard that checks for a string value that represents an number.
 *
 * @return {TypeGuard<`${number}`>}
 */
NumStr = () => asTypeGuard((v: unknown): v is `${number}` => throwOrReturn(typeof v === "string" && parseFloat(v) + "" === v, "NumStr"), ["Template", ["", numberDef, ""]]),
/**
 * The IntStr function returns a TypeGuard that checks for a string value that represents an integer. Intended to be used with Rec for integer key types.
 *
 * @return {TypeGuard<`${number}`>}
 */
IntStr = () => asTypeGuard((v: unknown): v is `${number}` => throwOrReturn(typeof v === "string" && parseInt(v) + "" === v, "IntStr"), ["Template", ["", numberDef, ""]]),
/**
 * The BoolStr function returns a TypeGuard that checks for a string value that represents an boolean.
 *
 * @return {TypeGuard<`${boolean}`>}
 */
BoolStr = () => asTypeGuard((v: unknown): v is `${boolean}` => throwOrReturn(typeof v === "string" && (v === "true" || v === "false"), "BoolStr"), ["Template", ["", booleanDef, ""]]),
/**
 * The Rec function returns a TypeGuard that checks for an Object type where the keys and values are of the types specified.
 *
 * @param {TypeGuard<Exclude<keyof any, number>>} key The Key type.
 * @param {TypeGuard<any>} value                      The Value type.
 *
 * @return {Record<keyof any, any>}
 */
Rec = <K extends TypeGuard<Exclude<keyof any, number>>, V extends TypeGuard<any>>(key: K, value: V) => asTypeGuard((v: unknown): v is Record<TypeGuardOf<K>, TypeGuardOf<V>> => {
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
			if (!throwUnknownError(value(v[k as keyof typeof v]))) {
				return false;
			}
		} catch (err) {
			return throwOrReturn(false, "record", k, err);
		}
	}

	return true;
}, () => ["Record", key.def(), value.def()]),
/**
 * The Or function returns a TypeGuard that checks a value matches against any of the given TypeGuards.
 *
 * @param {...TypeGuard<any>} ths A list of TypeGuards to match against.
 *
 * @return {TypeGuard<any>}
 */
Or = <T extends readonly TypeGuard<any>[]>(...tgs: T) => asTypeGuard((v: unknown): v is OR<T> => {
	const errs: string[] = [],
	      rm = resetMods(mods());

	for (const tg of tgs) {
		rm();

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
}, () => reduceAndOr("Or", tgs)),
/**
 * The And function returns a TypeGuard that checks a value matches against all of the given TypeGuards.
 *
 * @param {...TypeGuard<any>} ths A list of TypeGuards to match against.
 *
 * @return {TypeGuard<any>}
 */
And = <T extends readonly TypeGuard<any>[]>(...tgs: T) => asTypeGuard((v: unknown): v is {[K in keyof AND<T>]: AND<T>[K]} => {
	let pos = 0;

	const rm = resetMods(mods());

	for (const tg of tgs) {
		rm();

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
}, () => reduceAndOr("And", tgs)),
/**
 * The MapType function returns a TypeGuard that checks for an Map type where the keys and values are of the types specified.
 *
 * @param {TypeGuard<any>} key   The Key type.
 * @param {TypeGuard<any>} value The Value type.
 *
 * @return {Map<keyof any, any>}
 */
MapType = <K extends TypeGuard<any>, V extends TypeGuard<any>>(key: K, value: V) => asTypeGuard((v: unknown): v is Map<TypeGuardOf<K>, TypeGuardOf<V>> => {
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
}, () => ["Map", key.def(), value.def()]),
/**
 * The SetType function returns a TypeGuard that checks for an Set type where the values are of the type specified.
 *
 * @param {TypeGuard<any>} value The Value type.
 *
 * @return {Set<any>}
 */
SetType = <T>(t: TypeGuard<T>) => asTypeGuard((v: unknown): v is Set<T> => {
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
}, () => ["Set", t.def()]),
/**
 * The Class function returns a TypeGuard that checks a value is of the class specified.
 *
 * @param {Class} c The class to check against.
 *
 * @return {TypeGuard<class>}
 */
Class = <T extends {new (...args: any): any}>(t: T) => asTypeGuard((v: unknown): v is InstanceType<T> => throwOrReturn(v instanceof t, "class"), ["", t.name || unknownStr]),
/**
 * The Func function returns a TypeGuard that checks a value is a function. An optional number of arguments can be specified as an additional check.
 *
 * @param {number} [args] Number of arguments that the function must have.
 *
 * @returns {TypeGuard<Function>}
 */
Func = <T extends Function>(args?: number) => asTypeGuard((v: unknown): v is T => throwOrReturn(v instanceof Function && (args === undefined || v.length === args), "Function"), args ? ["", "Function", args?.toString()] : functionDef),
/**
 * The Forbid function returns a TypeGuard that disallows certain types from an existing type.
 *
 * @param {TypeGuard<T>} t A TypeGuard to require.
 * @param {TypeGuard<U>} u A TypeGuard to forbid.
 *
 * @returns {TypeGuard<Exclude<T, U>>}
 */
Forbid = <T, U>(t: TypeGuard<T>, u: TypeGuard<U>) => asTypeGuard((v: unknown): v is Exclude<T, U> => {
	let forbid = false;
	try {
		if (u(v)) {
			forbid = true;
		}
	} catch(e) {}

	if (forbid) {
		return throwOrReturn(false, "forbid")
	}

	return t(v);
}, () => ["Exclude", t.def(), u.def()]);
