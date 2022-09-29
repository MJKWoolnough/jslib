import {style} from './html.js';

interface ToString {
	toString(): string;
}

type Value = string | number | ToString;

interface Def {
	[key: string]: Value | Def;
}

type IDs<N extends number, U extends string[] = []> = U['length'] extends N ? U : IDs<N, [string, ...U]>;

export default class CSS {
	#data = "";
	#idPrefix: string;
	#id: number;
	constructor(prefix = "", idStart = 0) {
		this.#idPrefix = idRE.test(prefix) ? prefix : "_";
		this.#id = idStart;
	}
	add(selector: string, def: Def) {
		if (selector.trim()) {
			const d = this.#data;
			let data = `${selector}{`;
			for (const key in def) {
				const v = def[key];
				if (isDef(v)) {
					this.add(join(selector, key), v);
				} else {
					data += `${key}:${v};`;
				}
			}
			this.#data = d + data + "}" + this.#data.slice(d.length);
		}
		return this;
	}
	id() {
		return this.#idPrefix + this.#id++;
	}
	ids<N extends number>(length: N) {
		return Array.from({length}, _ => this.id()) as IDs<N>;
	}
	toString() {
		return this.#data;
	}
	render() {
		return style({"type": "text/css"}, this.#data);
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
				if (d === "\'") {
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
id = () => defaultCSS.id(),
ids = <N extends number>(n: N) => defaultCSS.ids(n) as IDs<N>,
render = () => defaultCSS.render();
