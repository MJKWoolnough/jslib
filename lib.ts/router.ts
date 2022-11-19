type MatchFn = (path: string) => boolean;

type NodeFn = () => Element | Text;

type MatchNode = [MatchFn, NodeFn];

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

let lastState = Date.now();

window.addEventListener("click", (e: Event) => {
	if (e.target instanceof HTMLAnchorElement) {
		const href = e.target.getAttribute("href");
		if (href) {
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
				lastState = now;
			}
		}
	}
});
window.addEventListener("popstate", () => {
	for (const r of routers) {
		r[newState](window.location.pathname, history.state);
	}
});

class Router extends HTMLElement {
	#marker: ChildNode = new Text();
	#connected = false;
	#history = new Map<number, ChildNode>();
	#matchers: MatchNode[] = [];
	constructor() {
		super();
		mo.observe(this, {"childList": true});
	}
	#sanity() {
		return !!this.#marker.parentNode;
	}
	#clear() {
		this.#connected = false;
		this.#marker.replaceWith(this.#marker = new Text());
	}
	#setRoute(path: string) {
		for (const c of this.#matchers) {
			if (c[0](path)) {
				this.#marker.replaceWith(this.#marker = c[1]());
				return this.#connected = true;
			}
		}
		return false;
	}
	register(matchFn: MatchFn, nodeFn: NodeFn) {
		this.#matchers.push([matchFn, nodeFn]);
		if (!this.#connected && matchFn(window.location.pathname)) {
			this.#marker.replaceWith(this.#marker = nodeFn());
			this.#connected = true;
		}
		return this;
	}
	[newState](path: string, state: number) {
		if (this.#sanity()) {
			const h = this.#history.get(state ?? 0);
			this.#history.set(lastState, this.#marker);
			if (h) {
				this.#marker.replaceWith(this.#marker = h);
			} else if (this.#setRoute(path)) {
				return true;
			}
			this.#clear();
		}
		return false;
	}
	[update]() {
		if (!this.#sanity()) {
			return;
		}
		for (const c of this.children) {
			const prefix = c.getAttribute("router-prefix"); // will probably end up with something more complicated than just URL prefix
			if (prefix != null) {
				this.register((path: string) => path.startsWith(prefix), () => c.cloneNode(true) as Element);
			}
		}
		this.replaceChildren();
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
		this.#clear();
		this.replaceWith(this.#marker);
		this.#setRoute(window.location.pathname);
		this[update]();
	}
	remove() {
		this.#marker.remove();
		routers.delete(this);
	}
}

customElements.define("router-router", Router);

export const router = () => new Router();
