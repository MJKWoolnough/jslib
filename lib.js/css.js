export default class CSS extends CSSStyleSheet {
	#idPrefix;
	#id;
	constructor(prefix = "", idStart = 0) {
		super();
		this.#idPrefix = idRE.test(prefix) ? prefix : "_";
		this.#id = idStart;
	}
	#compileRule(selector, def) {
		const rules = [];
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
	add(selectorOrDefs, defs = {}) {
		for (const [selector, def] of typeof selectorOrDefs === "string" ? [[selectorOrDefs, defs]] : Object.entries(selectorOrDefs)) {
			for (const rule of this.#compileRule(selector, def)) {
				this.insertRule(rule, this.cssRules.length);
			}
		}
		return this;
	}
	at(at, defs) {
		if (defs) {
			let data = "";
			for (const def in defs) {
				for (const rule of this.#compileRule(def, defs[def])) {
					data += rule;
				}
			}
			if (data) {
				this.insertRule(at + "{" + data + "}", this.cssRules.length);
			}
		} else {
			this.insertRule(at, this.cssRules.length);
		}
		return this;
	}
	id() {
		return this.#idPrefix + this.#id++;
	}
	ids(length) {
		return Array.from({length}, () => this.id());
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

export const add = defaultCSS.add.bind(defaultCSS),
at = defaultCSS.at.bind(defaultCSS),
id = defaultCSS.id.bind(defaultCSS),
ids = defaultCSS.ids.bind(defaultCSS),
render = defaultCSS.render.bind(defaultCSS),
mixin = (base, add) => {
	for (const key in add) {
		const v = add[key];
		if (isDef(v)) {
			const w = base[key] ??= {};
			if (isDef(w)) {
				mixin(w, v);
			}
		} else {
			base[key] = v;
		}
	}
	return base;
};
