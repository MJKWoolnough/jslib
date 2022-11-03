import {Bind, amendNode, bind, bindElement} from './dom.js';
import {ns} from './html.js';

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
		super("");
		const obj = {},
		      afn = this.#fn = () => {
			const o = {};
			for (const n in obj) {
				o[n] = obj[n].value;
			}
			this.value = fn(o) ?? Null;
		};
		for (const n of names) {
			obj[n] = new BindFn(getAttr(elem, n), this.#fn);
		}
		afn();
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
      getClass = (addRemove, handleAttrs, children) => {
	const n = (+addRemove << 2) | (+handleAttrs << 1) | +children,
	      b = classes[n];
	if (b) {
		return b;
	}
	const base = addRemove ? getClass(false, handleAttrs, children) : handleAttrs ? getClass(false, false, children) : HTMLElement;
	return classes[n] = addRemove ? class extends base {
		connectedCallback() {
			this.dispatchEvent(new CustomEvent("attached"));
		}
		disconnectedCallback() {
			this.dispatchEvent(new CustomEvent("removed"));
		}
	} : handleAttrs ? class extends base {
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
	} : children ? class extends base {
		constructor() {
			super();
			childObserver.observe(this, childList);
		}
		observeChildren(fn) {
			(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
		}
	} : base;
      },
      psuedos = Array.from({"length": 4}),
      noop = () => {},
      getPsuedo = (handleAttrs, children) => {
	const n = +handleAttrs | (+children << 1),
	      b = psuedos[n];
	if (b) {
		return b;
	}
	const base = children ? getPsuedo(handleAttrs, false) : DocumentFragment;
	return psuedos[n] = children ? class extends base {
		observeChildren(fn) {
			(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
		}
	} : handleAttrs ? class extends base {
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
	} : base;
      },
      genChars = () => String.fromCharCode(...Array.from({"length": 5}, _ => 97 + Math.floor(Math.random() * 26))),
      genName = () => {
	let name;
	while(customElements.get(name = genChars() + "-" + genChars())) {}
	return name;
      };

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

export default (fn, options = {}) => {
	const {attachRemoveEvent = true, attrs = true, observeChildren = true, psuedo = false, styles = [], delegatesFocus = false, manualSlot = false, classOnly = false} = options,
	      {name = psuedo ? "" : genName()} = options,
	      shadowOptions = {"mode": "closed", "slotAssignment": manualSlot ? "manual" : "named", delegatesFocus},
	      element = psuedo ? class extends getPsuedo(attrs, observeChildren) {
		constructor() {
			super();
			amendNode(this, fn(this));
			if (observeChildren) {
				childObserver.observe(this, childList);
			}
		}
	      } : class extends getClass(attachRemoveEvent, attrs, observeChildren) {
		constructor() {
			super();
			amendNode(this.attachShadow(shadowOptions), fn(this)).adoptedStyleSheets = styles;
		}
	      };
	if (!psuedo) {
		customElements.define(name, element);
	}
	return classOnly ? element : psuedo ? (properties, children) => amendNode(new element(), properties, children) : bindElement<HTMLElement>(ns, name);
};
