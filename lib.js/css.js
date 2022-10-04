import {style} from './html.js';

export default class CSS {
	#data = "";
	#idPrefix;
	#id;
	constructor(prefix = "", idStart = 0) {
		this.#idPrefix = idRE.test(prefix) ? prefix : "_";
		this.#id = idStart;
	}
	add(selector, def) {
		if (selector.trim()) {
			const d = this.#data;
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
				this.#data = d + selector + "{" + data + "}" + this.#data.slice(d.length);
			}
		}
		return this;
	}
	id() {
		return this.#idPrefix + this.#id++;
	}
	ids(length) {
		return Array.from({length}, _ => this.id());
	}
	toString() {
		return this.#data;
	}
	render() {
		return style({"type": "text/css"}, this.#data);
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
id = () => defaultCSS.id(),
ids = n => defaultCSS.ids(n),
render = () => defaultCSS.render();
