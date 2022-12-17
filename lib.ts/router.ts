type NodeFn = (attrs: Record<string, ToString>) => Exclude<Element, Router>;

type Match = {
	path: RegExp;
	matches: string[];
	params: URLSearchParams;
	hash: string;
};

type MatchNode = [Match, NodeFn];

type LocationURL = {
	pathname: string;
	search: string;
	searchParams?: URLSearchParams;
	hash: string;
};

interface ToString {
	toString(): string;
}

type Swapper = (current: ChildNode, next: ChildNode) => void;

const update = Symbol("update"),
      newState = Symbol("newState"),
      routers = new Set<Router>(),
      mo = new MutationObserver(records => {
	for (const record of records) {
		if (record.type === "childList" && record.target instanceof Router && record.addedNodes.length) {
			record.target[update]();
		}
	}
      }),
      defaultSwapper = (current: ChildNode, next: ChildNode) => current.replaceWith(next),
      swappers = new Map<string, Swapper>([["", defaultSwapper]]);

let lastState = Date.now();

history.replaceState(lastState, "");

window.addEventListener("click", (e: Event) => {
	let target = e.target as Element | null;
	while (target && !(target instanceof HTMLAnchorElement || target instanceof HTMLAreaElement || target instanceof SVGAElement)) {
		target = target.parentNode as Element;
	}
	const href = target?.getAttribute("href");
	if (href && goto(href)) {
		e.preventDefault();
	}
});
window.addEventListener("popstate", () => {
	for (const r of routers) {
		r[newState](window.location, history.state);
	}
	lastState = history.state;
});

class Router extends HTMLElement {
	#marker: ChildNode = new Text();
	#connected = false;
	#history = new Map<number, ChildNode>();
	#matchers: MatchNode[] = [];
	#swapper?: Swapper;
	constructor() {
		super();
		mo.observe(this, {"childList": true});
	}
	#clear() {
		this.#connected = false;
		this.#marker.replaceWith(this.#marker = new Text());
	}
	#match(match: Match, nodeFn: NodeFn, url: LocationURL = window.location, defaultAttrs?: Record<string, ToString>) {
		const attrs: Record<string, ToString> = {},
		      params = url.searchParams ?? new URLSearchParams(url.search),
		      matches = url.pathname.match(match.path);
		if (!matches) {
			return false;
		}
		matches.shift();
		for (const attr of match.matches) {
			attrs[attr] = matches.shift()!;
		}
		for (const [param, value] of match.params) {
			const p = params.get(param);
			if (value.charAt(0) === ':') {
				if (p) {
					attrs[value.slice(1)] = p;
				}
			} else if (p !== value) {
				return false;
			}
		}
		if (url.hash === match.hash) {
			this.#setNode(nodeFn(defaultAttrs ? Object.assign(attrs, defaultAttrs) : attrs));
			return this.#connected = true;
		}
		return false;
	}
	#setNode(n: ChildNode) {
		(this.#swapper ?? swappers.get(this.getAttribute("router-transition") ?? "") ?? defaultSwapper)(this.#marker, this.#marker = n);
	}
	#setRoute(path?: LocationURL, attrs?: Record<string, ToString>) {
		for (const c of this.#matchers) {
			if (this.#match(c[0], c[1], path, attrs)) {
				return true;
			}
		}
		return false;
	}
	add(match: string, nodeFn: NodeFn) {
		const u = new URL(match, window.location.href),
		      matches: string[] = [],
		      matchObj = {
			matches,
			"params": u.searchParams,
			"hash": u.hash
		      } as Match;
		let path = u.pathname,
		    r = match.startsWith("/") ? "^" : "";
		for (let c = path.indexOf(':'); c >= 0; c = path.indexOf(':')) {
			r += path.slice(0, c).replace(/[[\]()$*+.]/g, "\\$&") + "([^/]+)";
			path = path.slice(c);
			const s = path.indexOf('/'),
			      t = s < 0 ? path.length : s;
			matches.push(path.slice(1, t));
			path = path.slice(t);
		}
		matchObj.path = new RegExp(r + path + (path.endsWith("/") ? "" : "$"));
		this.#matchers.push([matchObj, nodeFn]);
		if (!this.#connected) {
			this.#match(matchObj, nodeFn);
		}
		return this;
	}
	setTransition(s: Swapper) {
		this.#swapper = s;
		return this;
	}
	[newState](path: LocationURL, state: number, attrs?: Record<string, ToString>) {
		if (this.#marker.isConnected) {
			const h = this.#history.get(state ?? 0);
			this.#history.set(lastState, this.#marker);
			if (h) {
				this.#setNode(h);
				return true;
			} else if (this.#setRoute(path, attrs)) {
				return true;
			}
			this.#clear();
		}
		return false;
	}
	[update]() {
		if (this.#marker.isConnected) {
			for (const c of this.children) {
				if (!(c instanceof Router)) {
					const match = c.getAttribute("route-match");
					if (match !== null) {
						const element = c.cloneNode(true) as Element;
						element.removeAttribute("route-match");
						this.add(match, (attrs: Record<string, ToString>) => {
							const node = element.cloneNode(true) as Element;
							for (const attr in attrs) {
								node.setAttribute(attr, attrs[attr] as string);
							}
							return node;
						});
					}
				}
			}
			this.replaceChildren();
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
		this.#clear();
		this.replaceWith(this.#marker);
		this.#setRoute(window.location);
		this[update]();
	}
	remove() {
		this.#marker.remove();
		routers.delete(this);
	}
}


customElements.define("x-router", Router);
customElements.define("x-route", class extends HTMLElement {
	connectedCallback() {
		const c = this.getAttribute("class"),
		      i = this.getAttribute("id"),
		      t = this.getAttribute("title");
		if (c) {
			document.documentElement.classList.toggle(c, true);
		}
		if (i) {
			document.documentElement.setAttribute("id", i);
		}
		if (t) {
			document.title = t;
		}
	}
	disconnectedCallback() {
		const c = this.getAttribute("class");
		if (c) {
			document.documentElement.classList.toggle(c, false);
		}
		if (document.documentElement.getAttribute("id") === this.getAttribute("id")) {
			document.documentElement.removeAttribute("id");
		}
	}
});

export const router = () => new Router(),
goto = (window as any).goto = (href: string, attrs?: Record<string, ToString>) => {
	const url = new URL(href, window.location + "");
	let handled = false;
	if (url.host === window.location.host) {
		const now = Date.now();
		for (const r of routers) {
			if (r[newState](url, now, attrs)) {
				handled = true;
			}
		}
		lastState = now;
		if (handled) {
			history.pushState(now, "", new URL(href, url + "") + "");
		}
	}
	return handled;
},
registerTransition = (name: string, s: Swapper) => {
	if (swappers.has(name)) {
		return false;
	}
	swappers.set(name, s);
	return true;
};
