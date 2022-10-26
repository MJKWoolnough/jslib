import type {Bind, DOMBind, Children} from './dom.js';
import {amendNode, bind, bindElement} from './dom.js';
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

type AttrFn = (newValue: ToString) => void;

type AttrBindFn = (newValue: ToString) => ToString;

type ChildWatchFn = (added: NodeList, removed: NodeList) => void;

interface AttrClass {
	attr(name: string, fn: AttrFn): void;
	attr(name: string, fn: AttrBindFn, def: string): Bind<string>;
	attr(name: string, def?: string): Bind<string>;
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

const attrs = new WeakMap<Node, Map<string, [Bind, ...AttrFn[]]>>(),
      cw = new WeakMap<Node, ChildWatchFn[]>(),
      attrObserver = new MutationObserver(list => {
	for (const record of list) {
		switch (record.type) {
		case "attributes":
			const name = record.attributeName ?? "",
			      v = (record.target as Element).getAttribute(name) ?? Null,
			      ahs = attrs.get(record.target)?.get(name);
			if (ahs?.[0]) {
				ahs[0].value = v ?? "";
			}
			for (const ah of ahs?.slice(1) as AttrFn[] ?? []) {
				ah(v);
			}
			break;
		case "childList":
			for (const fn of cw.get(record.target) ?? []) {
				fn(record.addedNodes, record.removedNodes);
			}
		}
	}
      }),
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
			if (childList || attributeOldValue) {
				attrObserver.observe(this, observeOptions);
			}
			amendNode(this.attachShadow(shadowOptions), fn(this));
		}
		observeChildren(fn: ChildWatchFn) {
			if (childList) {
				(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
			}
		}
		attr(name: string, fn: AttrFn): void;
		attr(name: string, fn?: AttrBindFn): Bind<ToString>;
		attr(name: string, fn?: AttrFn | AttrBindFn) {
			if (!attributeOldValue) {
				return;
			}
			const attrMap = attrs.get(this)!,
			      v = this.getAttribute(name) ?? Null,
			      attr = attrMap.get(name) ?? setAndReturn(attrMap, name, [bind(v ?? Null)]);
			if (fn instanceof Function) {
				const r = fn(v);
				if (r !== undefined) {
					const b = bind(r ?? Null);
					attr.push((newValue: ToString) => b.value = (fn as AttrBindFn)(newValue));
					return b;
				} else {
					attr.push(fn);
					fn(v);
					return;
				}
			}
			return attr[0];
		}
	      };
	customElements.define(name, element);
	return options?.classOnly ? element : bindElement<HTMLElement>(ns, name);
}) as ElementFactory;
