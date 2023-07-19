/**
 * The router module allows for easy use of the {@link https://developer.mozilla.org/en-US/docs/Web/API/History | History} API, updating the page according to the rules given to the router.
 *
 * @module router
 */
/** */

/**
 * This Function is used to create content based on the attributes given.
 */
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

/** A Swapper Function swaps to nodes in the DOM, with a possible transition effect. */
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

/**
 * This class is registered as the `x-router` tag, and should be created with the {@link router} Function.
 */
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
	get count() {
		return this.#matchers.length;
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
			if (value.charAt(0) === ':' && value.length > 1) {
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
	/**
	 * This method adds routes to a Router, specifying both a path to be matched and the function that is used to generate the HTML for that route. Note that the nodeFn can be a {@link dom:DOMBind | DOMBind} function.
	 *
	 * The match string can consist of three parts, the path, the query, and the fragment; like an ordinary URL, but without the origin (scheme, user info, host, and port).
	 *
	 * Both the path and query sections of the match string can contain variable bindings, which are attribute names, prepended with a ':'. For the path section, the binding can be anywhere in the string and the attribute name will end with either a '/' or the end of the string. For the query section bindings, the value of a parameter must start with ':' and the rest of the value will be the attribute name. The 'attrs' object will contain these bindings with the key set to the name of the binding and the value set to the value passed, if any.
	 *
	 * For the path, if it starts with '/' then the match path will parsed as absolute, and when not starting with a '/' the match path can start anywhere after a '/' in the actual path. If the match path ends with '/', then the match path will be parsed as a prefix, whereas with no following '/', the match path will accept nothing beyond the end of it.
	 *
	 * For the query, any non-binding params must match the URL param values for the route to match. Bound params are considered optional.
	 *
	 * For the fragment, if the match string has one then it must match the URL fragment exactly. If the match string does not have one, the fragment will not be checked.
	 *
	 * Some examples:
	 *
	 * |  URL  |  Match  |  Success  |  Params  |
	 * |-------|---------|-----------|----------|
	 * | /a    | /a<br>/b<br>a | true<br>false<br>true | |
	 * | /a-112 | /a<br>/a-112<br>/a-:id | false<br>true<br>true | <br><br>id = 112 |
	 * | /search?mode=list&id=123&q=keyword | /no-search?mode=list<br>/search?mode=list<br>/search?id=:id&mode=list<br>/search?q=:query&mode=list&id=:id | false<br>true<br>true<br>true | <br><br>id = 123<br>id = 123 & query=keyword |
	 * | /some-page#content | /some-page<br>/some-page#otherContent<br>/some-page#content | true<br>false<br>true |  |
	 *
	 * @param {string} match The string to match against.
	 * @param {NodeFn} nodeFn The Function used to create the contents based on the URL.
	 *
	 * @return {Router} Returns `this` for easy chaining.
	 */
	add(match: string, nodeFn: NodeFn): this {
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
		if (!this.#connected  && this.#marker.isConnected) {
			this.#match(matchObj, nodeFn);
		}
		return this;
	}
	/**
	 * The method is used to set the routers transition method. By default the router simply swaps the nodes, but this method allows for other effects and animations.
	 *
	 * @param {Swapper} s A function that will swap nodes, with a possible animated transition. For the passed function, it is expected that the `next` node will replace the `current` node in the document immediately.
	 *
	 * @return {Router} Returns `this` for easy chaining.
	 */
	setTransition(s: Swapper): this {
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
	/** Used to remove the Router from the DOM and disable its routing. It can be added to the DOM later to reactivate it. */
	remove() {
		this.#marker.remove();
		routers.delete(this);
	}
}


customElements.define("x-router", Router);
customElements.define("x-route", class extends HTMLElement {
	#class?: string;
	#id?: string;
	#title?: string;
	connectedCallback() {
		const c = this.#class ??= this.getAttribute("route-class") ?? "",
		      i = this.#id ??= this.getAttribute("route-id") ?? "",
		      t = this.#title ??= this.getAttribute("route-title") ?? "";
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
		const c = this.#class;
		if (c) {
			document.documentElement.classList.toggle(c, false);
		}
		if (this.#id && document.documentElement.getAttribute("id") === this.#id) {
			document.documentElement.removeAttribute("id");
		}
	}
});

export const
/**
 * The `router` function creates a new router, which should be added to the DOM in the place that you wish the matched routes to be placed.
 *
 * In addition to being able to be used from javascript, the Router can be added directly with HTML using the `x-router` tag. When used in this way, routes can be added by adding children to the Router with the `route-match` attribute set to the matching route, as per the {@link Router/add | add} method.
 *
 * The `x-router` can take a `router-transition` attribute, the name of which can be set to a name/function combo that is registered with the {@link registerTransition} function to allow an animated transition between routes.
 *
 * For example, the following creates two path routes and a catch-all route:
 *
 * ```html
 * <x-router>
 *	<div route-match="/a">Route A</a>
 *	<div route-match="/b"><span>Route B</span></a>
 *	<div route-match="">404</a>
 * </x-router>
 * ```
 *
 * In addition to the `x-router` tag, there is also the `x-route` tag which can be used in HTML to set `route-title`, `route-class`, and `route-id` attributes which, when the route is selected, are set as the window title, html class, and html ID, respectively. An example is the following:
 *
 * ```html
 * <x-router>
 *	<x-route route-title="Route A" route-id="route_a" route-class="dark" route-match="/a">Route A</x-route>
 *	<x-route route-title="Route B" route-class="light" route-match="/b"><span>Route B</span></x-route>
 *	<x-route route-title="Unknown Route" route-match="">404</x-route>
 * </x-router>
 * ```
 *
 * When the first route is matched, the title of the document will be set to "Route A", the class of the root `html` element will be set to "dark", and the ID of the root `html` element will be set to "route_a". Likewise, when the second route is matched, the title of the document will be set to "Route B", and the class will be set to "light". Lastly, the catch-all third route will just set the document title to "Unknown Route".
 *
 * When a route is unmatched, any class and ID set is removed.
 *
 * NB: It is recommended to either set the style attribute on all x-router elements to "display: none", or to add the following to CSS on the page:
 * ```css
 * x-router {
 * 	display: none;
 * }
 * ```
 *
 * This will hide the flash of elements that will appear of the page before the x-router element is registered.
 *
 * @return {Router}
 */
router = () => new Router(),
/**
 * This function will update all routers to the provided `href` location, overriding any resolved attributes from the URL with those specified in the `attrs` object.
 *
 * This function may be called directly from HTML event handlers, as it is granted global scope in the page.
 *
 * @param {string} href                      The new location to 'go to'.
 * @param {Record<string, ToString>} [attrs] Attributes to add/override ones derived from the URL.
 *
 * @return {boolean} Will return `true` if any Router has a route that matches the location, and `false` otherwise.
 */
goto = (window as any).goto = (href: string, attrs?: Record<string, ToString>): boolean => {
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
			history.pushState(now, "", new URL(href, url));
		}
	}
	return handled;
},
/**
 * This function will register a transition function with the specified name, allowing for transition effects and animation. This function will return true on a successful registration, and false if it fails, which will most likely be because of a name collision.
 *
 * @param {string} name A unique name for the transition.
 * @param {Swapper} s   A function that will swap nodes, with a possible animated transition. For the passed function, it is expected that the `next` node will replace the `current` node in the document immediately.
 *
 * @return {boolean} Will return `true` on a successful registration, and false otherwise.
 */
registerTransition = (name: string, s: Swapper) => {
	if (swappers.has(name)) {
		return false;
	}
	swappers.set(name, s);
	return true;
};
