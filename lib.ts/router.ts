import type {Children, Props} from './dom.js';
import {amendNode, bindElement} from './dom.js';
import {a as aHTML, ns, slot} from './html.js';

const update = Symbol("update"),
      aHandler = function(this: HTMLAnchorElement, e: Event) {
	e.preventDefault();
      };

class Router extends HTMLElement {
	#s: HTMLSlotElement;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), this.#s = slot());
	}
	[update]() {
		this.#s.assign();
	}
}

class Route extends HTMLTemplateElement {
	connectedCallback() {
		if (this.parentNode instanceof Router) {
			this.parentNode[update]();
		}
	}
	disconnectedCallback() { this.connectedCallback(); }
}

class RouterA extends HTMLAnchorElement {
	constructor() {
		super();
		amendNode(this, {"onclick": aHandler});
	}
}

customElements.define("router-router", Router);
customElements.define("router-route", Route);
customElements.define("router-a", RouterA);

export const router = bindElement(ns, "router-router"),
route = bindElement(ns, "router-route"),
a = (props?: Props, children?: Children) => amendNode(aHTML({"onclick": aHandler}), props, children);
