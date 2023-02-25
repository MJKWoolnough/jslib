{
	const ILLEGAL_CONSTRUCTOR = "Illegal constructor.";

	class Node extends EventTarget {
		nodeType: number = 0;
		firstChild: ChildNode | null = null;
		lastChild: ChildNode | null = null;
		nextSibling: ChildNode | null = null;
		previousSibling: ChildNode | null = null;
		parentNode: ParentNode | null = null;
		constructor() {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class DOMTokenList {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class HTMLCollection {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class CSSStyleDeclaration {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class NodeList {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class NamedNodeMap {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class Attr extends Node {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class CharacterData extends Node {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class Text extends CharacterData {
	}

	class Document extends Node {
	}

	class DocumentFragment extends Node {
	}

	class ShadowRoot extends DocumentFragment {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class Element extends Node {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class HTMLElement extends Element {
		constructor () {
			if (!init) { // check registry for valid Element type
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class SVGElement extends Element {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class MathMLElement extends Element {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class DOMStringMap {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class Location {
		protocol = "local:";
		hostname = "" ;
		port = "";
		path = "";
		search = "";
		hash = "";
		readonly origin = "null";
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
		get host() {
			if (this.port) {
				return `${this.hostname}:${this.port}`;
			}
			return this.hostname;
		}
		get pathname() {
			return "/" + this.path;
		}
		get href() {
			return this.protocol + "//" + this.host + this.pathname;
		}
		toString() {
			return this.href;
		}
		assign(_url: string | URL) {}
		reload() {}
		replace(_url: string | URL) {}
	}

	class Storage {
		#storage = new Map<string, string>();

		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
		get length() {
			return 0;
		}
		key(index: number) {
			Array.from(this.#storage.keys())[index] ?? null;
		}
		getItem(keyName: string) {
			return this.#storage.get(keyName) ?? null
		}
		setItem(keyName: string, keyValue: string) {
			this.#storage.set(keyName, keyValue);
		}
		removeItem(keyName: string) {
			this.#storage.delete(keyName);
		}
		clear() {
			this.#storage.clear();
		}
	}

	class Window extends EventTarget {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class WebSocket extends EventTarget {
	}

	class XMLHttpRequestEventTarget extends EventTarget {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class XMLHttpRequest extends XMLHttpRequestEventTarget {
	}

	class XMLHttpRequestUpload extends XMLHttpRequestEventTarget {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class CustomEvent extends Event {
	}

	class UIEvent extends Event {
	}

	class MouseEvent extends UIEvent {
	}

	class KeyboardEvent extends UIEvent {
	}

	class PopStateEvent extends Event {
	}

	class StyleSheet {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class CSSStyleSheet extends StyleSheet {
	}



	class MutationObserver {
	}

	class MutationEvent extends Event {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super("MutationEvent");
		}
	}

	class MutationRecord {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class History {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class CustomElementRegistry {
		static #nameRE = /^[a-z][-.0-9_a-z\xB7\#xC0-\xD6\xD8-\xF6\xF8-\x37D\x37F-\x1FFF\x200C-\x200D\x203F-\x2040\x2070-\x218F\x2C00-\x2FEF\x3001-\xD7FF\xF900-\xFDCF\xFDF0-\xFFFD\x10000-\xEFFFF]*-[-.0-9_a-z\xB7\#xC0-\xD6\xD8-\xF6\xF8-\x37D\x37F-\x1FFF\x200C-\x200D\x203F-\x2040\x2070-\x218F\x2C00-\x2FEF\x3001-\xD7FF\xF900-\xFDCF\xFDF0-\xFFFD\x10000-\xEFFFF]$/;
		static #invalidNames = ["nnotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph"];
		#elements: Map<string, CustomElementConstructor>;
		#customElements = new Map<string, CustomElementConstructor>();
		#constructors = new Map<CustomElementConstructor, string>();
		#promises = new Map<string, [Promise<void>, Function]>();
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			this.#elements = new Map();
			// define standard elements
		}
		define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
			if (!CustomElementRegistry.#nameRE.test(name) || CustomElementRegistry.#invalidNames.includes(name)) {
				throw new SyntaxError(`'${JSON.stringify(name)}' is not a valid custom element name`);
			}
			if (!(constructor instanceof Function)) {
				throw new TypeError("CustomElementRegistry.define: Argument 2 is not a constructor.");
			}
			if (this.#customElements.has(name)) {
				throw new Error(`CustomElementRegistry.define: '${JSON.stringify(name)}' has already been defined as a custom element`);
			}
			if (this.#constructors.has(constructor)) {
				throw new Error(`CustomElementRegistry.define: '${JSON.stringify(name)}' and '${JSON.stringify(this.#constructors.get(constructor))}' have the same constructor`);
			}
			if (options?.extends) {
				if (CustomElementRegistry.#nameRE.test(options.extends)) {
					throw new Error(`CustomElementRegistry.define: '${JSON.stringify(name)}' cannot extend a custom element`);
				} else if (!this.#elements.has(options.extends)) {
					throw new Error("Operation is not supported");
				}
			}
			// handle extends?
			this.#customElements.set(name, constructor);
			this.#constructors.set(constructor, name);
			this.#promises.get(name)?.[1]();
			this.#promises.delete(name);
		}
		get(name: string) {
			return this.#customElements.get(name);
		}
		upgrade(_root: Node) {
			// not implemented
		}
		whenDefined(name: string) {
			const p = this.#promises.get(name);
			if (p) {
				return p;
			}
			if (this.#customElements.has(name)) {
				return Promise.resolve();
			}
			let fn!: Function;
			const np = new Promise<void>(sFn => fn = sFn);
			this.#promises.set(name, [np, fn]);
			return np;
		}
	}

	class NodeFilter {
		static readonly SHOW_ALL = 4294967295;
		static readonly SHOW_ELEMENT = 1;
		static readonly SHOW_ATTRIBUTE = 2;
		static readonly SHOW_TEXT = 4;
		static readonly SHOW_CDATA_SECTION = 8;
		static readonly SHOW_ENTITY_REFERENCE = 16;
		static readonly SHOW_ENTITY = 32;
		static readonly SHOW_PROCESSING_INSTRUCTION = 64;
		static readonly SHOW_COMMENT = 128;
		static readonly SHOW_DOCUMENT = 256;
		static readonly SHOW_DOCUMENT_TYPE = 512;
		static readonly SHOW_DOCUMENT_FRAGMENT = 1024;
		static readonly SHOW_NOTATION = 2048

		static readonly FILTER_ACCEPT = 1;
		static readonly FILTER_REJECT = 2;
		static readonly FILTER_SKIP = 3;
	}


	class NodeIterator {
		#root: Node;
		#whatToShow: number;
		#filter: ((node: Node) => number) | { acceptNode(node: Node): number; } | null;
		#referenceNode: Node;
		#pointerBeforeReferenceNode = true;
		#active = false;
		constructor (root: Node, whatToShow = NodeFilter.SHOW_ALL, filter: ((node: Node) => number) | { acceptNode(node: Node): number; } | null = null) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			this.#root = this.#referenceNode  = root;
			this.#whatToShow = whatToShow;
			this.#filter = filter;
		}
		get root() {
			return this.#root;
		}
		get whatToShow() {
			return this.#whatToShow;
		}
		get filter() {
			return this.#filter;
		}
		get referenceNode() {
			return this.#referenceNode;
		}
		get pointerBeforeReferenceNode() {
			return this.#pointerBeforeReferenceNode;
		}
		detach() {}
		#runFilter(n: Node) {
			if (this.#active) {
				throw new Error("InvalidStateError");
			}
			if ((this.#whatToShow & n.nodeType) === 0) {
				return NodeFilter.FILTER_SKIP;
			}
			if (this.#filter === null) {
				return NodeFilter.FILTER_ACCEPT;
			}
			this.#active = true;
			let result: number;
			try {
				result = this.#filter instanceof Function ? this.#filter(n) : this.#filter.acceptNode(n);
			} catch (e) {
				this.#active = false;
				throw e;
			}
			this.#active = false;
			return result;
		}
		#next(forwards: boolean) {
			let node = this.#referenceNode,
			    beforeNode = this.#pointerBeforeReferenceNode;
			while (true) {
				if (forwards) {
					if (beforeNode) {
						beforeNode = false;
					} else if (node.firstChild) {
						node = node.firstChild;
					} else {
						while (!node.nextSibling && node !== this.#root && node.parentNode) {
							node = node.parentNode;
						}
						if (node === this.#root || !node.parentNode) {
							return null;
						}
						node = node.nextSibling!;
					}
				} else {
					if (!beforeNode) {
						beforeNode = true;
					} else if (node.previousSibling) {
						node = node.previousSibling;
						while (node.lastChild) {
							node = node.lastChild;
						}
					} else {
						while (!node.previousSibling && node !== this.#root && node.parentNode) {
							node = node.parentNode;
						}
						if (node === this.#root || !node.parentNode) {
							return null;
						}
						node = node.previousSibling!;
						while (node.lastChild) {
							node = node.lastChild;
						}
					}
				}
				if (this.#runFilter(this.#referenceNode) === NodeFilter.FILTER_ACCEPT) {
					break;
				}
			}
			this.#referenceNode = node;
			this.#pointerBeforeReferenceNode = beforeNode;
			return this.#referenceNode;
		}
		previousNode() {
			this.#next(false);
		}
		nextNode() {
			this.#next(true);
		}
	}

	let init = true;

	for (const [name, val] of [
		["Node", Node],
		["DOMTokenList", DOMTokenList],
		["HTMLCollection", HTMLCollection],
		["CSSStyleDeclaration", CSSStyleDeclaration],
		["NodeList", NodeList],
		["NamedNodeMap", NamedNodeMap],
		["Attr", Attr],
		["CharacterData", CharacterData],
		["Text", Text],
		["Document", Document],
		["HTMLDocument", Document],
		["DocumentFragment", DocumentFragment],
		["ShadowRoot", ShadowRoot],
		["Element", Element],
		["HTMLElement", HTMLElement],
		["SVGElement", SVGElement],
		["MathMLElement", MathMLElement],
		["DOMStringMap", DOMStringMap],
		["Location", Location],
		["Storage", Storage],
		["Window", Window],
		["WebSocket", WebSocket],
		["XMLHttpRequestEventTarget", XMLHttpRequestEventTarget],
		["XMLHttpRequest", XMLHttpRequest],
		["XMLHttpRequestUpload", XMLHttpRequestUpload],
		["CustomEvent", CustomEvent],
		["UIEvent", UIEvent],
		["MouseEvent", MouseEvent],
		["KeyboardEvent", KeyboardEvent],
		["PopStateEvent", PopStateEvent],
		["StyleSheet", StyleSheet],
		["CSSStyleSheet", CSSStyleSheet],
		["MutationObserver", MutationObserver],
		["MutationEvent", MutationEvent],
		["MutationRecord", MutationRecord],
		["History", History],
		["CustomElementRegistry", CustomElementRegistry],
		["NodeFilter", NodeFilter],
		["NodeIterator", NodeIterator],
		["customElements", new CustomElementRegistry()],
		["document", new Document()],
		["history", new History()],
		["window", new Window()],
	]) {
		Object.assign(globalThis, name, val);
	}

	init = false;
}
