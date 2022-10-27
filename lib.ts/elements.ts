import type {DOMBind, Children} from './dom.js';
import {Bind, amendNode, bind, bindElement} from './dom.js';
import {ns} from './html.js';

type Options = {
	manualSlot?: boolean;
	classOnly?: boolean;
	delegatesFocus?: boolean;
	attachRemoveEvents?: boolean;
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
	attr(name: string, fn?: AttrFn): void;
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

class AttachRemoveEvent extends HTMLElement {
	connectedCallback() {
		this.dispatchEvent(new CustomEvent("attached"));
	}
	disconnectedCallback() {
		this.dispatchEvent(new CustomEvent("removed"));
	}
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

const attrs = new WeakMap<Node, Map<string, [Bind, ...AttrFn[]]>>(),
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
	const ahs = attrs.get(elem)?.get(name);
	if (ahs) {
		const [attr, ...fns] = ahs;
		if (value === null) {
			value = attr.value ? Null : name;
		}
		attr.value = value;
		for (const fn of fns) {
			fn(value);
		}
		return value !== Null;
	}
	return null;
      },
      setAndReturn = <K, V>(m: {set: (k: K, v: V) => any}, k: K, v: V) => {
	      m.set(k, v);
	      return v;
      };

export const Null = Object.assign(() => {}, {
	toString(){
		return "";
	},
	handleEvent() {}
});

export default ((name: string, fn: (elem: HTMLElement) => Children, options?: Options) => {
	const shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": options?.manualSlot ? "manual" : "named", "delegatesFocus": options?.delegatesFocus ?? false},
	      {attrs: attributeOldValue = true, observeChildren: childList = true} = options ?? {},
	      observeOptions = {attributeOldValue, childList},
	      element = class extends (options?.attachRemoveEvent ? AttachRemoveEvent : HTMLElement) {
		constructor() {
			super();
			if (attributeOldValue) {
				attrs.set(this, new Map());
			}
			if (childList) {
				childObserver.observe(this, observeOptions);
			}
			amendNode(this.attachShadow(shadowOptions), fn(this));
		}
		observeChildren(fn: ChildWatchFn) {
			if (childList) {
				(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
			}
		}
		act(name: string, fn: (newValue: ToString) => void) {
			if (!attributeOldValue) {
				return;
			}
			const attrMap = attrs.get(this)!,
			      attr = attrMap.get(name) ?? setAndReturn(attrMap, name, [bind(this.getAttribute(name) ?? Null)]);
			attr.push(fn);
		}
		attr(name: string, fn?: AttrFn) {
			if (!attributeOldValue) {
				return;
			}
			const attrMap = attrs.get(this)!,
			      attr = attrMap.get(name) ?? setAndReturn(attrMap, name, [bind(this.getAttribute(name) ?? Null)]);
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
	      };
	customElements.define(name, element);
	return options?.classOnly ? element : bindElement<HTMLElement>(ns, name);
}) as ElementFactory;
