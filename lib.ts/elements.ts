import type {Children} from './dom.js';
import {amendNode, bindElement} from './dom.js';
import {ns} from './html.js';

type Options = {
	attrs?: readonly string[];
	manualSlot?: boolean;
}

type AttrFn = (newValue: string, oldValue: string) => void;

type AttrFnWrap = (fn: AttrFn) => void;

export default (name: string, fn: (this: HTMLElement, ...params: AttrFnWrap[]) => Children, options?: Options) => {
	const attrs = options?.attrs ?? [],
	      shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": options?.manualSlot ? "manual" : "named"},
	      element = attrs.length ? class extends HTMLElement {
		#attrs: Map<string, AttrFn>;
		static observedAttributes = attrs;
		constructor() {
			super();
			this.#attrs = new Map();
			const params: AttrFnWrap[] = [];
			for (const param of attrs) {
				params.push((fn: AttrFn) => this.#attrs.set(param, fn));
			}
			amendNode(this.attachShadow(shadowOptions), fn.call(this, ...params));
		}
		attributeChangedCallback(name: string, oldValue: string, newValue: string) {
			this.#attrs.get(name)?.(newValue, oldValue);
		}
	      } : class extends HTMLElement {
		constructor() {
			super();
			amendNode(this.attachShadow(shadowOptions), fn.call(this));
		}
	      }
	customElements.define(name, element);
	return bindElement<Element>(ns, name);
};
