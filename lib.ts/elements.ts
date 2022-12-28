import type {Children, DOMBind, Props} from './dom.js';
import {Bind, amendNode, bind, bindElement} from './dom.js';
import {ns} from './html.js';

type Options = {
	manualSlot?: boolean;
	delegatesFocus?: boolean;
	attrs?: boolean;
	observeChildren?: boolean;
	attachRemoveEvent?: boolean;
	styles?: [CSSStyleSheet];
	psuedo?: boolean;
	name?: string;
	extend?: Function;
	classOnly?: boolean;
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

type ConstructorOf<C> = {
	new(...args: any[]): C;
}

interface OptionsFactory <T extends HTMLElement | DocumentFragment, U extends Options> {
	<V extends T>(fn: (elem: V) => Children, options?: U & {extend?: (base: ConstructorOf<T>) => ConstructorOf<V>, classOnly?: false}): DOMBind<V>;
	<V extends T>(fn: (elem: V) => Children, options?: U & {extend?: (base: ConstructorOf<T>) => ConstructorOf<V>, classOnly: true}): ConstructorOf<V>;
}

type HTMLElementORDocumentFragmentFactory<T extends HTMLElement | DocumentFragment, U extends {psuedo?: boolean}> = OptionsFactory<T & AttrClass & ChildClass, Options & {attrs?: true, observeChildren?: true} & U> & OptionsFactory<T & ChildClass, Options & {attrs: false, observeChildren?: true} & U> & OptionsFactory<T & AttrClass, Options & {attrs?: true, observeChildren: false} & U> & OptionsFactory<T, Options & {attrs: false, observeChildren: false} & U>;

type ElementFactory = HTMLElementORDocumentFragmentFactory<HTMLElement, {psuedo?: false}> & HTMLElementORDocumentFragmentFactory<DocumentFragment, {psuedo: true}>;

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
		super(0);
		let calling = false;
		const obj: Record<string, Bind> = {},
		      self = this;
		this.#fn = function(this: Bind, val: ToString) {
			if (!calling) {
				calling = true;
				const o: Record<string, ToString> = {};
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

const attrs = new WeakMap<Node, Map<string, Bind>>(),
      getAttr = (elem: Node, name: string) => {
	const attrMap = attrs.get(elem)!;
	return attrMap.get(name) ?? setAndReturn(attrMap, name, bind((elem as HTMLElement).getAttribute(name) ?? Null));
      },
      cw = new WeakMap<Node, ChildWatchFn[]>(),
      childObserver = new MutationObserver(list => {
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
      classes: (ConstructorOf<HTMLElement> | undefined)[] = Array.from({"length": 8}),
      getClass = (addRemove: boolean, handleAttrs: boolean, children: boolean): ConstructorOf<HTMLElement> => classes[(+addRemove << 2) | (+handleAttrs << 1) | +children] ??= addRemove ? class extends getClass(false, handleAttrs, children) {
	connectedCallback() {
		this.dispatchEvent(new CustomEvent("attached"));
	}
	disconnectedCallback() {
		this.dispatchEvent(new CustomEvent("removed"));
	}
      } : handleAttrs ? class extends getClass(false, false, children) {
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
	setAttribute(qualifiedName: string, value: ToString) {
		setAttr(this, qualifiedName, value) ?? super.setAttribute(qualifiedName, value as string);
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
      } : children ? class extends HTMLElement {
	constructor() {
		super();
		childObserver.observe(this, childList);
	}
	observeChildren(fn: ChildWatchFn) {
		(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
	}
      } : HTMLElement,
      psuedos: (ConstructorOf<DocumentFragment> | undefined)[] = Array.from({"length": 4}),
      noop = () => {},
      getPsuedo = (handleAttrs: boolean, children: boolean): ConstructorOf<DocumentFragment> => psuedos[+handleAttrs | (+children << 1)] ??= children ? class extends getPsuedo(handleAttrs, false) {
	observeChildren(fn: ChildWatchFn) {
		(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
	}
      } : handleAttrs ? class extends DocumentFragment {
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
      } : DocumentFragment,
      genName = () => {
	let name;
	while(customElements.get(name = String.fromCharCode(...Array.from({"length": 11}, (_, n) => n === 5 ? 45 : 97 + Math.floor(Math.random() * 26))))) {}
	return name;
      },
      noExtend = <T extends ConstructorOf<HTMLElement> | ConstructorOf<DocumentFragment>>(v: T) => v;

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
	const {attachRemoveEvent = true, attrs = true, observeChildren = true, psuedo = false, styles = [], delegatesFocus = false, manualSlot = false, extend = noExtend, classOnly = false} = options,
	      {name = psuedo ? "" : genName()} = options,
	      shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": manualSlot ? "manual" : "named", delegatesFocus},
	      element = psuedo ? class extends (extend as (<T extends ConstructorOf<DocumentFragment>, V extends T>(base: T) => V))(getPsuedo(attrs, observeChildren)) {
		constructor() {
			super();
			amendNode(this, fn(this));
			if (observeChildren) {
				childObserver.observe(this, childList);
			}
		}
	      } : class extends (extend as (<T extends ConstructorOf<HTMLElement>, V extends T>(base: T) => V))(getClass(attachRemoveEvent, attrs, observeChildren)) {
		constructor() {
			super();
			amendNode(this.attachShadow(shadowOptions), fn(this)).adoptedStyleSheets = styles;
		}
	      };
	if (!psuedo && !(classOnly && name === "")) {
		customElements.define(name, element as CustomElementConstructor);
	}
	return classOnly ? element : psuedo ? (properties?: Props, children?: Children) => amendNode(new element(), properties, children) : bindElement<HTMLElement>(ns, name);
}) as ElementFactory;
