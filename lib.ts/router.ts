type NodeFn = (attrs: Record<string, string>) => Exclude<Element, Router>;

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
      regexpChars = ['[', ']', '(', ')', '\\'],
      escapeRegexp = (data: string) => {
	for (const c of regexpChars) {
		data = data.replaceAll(c, "\\" + c);
	}
	return data;
      },
      createMatch = (match: string) => {
	const u = new URL(match, window.location.protocol + window.location.host),
	      matches: string[] = [];
	let path = u.pathname,
	    r = match.startsWith("/") ? "^" : "";
	for (let c = path.indexOf(':'); c >= 0; c = path.indexOf(':')) {
		r += escapeRegexp(path.slice(0, c)) + "([^/]*)";
		path = path.slice(c);
		const s = path.indexOf('/'),
		      t = s < 0 ? path.length : s;
		matches.push(path.slice(1, t));
		path = path.slice(t);
	}
	r += path;
	return {
		"path": new RegExp(r),
		matches,
		"params": u.searchParams,
		"hash": u.hash
	}
      };

let lastState = Date.now();

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
	#match(match: Match, nodeFn: NodeFn, url: LocationURL = window.location) {
		const attrs: Record<string, string> = {},
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
			this.#marker.replaceWith(this.#marker = nodeFn(attrs));
			return this.#connected = true;
		}
		return false;
	}
	#setRoute(path?: LocationURL) {
		for (const c of this.#matchers) {
			if (this.#match(c[0], c[1], path)) {
				return true;
			}
		}
		return false;
	}
	register(match: string, nodeFn: NodeFn) {
		const matchObj = createMatch(match);
		this.#matchers.push([matchObj, nodeFn]);
		if (!this.#connected) {
			this.#match(matchObj, nodeFn);
		}
		return this;
	}
	[newState](path: LocationURL, state: number) {
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
			if (!(c instanceof Router)) {
				const match = c.getAttribute("route-match");
				if (match !== null) {
					const element = c.cloneNode(true) as Element;
					element.removeAttribute("route-match");
					this.register(match, (attrs: Record<string, string>) => {
						const node = element.cloneNode(true) as Element;
						for (const attr in attrs) {
							node.setAttribute(attr, attrs[attr]);
						}
						return node;
					});
				}
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
		this.#setRoute(window.location);
		this[update]();
	}
	remove() {
		this.#marker.remove();
		routers.delete(this);
	}
}

customElements.define("x-router", Router);

export const router = () => new Router(),
goto = (href: string) => {
	const url = new URL(href, window.location + "");
	let handled = false;
	if (url.host === window.location.host) {
		const now = Date.now();
		for (const r of routers) {
			if (r[newState](url, now)) {
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
