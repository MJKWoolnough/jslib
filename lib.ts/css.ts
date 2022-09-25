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
					this.add(selector + key, v);
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
	render() {
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
		return style({"type": "text/css"}, data);
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
      isDef = (v: Value | Def | ValueFn): v is Def => Object.getPrototypeOf(v) === Object.prototype,
      idRE = /^\-?[_a-z\240-\377][_a-z0-9\-\240-\377]*$/i,
      defaultCSS = new CSS();

export const add = (selector: string, def: Def) => defaultCSS.add(selector, def),
id = () => defaultCSS.id(),
render = () => defaultCSS.render();
