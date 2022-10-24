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

export default ((name: string, fn: (elem: Elem) => Children, options?: Options) => {
	const shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": options?.manualSlot ? "manual" : "named", "delegatesFocus": options?.delegatesFocus ?? false},
	      element = class extends (options?.removeEvent ? RemoveEvent : HTMLElement) {
		#attrs: Map<string, Bind<string> | AttrFn>;
		constructor() {
			super();
			this.#attrs = new Map();
			new MutationObserver(list => {
				for (const record of list) {
					if (record.type === "attributes") {
						const name = record.attributeName ?? "",
							ah = this.#attrs.get(name);
						if (ah) {
							const v = this.getAttribute(name);
							if (ah instanceof Function) {
								ah(v, record.oldValue);
							} else {
								ah.value = v ?? "";
							}
						}
					}
				}
			}).observe(this, {"attributeOldValue": true});
			amendNode(this.attachShadow(shadowOptions), fn(this));
		}
		attr(name: string, fn: AttrFn): void;
		attr(name: string, def?: string): Bind<string>;
		attr(name: string, fn?: string | AttrFn) {
			if (this.#attrs.has(name)) {
				throw new Error("already assigned");
			}
			const v = this.getAttribute(name);
			if (fn instanceof Function) {
				this.#attrs.set(name, fn);
				fn(v, null);
				return;
			} else {
				const b = bind<string>(v ?? fn ?? "");
				this.#attrs.set(name, b);
				return b;
			}
		}
	      };
	customElements.define(name, element);
	return options?.classOnly ? element : bindElement<HTMLElement>(ns, name);
}) as ElementFactory;
