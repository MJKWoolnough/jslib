import type {Children, DOMBind, Props} from './dom.js';
import {Bind, amendNode, bind, bindElement} from './dom.js';
import {ns} from './html.js';

type Options = {
	manualSlot?: boolean;
	classOnly?: boolean;
	delegatesFocus?: boolean;
	attrs?: boolean;
	observeChildren?: boolean;
	attachRemoveEvent?: boolean;
	styles?: [CSSStyleSheet];
	psuedo?: boolean;
	name?: string;
}

interface ToString {
	toString(): string;
}

type AttrFn = (newValue: ToString) => ToString | void;

type ChildWatchFn = (added: NodeList, removed: NodeList) => void;

interface AttrClass {
	act(name: string | string[], fn: Function): void;
	attr(name: string[], fn: Function): Bind;
	attr(name: string, fn?: Function): Bind;
}

interface ChildClass {
	observeChildren(fn: ChildWatchFn): void;
}

interface ElementFactory {
	(fn: (elem: HTMLElement & AttrClass & ChildClass) => Children, options?: Options): DOMBind<HTMLElement & AttrClass & ChildClass>;
	(fn: (elem: HTMLElement & ChildClass) => Children, options: Options & {attrs: false}): DOMBind<HTMLElement & ChildClass>;
	(fn: (elem: HTMLElement & AttrClass) => Children, options: Options & {observeChildren: false}): DOMBind<HTMLElement & AttrClass>;
	(fn: (elem: HTMLElement) => Children, options: Options & {attrs: false, observeChildren: false}): DOMBind<HTMLElement>;

	(fn: (elem: HTMLElement & AttrClass & ChildClass) => Children, options?: Options & {classOnly: true}): HTMLElement & AttrClass & ChildClass;
	(fn: (elem: HTMLElement & ChildClass) => Children, options: Options & {attrs: false, classOnly: true}): HTMLElement & ChildClass;
	(fn: (elem: HTMLElement & AttrClass) => Children, options: Options & {observeChildren: false, classOnly: true}): HTMLElement & AttrClass;
	(fn: (elem: HTMLElement) => Children, options: Options & {attrs: false, observeChildren: false, classOnly: true}): HTMLElement;

	(fn: (elem: DocumentFragment & AttrClass & ChildClass) => Children, options: Options & {psuedo: true}): DOMBind<DocumentFragment & AttrClass & ChildClass>;
	(fn: (elem: DocumentFragment & ChildClass) => Children, options: Options & {attrs: false, psuedo: true}): DOMBind<DocumentFragment & ChildClass>;
	(fn: (elem: DocumentFragment & AttrClass) => Children, options: Options & {observeChildren: false, psuedo: true}): DOMBind<DocumentFragment & AttrClass>;
	(fn: (elem: DocumentFragment) => Children, options: Options & {attrs: false, observeChildren: false, psuedo: true}): DOMBind<DocumentFragment>;

	(fn: (elem: DocumentFragment & AttrClass & ChildClass) => Children, options?: Options & {classOnly: true, psuedo: true}): DocumentFragment & AttrClass & ChildClass;
	(fn: (elem: DocumentFragment & ChildClass) => Children, options: Options & {attrs: false, classOnly: true, psuedo: true}): DocumentFragment & ChildClass;
	(fn: (elem: DocumentFragment & AttrClass) => Children, options: Options & {observeChildren: false, classOnly: true, psuedo: true}): DocumentFragment & AttrClass;
	(fn: (elem: DocumentFragment) => Children, options: Options & {attrs: false, observeChildren: false, classOnly: true, psuedo: true}): DocumentFragment;
}

class BindFn extends Bind {
	#fn: AttrFn;
	constructor(v: ToString, fn: AttrFn) {
		super(v);
		this.#fn = fn;
	}
	get value() {
		return this.#fn(super.value) ?? Null;
	}
}

