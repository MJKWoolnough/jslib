import type {Children, Props} from './dom.js';
import {amendNode, clearNode, bindElement} from './dom.js';
import {a as aHTML, ns} from './html.js';

const update = Symbol("update"),
      newState = Symbol("newState"),
      aHandler = function(this: HTMLAnchorElement, e: Event) {
	const href = this.getAttribute("href");
	if (href) {
		lastState = history.state;
		const url = new URL(href, window.location + "");
		if (url.host !== window.location.host) {
			return;
		}
		history.pushState(Date.now(), "", new URL(href, url + "") + "")
	}
	e.preventDefault();
      },
      routers = new Set<Router>();

let lastState = 0;

amendNode(window, {"onpopstate": () => {
	for (const r of routers) {
		r[newState]();
	}
}});

class Router extends HTMLElement {
	#s: ShadowRoot;
	#current?: Route;
	#history = new Map<number, Node[]>();
	constructor() {
		super();
		this.#s = this.attachShadow({"mode": "closed", "slotAssignment": "manual"});
	}
	[newState]() {
		this.#history.set(lastState, Array.from(this.#s.childNodes));
		const h = this.#history.get(history.state ?? 0);
		if (h) {
			clearNode(this.#s, h);
		} else {
			const c = this.#getRoute();
			if (c) {
				clearNode(this.#s, (this.#current = c).content.cloneNode());
			}
		}
	}
	#getRoute() {
		const url = window.location.pathname;
		for (const c of this.children) {
			if (c instanceof Route) {
				const prefix = c.getAttribute("prefix"); // will probably end up with something more complicated that just URL prefix
				if (prefix && url.startsWith(prefix))  {
					return c;
				}
			}
		}
		return null;
	}
	[update]() {
		const c = this.#getRoute();
		if (c && this.#current !== c) {
			clearNode(this.#s, (this.#current = c).content.cloneNode());
		}
	}
	handleEvent() {}
	connectedCallback() {
		let n: Node | Document = this;
		while (n) {
			if (n instanceof ShadowRoot) {
				n = n.host;
			} else if (!n.parentNode || n instanceof Route || n instanceof Router) {
				return;
			} else {
				n = n.parentNode;
			}
		}
		routers.add(this);
	}
	disconnectedCallback() {
		routers.delete(this);
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
