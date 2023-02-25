{
	interface PreRemover {
		[preRemove](node: Node): void;
	}

	const ILLEGAL_CONSTRUCTOR = "Illegal constructor.",
	      preRemove = Symbol("preRemove"),
	      realTarget = Symbol("realTarget"),
	      pIFn = <T>(name: PropertyKey, fn: (index: number) => T): T | undefined => {
		if (typeof name === "number") {
			return fn(name);
		} else if (typeof name === "string") {
			const index = parseInt(name);
			if (index.toString() === name) {
				return fn(index);
			}
		}
		return undefined;
	      },
	      nodeListProxyObj = {
		has: <T extends Node>(target: NodeList<T>, name: PropertyKey) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
		get: <T extends Node>(target: NodeList<T>, name: PropertyKey) => pIFn(name, index => target.item(index)) || (target as any)[name],
	      };

	class Node extends EventTarget {
		static readonly ELEMENT_NODE = 1;
		static readonly ATTRIBUTE_NODE = 2;
		static readonly TEXT_NODE = 3;
		static readonly CDATA_SECTION_NODE = 4;
		static readonly ENTITY_REFERENCE_NODE = 5;
		static readonly ENTITY_NODE = 6;
		static readonly PROCESSING_INSTRUCTION_NODE = 7
		static readonly COMMENT_NODE = 8;
		static readonly DOCUMENT_NODE = 9;
		static readonly DOCUMENT_TYPE_NODE = 10;
		static readonly DOCUMENT_FRAGMENT_NODE = 11;
		static readonly NOTATION_NODE = 12;
		static readonly DOCUMENT_POSITION_DISCONNECTED = 1;
		static readonly DOCUMENT_POSITION_PRECEDING =  2;
		static readonly DOCUMENT_POSITION_FOLLOWING = 4;
		static readonly DOCUMENT_POSITION_CONTAINS = 8;
		static readonly DOCUMENT_POSITION_CONTAINED_BY = 16;
		static readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;
		readonly ELEMENT_NODE = 1;
		readonly ATTRIBUTE_NODE = 2;
		readonly TEXT_NODE = 3;
		readonly CDATA_SECTION_NODE = 4;
		readonly ENTITY_REFERENCE_NODE = 5;
		readonly ENTITY_NODE = 6;
		readonly PROCESSING_INSTRUCTION_NODE = 7
		readonly COMMENT_NODE = 8;
		readonly DOCUMENT_NODE = 9;
		readonly DOCUMENT_TYPE_NODE = 10;
		readonly DOCUMENT_FRAGMENT_NODE = 11;
		readonly NOTATION_NODE = 12;
		readonly DOCUMENT_POSITION_DISCONNECTED = 1;
		readonly DOCUMENT_POSITION_PRECEDING =  2;
		readonly DOCUMENT_POSITION_FOLLOWING = 4;
		readonly DOCUMENT_POSITION_CONTAINS = 8;
		readonly DOCUMENT_POSITION_CONTAINED_BY = 16;
		readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;
		#nodeType: number = 0;
		#nodeName: string = "";
		#children: Node[] = [];
		#nextSibling: Node | null = null;
		#previousSibling: Node | null = null;
		#parentNode: Node | null = null;
		#preRemove = new Set<PreRemover>();
		#childrenNodeList = new NodeList<Node>(this.#children);
		constructor() {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
		get baseURI() {
			return "";
		}
		get childNodes() {
			return this.#childrenNodeList;
		}
		get firstChild() {
			return this.#children.at(0);
		}
		get isConnected() {
			return false;
		}
		get lastChild() {
			return this.#children.at(-1);
		}
		get nextSibling() {
			return this.#nextSibling;
		}
		get nodeName() {
			return this.#nodeName;
		}
		get nodeType() {
			return this.#nodeType;
		}
		get nodeValue() {
			// TODO
			return "";
		}
		get ownerDocument() {
			return null;
		}
		get parentElement(): HTMLElement | null {
			let p = this.#parentNode;
			while (p) {
				if (p instanceof HTMLElement) {
					return p;
				}
				p = p.parentNode;
			}
			return null;
		}
		get parentNode() {
			return this.#parentNode;
		}
		get previousSibling() {
			return this.#previousSibling;
		}
		get textContent() {
			// TODO
			return ""
		}
		set textContent(_text: string) {
			// TODO
		}
		appendChild<T extends Node>(node: T) {
			node?.parentNode?.removeChild(node);
			this.#children.push(node);
			return node;
		}
		cloneNode(_deep?: boolean) {
			// TODO
			return this;
		}
		compareDocumentPosition(_other: Node) {
			// TODO
			return NaN;
		}
		contains(other: Node | null): boolean {
			return this === other || this.#children.some(child => child.contains(other));
		}
		getRootNode(_options?: GetRootNodeOptions) {
			// TODO
			return this;
		}
		hasChildNodes() {
			return !!this.#children.length;
		}
		insertBefore<T extends Node>(node: T, child: Node | null) {
			if (child) {
				for (let i = 0; i < this.#children.length; i++) {
					if (this.#children[i] === child) {
						this.#children.splice(i, 0, node);
						return node;
					}
				}
				throw new Error("Node.insertBefore: Child to insert before is not a child of this node");
			} else {
				return this.appendChild(node);
			}
		}
		isDefaultNamespace(_namespace: string | null) {
			// TODO
			return false;
		}
		isEqualNode(_otherNode: Node | null) {
			// TODO
			return false;
		}
		isSameNode(otherNode: Node | null) {
			return otherNode === this;
		}
		lookupNamespaceURI(_prefix: string | null) {
			// TODO
			return null;
		}
		lookupPrefix(_namespace: string | null) {
			// TODO
			return null;
		}
		normalize() {
			// TODO
		}
		removeChild<T extends Node>(child: T) {
			if ((child.#parentNode as Node | null) !== this) {
				throw new Error("Node.removeChild: The node to be removed is not a child of this node");
			}
			for (const pr of child.#preRemove) {
				pr[preRemove](child);
			}
			child.#preRemove.clear();
			return child;
		}
		replaceChild<T extends Node>(node: Node, child: T) {
			for (let i = 0; i < this.#children.length; i++) {
				if (this.#children[i] === child) {
					for (const pr of child.#preRemove) {
						pr[preRemove](child);
					}
					child.#preRemove.clear();
					this.#children.splice(i, 1, node);
					return child;
				}
			}
			throw new Error("Node.insertBefore: Child to insert before is not a child of this node");
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

	class NodeList<TNode extends Node> {
		#nodes: TNode[];
		#preRemove?: PreRemover
		[realTarget]: NodeList<TNode>
		constructor (nodes: TNode[], preRemove?: PreRemover) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			this.#nodes = nodes;
			this.#preRemove = preRemove;
			this[realTarget] = this;
			return new Proxy<NodeList<TNode>>(this, nodeListProxyObj);
		}
		[preRemove](node: Node) {
			this[realTarget].#preRemove?.[preRemove](node);
		}
		get length() {
			return this[realTarget].#nodes.length;
		}
		item(index: number) {
			return this[realTarget].#nodes[index];
		}
		forEach(callbackfn: (value: Node, key: number, parent: NodeList<TNode>) => void, thisArg?: any) {
			this[realTarget].#nodes.forEach((value, key) => callbackfn(value, key, thisArg));
		}
		[index: number]: TNode;
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