class BindMulti extends Bind {
	#fn: AttrFn;
	constructor(elem: Node, names: string[], fn: Function) {
		super("");
		const obj: Record<string, Bind> = {},
		      afn = this.#fn = () => {
			const o: Record<string, ToString> = {};
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

let noObserve = false;

const attrs = new WeakMap<Node, Map<string, Bind>>(),
      getAttr = (elem: Node, name: string) => {
	const attrMap = attrs.get(elem)!;
	return attrMap.get(name) ?? setAndReturn(attrMap, name, bind((elem as HTMLElement).getAttribute(name) ?? Null));
      },
      cw = new WeakMap<Node, ChildWatchFn[]>(),
      childObserver = new MutationObserver(list => {
	if (noObserve) {
		return;
	}
	for (const record of list) {
		if (record.type === "childList") {
			for (const fn of cw.get(record.target) ?? []) {
				fn(record.addedNodes, record.removedNodes);
			}
		}
	}
      }),
      setAttr = (elem: Node, name: string, value: ToString | null) => {
	const attr = attrs.get(elem)?.get(name);
	return attr ? (attr.value = value === null ? attr.value ? Null : name : value) !== Null : null;
      },
      setAndReturn = <K, V>(m: {set: (k: K, v: V) => any}, k: K, v: V) => {
	      m.set(k, v);
	      return v;
      },
      act = (c: Node, names: string | string[], fn: (newValue: ToString) => void) => {
	if (names instanceof Array) {
		return new BindMulti(c, names, fn);
	} else {
		const attr = getAttr(c, names);
		fn(attr.value);
		return new BindFn(attr, fn);
	}
      },
      attr = (c: Node, names: string | string[], fn?: AttrFn) => {
	if (names instanceof Array) {
		return new BindMulti(c, names, fn!);
	}
	const attr = getAttr(c, names);
	return fn instanceof Function ? new BindFn(attr, fn) : attr;
      },
      childList = {"childList": true},
      classes: (typeof HTMLElement | null)[] = Array.from({"length": 8}, _ => null),
      getClass = (addRemove: boolean, handleAttrs: boolean, children: boolean): typeof HTMLElement => {
	const n = (+addRemove << 2) | (+handleAttrs << 1) | +children,
	      b = classes[n];
	if (b) {
		return b;
	}
	const base = addRemove ? getClass(false, handleAttrs, children) : handleAttrs ? getClass(false, false, children) : HTMLElement;
	return classes[n] = children ? class extends base {
		connectedCallback() {
			this.dispatchEvent(new CustomEvent("attached"));
		}
		disconnectedCallback() {
			this.dispatchEvent(new CustomEvent("removed"));
		}
	} : handleAttrs ? class extends base {
		#acts: Bind[] = [];
		constructor() {
			super();
			attrs.set(this, new Map());
		}
		act(names: string | string[], fn: (newValue: ToString) => void) {
			this.#acts.push(act(this, names, fn));
		}
		attr(names: string | string[], fn?: AttrFn) {
			return attr(this, names, fn);
		}
		addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
			setAttr(this, "on" + type, listener) ?? super.addEventListener(type, listener, options);
		}
		removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
			setAttr(this, "on" + type, Null) === null ?? super.removeEventListener(type, listener, options);
		}
		toggleAttribute(qualifiedName: string, force?: boolean) {
			return setAttr(this, qualifiedName, force ?? null) ?? super.toggleAttribute(qualifiedName, force);
		}
		setAttribute(qualifiedName: string, value: string) {
			setAttr(this, qualifiedName, value) ?? super.setAttribute(qualifiedName, value);
		}
		setAttributeNode(attribute: Attr) {
			const attr = this.getAttributeNode(attribute.name);
			return setAttr(this, attribute.name, attribute.value) === null ? super.setAttributeNode(attribute) : attr;
		}
		removeAttribute(qualifiedName: string) {
			setAttr(this, qualifiedName, Null) ?? super.removeAttribute(qualifiedName);
		}
		removeAttributeNode(attribute: Attr) {
			return setAttr(this, attribute.name, Null) === null ? super.removeAttributeNode(attribute) : attribute;
		}
	} : addRemove ? class extends base {
		constructor() {
			super();
			childObserver.observe(this, childList);
		}
		observeChildren(fn: ChildWatchFn) {
			(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
		}
	} : base;
      },
      psuedos: (typeof DocumentFragment | null)[] = Array.from({"length": 4}, _ => null),
      noop = () => {},
      getPsuedo = (handleAttrs: boolean, children: boolean): typeof DocumentFragment => {
	const n = +handleAttrs | (+children << 1),
	      b = psuedos[n];
	if (b) {
		return b;
	}
	const base = children ? getPsuedo(handleAttrs, false) : DocumentFragment;
	return psuedos[n] = children ? class extends base {
		constructor() {
			super();
			childObserver.observe(this, childList);
		}
		observeChildren(fn: ChildWatchFn) {
			(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
		}
	} : handleAttrs ? class extends base {
		#acts: Bind[] = [];
		readonly classList = {toggle: noop};
		readonly style = {removeProperty: noop, setProperty: noop};
		constructor() {
			super();
			attrs.set(this, new Map());
		}
		act(names: string | string[], fn: (newValue: ToString) => void) {
			this.#acts.push(act(this, names, fn));
		}
		attr(names: string | string[], fn?: AttrFn) {
			return attr(this, names, fn);
		}
		addEventListener(type: string, listener: EventListenerOrEventListenerObject, _options?: boolean | AddEventListenerOptions) {
			setAttr(this, "on" + type, listener);
		}
		removeEventListener(type: string, _listener: EventListenerOrEventListenerObject, _options?: boolean | EventListenerOptions) {
			setAttr(this, "on" + type, Null);
		}
		getAttribute(_qualifiedName: string) {
			return null;
		}
		getAttributeNode(_qualifiedName: string) {
			return null;
		}
		toggleAttribute(qualifiedName: string, force?: boolean) {
			return setAttr(this, qualifiedName, force ?? null);
		}
		setAttribute(qualifiedName: string, value: string) {
			setAttr(this, qualifiedName, value);
		}
		removeAttribute(qualifiedName: string) {
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
	[Symbol.toPrimitive](hint: string) {
		return hint === "number" ? NaN : "";
	}
}));

export default ((fn: (elem: Node) => Children, options: Options = {}) => {
	const {attachRemoveEvent = true, attrs = true, observeChildren = true, psuedo = false, styles = [], delegatesFocus = false, manualSlot = false, classOnly = false} = options,
	      {name = psuedo ? "" : genName()} = options,
	      shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": manualSlot ? "manual" : "named", delegatesFocus},
	      element = psuedo ? class extends getPsuedo(attrs, observeChildren) {
		constructor() {
			super();
			const c = fn(this);
			noObserve = true;
			amendNode(this, c);
			noObserve = false;
		}
	      } : class extends getClass(attachRemoveEvent, attrs, observeChildren) {
		constructor() {
			super();
			amendNode(this.attachShadow(shadowOptions), fn(this)).adoptedStyleSheets = styles;
		}
	      };
	if (!psuedo) {
		customElements.define(name, element as CustomElementConstructor);
	}
	return classOnly ? element : psuedo ? (properties?: Props, children?: Children) => amendNode(new element(), properties, children) : bindElement<HTMLElement>(ns, name);
}) as ElementFactory;
