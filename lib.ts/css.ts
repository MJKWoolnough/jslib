interface ToString {
	toString(): string;
}

type Value = string | number | ToString;

type ValueFn = () => Value;

interface Def {
	[key: string]: Value | Def | ValueFn;
}

type innerDef = Record<string, Value | ValueFn>;

const normalise = (id: string) => {
	id = id.trim();
	let string = "";
	for (let i = 0; i < id.length; i++) {
		const c = id.charAt(i);
		switch (c) {
		case '"':
		case "'":
			string = c === string ? "" : c;
			break;
		case "\\":
			i++;
			break;
		default:
			if (!string && !c.trim()) {
				let end = false;
				for (let j = i + 1; j < id.length; j++ ) {
					switch (id.charAt(j).trim()) {
					case '+':
					case '>':
					case '~':
					case '|':
					case ',':
					case '(':
					case '[':
						end = true;
					case ')':
					case ']':
						id = id.slice(0, i) + id.slice(j);
						i++;
					case '':
						break;
					default:
						if (i + 1 !== j) {
							id = id.slice(0, i+1) + id.slice(j);
						}
					}
				}
				if (end) {
					for (let j = i + 1; j < id.length; j++ ) {
						if (id.charAt(j).trim()) {
							if (i + 1 !== j) {
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
      idRE = /^[_a-z0-9\-\240-\377]+/i,
      classRE = /^\-?[_a-z\240-\377][_a-z0-9\-\240-\377]*$/i;

export class CSS {
	#data = new Map<string, innerDef>();
	#idPrefix: string;
	#classPrefix: string;
	#id: number;
	#class: number;
	constructor(prefix = "", idStart = 0, classStart = 0) {
		this.#idPrefix = idRE.test(prefix) ? prefix : "_";
		this.#classPrefix = classRE.test(prefix) ? prefix : "_";
		this.#id = idStart;
		this.#class = classStart;
	}
	add(id: string | Identifier, def: Def) {
		if (id instanceof Identifier) {
			id = id.toString();
		}
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
	className(def: Def) {
		return new Identifier(this, "." + this.#classPrefix + this.#class++).add(def);
	}
	id(def: Def) {
		return new Identifier(this, "#" + this.#idPrefix + this.#id++).add(def);
	}
	render() {
		const s = document.createElement("style");
		s.setAttribute("type", "text/css");
		let data = "";
		for (const [specifier, style] of this.#data) {
			data += specifier+"{";
			for (const [ident, value] of Object.entries(style)) {
				data += `${ident}:${value instanceof Function ? value() : value};`;
			}
			data += "}";
		}
		s.innerText = data;
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
