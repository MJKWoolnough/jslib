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
	add(selector: string, def: Def) {
		if (!(selector = normalise(selector))) {
			return;
		}
		let o = this.#data.get(selector);
		if (!o) {
			this.#data.set(selector, o = {});
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
	className() {
		return this.#classPrefix + this.#class++;
	}
	id() {
		return this.#idPrefix + this.#id++;
	}
	render() {
		const s = document.createElement("style");
		s.setAttribute("type", "text/css");
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
		s.innerText = data;
		return s;
	}
}

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
      classRE = /^\-?[_a-z\240-\377][_a-z0-9\-\240-\377]*$/i,
      defaultCSS = new CSS();

export const add = defaultCSS.add.bind(defaultCSS),
className = defaultCSS.className.bind(defaultCSS),
id = defaultCSS.id.bind(defaultCSS),
render = defaultCSS.render.bind(defaultCSS);
