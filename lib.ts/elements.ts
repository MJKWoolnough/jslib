import type {Children, DOMBind} from './dom.js';
import {Bind, amendNode, bind, bindElement} from './dom.js';
import {ns} from './html.js';

type Options = {
	manualSlot?: boolean;
	classOnly?: boolean;
	delegatesFocus?: boolean;
	attrs?: boolean;
	observeChildren?: boolean;
	attachRemoveEvent?: boolean;
}

interface ToString {
	toString(): string;
}

type AttrFn = (newValue: ToString) => ToString | void;

type ChildWatchFn = (added: NodeList, removed: NodeList) => void;

interface AttrClass {
	attr(name: string, fn?: Function): Bind;
}

interface ChildClass {
	observeChildren(fn: ChildWatchFn): void;
}

interface ElementFactory {
	(name: string, fn: (elem: HTMLElement & AttrClass & ChildClass) => Children, options?: Options): DOMBind<HTMLElement & AttrClass & ChildClass>;
	(name: string, fn: (elem: HTMLElement & ChildClass) => Children, options: Options & {attrs: false}): DOMBind<HTMLElement & ChildClass>;
	(name: string, fn: (elem: HTMLElement & AttrClass) => Children, options: Options & {observeChildren: false}): DOMBind<HTMLElement & AttrClass>;
	(name: string, fn: (elem: HTMLElement) => Children, options: Options & {attrs: false, observeChildren: false}): DOMBind<HTMLElement>;

	(name: string, fn: (elem: HTMLElement & AttrClass & ChildClass) => Children, options?: Options & {classOnly: true}): HTMLElement & AttrClass & ChildClass;
	(name: string, fn: (elem: HTMLElement & ChildClass) => Children, options: Options & {attrs: false, classOnly: true}): HTMLElement & ChildClass;
	(name: string, fn: (elem: HTMLElement & AttrClass) => Children, options: Options & {observeChildren: false, classOnly: true}): HTMLElement & AttrClass;
	(name: string, fn: (elem: HTMLElement) => Children, options: Options & {attrs: false, observeChildren: false, classOnly: true}): HTMLElement;
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

const attrs = new WeakMap<Node, Map<string, Bind>>(),
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
      setAttr = (elem: HTMLElement, name: string, value: ToString | null) => {
	const attr = attrs.get(elem)?.get(name);
	if (attr) {
		if (value === null) {
			value = attr.value ? Null : name;
		}
		attr.value = value;
		return value !== Null;
	}
	return null;
      },
      setAndReturn = <K, V>(m: {set: (k: K, v: V) => any}, k: K, v: V) => {
	      m.set(k, v);
	      return v;
      },
      classes: (typeof HTMLElement | null)[] = Array.from({"length": 8}, _ => null),
      getClass = (addRemove: boolean, handleAttrs: boolean, children: boolean): typeof HTMLElement => {
	const n = +addRemove | (+handleAttrs << 1) | (+children << 2),
	      b = classes[n];
	if (b) {
		return b;
	}
	const base = children ? getClass(addRemove, handleAttrs, false) : handleAttrs ? getClass(addRemove, false, false) : HTMLElement;
	return classes[n] = children ? class extends base {
		constructor() {
			super();
			childObserver.observe(this, {"childList": true});
		}
		observeChildren(fn: ChildWatchFn) {
			(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
		}
	} : handleAttrs ? class extends base {
		acts: BindFn[] = [];
		constructor() {
			super();
			attrs.set(this, new Map());
		}
		#attr (name: string) {
			const attrMap = attrs.get(this)!;
			return attrMap.get(name) ?? setAndReturn(attrMap, name, bind(this.getAttribute(name) ?? Null));
		}
		act(name: string, fn: (newValue: ToString) => void) {
			const attr = this.#attr(name);
			fn(attr.value);
			this.acts.push(new BindFn(attr, fn));
		}
		attr(name: string, fn?: AttrFn) {
			const attr = this.#attr(name);
			return fn instanceof Function ? new BindFn(attr, fn) : attr;
		}
		addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
			if (setAttr(this, "on" + type, listener) === null) {
				super.addEventListener(type, listener, options);
			}
		}
		removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
			if (setAttr(this, "on" + type, Null) === null) {
				super.removeEventListener(type, listener, options);
			}
		}
		toggleAttribute(qualifiedName: string, force?: boolean) {
			const ret = setAttr(this, qualifiedName, force ?? null);
			if (ret === null) {
				return super.toggleAttribute(qualifiedName, force);
			}
			return ret;
		}
		setAttribute(qualifiedName: string, value: string) {
			if (setAttr(this, qualifiedName, value) === null) {
				super.setAttribute(qualifiedName, value);
			}
		}
		removeAttribute(qualifiedName: string) {
			if (setAttr(this, qualifiedName, Null) === null) {
				super.removeAttribute(qualifiedName);
			}
		}
	} : addRemove ? class extends base {
		connectedCallback() {
			this.dispatchEvent(new CustomEvent("attached"));
		}
		disconnectedCallback() {
			this.dispatchEvent(new CustomEvent("removed"));
		}
	} : base;
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

export default ((name: string, fn: (elem: HTMLElement) => Children, options?: Options) => {
	const shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": options?.manualSlot ? "manual" : "named", "delegatesFocus": options?.delegatesFocus ?? false},
	      element = class extends getClass(options?.attachRemoveEvent ?? true, options?.attrs ?? true, options?.observeChildren ?? true) {
		constructor() {
			super();
			amendNode(this.attachShadow(shadowOptions), fn(this));
		}
	      };
	customElements.define(name, element);
	return options?.classOnly ? element : bindElement<HTMLElement>(ns, name);
}) as ElementFactory;
