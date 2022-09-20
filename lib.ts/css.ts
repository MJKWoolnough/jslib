interface ToString {
	toString(): string;
}

type Value = string | number | ToString;

type ValueFn = () => Value;

interface Def {
	[key: string]: Value | Def | ValueFn;
}

type innerDef = Record<string, Value | ValueFn>;

export class CSS {
	#style: HTMLStyleElement;
	#data = new Map<string, Def>();
	#prefix: string;
	#class = 0;
	#id = 0;
	constructor(prefix?: string) {
		this.#style = document.createElement("style");
		this.#style.setAttribute("type", "text/css");
		this.#prefix = prefix ?? "";
	}
	add(id: string, def: Def) {
	}
	class(def: Def) {
		return new Identifier(this, "." + this.#prefix + this.#class++).add(def);
	}
	id(def: Def) {
		return new Identifier(this, "#" + this.#prefix + this.#id++).add(def);
	}
}

class Identifier {
	#ident: string;
	#css: CSS;
	constructor(parent: CSS, ident: string) {
		this.#css = parent;
		this.#ident = ident;
	}
	set(key: string, value: Value) {
		this.#css.add(this.#ident, {[key]: value});
		return this;
	}
	add(def: Def) {
		this.#css.add(this.#ident, def);
		return this;
	}
	toString() {
		return this.#ident;
	}
}
