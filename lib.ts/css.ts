interface ToString {
	toString(): string;
}

type Value = string | number | ToString;

interface Def {
	[key: string]: Value | Def;
}

type IDs<N extends number, U extends string[] = []> = U['length'] extends N ? U : IDs<N, [string, ...U]>;

export default class CSS extends CSSStyleSheet {
	#idPrefix: string;
	#id: number;
	constructor(prefix = "", idStart = 0) {
		super();
		this.#idPrefix = idRE.test(prefix) ? prefix : "_";
		this.#id = idStart;
	}
	#compileRule(selector: string, def: Def) {
		const rules: string[] = [];
		let data = "";
		for (const key in def) {
			const v = def[key];
			if (isDef(v)) {
				rules.push(...this.#compileRule(join(selector, key), v));
			} else {
				data += `${key}:${v};`;
			}
		}
		if (data) {
			rules.unshift(selector + "{" + data + "}");
		}
		return rules;
	}
	add(selector: string, def: Def) {
		for (const rule of this.#compileRule(selector, def)) {
			this.insertRule(rule, this.cssRules.length);
		}
		return this;
	}
	at(at: string, defs?: Record<string, Def>) {
		if (defs) {
			let data = "";
			for (const def in defs) {
				for (const rule of this.#compileRule(def, defs[def])) {
					data += rule;
				}
			}
			this.insertRule(at + "{" + data + "}", this.cssRules.length);
		} else {
			this.insertRule(at, this.cssRules.length);
		}
		return this;
	}
	id() {
		return this.#idPrefix + this.#id++;
	}
	ids<N extends number>(length: N) {
		return Array.from({length}, () => this.id()) as IDs<N>;
	}
	toString() {
		let r = "";
		for (const rule of this.cssRules) {
			r += rule.cssText;
		}
		return r;
	}
	render() {
		const style = document.createElement("style");
		style.setAttribute("type", "text/css");
		style.textContent = this + "";
		return style;
	}
}

const split = (selector: string) => {
	const stack: string[] = [],
	      parts: string[] = [];
	let pos = 0;
	for (let i = 0; i < selector.length; i++) {
		const c = selector.charAt(i);
		if (c === '"' || c === "'") {
			for (i++; i < selector.length; i++) {
				const d = selector.charAt(i);
				if (d === "\\") {
					i++;
				} else if (d === c) {
					break;
				}
			}
		} else if (c === "," && !stack.length) {
			parts.push(selector.slice(pos, i));
			pos = i + 1;
		} else if (c === stack.at(-1)) {
			stack.pop();
		} else if (c === "[") {
			stack.push("]");
		} else if (c === "(") {
			stack.push(")");
		}
	}
	parts.push(selector.slice(pos, selector.length));
	return parts;
      },
      join = (selector: string, add: string) => {
	const addParts = split(add);
	let out = "";
	for (const part of split(selector)) {
		for (const addPart of addParts) {
			out += (out.length ? "," : "") + part + addPart;
		}
	}
	return out;
      },
      isDef = (v: Value | Def): v is Def => Object.getPrototypeOf(v) === Object.prototype,
      idRE = /^\-?[_a-z\240-\377][_a-z0-9\-\240-\377]*$/i,
      defaultCSS = new CSS();

export const add = (selector: string, def: Def) => defaultCSS.add(selector, def),
at = (at: string, defs?: Record<string, Def>) => defaultCSS.at(at, defs),
id = () => defaultCSS.id(),
ids = <N extends number>(n: N) => defaultCSS.ids(n) as IDs<N>,
render = () => defaultCSS.render(),
mixin = (base: Def, add: Def) => {
	for (const key in add) {
		const v = add[key];
		if (isDef(v)) {
			const w = base[key] ?? (base[key] = {});
			if (isDef(w)) {
				mixin(w, v);
			}
		} else {
			base[key] = v;
		}
	}
	return base;
};
