import {style} from './html.js';

interface ToString {
	toString(): string;
}

type Value = string | number | ToString;

type ValueFn = () => Value;

interface Def {
	[key: string]: Value | Def | ValueFn;
}

type innerDef = Record<string, Value | ValueFn>;

export default class CSS {
	#data = new Map<string, innerDef>();
	#idPrefix: string;
	#id: number;
	constructor(prefix = "", idStart = 0) {
		this.#idPrefix = idRE.test(prefix) ? prefix : "_";
		this.#id = idStart;
	}
	add(selector: string, def: Def) {
		if (selector = normalise(selector)) {
			let o = this.#data.get(selector);
			if (!o) {
				this.#data.set(selector, o = {});
			}
			for (const key in def) {
				const v = def[key];
				if (isDef(v)) {
					this.add(join(selector, key), v);
				} else {
					o[key] = v;
				}
			}
		}
		return this;
	}
	id() {
		return this.#idPrefix + this.#id++;
	}
	toString() {
		let data = "";
		for (const [specifier, style] of this.#data) {
			const e = Object.entries(style);
			if (e.length) {
				data += specifier+"{";
				for (const [ident, value] of e) {
					data += `${ident}:${value instanceof Function ? value() : value};`;
				}
				data += "}";
			}
		}
		return data;
	}
	render() {
		return style({"type": "text/css"}, this+"");
	}
}

const afterSpace = "])+>~|,([=",
      beforeSpace = "+>~|,([=\"'",
      normalise = (id: string) => {
	id = id.trim();
	let string = "";
	for (let i = 0; i < id.length; i++) {
		const c = id.charAt(i);
		switch (c) {
		case "\\":
			i++;
			break;
		case '"':
		case "'":
			string = c === string ? "" : c;
		default:
			if (!string) {
				if (!c.trim()) {
					for (let j = i + 1; j < id.length; j++) {
						const c = id.charAt(j).trim();
						if (c) {
							if (afterSpace.includes(c)) {
								i--;
							}
							if (i+1 !== j) {
								id = id.slice(0, i+1) + id.slice(j);
							}
							break;
						}
					}
				} else if (beforeSpace.includes(c)) {
					for (let j = i+1; j < id.length; j++) {
						if (id.charAt(j).trim()) {
							if (i+1 !== j) {
								id = id.slice(0, i+1) + id.slice(j);
							}
							break;
						}
					}
				}
			}
		}
	}
	return id;
      },
      split = (selector: string) => {
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
      isDef = (v: Value | Def | ValueFn): v is Def => Object.getPrototypeOf(v) === Object.prototype,
      idRE = /^\-?[_a-z\240-\377][_a-z0-9\-\240-\377]*$/i,
      defaultCSS = new CSS();

export const add = (selector: string, def: Def) => defaultCSS.add(selector, def),
id = () => defaultCSS.id(),
render = () => defaultCSS.render();
