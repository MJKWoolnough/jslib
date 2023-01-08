import {Bind, amendNode, bind, isChildren} from './dom.js';

class BindFn extends Bind {
	#fn;
	constructor(v, fn) {
		super(v);
		this.#fn = fn;
	}
	get value() {
		return this.#fn(super.value) ?? Null;
	}
}

class BindMulti extends Bind {
	#fn;
	constructor(elem, names, fn) {
		super(0);
		let calling = false;
		const obj = {},
		      self = this;
		this.#fn = function(val) {
			if (!calling) {
				calling = true;
				const o = {};
				for (const n in obj) {
					o[n] = obj[n] === this ? val : obj[n].value;
				}
				calling = false;
				self.value = fn(o) ?? Null;
			}
			return val;
		};
		for (const n of names) {
			obj[n] = new BindFn(getAttr(elem, n), this.#fn);
		}
		this.#fn(0);
	}
}

const attrs = new WeakMap(),
      getAttr = (elem, name) => {
	const attrMap = attrs.get(elem);
	return attrMap.get(name) ?? setAndReturn(attrMap, name, bind(elem.getAttribute(name) ?? Null));
      },
      cw = new WeakMap(),
      childObserver = new MutationObserver(list => {
	for (const record of list) {
		if (record.type === "childList") {
			for (const fn of cw.get(record.target) ?? []) {
				fn(record.addedNodes, record.removedNodes);
			}
		}
	}
      }),
      setAttr = (elem, name, value) => {
	const attr = attrs.get(elem)?.get(name);
	return attr ? (attr.value = value === null ? attr.value ? Null : name : value) !== Null : null;
      },
      setAndReturn = (m, k, v) => {
	      m.set(k, v);
	      return v;
      },
      act = (c, names, fn) => {
	if (names instanceof Array) {
		return new BindMulti(c, names, fn);
	} else {
		const attr = getAttr(c, names);
		fn(attr.value);
		return new BindFn(attr, fn);
	}
      },
      attr = (c, names, fn) => {
	if (names instanceof Array) {
		return new BindMulti(c, names, fn);
	}
	const attr = getAttr(c, names);
	return fn instanceof Function ? new BindFn(attr, fn) : attr;
      },
      childList = {"childList": true},
      classes = Array.from({"length": 8}),
      getClass = (addRemove, handleAttrs, children) => classes[(+addRemove << 2) | (+handleAttrs << 1) | +children] ??= addRemove ? class extends getClass(false, handleAttrs, children) {
	connectedCallback() {
		this.dispatchEvent(new CustomEvent("attached"));
	}
	disconnectedCallback() {
		this.dispatchEvent(new CustomEvent("removed"));
	}
      } : handleAttrs ? class extends getClass(false, false, children) {
	#acts = [];
	constructor() {
		super();
		attrs.set(this, new Map());
	}
	act(names, fn) {
		this.#acts.push(act(this, names, fn));
	}
	attr(names, fn) {
		return attr(this, names, fn);
	}
	addEventListener(type, listener, options) {
		setAttr(this, "on" + type, listener) ?? super.addEventListener(type, listener, options);
	}
	removeEventListener(type, listener, options) {
		setAttr(this, "on" + type, Null) === null ?? super.removeEventListener(type, listener, options);
	}
	toggleAttribute(qualifiedName, force) {
		return setAttr(this, qualifiedName, force ?? null) ?? super.toggleAttribute(qualifiedName, force);
	}
	setAttribute(qualifiedName, value) {
		setAttr(this, qualifiedName, value) ?? super.setAttribute(qualifiedName, value);
	}
	setAttributeNode(attribute) {
		const attr = this.getAttributeNode(attribute.name);
		return setAttr(this, attribute.name, attribute.value) === null ? super.setAttributeNode(attribute) : attr;
	}
	removeAttribute(qualifiedName) {
		setAttr(this, qualifiedName, Null) ?? super.removeAttribute(qualifiedName);
	}
	removeAttributeNode(attribute) {
		return setAttr(this, attribute.name, Null) === null ? super.removeAttributeNode(attribute) : attribute;
	}
      } : children ? class extends HTMLElement {
	constructor() {
		super();
		childObserver.observe(this, childList);
	}
	observeChildren(fn) {
		(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
	}
      } : HTMLElement,
      pseudos = Array.from({"length": 4}),
      noop = () => {},
      getPseudo = (handleAttrs, children) => pseudos[+handleAttrs | (+children << 1)] ??= children ? class extends getPseudo(handleAttrs, false) {
	observeChildren(fn) {
		(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
	}
      } : handleAttrs ? class extends DocumentFragment {
	#acts = [];
	classList = {toggle: noop};
	style = {removeProperty: noop, setProperty: noop};
	constructor() {
		super();
		attrs.set(this, new Map());
	}
	act(names, fn) {
		this.#acts.push(act(this, names, fn));
	}
	attr(names, fn) {
		return attr(this, names, fn);
	}
	addEventListener(type, listener) {
		setAttr(this, "on" + type, listener);
	}
	removeEventListener(type) {
		setAttr(this, "on" + type, Null);
	}
	getAttribute() {
		return null;
	}
	getAttributeNode() {
		return null;
	}
	toggleAttribute(qualifiedName, force) {
		return setAttr(this, qualifiedName, force ?? null);
	}
	setAttribute(qualifiedName, value) {
		setAttr(this, qualifiedName, value);
	}
	removeAttribute(qualifiedName) {
		setAttr(this, qualifiedName, Null);
	}
      } : DocumentFragment,
      genName = () => {
	let name;
	while(customElements.get(name = String.fromCharCode(...Array.from({"length": 11}, (_, n) => n === 5 ? 45 : 97 + Math.floor(Math.random() * 26))))) {}
	return name;
      },
      noExtend = v => v;

export const Null = Object.freeze(Object.assign(() => {}, {
	toString(){
		return "";
	},
	handleEvent() {},
	*[Symbol.iterator]() {},
	[Symbol.toPrimitive](hint) {
		return hint === "number" ? NaN : "";
	}
}));

export default (optionsOrFn, fn) => {
	fn ??= optionsOrFn;
	const options = optionsOrFn instanceof Function ? {} : optionsOrFn,
	      {args = [], attachRemoveEvent = true, attrs = true, observeChildren = true, pseudo = false, styles = [], delegatesFocus = false, manualSlot = false, extend = noExtend, classOnly = false} = options,
	      {name = pseudo ? "" : genName()} = options,
	      shadowOptions = {"mode": "closed", "slotAssignment": manualSlot ? "manual" : "named", delegatesFocus},
	      element = pseudo ? class extends extend(getPseudo(attrs, observeChildren)) {
		constructor(...args) {
			super();
			amendNode(this, fn.apply(null, [this, ...args]));
			if (observeChildren) {
				childObserver.observe(this, childList);
			}
		}
	      } : class extends extend(getClass(attachRemoveEvent, attrs, observeChildren)) {
		constructor(...args) {
			super();
			amendNode(this.attachShadow(shadowOptions), fn.apply(null, [this, ...args])).adoptedStyleSheets = styles;
		}
	      };
	if (!pseudo && !(classOnly && name === "")) {
		customElements.define(name, element);
	}
	return Object.defineProperty(classOnly ? element : (properties, children) => {
		const eArgs = args.map(() => undefined);
		let props = properties;
		if (args.length && properties && !isChildren(properties) && !(properties instanceof NamedNodeMap)) {
			let pos = 0;
			props = Object.assign({}, properties);
			for (const a of args) {
				const v = properties[a];
				if (v) {
					eArgs[pos] = v;
				} else {
					delete props[a];
				}
				pos++;
			}
		}
		return amendNode(new element(...eArgs), props, children);
	}, "name", {"value": name});
};
