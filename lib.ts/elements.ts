import type {Bind, DOMBind, Children} from './dom.js';
import {amendNode, bind, bindElement} from './dom.js';
import {ns} from './html.js';

type Options = {
	manualSlot?: boolean;
	classOnly?: boolean;
	delegatesFocus?: boolean;
	removeEvent?: boolean;
}

type AttrFn = (newValue: string | null, oldValue: string | null) => void;

interface ElementFactory {
	(name: string, fn: (elem: Elem) => Children, options?: Options): DOMBind<HTMLElement>;
	(name: string, fn: (elem: Elem) => Children, options: Options & {classOnly: true}): HTMLElement;
}

class RemoveEvent extends HTMLElement {
	disconnectedCallback() {
		this.dispatchEvent(new CustomEvent("remove"));
	}
}

export interface Elem extends HTMLElement {
	attr(name: string, fn: AttrFn): void;
	attr(name: string, def?: string): Bind<string>;
}

const attrs = new WeakMap<Node, Map<string, Bind<string> | AttrFn>>(),
      attrObserver = new MutationObserver(list => {
	for (const record of list) {
		if (record.type === "attributes") {
			const name = record.attributeName ?? "",
			      ah = attrs.get(record.target)?.get(name);
			if (ah) {
				const v = (record.target as Elem).getAttribute(name);
				if (ah instanceof Function) {
					ah(v, record.oldValue);
				} else {
					ah.value = v ?? "";
				}
			}
		}
	}
      });

export default ((name: string, fn: (elem: Elem) => Children, options?: Options) => {
	const shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": options?.manualSlot ? "manual" : "named", "delegatesFocus": options?.delegatesFocus ?? false},
	      element = class extends (options?.removeEvent ? RemoveEvent : HTMLElement) {
		constructor() {
			super();
			attrs.set(this, new Map());
			attrObserver.observe(this, {"attributeOldValue": true});
			amendNode(this.attachShadow(shadowOptions), fn(this));
		}
		attr(name: string, fn: AttrFn): void;
		attr(name: string, def?: string): Bind<string>;
		attr(name: string, fn?: string | AttrFn) {
			const attrMap = attrs.get(this)!;
			if (attrMap.has(name)) {
				throw new Error("already assigned");
			}
			const v = this.getAttribute(name);
			if (fn instanceof Function) {
				attrMap.set(name, fn);
				fn(v, null);
				return;
			} else {
				const b = bind<string>(v ?? fn ?? "");
				attrMap.set(name, b);
				return b;
			}
		}
	      };
	customElements.define(name, element);
	return options?.classOnly ? element : bindElement<HTMLElement>(ns, name);
}) as ElementFactory;
