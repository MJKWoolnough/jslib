import type {Children, Props} from './dom.js';
import {amendNode, bindElement, event, eventRemove} from './dom.js';
import {a as aHTML, ns, slot} from './html.js';

const update = Symbol("update"),
      aHandler = function(this: HTMLAnchorElement, e: Event) {
	const href = this.getAttribute("href");
	if (href) {
		history.pushState(Date.now(), "", new URL(href, window.location + "") + "")
	}
	e.preventDefault();
      };

class Router extends HTMLElement {
	#s: HTMLSlotElement;
	#current?: Route;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), this.#s = slot());
	}
	[update]() {
		const url = window.location.pathname;
		for (const c of this.children) {
			if (c instanceof Route) {
				const prefix = c.getAttribute("prefix"); // will probably end up with something more complicated that just URL prefix
				if (prefix && url.startsWith(prefix))  {
					if (this.#current !== c) {
						this.#s.assign(this.#current = c);
					}
					return;
				}
			}
		}
	}
	handleEvent() {}
	connectedCallback() {
		amendNode(window, {"onpopstate": this});
	}
	disconnectedCallback() {
		amendNode(window, {"onpopstate": event(this, eventRemove)});
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
