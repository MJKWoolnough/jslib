import {amendNode, bindElement} from './dom.js';
import {ns} from './html.js';

const update = Symbol("update"),
      newState = Symbol("newState"),
      routers = new Set<Router>(),
      mo = new MutationObserver(records => {
	for (const record of records) {
		if (record.type === "childList" && record.target instanceof Router) {
			record.target[update]();
		}
	}
      });

let lastState = 0;

amendNode(window, {"onclick": (e: Event) => {
	if (e.target instanceof HTMLAnchorElement) {
		const href = e.target.getAttribute("href");
		if (href) {
			lastState = history.state;
			const url = new URL(href, window.location + "");
			if (url.host === window.location.host) {
				const now = Date.now();
				let handled = false;
				for (const r of routers) {
					if (r[newState](url.pathname, now)) {
						handled = true;
					}
				}
				if (handled) {
					history.pushState(now, "", new URL(href, url + "") + "")
					e.preventDefault();
				}
			}
		}
	}
}, "onpopstate": () => {
	for (const r of routers) {
		r[newState](window.location.pathname, history.state);
	}
}});

class Router extends HTMLElement {
	#marker: ChildNode = new Text();
	#current?: Node;
	#history = new Map<number, ChildNode>();
	constructor() {
		super();
		mo.observe(this, {"childList": true});
	}
	#sanity() {
		return !!this.#marker.parentNode;
	}
	#clear() {
		this.#marker.replaceWith(this.#marker = new Text());
	}
	#getRoute(path: string) {
		for (const c of this.children) {
			const prefix = c.getAttribute("router-prefix"); // will probably end up with something more complicated than just URL prefix
			if (prefix != null && path.startsWith(prefix))  {
				return c;
			}
		}
		return null;
	}
	[newState](path: string, state: number) {
		if (!this.#sanity()) {
			return false;
		}
		const h = this.#history.get(state ?? 0);
		this.#history.set(lastState, this.#marker);
		if (h) {
			this.#marker.replaceWith(this.#marker = h);
		} else {
			const c = this.#getRoute(path);
			if (!c) {
				this.#clear();
				return false;
			}
			this.#marker.replaceWith(this.#marker = (this.#current = c).cloneNode(true) as Element);
			return true;
		}
		return false;
	}
	[update]() {
		if (!this.#sanity()) {
			return;
		}
		const c = this.#getRoute(window.location.pathname);
		if (c) {
			if (this.#current !== c) {
				this.#marker.replaceWith(this.#marker = (this.#current = c).cloneNode(true) as Element);
			}
		} else {
			this.#clear();
		}
	}
	connectedCallback() {
		let n = this.parentNode;
		while (n) {
			if (n === document) {
				break;
			} else if (n instanceof ShadowRoot) {
				n = n.host;
			} else if (!n.parentNode || n instanceof Router) {
				return;
			} else {
				n = n.parentNode;
			}
		}
		routers.add(this);
		this.replaceWith(this.#marker);
		this[update]();
	}
	remove() {
		this.#marker.remove();
		routers.delete(this);
	}
}

customElements.define("router-router", Router);

export const router = bindElement(ns, "router-router");
