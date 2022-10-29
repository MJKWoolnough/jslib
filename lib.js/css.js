import {style} from './html.js';

export default class CSS extends CSSStyleSheet {
	#idPrefix;
	#id;
	constructor(prefix = "", idStart = 0) {
		super();
		this.#idPrefix = idRE.test(prefix) ? prefix : "_";
		this.#id = idStart;
	}
	add(selector, def) {
		if (selector.trim()) {
			const pos = this.cssRules.length;
			let data = "";
			for (const key in def) {
				const v = def[key];
				if (isDef(v)) {
					this.add(join(selector, key), v);
				} else {
					data += `${key}:${v};`;
				}
			}
			if (data) {
				this.insertRule(selector + "{" + data + "}", pos);
			}
		}
		return this;
	}
	query(query, defs) {
		const c = new CSS(this.#idPrefix, this.#id);
		for (const s in defs) {
			c.add(s, defs[s]);
		}
		this.#id = c.#id;
		this.insertRule(query + "{" + c + "}");
		return this;
	}
	id() {
		return this.#idPrefix + this.#id++;
	}
	ids(length) {
		return Array.from({length}, _ => this.id());
	}
	toString() {
		let r = "";
		for (const rule of this.cssRules) {
			r += rule.cssText;
		}
		return r;
	}
	render() {
		return style({"type": "text/css"}, this+"");
	}
}

const split = selector => {
	const stack = [],
	      parts = [];
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
      join = (selector, add) => {
	const addParts = split(add);
	let out = "";
	for (const part of split(selector)) {
		for (const addPart of addParts) {
			out += (out.length ? "," : "") + part + addPart;
		}
	}
	return out;
      },
      isDef = v => Object.getPrototypeOf(v) === Object.prototype,
      idRE = /^\-?[_a-z\240-\377][_a-z0-9\-\240-\377]*$/i,
      defaultCSS = new CSS();

export const add = (selector, def) => defaultCSS.add(selector, def),
query = (query, defs) => defaultCSS.query(query, defs),
id = () => defaultCSS.id(),
ids = n => defaultCSS.ids(n),
render = () => defaultCSS.render();
