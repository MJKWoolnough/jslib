interface ToString {
	toString(): string;
}

type Value = string | number | ToString;

type ValueFn = () => Value;

interface Def {
	[key: string]: Value | Def | ValueFn;
}

type innerDef = Record<string, Value | ValueFn>;

const normalise = (id: string) => id,
      isDef = (v: Value | Def | ValueFn): v is Def => Object.getPrototypeOf(v) === Object.prototype;

export class CSS {
	#data = new Map<string, innerDef>();
	#prefix: string;
	#class = 0;
	#id = 0;
	constructor(prefix?: string) {
		this.#prefix = (prefix ?? "") + "_";
	}
	add(id: string, def: Def) {
		if (!(id = normalise(id))) {
			return;
		}
		let o = this.#data.get(id);
		if (!o) {
			this.#data.set(id, o = {});
		}
		for (const key in def) {
			const v = def[key];
			if (isDef(v)) {
				this.add(id + key, v);
			} else {
				o[key] = v;
			}
		}
	}
	class(def: Def) {
		return new Identifier(this, "." + this.#prefix + this.#class++).add(def);
	}
	id(def: Def) {
		return new Identifier(this, "#" + this.#prefix + this.#id++).add(def);
	}
	render() {
		const s = document.createElement("style");
		s.setAttribute("type", "text/css");
		// render data -> s
		return s;
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
