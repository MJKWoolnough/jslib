const childrenArr = (children, res = []) => {
	if (children instanceof Binding) {
		res.push(children[setNode](new Text(children+"")));
	} else if (typeof children === "string" || children instanceof Node) {
		res.push(children);
	} else if (Array.isArray(children)) {
		for (const c of children) {
			childrenArr(c, res);
		}
	} else if (children instanceof NodeList || children instanceof HTMLCollection) {
		res.push(...children);
	}
	return res;
      },
      isEventListenerObject = prop => prop instanceof Object && prop.handleEvent instanceof Function,
      isEventListenerOrEventListenerObject = prop => prop instanceof Function || (isEventListenerObject(prop) && !(prop instanceof Bind)) || prop instanceof Bind && isEventListenerOrEventListenerObject(prop.value),
      isEventObject = prop => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isClassObj = prop => prop instanceof Object && !(prop instanceof Binding),
      isStyleObj = prop => prop instanceof CSSStyleDeclaration || (prop instanceof Object && !(prop instanceof Binding)),
      isNodeAttributes = n => !!n.style && !!n.classList && !!n.getAttributeNode && !!n.removeAttribute && !!n.setAttribute && !!n.toggleAttribute,
      setNode = Symbol("setNode"),
      update = Symbol("update"),
      remove = Symbol("remove");

export class Binding {
	#set = new Set();
	[setNode](n) {
		this.#set.add(new WeakRef(n));
		return n;
	}
	[update]() {
		const text = this+"";
		for (const wr of this.#set) {
			const ref = wr.deref();
			if (ref) {
				if (ref instanceof Binding) {
					ref[update]();
				} else {
					ref.textContent = text;
				}
			} else {
				this.#set.delete(wr);
			}
		}
	}
	[remove](b) {
		for (const wr of this.#set) {
			const ref = wr.deref();
			if (!ref || ref === b) {
				this.#set.delete(wr);
			}
		}
	}
}

class TemplateBind extends Binding {
	#strings;
	#bindings;
	constructor(strings, ...bindings) {
		super();
		this.#strings = strings;
		this.#bindings = bindings;
		for (const b of bindings) {
			if (b instanceof Binding) {
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

export class Bind extends Binding {
	#value;
	constructor(v) {
		super();
		this.#value = v;
		if (v instanceof Binding) {
			v[setNode](this);
		}
	}
	get value() { return this.#value instanceof Bind ? this.#value.value : this.#value; }
	set value(v) {
		if (this.#value !== v) {
			if (this.#value instanceof Binding) {
				this.#value[remove](this);
			}
			this.#value = v;
			if (v instanceof Binding) {
				v[setNode](this);
			}
		}
		this[update]();
	}
	handleEvent(e) {
		const v = this.value;
		if (v instanceof Function) {
			v.call(e.currentTarget, e);
		} else if (isEventListenerObject(v)) {
			v.handleEvent(e);
		}
	}
	toString() {
		return this.value.toString();
	}
}

export const isChildren = properties => typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof HTMLCollection || properties instanceof Node || properties instanceof Binding,
amendNode = (node, properties, children) => {
	if (properties && isChildren(properties)) {
		children = properties;
	} else if (properties instanceof NamedNodeMap && node instanceof Element) {
		for (const prop of properties) {
			node.setAttributeNode(prop.cloneNode());
		}
	} else if (node && typeof properties === "object") {
		const isNode = isNodeAttributes(node);
		for (const k in properties) {
			const prop = properties[k];
			if (isEventObject(prop) && k.startsWith("on")) {
				const arr = prop instanceof Array;
				node[arr && prop[2] ? "removeEventListener" : "addEventListener"](k.slice(2), arr ? prop[0] : prop, arr ? prop[1] : false);
			} else if (isNode) {
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
					node.setAttribute(k, prop);
					if (prop instanceof Binding) {
						const p = node.getAttributeNode(k);
						if (p) {
							prop[setNode](p);
						}
					}
				}
			}
		}
	}
	if (node instanceof Node) {
		if (typeof children === "string" && !node.firstChild) {
			node.textContent = children;
		} else if (children) {
			if (children instanceof Node) {
				node.appendChild(children);
			} else if (node instanceof Element || node instanceof DocumentFragment) {
				node.append(...childrenArr(children));
			} else {
				node.appendChild(createDocumentFragment(children));
			}
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
	} else if (children instanceof Node) {
		df.append(children);
	} else if (children !== undefined) {
		df.append(...childrenArr(children));
	}
	return df;
},
clearNode = (node, properties, children) => {
	if (!node) {
		return node;
	}
	if (properties && isChildren(properties)) {
		properties = void (children = properties);
	}
	if (typeof children === "string") {
		children = void (node.textContent = children);
	} else if (children && node instanceof Element) {
		children = void node.replaceChildren(...childrenArr(children));
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
bind = (v, first, ...bindings) => {
	if (v instanceof Array && first) {
		return new TemplateBind(v, first, ...bindings);
	}
	return new Bind(v);
};
