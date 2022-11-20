type MatchFn = (path: string) => boolean;

type NodeFn = () => Element | Text;

type MatchNode = [MatchFn, NodeFn];

const update = Symbol("update"),
      newState = Symbol("newState"),
      routers = new Set<Router>(),
      mo = new MutationObserver(records => {
	for (const record of records) {
		if (record.type === "childList" && record.target instanceof Router && record.addedNodes.length) {
			record.target[update]();
		}
	}
      });

let lastState = Date.now();

window.addEventListener("click", (e: Event) => {
	if (e.target instanceof HTMLAnchorElement) {
		const href = e.target.getAttribute("href");
		if (href && goto(href)) {
			e.preventDefault();
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
		return this.#marker.isConnected;
	}
	#clear() {
		this.#connected = false;
		this.#marker.replaceWith(this.#marker = new Text());
	}
	#match(matchFn: MatchFn, nodeFn: NodeFn, path = window.location.pathname) {
		if (matchFn(path)) {
			this.#marker.replaceWith(this.#marker = nodeFn());
			return this.#connected = true;
		}
		return false;
	}
	#setRoute(path?: string) {
		for (const c of this.#matchers) {
			if (this.#match(c[0], c[1], path)) {
				return true;
			}
		}
		return false;
	}
	register(matchFn: MatchFn, nodeFn: NodeFn) {
		this.#matchers.push([matchFn, nodeFn]);
		if (!this.#connected) {
			this.#match(matchFn, nodeFn);
		}
		return this;
	}
	[newState](path: string, state: number) {
		if (this.#sanity()) {
			const h = this.#history.get(state ?? 0);
			this.#history.set(lastState, this.#marker);
			if (h) {
				this.#marker.replaceWith(this.#marker = h);
				return true;
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
			const prefix = c.getAttribute("route-match");
			if (prefix !== null) {
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

export const router = () => new Router(),
goto = (href: string) => {
	const url = new URL(href, window.location + "");
	let handled = false;
	if (url.host === window.location.host) {
		const now = Date.now();
		for (const r of routers) {
			if (r[newState](url.pathname, now)) {
				handled = true;
			}
		}
		lastState = now;
		if (handled) {
			history.pushState(now, "", new URL(href, url + "") + "")
		}
	}
	return handled;
};
