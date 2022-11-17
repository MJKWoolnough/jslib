import type {Children, Props} from './dom.js';
import {amendNode, createDocumentFragment, bindElement} from './dom.js';
import {a as aHTML, ns} from './html.js';

const update = Symbol("update"),
      newState = Symbol("newState"),
      aHandler = function(this: HTMLAnchorElement, e: Event) {
	const href = this.getAttribute("href");
	if (href) {
		lastState = history.state;
		const url = new URL(href, window.location + "");
		if (url.host === window.location.host) {
			history.pushState(Date.now(), "", new URL(href, url + "") + "")
			e.preventDefault();
		}
	}
      },
      routers = new Set<Router>();

let lastState = 0;

amendNode(window, {"onpopstate": () => {
	for (const r of routers) {
		r[newState]();
	}
}});

class Router extends HTMLElement {
	#start = new Text();
	#end = new Text();
	#current?: Route;
	#history = new Map<number, Node[]>();
	#sanity() {
		return this.#start.parentNode && this.#start.parentNode !== this.#end.parentNode;
	}
	#clear() {
		while (this.#start.nextSibling !== this.#end && this.#start.nextSibling) {
			this.#start.nextSibling?.remove();
		}
		if (this.#start.nextSibling !== this.#end) {
			this.#start.after(this.#end);
		}
	}
	#getRoute() {
		const url = window.location.pathname;
		for (const c of this.children) {
			if (c instanceof Route) {
				const prefix = c.getAttribute("prefix"); // will probably end up with something more complicated than just URL prefix
				if (prefix && url.startsWith(prefix))  {
					return c;
				}
			}
		}
		return null;
	}
	[newState]() {
		if (!this.#sanity()) {
			return;
		}
		const children: Node[] = [],
		      h = this.#history.get(history.state ?? 0);
		for (let curr = this.#start.nextSibling; curr !== this.#end && curr; curr = curr.nextSibling) {
			children.push(curr);
		}
		this.#history.set(lastState, children);
		this.#clear();
		if (h) {
			this.#start.after(createDocumentFragment(h));
		} else {
			const c = this.#getRoute();
			if (c) {
				this.#start.after((this.#current = c).content.cloneNode());
			}
		}
	}
	[update]() {
		if (!this.#sanity()) {
			return;
		}
		const c = this.#getRoute();
		if (c) {
			if (this.#current !== c) {
				this.#clear();
				this.#start.after((this.#current = c).content.cloneNode());
			}
		} else {
			this.#clear();
		}
	}
	connectedCallback() {
		let n: Node | Document = this;
		while (n) {
			if (n instanceof ShadowRoot) {
				n = n.host;
			} else if (!n.parentNode || n instanceof Route) {
				return;
			} else {
				n = n.parentNode;
			}
		}
		routers.add(this);
		this.before(this.#start);
		this.after(this.#end);
		this.remove();
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
