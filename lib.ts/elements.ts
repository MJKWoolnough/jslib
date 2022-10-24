import type {Bind, DOMBind, Children} from './dom.js';
import {amendNode, bind, bindElement} from './dom.js';
import {ns} from './html.js';

type Options = {
	manualSlot?: boolean;
	classOnly?: boolean;
	delegatesFocus?: boolean;
	attachRemoveEvent?: boolean;
}

type AttrFn = (newValue: string | null, oldValue: string | null) => void;

type AttrBindFn = (newValue: string | null, oldValue: string | null) => string;

type ChildWatchFn = (added: NodeList, removed: NodeList) => void;

interface ElementFactory {
	(name: string, fn: (elem: Elem) => Children, options?: Options): DOMBind<HTMLElement>;
	(name: string, fn: (elem: Elem) => Children, options: Options & {classOnly: true}): HTMLElement;
}

class AttachRemoveEvent extends HTMLElement {
	connectedCallback() {
		this.dispatchEvent(new CustomEvent("attached"));
	}
	disconnectedCallback() {
		this.dispatchEvent(new CustomEvent("removed"));
	}
}

export interface Elem extends HTMLElement {
	attr(name: string, fn: AttrFn): void;
	attr(name: string, fn: AttrBindFn, def: string): Bind<string>;
	attr(name: string, def: string): Bind<string>;
}

const attrs = new WeakMap<Node, Map<string, (Bind<string> | AttrFn)[]>>(),
      cw = new WeakMap<Node, ChildWatchFn[]>(),
      attrObserver = new MutationObserver(list => {
	for (const record of list) {
		switch (record.type) {
		case "attributes":
			const name = record.attributeName ?? "",
			      v = (record.target as Elem).getAttribute(name);
			for (const ah of attrs.get(record.target)?.get(name) ?? []) {
				if (ah instanceof Function) {
					ah(v, record.oldValue);
				} else {
					ah.value = v ?? "";
				}
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

export default ((name: string, fn: (elem: Elem) => Children, options?: Options) => {
	const shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": options?.manualSlot ? "manual" : "named", "delegatesFocus": options?.delegatesFocus ?? false},
	      element = class extends (options?.attachRemoveEvent ? AttachRemoveEvent : HTMLElement) {
		constructor() {
			super();
			attrs.set(this, new Map());
			attrObserver.observe(this, {"attributeOldValue": true, "childList": true});
			amendNode(this.attachShadow(shadowOptions), fn(this));
		}
		observeChildren(fn: ChildWatchFn) {
			(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
		}
		attr(name: string, fn: AttrFn): void;
		attr(name: string, fn: AttrBindFn, def: string): Bind<string>;
		attr(name: string, def: string): Bind<string>;
		attr(name: string, fn: string | AttrFn | AttrBindFn, def?: string) {
			const attrMap = attrs.get(this)!,
			      v = this.getAttribute(name),
			      attr = attrMap.get(name) ?? setAndReturn(attrMap, name, []);
			if (fn instanceof Function) {
				if (typeof def === "string") {
					const b = bind<string>(def);
					attr.push((newValue: string | null, oldValue: string | null) => b.value = (fn as AttrBindFn)(newValue, oldValue));
					return b;
				} else {
					attr.push(fn);
					fn(v, null);
					return;
				}
			} else {
				const b = bind<string>(v ?? fn);
				attr.push(b);
				return b;
			}
		}
	      };
	customElements.define(name, element);
	return options?.classOnly ? element : bindElement<HTMLElement>(ns, name);
}) as ElementFactory;
