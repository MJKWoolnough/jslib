import type {Bind, DOMBind, Children} from './dom.js';
import {amendNode, bindElement} from './dom.js';
import {ns} from './html.js';

type Options = {
	attrs?: readonly string[];
	manualSlot?: boolean;
	classOnly?: boolean;
	delegatesFocus?: boolean;
	removeEvent?: boolean;
}

type AttrFn = (newValue: string | null, oldValue: string | null) => void;

type AttrFnWrap = <T extends AttrFn | Bind<string>>(fn : T) => T;

interface ElementFactory {
	(name: string, fn: (this: HTMLElement) => Children, options?: Exclude<Options, "attrs">): DOMBind<HTMLElement>;
	(name: string, fn: (this: HTMLElement, ...params: AttrFnWrap[]) => Children, options?: Options): DOMBind<HTMLElement>;
	(name: string, fn: (this: HTMLElement, ...params: AttrFnWrap[]) => Children, options: Options & {classOnly: true}): HTMLElement;
}

class RemoveEvent extends HTMLElement {
	disconnectedCallback() {
		this.dispatchEvent(new CustomEvent("remove"));
	}
}

export default ((name: string, fn: (this: HTMLElement, ...params: AttrFnWrap[]) => Children, options?: Options) => {
	const attrs = options?.attrs ?? [],
	      shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": options?.manualSlot ? "manual" : "named", "delegatesFocus": options?.delegatesFocus ?? false},
	      base = options?.removeEvent ? RemoveEvent : HTMLElement,
	      element = attrs.length ? class extends base {
		#attrs: Map<string, AttrFn | Bind<string>>;
		static observedAttributes = attrs;
		constructor() {
			super();
			this.#attrs = new Map();
			const params: AttrFnWrap[] = [];
			for (const param of attrs) {
				params.push(<T extends AttrFn | Bind<string>>(fn: T) => {
					this.#attrs.set(param, fn);
					return fn;
				});
			}
			amendNode(this.attachShadow(shadowOptions), fn.call(this, ...params));
		}
		attributeChangedCallback(name: string, oldValue: string, newValue: string) {
			const a = this.#attrs.get(name);
			if (a instanceof Function) {
				a(newValue, oldValue);
			} else if (a) {
				a.value = newValue ?? "";
			}
		}
	      } : class extends base {
		constructor() {
			super();
			amendNode(this.attachShadow(shadowOptions), fn.call(this));
		}
	      }
	customElements.define(name, element);
	return options?.classOnly ? element : bindElement<HTMLElement>(ns, name);
}) as ElementFactory;
