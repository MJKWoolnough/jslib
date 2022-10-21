const childrenArr = (node, children) => {
	if (children instanceof Binder) {
		const t = new Text(children+"");
		children[setNode](t);
		node.appendChild(t);
	} else if (typeof children === "string") {
		node.appendChild(document.createTextNode(children));
	} else if (Array.isArray(children)) {
		for (const c of children) {
			childrenArr(node, c);
		}
	} else if (children instanceof Node) {
		node.appendChild(children);
	} else if (children instanceof NodeList || children instanceof HTMLCollection) {
		for (const c of Array.from(children)) {
			node.appendChild(c);
		}
	}
      },
      isEventListenerOrEventListenerObject = prop => prop instanceof Function || (prop instanceof Object && prop.handleEvent instanceof Function),
      isEventObject = prop => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isClassObj = prop => prop instanceof Object,
      isStyleObj = prop => prop instanceof CSSStyleDeclaration || prop instanceof Object,
      setNode = Symbol("setNode"),
      update = Symbol("update");

class Binder {
	#set = new Set();
	[setNode](n) {
		this.#set.add(new WeakRef(n));
	}
	[update]() {
		const text = this+"";
		for (const wr of this.#set) {
			const ref = wr.deref();
			if (ref) {
				if (ref instanceof TemplateBind) {
					ref[update]();
				} else {
					ref.textContent = text;
				}
			} else {
				this.#set.delete(wr);
			}
		}
	}
}

class TemplateBind extends Binder {
	#strings;
	#bindings;
	constructor(strings, bindings) {
		super();
		this.#strings = strings;
		this.#bindings = bindings;
		for (const b of bindings) {
			if (b instanceof Binder) {
				b[setNode](this);
			}
		}
	}
	toString() {
		let str = "";
		for (let i = 0; i < this.#strings.length; i++) {
			str += this.#strings[i] + (this.#bindings[i] ?? "");
		}
		return str;
	}
}

class Bound extends Binder {
	#value;
	constructor(v) {
		super();
		this.#value = v;
	}
	get value() { return this.#value; }
	set value(v) {
		if (this.#value !== v) {
			this.#value = v;
			this[update]();
		}
	}
	toString() {
		return this.#value.toString();
	}
}

export const amendNode = (node, properties, children) => {
	if (typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof HTMLCollection || properties instanceof Node || properties instanceof Binder) {
		children = properties;
	} else if (properties instanceof NamedNodeMap && node instanceof Element) {
		for (const prop of properties) {
			node.setAttributeNode(prop.cloneNode());
		}
	} else if (node && typeof properties === "object") {
		for (const k in properties) {
			const prop = properties[k];
			if (isEventObject(prop)) {
				if (k.startsWith("on") && node instanceof EventTarget) {
					const arr = prop instanceof Array;
					node[arr && prop[2] ? "removeEventListener" : "addEventListener"](k.slice(2), arr ? prop[0] : prop, arr ? prop[1] : false);
				}
			} else if (node instanceof HTMLElement || node instanceof SVGElement) {
				if (typeof prop === "boolean") {
					node.toggleAttribute(k, prop);
				} else if (prop === undefined) {
					node.removeAttribute(k);
				} else if (prop instanceof Array || prop instanceof DOMTokenList) {
					if (k === "class" && prop.length) {
						for (let c of prop) {
							const f = c.slice(0, 1),
							      m = f !== '!' && (f !== '~' || undefined);
							node.classList.toggle(m ? c : c.slice(1), m);
						}
					}
				} else if (k === "class" && isClassObj(prop)) {
					for (const k in prop) {
						node.classList.toggle(k, prop[k] ?? undefined);
					}
				} else if (k === "style" && isStyleObj(prop)) {
					for (const [k, p] of prop instanceof CSSStyleDeclaration ? Array.from(prop, k => [k, prop.getPropertyValue(k)]) : Object.entries(prop)) {
						if (p === undefined) {
							node.style.removeProperty(k);
						} else {
							node.style.setProperty(k, p.toString());
						}
					}
				} else {
					node.setAttribute(k, prop.toString());
					if (prop instanceof Binder) {
						prop[setNode](node.getAttributeNode(k));
					}
				}
			}
		}
	}
	if (node instanceof Node) {
		if (typeof children === "string" && !node.firstChild) {
			node.textContent = children;
		} else if (children) {
			childrenArr(node, children);
		}
	}
	return node;
},
bindElement = (ns, value) => Object.defineProperty((props, children) => amendNode(document.createElementNS(ns, value), props, children), "name", {value}),
eventOnce = 1,
eventCapture = 2,
eventPassive = 4,
eventRemove = 8,
event = (fn, options, signal) => [fn, {"once": !!(options&eventOnce), "capture": !!(options&eventCapture), "passive": !!(options&eventPassive), signal}, !!(options&eventRemove)],
createDocumentFragment = children => {
	const df = document.createDocumentFragment();
	if (typeof children === "string") {
		df.textContent = children;
	} else if (children !== undefined) {
		childrenArr(df, children);
	}
	return df;
},
clearNode = (node, properties, children) => {
	if (typeof properties === "string") {
		children = properties = void (node.textContent = properties);
	} else if (typeof children === "string") {
		children = void (node.textContent = children);
	} else if (node instanceof Element) {
		node.replaceChildren();
	} else {
		while (node.lastChild !== null) {
			node.lastChild.remove();
		}
	}
	return amendNode(node, properties, children);
},
autoFocus = (node, inputSelect = true) => {
	window.setTimeout(() => {
		node.focus();
		if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && inputSelect) {
			node.select();
		}
	}, 0);
	return node;
},
bind = (v, ...bindings) => {
	if (v instanceof Array) {
		if (v.length === 1 && bindings.length === 0) {
			return new Bound(v[0]);
		}
		if (v.length !== bindings.length + 1){
			return new SyntaxError("invalid tag call");
		}
		return new TemplateBind(v, bindings);
	} else {
		return new Bound<T>(v);
	}
};
