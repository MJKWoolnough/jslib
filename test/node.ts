{
	interface PreRemover {
		[preRemove](node: Node): void;
	}

	const ILLEGAL_CONSTRUCTOR = "Illegal constructor.",
	      addPreRemove = Symbol("addPreRemove"),
	      removePreRemove = Symbol("removePreRemove"),
	      preRemove = Symbol("preRemove"),
	      after = Symbol("after"),
	      before = Symbol("before"),
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
		#firstChild: Node | null = null;
		#lastChild: Node | null = null;
		#nextSibling: Node | null = null;
		#ownerDocument: Document | null;
		#previousSibling: Node | null = null;
		#parentNode: Node | null = null;
		#preRemove = new Set<PreRemover>();
		#childrenNodeList = new NodeList<Node>(this);
		constructor(type: number, name: string, ownerDocument: Document | null) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
			this.#nodeType = type;
			this.#nodeName = name;
			this.#ownerDocument = ownerDocument
		}
		get baseURI() {
			return "";
		}
		get childNodes() {
			return this.#childrenNodeList;
		}
		get firstChild() {
			return this.#firstChild;
		}
		get isConnected() {
			return false;
		}
		get lastChild() {
			return this.#lastChild;
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
			return this.#ownerDocument;
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
			let text = "";
			for (let n = this.#firstChild; n !== null; n = n.#nextSibling) {
				text += n.textContent;
			}
			return text;
		}
		set textContent(text: string) {
			let n = this.#firstChild;
			while (n) {
				const next = n.nextSibling;
				this.removeChild(n);
				n = next;
			}
			this.#firstChild = this.#lastChild = new Text(text);
		}
		[addPreRemove](pr: PreRemover) {
			this.#preRemove.add(pr);
		}
		[removePreRemove](pr: PreRemover) {
			this.#preRemove.delete(pr);
		}
		[after](referenceNode: Node, ...nodes: (Node | string)[]) {
			for (const c of nodes) {
				if (c instanceof DocumentFragment) {
					referenceNode = this[after](referenceNode, ...Array.from(c.childNodes));
				} else {
					const n = c instanceof Node ? c : new Text(c);
					n.#previousSibling = referenceNode;
					n.#nextSibling = referenceNode.#nextSibling;
					n.#parentNode?.removeChild(n);
					n.#parentNode = this;
					referenceNode = referenceNode.#nextSibling = n;
				}
			}
			if (!referenceNode.#nextSibling) {
				this.#firstChild = referenceNode;
			}
			return referenceNode;
		}
		[before](referenceNode: Node, ...nodes: (Node | string)[]) {
			for (const c of nodes) {
				if (c instanceof DocumentFragment) {
					referenceNode = this[before](referenceNode, ...Array.from(c.childNodes));
				} else {
					const n = c instanceof Node ? c : new Text(c);
					n.#nextSibling = referenceNode;
					n.#previousSibling = referenceNode.#previousSibling;
					n.#parentNode?.removeChild(n);
					n.#parentNode = this;
					if (!n.#previousSibling) {
						this.#lastChild = n;
					}
					referenceNode = referenceNode.#previousSibling = n;
				}
			}
			if (!referenceNode.#nextSibling) {
				this.#firstChild = referenceNode;
			}
			return referenceNode;
		}
		appendChild<T extends Node>(node: T) {
			if (node instanceof DocumentFragment) {
				while (node.#firstChild) {
					this.appendChild(node.#firstChild);
				}
			} else {

			}
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
			if (this === other) {
				return true;
			}
			for (let n = this.firstChild; n; n = n.nextSibling) {
				if (n.contains(other)) {
					return true;
				}
			}
			return false;
		}
		getRootNode(_options?: GetRootNodeOptions) {
			// TODO
			return this;
		}
		hasChildNodes() {
			return !!this.#firstChild;
		}
		insertBefore<T extends Node>(node: T, child: Node | null) {
			if (child && child.#parentNode !== this) {
				throw new Error("Node.insertBefore: Child to insert before is not a child of this node");
			}
			if (child) {
				this[before](child, node);
				return node;
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
			if (child.#nextSibling) {
				child.#nextSibling.#previousSibling = child.#previousSibling;
			} else {
				this.#lastChild = child.#previousSibling;
			}
			if (child.#previousSibling) {
				child.#previousSibling.#nextSibling = child.#nextSibling;
			} else {
				this.#firstChild = child.#nextSibling;
			}
			child.#parentNode = null;
			return child;
		}
		replaceChild<T extends Node>(node: Node, child: T) {
			if ((child.#parentNode as Node | null) !== this) {
				throw new Error("Node.replaceChild: Child to replace is not a child of this node");
			}
			this[after](child, node);
			return this.removeChild(child);
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
		#nodes: Node | TNode[];
		[realTarget]: NodeList<TNode>
		constructor (nodes: Node | TNode[]) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			this.#nodes = nodes;
			this[realTarget] = this;
			return new Proxy<NodeList<TNode>>(this, nodeListProxyObj);
		}
		get length() {
			if (this[realTarget].#nodes instanceof Node) {
				let length = 0;
				for (const _ of this.values()) {
					length++;
				}
				return length;
			}
			return this[realTarget].#nodes.length;
		}
		*entries() {
			let n = 0;
			for (const node of this.values()) {
				yield [n++, node];
			}
		}
		item(index: number) {
			let n = 0;
			for (const node of this.values()) {
				if (index === n) {
					return node;
				}
			}
			return null;
		}
		*keys() {
			let n = 0;
			for (const _ of this.values()) {
				yield n++;
			}
		}
		forEach(callbackfn: (value: Node, key: number, parent: NodeList<TNode>) => void, thisArg?: any) {
			let n = 0;
			for (const node of this.values()) {
				callbackfn(node, n, thisArg);
			}
		}
		*values() {
			if (this[realTarget].#nodes instanceof Node) {
				let n = this[realTarget].#nodes.firstChild;
				const pr = {
					[preRemove]() {
						n = n!.nextSibling;
					}
				      };
				while (n) {
					n[addPreRemove](pr);
					yield n;
					n[removePreRemove](pr);
					n = n.nextSibling;
				}
			} else {
				yield* this[realTarget].#nodes;
			}
		}
		*[Symbol.iterator]() {
			yield* this.values();
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
		#localName: string;
		#namespaceURI: string | null;
		#ownerElement: Element | null;
		#prefix: string | null;
		value: string;
		constructor (ownerDocument: Document, ownerElement: Element | null, namespaceURI: string | null, prefix: string | null, name: string, value: string) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super(Node.ATTRIBUTE_NODE, name, ownerDocument);
			this.#ownerElement = ownerElement;
			this.#namespaceURI = namespaceURI;
			this.#prefix = prefix;
			this.#localName = name;
			this.value = value;
		}
		get localName() {
			return this.#localName;
		}
		get name() {
			return (this.#prefix ? this.#prefix + ":" : "") + this.#localName;
		}
		get namespaceURI() {
			return this.#namespaceURI;
		}
		get ownerElement() {
			return this.#ownerElement;
		}
		get specified() {
			return true;
		}
	}

	class CharacterData extends Node {
		data: string;
		constructor (nodeType: number, nodeName: string, ownerDocument: Document, data: string) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super(nodeType, nodeName, ownerDocument);
			this.data = data;
		}
		get length() {
			return this.data.length;
		}
		get textContent() {
			return this.data;
		}
		get nextElementSibling() {
			let n = this.nextSibling;
			while (n && !(n instanceof Element)) {
				n = n.nextSibling;
			}
			return n;
		}
		get previousElementSibling() {
			let n = this.previousSibling;
			while (n && !(n instanceof Element)) {
				n = n.previousSibling;
			}
			return n;
		}
		after(...nodes: Node[]) {
			this.parentNode?.[after](this, ...nodes);
		}
		before(...nodes: Node[]) {
			this.parentNode?.[before](this, ...nodes);
		}
		deleteData(offset: number, count: number) {
			this.data = this.data.slice(0, offset) + this.data.slice(offset + count);
		}
		insertData(offset: number, data: string) {
			this.data = this.data.slice(0, offset) + data + this.data.slice(offset);
		}
		remove() {
			this.parentNode?.removeChild(this);
		}
		replaceData(offset: number, count: number, data: string) {
			this.data = this.data.slice(0, offset) + data + this.data.slice(offset + count);
		}
		substringData(offset: number, count: number) {
			return this.data.slice(offset, count);
		}
	}

	class Text extends CharacterData {
		constructor(text: string) {
			init = true;
			super(Node.TEXT_NODE, "#text", document, text);
			init = false;
		}
		get assignedSlot() {
			return null;
		}
		get wholeText() {
			return "";
		}
		splitText(offset: number) {
			const newText = new Text(this.data.slice(offset));
			this.data = this.data.slice(0, offset);
			this.after(newText);
			return newText;
		}
	}

	class Comment extends CharacterData {
		constructor(text: string) {
			init = true;
			super(Node.COMMENT_NODE, "#comment", document, text);
			init = false;
		}
	}

	class Document extends Node {
		constructor() {
			super(Node.DOCUMENT_NODE, "#document", null);
		}
	}

	class DocumentFragment extends Node {
		constructor() {
			super(Node.DOCUMENT_FRAGMENT_NODE, "#document-fragment", document);
		}
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
		constructor (nodeName: string, ownerDocument: Document) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super(Node.ELEMENT_NODE, nodeName, ownerDocument);
		}
	}

	class HTMLElement extends Element {
		constructor () {
			if (!init) { // check registry for valid Element type
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super("", document);
		}
	}

	class SVGElement extends Element {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super("", document);
		}
	}

	class MathMLElement extends Element {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super("", document);
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

	class CustomEvent<T = any> extends Event {
		readonly detail: T | null;
		constructor(type: string, eventInitDict: CustomEventInit<T>) {
			super(type, eventInitDict);
			this.detail = eventInitDict.detail ?? null;
		}
	}

	class UIEvent extends Event {
		readonly detail: number | null;
		readonly view: Window | null;
		constructor(type: string, eventInitDict?: UIEventInit) {
			super(type, eventInitDict);
			this.detail = eventInitDict?.detail ?? null;
			this.view = eventInitDict?.view ?? null;
		}
	}

	class MouseEvent extends UIEvent {
		readonly altKey: boolean = false;
		readonly button: number;
		readonly buttons: number;
		readonly clientX: number;
		readonly clientY: number;
		readonly ctrlKey: boolean = false;
		readonly metaKey: boolean = false;
		readonly movementX: number;
		readonly movementY: number;
		readonly offsetX: number = 0;
		readonly offsetY: number = 0;
		readonly pageX: number = 0;
		readonly pageY: number = 0;
		readonly relatedTarget: EventTarget | null;
		readonly screenX: number;
		readonly screenY: number;
		readonly shiftKey: boolean = false;
		readonly x: number = 0;
		readonly y: number = 0;

		constructor(type: string, eventInitDict?: MouseEventInit) {
			super(type, eventInitDict);
			this.button = eventInitDict?.button ?? 0;
			this.buttons = eventInitDict?.buttons ?? 0;
			this.clientX = eventInitDict?.clientX ?? 0;
			this.clientY = eventInitDict?.clientY ?? 0;
			this.movementX = eventInitDict?.movementX ?? 0;
			this.movementY = eventInitDict?.movementY ?? 0;
			this.relatedTarget = eventInitDict?.relatedTarget ?? null;
			this.screenX = eventInitDict?.screenX ?? 0;
			this.screenY = eventInitDict?.screenY ?? 0;
		}
		getModifierState(key: string) {
			return key === "Shift" && this.shiftKey || key === "Ctrl" && this.ctrlKey || key === "Alt" && this.altKey || key === "Meta" && this.metaKey;
		}
	}

	class KeyboardEvent extends UIEvent {
		static readonly DOM_KEY_LOCATION_STANDARD = 0;
		static readonly DOM_KEY_LOCATION_LEFT = 1;
		static readonly DOM_KEY_LOCATION_RIGHT = 2;
		static readonly DOM_KEY_LOCATION_NUMPAD = 4;

		readonly altKey: boolean = false;
		readonly code: string;
		readonly ctrlKey: boolean = false;
		readonly isComposing: boolean = false;
		readonly key: string;
		readonly locale: string = "";
		readonly location: number;
		readonly metaKey: boolean = false;
		readonly repeat: boolean;
		readonly shiftKey: boolean = false;
		constructor(type: string, eventInitDict?: KeyboardEventInit) {
			super(type, eventInitDict);
			this.code = eventInitDict?.code ?? "";
			this.key = eventInitDict?.key ?? "";
			this.location = eventInitDict?.location ?? 0;
			this.repeat = eventInitDict?.repeat ?? false;
		}
		getModifierState(key: string) {
			return key === "Shift" && this.shiftKey || key === "Ctrl" && this.ctrlKey || key === "Alt" && this.altKey || key === "Meta" && this.metaKey;
		}
	}


	class PopStateEvent extends Event {
		readonly state: any;
		constructor(type: string, eventInitDict?: PopStateEventInit) {
			super(type, eventInitDict);
			this.state = eventInitDict?.state;
		}
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
		[preRemove](node: Node) {
			if (this.#pointerBeforeReferenceNode) {
				let next: Node | null = this.#referenceNode;
				if (next.firstChild) {
					next = next.firstChild;
				} else {
					while (!next.nextSibling && next !== this.#root && next.parentNode) {
						next = next.parentNode;
					}
					if (next === this.#root || !next.parentNode) {
						next = null;
					} else {
						next = next.nextSibling!;
					}
				}
				if (next) {
					this.#referenceNode = next;
					return;
				}
				this.#pointerBeforeReferenceNode = false;
			}
			this.#referenceNode = node.parentNode!;
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
			for (let n: Node | null = node; n && n !== this.#root; n = n.parentNode) {
				n[removePreRemove](this);
			}
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
			for (let n: Node | null = node; n && n !== this.#root; n = n.parentNode) {
				n[addPreRemove](this);
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

	const document = new Document();

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
		["Comment", Comment],
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
		["document", document],
		["history", new History()],
		["window", new Window()],
	]) {
		Object.assign(globalThis, name, val);
	}

	init = false;
}
