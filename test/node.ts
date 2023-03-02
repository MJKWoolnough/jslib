{
	interface PreRemover {
		[preRemove](node: Node): void;
	}

	const ILLEGAL_CONSTRUCTOR = "Illegal constructor.",
	      addPreRemove = Symbol("addPreRemove"),
	      removePreRemove = Symbol("removePreRemove"),
	      preRemove = Symbol("preRemove"),
	      append = Symbol("append"),
	      after = Symbol("after"),
	      before = Symbol("before"),
	      realTarget = Symbol("realTarget"),
	      has = Symbol("has"),
	      get = Symbol("get"),
	      set = Symbol("set"),
	      remove = Symbol("remove"),
	      setElement = Symbol("setElement"),
	      whitespace = /\s+/,
	      camelToKebab = (name: string) => {
		let ret = "";
		for (const char of name) {
			const code = char.charCodeAt(0);
			if (code >= 65 && code <= 90) {
				ret += "-" + char.toLowerCase();
			} else {
				ret += char;
			}
		}
		return ret;
	      },
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
	      htmlCollectionProxyObj = {
		has: (target: HTMLCollection, name: PropertyKey) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
		get: (target: HTMLCollection, name: PropertyKey) => pIFn(name, index => target.item(index)) || (target as any)[name],
	      },
	      nodeListProxyObj = {
		has: <T extends Node>(target: NodeList<T>, name: PropertyKey) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
		get: <T extends Node>(target: NodeList<T>, name: PropertyKey) => pIFn(name, index => target.item(index)) || (target as any)[name],
	      },
	      domStringMapProxyObj = {
		has: (target: DOMStringMap, name: PropertyKey) => target[has](name),
		get: (target: DOMStringMap, name: PropertyKey) => target[get](name),
		set: (target: DOMStringMap, name: PropertyKey, value: any) => target[set](name, value),
		deleteProperty: (target: DOMStringMap, name: PropertyKey) => target[remove](name)
	      },
	      namedNodeMapProxyObj = {
		has: (target: NamedNodeMap, name: PropertyKey) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
		get: (target: NamedNodeMap, name: PropertyKey) => pIFn(name, index => target.item(index)) || (target as any)[name],
	      },
	      domRectListProxyObj = {
		has: (target: DOMRectList, name: PropertyKey) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
		get: (target: DOMRectList, name: PropertyKey) => pIFn(name, index => target.item(index)) || (target as any)[name],
	      };

	class DOMException extends Error {
		static readonly INDEX_SIZE_ERR = 1;
		static readonly DOMSTRING_SIZE_ERR = 2;
		static readonly HIERARCHY_REQUEST_ERR = 3;
		static readonly WRONG_DOCUMENT_ERR = 4;
		static readonly INVALID_CHARACTER_ERR = 5;
		static readonly NO_DATA_ALLOWED_ERR = 6;
		static readonly NO_MODIFICATION_ALLOWED_ERR = 7;
		static readonly NOT_FOUND_ERR = 8;
		static readonly NOT_SUPPORTED_ERR = 9;
		static readonly INUSE_ATTRIBUTE_ERR = 10;
		static readonly INVALID_STATE_ERR = 11;
		static readonly SYNTAX_ERR = 12;
		static readonly INVALID_MODIFICATION_ERR = 13;
		static readonly NAMESPACE_ERR = 14;
		static readonly INVALID_ACCESS_ERR = 15;
		static readonly VALIDATION_ERR = 16;
		static readonly TYPE_MISMATCH_ERR = 17;
		static readonly SECURITY_ERR = 18;
		static readonly NETWORK_ERR = 19;
		static readonly ABORT_ERR = 20;
		static readonly URL_MISMATCH_ERR = 21;
		static readonly QUOTA_EXCEEDED_ERR = 22;
		static readonly TIMEOUT_ERR = 23;
		static readonly INVALID_NODE_TYPE_ERR = 24;
		static readonly DATA_CLONE_ERR = 25;
		readonly INDEX_SIZE_ERR = 1;
		readonly DOMSTRING_SIZE_ERR = 2;
		readonly HIERARCHY_REQUEST_ERR = 3;
		readonly WRONG_DOCUMENT_ERR = 4;
		readonly INVALID_CHARACTER_ERR = 5;
		readonly NO_DATA_ALLOWED_ERR = 6;
		readonly NO_MODIFICATION_ALLOWED_ERR = 7;
		readonly NOT_FOUND_ERR = 8;
		readonly NOT_SUPPORTED_ERR = 9;
		readonly INUSE_ATTRIBUTE_ERR = 10;
		readonly INVALID_STATE_ERR = 11;
		readonly SYNTAX_ERR = 12;
		readonly INVALID_MODIFICATION_ERR = 13;
		readonly NAMESPACE_ERR = 14;
		readonly INVALID_ACCESS_ERR = 15;
		readonly VALIDATION_ERR = 16;
		readonly TYPE_MISMATCH_ERR = 17;
		readonly SECURITY_ERR = 18;
		readonly NETWORK_ERR = 19;
		readonly ABORT_ERR = 20;
		readonly URL_MISMATCH_ERR = 21;
		readonly QUOTA_EXCEEDED_ERR = 22;
		readonly TIMEOUT_ERR = 23;
		readonly INVALID_NODE_TYPE_ERR = 24;
		readonly DATA_CLONE_ERR = 25;
		static ERROR_NAMES = Object.freeze([
			"",
			"IndexSizeError",
			"DOMSTRING_SIZE_ERR",
			"HierarchyRequestError",
			"WrongDocumentError",
			"InvalidCharacterError",
			"NO_DATA_ALLOWED_ERR",
			"NoModificationAllowedError",
			"NotFoundError",
			"NotSupportedError",
			"INUSE_ATTRIBUTE_ERR",
			"InUseAttributeError",
			"SyntaxError",
			"InvalidModificationError",
			"NamespaceError",
			"InvalidAccessError",
			"VALIDATION_ERR",
			"TypeMismatchError",
			"SecurityError",
			"NetworkError",
			"AbortError",
			"URLMismatchError",
			"QuotaExceededError",
			"TimeoutError",
			"InvalidNodeTypeError",
			"DataCloneError",
		]);
		#code: number;
		#message: string;
		#name: string;
		constructor(message = "", name = "") {
			super(message);
			this.#message = message;
			this.#name = name;
			this.#code = DOMException.ERROR_NAMES.indexOf(name);
		}
		get code() {
			return this.#code;
		}
		get message() {
			return this.#message;
		}
		get name() {
			return this.#name;
		}
		[Symbol.toStringTag]() {
			return "DOMException";
		}
	}

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
		#connected = false;
		constructor(type: number, name: string, ownerDocument: Document | null) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
			this.#nodeType = type;
			this.#nodeName = name;
			this.#ownerDocument = ownerDocument
		}
		#connect() {
			if (this.#parentNode && this.#parentNode.#connected) {
				this.#connected = true;
				for (let n = this.#firstChild; n; n = n.nextSibling) {
					n.#connect();
				}
			}
		}
		#disconnect() {
			if (this.#connected) {
				this.#connected = false;
				for (let n = this.#firstChild; n; n = n.nextSibling) {
					n.#disconnect();
				}
			}
		}
		#validateChild(fn: string, node: Node) {
			if (!(this instanceof Element) && !(this instanceof Document) && !(this instanceof DocumentFragment)) {
				throw new DOMException(`${this[Symbol.toStringTag]()}.${fn}: Cannot add children to a ${this[Symbol.toStringTag]()}`, DOMException.ERROR_NAMES[DOMException.HIERARCHY_REQUEST_ERR]);
			}
			if ((!(node instanceof Element) && !(node instanceof CharacterData) && !(node instanceof DocumentType) && !(node instanceof DocumentFragment)) || (node instanceof Text && this instanceof Document) || (node instanceof DocumentType && !(this instanceof Document))) {
				throw new DOMException(`${this[Symbol.toStringTag]()}.${fn}: May not add a ${node[Symbol.toStringTag]()} as a child`, DOMException.ERROR_NAMES[DOMException.HIERARCHY_REQUEST_ERR])
			}
			if (node instanceof DocumentFragment && this instanceof Document) {
				let hasElement = false;
				for (let n = node.#firstChild; n; n = n.#nextSibling) {
					if (n instanceof Element) {
						if (hasElement) {
							throw new DOMException(`${this[Symbol.toStringTag]()}.${fn}: Cannot have more than one Element child of a Document`, DOMException.ERROR_NAMES[DOMException.HIERARCHY_REQUEST_ERR]);
						}
						hasElement = true;
					} else if (n instanceof Text) {
						throw new DOMException(`${this[Symbol.toStringTag]()}.${fn}: May not add a Text as a Child`, DOMException.ERROR_NAMES[DOMException.HIERARCHY_REQUEST_ERR]);
					}
				}
			}
			if (this instanceof Document && node instanceof Element) {
				for (let n = node.#firstChild; n; n = n.#nextSibling) {
					if (n instanceof Element) {
						throw new DOMException(`${this[Symbol.toStringTag]()}.${fn}: Cannot have more than one Element child of a Document`, DOMException.ERROR_NAMES[DOMException.HIERARCHY_REQUEST_ERR]);
					}
				}
			}
			for (let n = this as Node | null; n; n = n.#parentNode) {
				if (n === node) {
					throw new DOMException(`${this[Symbol.toStringTag]()}.${fn}: The new child is an ancestor of the parent`, DOMException.ERROR_NAMES[DOMException.HIERARCHY_REQUEST_ERR]);
				}
			}
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
			return this.#connected;
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
		get nodeValue(): string | null {
			return null;
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
		[append](fn: string, node: Node) {
			this.#validateChild(fn, node);
			if (node instanceof DocumentFragment) {
				while (node.#firstChild) {
					this.appendChild(node.#firstChild);
				}
			} else {
				node.#parentNode?.removeChild(node);
				if (this.#lastChild) {
					this.#lastChild.#nextSibling = node;
					node.#previousSibling = this.#lastChild;
				}
				this.#lastChild = node;
				if (!this.#firstChild) {
					this.#firstChild = node;
				}
				node.#connect();
			}
			return node;
		}
		[after](fn: string, referenceNode: Node, ...nodes: (Node | string)[]) {
			for (const c of nodes) {
				if (c instanceof DocumentFragment) {
					referenceNode = this[after](fn, referenceNode, ...Array.from(c.childNodes));
				} else {
					const n = c instanceof Node ? c : new Text(c);
					this.#validateChild(fn, n);
					n.#previousSibling = referenceNode;
					n.#nextSibling = referenceNode.#nextSibling;
					n.#parentNode?.removeChild(n);
					n.#parentNode = this;
					referenceNode = referenceNode.#nextSibling = n;
					n.#connect();
				}
			}
			if (!referenceNode.#nextSibling) {
				this.#firstChild = referenceNode;
			}
			return referenceNode;
		}
		[before](fn: string, referenceNode: Node, ...nodes: (Node | string)[]) {
			for (const c of nodes) {
				if (c instanceof DocumentFragment) {
					referenceNode = this[before](fn, referenceNode, ...Array.from(c.childNodes));
				} else {
					const n = c instanceof Node ? c : new Text(c);
					this.#validateChild(fn, n);
					n.#nextSibling = referenceNode;
					n.#previousSibling = referenceNode.#previousSibling;
					n.#parentNode?.removeChild(n);
					n.#parentNode = this;
					if (!n.#previousSibling) {
						this.#lastChild = n;
					}
					referenceNode = referenceNode.#previousSibling = n;
					n.#connect();
				}
			}
			if (!referenceNode.#nextSibling) {
				this.#firstChild = referenceNode;
			}
			return referenceNode;
		}
		appendChild<T extends Node>(node: T) {
			return this[append]("appendChild", node);
		}
		cloneNode(deep?: boolean) {
			init = true;
			const cn = new (this.constructor as {new(): Node});
			init = false;
			if (deep) {
				for (let n = this.#firstChild; n; n = n.#nextSibling) {
					cn.appendChild(n.cloneNode(true));
				}
			}
			return cn;
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
				throw new DOMException(`${this[Symbol.toStringTag]()}.insertBefore: Child to insert before is not a child of this node`, DOMException.ERROR_NAMES[DOMException.NOT_FOUND_ERR]);
			}
			if (child) {
				this[before]("before", child, node);
				return node;
			} else {
				return this[append]("insertBefore", node);
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
				throw new DOMException(`${this[Symbol.toStringTag]()}.removeChild: The node to be removed is not a child of this node`, DOMException.ERROR_NAMES[DOMException.NOT_FOUND_ERR]);
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
			child.#nextSibling = child.#previousSibling = child.#parentNode = null;
			child.#disconnect();
			return child;
		}
		replaceChild<T extends Node>(node: Node, child: T) {
			if ((child.#parentNode as Node | null) !== this) {
				throw new DOMException(`${this[Symbol.toStringTag]()}.replaceChild: Child to replace is not a child of this node`, DOMException.ERROR_NAMES[DOMException.NOT_FOUND_ERR]);
			}
			this[after]("replaceChild", child, node);
			return this.removeChild(child);
		}
		[Symbol.toStringTag]() {
			return "Node";
		}
	}

	class DOMTokenList {
		#tokens: string[] = [];
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
		get length() {
			return this.#tokens.length;
		}
		get value() {
			return this.#tokens.join(" ");
		}
		set value(tokens: string) {
			this.#tokens.splice(0, this.#tokens.length, ...tokens.split(whitespace));
		}
		#add(fn: string, token: string) {
			if (!token) {
				throw new DOMException(`DOMTokenList.${fn}: The empty string is not a valid token.`, DOMException.ERROR_NAMES[DOMException.SYNTAX_ERR]);
			}
			if (whitespace.test(token)) {
				throw new DOMException(`DOMTokenList.${fn}: The token can not contain whitespace.`, DOMException.ERROR_NAMES[DOMException.INVALID_CHARACTER_ERR]);
			}
			if (!this.contains(token)) {
				this.#tokens.push(token);
			}
		}
		#remove(token: string) {
			const index = this.#tokens.indexOf(token);
			if (index >= 0) {
				this.#tokens.splice(index, 1);
			}
		}
		add(token: string, ...tokens: string[]) {
			this.#add("add", token);
			for (const t of tokens) {
				this.#add("add", t);
			}
		}
		contains(token: string) {
			return this.#tokens.includes(token);
		}
		entries() {
			this.#tokens.entries();
		}
		forEach(callbackfn: (value: string, key: number, parent: DOMTokenList) => void, thisArg: any = this) {
			let i = 0;
			for (const token of this.#tokens) {
				callbackfn.call(thisArg, token, i++, this);
			}
		}
		item(index: number) {
			return this.#tokens[index] ?? null;
		}
		keys() {
			return this.#tokens.keys();
		}
		remove(token: string, ...tokens: string[]) {
			this.#remove(token);
			for (const t of tokens) {
				this.#remove(t);
			}
		}
		replace(oldToken: string, newToken: string) {
			const index = this.#tokens.indexOf(oldToken);
			if (index === -1) {
				return false;
			}
			this.#tokens.splice(index, 1, newToken);
			return true;
		}
		supports(_token: string) {
			// TODO
			return false;
		}
		toggle(token: string, force?: boolean) {
			if (force === false || this.contains(token)) {
				this.#remove(token);
				return false;
			}
			this.#add("toggle", token);
			return true;
		}
		values() {
			return this.#tokens.values();
		}
	}

	class HTMLCollection {
		#nodes: Node;
		#onlyDirect: boolean;
		#filter?: (e: Element) => boolean;
		[realTarget]: this;
		constructor (nodes: Node, onlyDirect: boolean, filter?: (e: Element) => boolean) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			this.#nodes = nodes;
			this.#onlyDirect = onlyDirect;
			this.#filter = filter;
			this[realTarget] = this;
			return new Proxy<HTMLCollection>(this, htmlCollectionProxyObj);
		}
		*#entries() {
			let n = this.#nodes.firstChild;
			while (n && n !== this.#nodes) {
				if (n instanceof Element) {
					if (!this.#filter || this.#filter(n)) {
						yield n;
					}
					if (!this.#onlyDirect && n.firstChild) {
						n = n.firstChild;
						continue;
					}
				}
				n = n.nextSibling ?? n.parentNode;
			}
		}
		get length() {
			let length = 0;
			for (const n of this.#entries()) {
				if (n instanceof Element) {
					length++;
				}
			}
			return length;
		}
		item(index: number) {
			let count = 0;
			for (const n of this.#entries()) {
				if (count++ === index) {
					return n;
				}
			}
			return null;
		}
		namedItem(_key: string) {
			// TODO
			return null;
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
		[realTarget]: this;
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
		forEach(callbackfn: (value: Node, key: number, parent: NodeList<TNode>) => void, thisArg: any = this) {
			let n = 0;
			for (const node of this.values()) {
				callbackfn.call(thisArg, node, n, this);
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
		#element: Element;
		#items: Attr[] = [];
		constructor (element: Element) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			this.#element = element;
			return new Proxy<NamedNodeMap>(this, namedNodeMapProxyObj);
		}
		get length() {
			return 0;
		}
		getNamedItem(qualifiedName: string) {
			for (const item of this.#items) {
				if (item.name === qualifiedName && item.namespaceURI === null) {
					return item;
				}
			}
			return null;
		}
		getNamedItemNS(namespace: string | null, localName: string) {
			for (const item of this.#items) {
				if (item.name === localName && item.namespaceURI === namespace) {
					return item;
				}
			}
			return null;
		}
		item(index: number) {
			return this.#items[index] ?? null;
		}
		removeNamedItem(qualifiedName: string) {
			let pos = 0;
			for (const item of this.#items) {
				if (item.name === qualifiedName && item.namespaceURI === null) {
					this.#items.splice(pos, 1);
					item[setElement](null);
					return item;
				}
				pos++;
			}
			return null;
		}
		removeNamedItemNS(namespace: string | null, localName: string) {
			let pos = 0;
			for (const item of this.#items) {
				if (item.name === localName && item.namespaceURI === namespace) {
					this.#items.splice(pos, 1);
					item[setElement](null);
					return item;
				}
				pos++;
			}
			return null;
		}
		setNamedItem(attr: Attr) {
			let pos = 0;
			attr[setElement](this.#element);
			for (const item of this.#items) {
				if (item.name === attr.name && item.namespaceURI === null) {
					this.#items.splice(pos, 1, attr);
					return item;
				}
				pos++;
			}
			this.#items.push(attr);
			return null;
		}
		setNamedItemNS(attr: Attr) {
			let pos = 0;
			attr[setElement](this.#element);
			for (const item of this.#items) {
				if (item.name === attr.name && item.namespaceURI === attr.namespaceURI) {
					this.#items.splice(pos, 1, attr);
					return item;
				}
				pos++;
			}
			this.#items.push(attr);
			return null;
		}
		[index: number]: Attr;
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
		get nodeValue() {
			return this.value;
		}
		set nodeValue(v: string) {
			this.value = v;
		}
		get ownerElement() {
			return this.#ownerElement;
		}
		[setElement](element: Element | null) {
			this.#ownerElement = element;
		}
		get specified() {
			return true;
		}
		get textContent() {
			return this.value;
		}
		set textContent(t: string) {
			this.value = t;
		}
		cloneNode(_deep?: boolean) {
			return new Attr(this.ownerDocument!, this.#ownerElement, this.#namespaceURI, this.#prefix, this.#localName, this.value);
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
		get nextElementSibling() {
			let n = this.nextSibling;
			while (n && !(n instanceof Element)) {
				n = n.nextSibling;
			}
			return n;
		}
		get nodeValue() {
			return this.data;
		}
		set nodeValue(v: string) {
			this.data = v;
		}
		get previousElementSibling() {
			let n = this.previousSibling;
			while (n && !(n instanceof Element)) {
				n = n.previousSibling;
			}
			return n;
		}
		get textContent() {
			return this.data;
		}
		set textContent(t: string) {
			this.data = t;
		}
		after(...nodes: Node[]) {
			this.parentNode?.[after]("after", this, ...nodes);
		}
		before(...nodes: Node[]) {
			this.parentNode?.[before]("before", this, ...nodes);
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
		constructor(text: string, type?: number) {
			const t = init && type ? type : Node.TEXT_NODE,
			      name = t === Node.TEXT_NODE ? "#text" : "#comment";
			init = true;
			super(t, name, document, text);
			init = false;
		}
		get assignedSlot() {
			return null;
		}
		get wholeText() {
			return "";
		}
		cloneNode(_deep?: boolean) {
			return new Text(this.data);
		}
		splitText(offset: number) {
			const newText = new Text(this.data.slice(offset));
			this.data = this.data.slice(0, offset);
			this.after(newText);
			return newText;
		}
	}

	class CDATASection extends Text {
		constructor(text: string) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super(text, Node.CDATA_SECTION_NODE);
		}
		cloneNode(_deep?: boolean) {
			return new CDATASection(this.data);
		}
	}

	class Comment extends CharacterData {
		constructor(text: string) {
			init = true;
			super(Node.COMMENT_NODE, "#comment", document, text);
			init = false;
		}
		cloneNode(_deep?: boolean) {
			return new Comment(this.data);
		}
	}

	class ProcessingInstruction extends CharacterData {
		#sheet: StyleSheet | null;
		#target: string;
		constructor(sheet: StyleSheet | null, target: string) {
			super(Node.PROCESSING_INSTRUCTION_NODE, "#comment", document, "");
			this.#sheet = sheet;
			this.#target = target;
		}
		get sheet() {
			return this.#sheet;
		}
		get target() {
			return this.#target;
		}
		cloneNode(_deep?: boolean) {
			return new ProcessingInstruction(this.#sheet, this.#target);
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
		get childElementCount() {
			let count = 0;
			for (let n = this.firstChild; n; n = n.nextSibling) {
				if (n instanceof Element) {
					count++;
				}
			}
			return count;
		}
		get children() {
			init = true;
			const hc = new HTMLCollection(this, true);
			init = false;
			return hc;
		}
		get firstElementChild() {
			for (let n = this.firstChild; n; n = n.nextSibling) {
				if (n instanceof Element) {
					return n;
				}
			}
			return null;
		}
		get lastElementChild() {
			for (let n = this.lastChild; n; n = n.previousSibling) {
				if (n instanceof Element) {
					return n;
				}
			}
			return null;
		}
		#append(fn: string, nodes: (Node | string)[]) {
			for (const n of nodes) {
				this[append](fn, n instanceof Node ? n : new Text(n));
			}
		}
		append(...nodes: (Node | string)[]) {
			this.#append("DocumentFragment.append", nodes);
		}
		getElementById(_id: string) {
			// TODO
			return null;
		}
		prepend(...nodes: (Node | string)[]) {
			if (this.firstChild) {
				this[before]("DocumentFragment.prepend", this.firstChild, ...nodes);
			} else {
				this.#append("DocumentFragment.prepend", nodes);
			}
		}
		querySelector(_selectors: any) {
			// TODO
			return null;
		}
		querySelectorAll(_selectors: any) {
			// TODO
			return null;
		}
		replaceChildren(...nodes: (Node | string)[]) {
			while (this.firstChild) {
				this.removeChild(this.firstChild);
			}
			this.#append("DocumentFragment.replaceChildren", nodes);
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
		#assignedSlot: HTMLSlotElement | null = null;
		#attributes = new NamedNodeMap(this);
		#classList = new DOMTokenList();
		#children = new HTMLCollection(this, true);
		#localName: string;
		#namespaceURI: string;
		scrollLeft = 0;
		scrollTop = 0;
		constructor (namespaceURI: string, localName: string, ownerDocument: Document) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super(Node.ELEMENT_NODE, localName.toUpperCase(), ownerDocument);
			this.#localName = localName;
			this.#namespaceURI = namespaceURI;
		}
		get assignedSlot() {
			return this.#assignedSlot;
		}
		get attributes() {
			return this.#attributes;
		}
		get childElementCount() {
			let count = 0;
			for (let n = this.firstChild; n; n = n.nextSibling) {
				if (n instanceof Element) {
					count++;
				}
			}
			return count;
		}
		get children() {
			return this.#children;
		}
		get classList() {
			return this.#classList;
		}
		get className() {
			return this.#classList.value;
		}
		set className(className: string) {
			this.#classList.value = className;
		}
		get clientHeight() {
			return 0;
		}
		get clientLeft() {
			return 0;
		}
		get clientTop() {
			return 0;
		}
		get clientWidth() {
			return 0;
		}
		get firstElementChild(): Element | null {
			for (let n = this.firstChild; n; n = n.nextSibling) {
				if (n instanceof Element) {
					return n;
				}
			}
			return null;
		}
		get id() {
			return this.#attributes.getNamedItem("id")?.value ?? "";
		}
		set id(id: string) {
			this.setAttribute("id", id);
		}
		get innerHTML() {
			// TODO
			return "";
		}
		set innerHTML(_html: string) {
			// TODO;
		}
		get lastElementChild(): Element | null {
			for (let n = this.lastChild; n; n = n.previousSibling) {
				if (n instanceof Element) {
					return n;
				}
			}
			return null;
		}
		get localName() {
			return this.#localName;
		}
		get namespaceURI() {
			return this.#namespaceURI;
		}
		get nextElementSibling(): Element | null {
			for (let n = this.nextSibling; n; n = n.nextSibling) {
				if (n instanceof Element) {
					return n;
				}
			}
			return null;
		}
		get outerHTML() {
			// TODO
			return "";
		}
		set outerHTML(_html: string) {
			// TODO
		}
		get part() {
			return this.#attributes.getNamedItem("part")?.value ?? "";
		}
		set part(part: string) {
			this.setAttribute("part", part);
		}
		get prefix() {
			// TODO
			return null;
		}
		get previousElementSibling(): Element | null {
			for (let n = this.previousSibling; n; n = n.previousSibling) {
				if (n instanceof Element) {
					return n;
				}
			}
			return null;
		}
		get scrollHeight() {
			return 0;
		}
		get scrollLeftMax() {
			return 0;
		}
		get scrollTopMax() {
			return 0;
		}
		get scrollWidth() {
			return 0;
		}
		get shadowRoot() {
			// TODO
			return null;
		}
		get slot() {
			// TODO
			return "";
		}
		get tagName() {
			return this.nodeName;
		}
		// TODO: Aria?
		after(...nodes: Node[]) {
			this.parentNode?.[after]("Element.after", this, ...nodes);
		}
		attachShadow(_init: ShadowRootInit) {
			// TODO
			return null as any as ShadowRoot;
		}
		animate(_keyframes: Keyframe[] | PropertyIndexedKeyframes | null, _options?: number | KeyframeAnimationOptions) {
			// TODO
			return null as any as Animation;
		}
		#append(fn: string, nodes: (Node | string)[]) {
			for (const n of nodes) {
				this[append](fn, n instanceof Node ? n : new Text(n));
			}
		}
		append(...nodes: (Node | string)[]) {
			this.#append("Element.append", nodes);
		}
		before(...nodes: Node[]) {
			this.parentNode?.[before]("Element.before", this, ...nodes);
		}
		closest(_selectors: string) {
			// TODO
			return null;
		}
		getAnimations(_options?: GetAnimationsOptions) {
			return [] as Animation[];
		}
		getAttribute(attributeName: string) {
			return this.#attributes.getNamedItem(attributeName)?.value ?? null;
		}
		getAttributeNames() {
			const names: string[] = [];
			for (let i = 0; i < this.#attributes.length; i++) {
				names.push(this.#attributes.item(i).name);
			}
			return names;
		}
		getAttributeNode(attributeName: string) {
			return this.#attributes.getNamedItem(attributeName);
		}
		getAttributeNodeNS(namespace: string | null, localName: string) {
			return this.#attributes.getNamedItemNS(namespace, localName);
		}
		getBoundingClientRect() {
			return new DOMRect(0, 0, 0, 0);
		}
		getClientRects() {
			return new DOMRectList();
		}
		getElementsByClassName(names: string) {
			const nameArr = names.split(whitespace);
			return new HTMLCollection(this, false, e => nameArr.every(c => e.classList.contains(c)));
		}
		getElementsByTagName(tagName: string) {
			return new HTMLCollection(this, false, tagName === "*" ? undefined : e => e.tagName === tagName);
		}
		getElementsByTagNameNS(namespaceURI: string, localName: string) {
			return new HTMLCollection(this, false, localName === "*" ? e => e.namespaceURI === namespaceURI : e => e.namespaceURI === namespaceURI && e.localName === localName );
		}
		hasAttribute(attributeName: string) {
			return !!this.#attributes.getNamedItem(attributeName);
		}
		hasAttributeNS(namespace: string | null, localName: string) {
			return !!this.#attributes.getNamedItemNS(namespace, localName);
		}
		hasAttributes() {
			return !!this.#attributes.length;
		}
		hasPointerCapture() {
			// TODO
			return false;
		}
		#insertAdjacentNode(fn: string, position: string, element: Node) {
			if (!(element instanceof Element)) {
				throw TypeError(`${fn}: Argument 2 does not implement interface Element.`);
			}
			switch (position) {
			case "beforebegin":
				if (!this.parentNode) {
					return null;
				}
				this.parentNode[before](fn, this, element);
				break;
			case "afterbegin":
				const child = this.firstChild;
				if (child) {
					this[before](fn, child, element);
				} else {
					this.#append(fn, [element]);
				}
				break;
			case "beforeend":
				this.#append(fn, [element]);
				break;
			case "afterend":
				if (!this.parentNode) {
					return null;
				}
				this.parentNode[after](fn, this, element);
				break;
			default:
				throw new DOMException("An invalid or illegal string was specified", DOMException.ERROR_NAMES[DOMException.SYNTAX_ERR]);
			}
			return element;
		}
		insertAdjacentElement(position: string, element: Element) {
			this.#insertAdjacentNode("Element.insertAdjacentElement", position, element);
		}
		insertAdjacentHTML(_position: string, _text: string) {
			// TODO
		}
		insertAdjacentText(position: string, text: string) {
			this.#insertAdjacentNode("Element.insertAdjacentText", position, new Text(text));
		}
		matches(_selectors: string) {
			// TODO
			return false;
		}
		prepend(...nodes: Node[]) {
			if (this.firstChild) {
				this[before]("Element.prepend", this.firstChild, ...nodes);
			} else {
				this.#append("Element.prepend", nodes);
			}
		}
		querySelector(_selectors: string) {
			// TODO
			return null;
		}
		querySelectorAll(_selectors: string) {
			// TODO
			return new NodeList([])
		}
		releasePointerCapture(_pointerID: number) {
			// TODO
		}
		remove() {
			this.parentNode?.removeChild(this);
		}
		removeAttribute(qualifiedName: string) {
			this.#attributes.removeNamedItem(qualifiedName);
		}
		removeAttributeNode(attr: Attr) {
			if (attr.ownerElement === this) {
				this.#attributes.removeNamedItemNS(attr.namespaceURI, attr.localName);
			}
		}
		removeAttributeNS(namespaceURI: string, localName: string) {
			this.#attributes.removeNamedItemNS(namespaceURI, localName);
		}
		replaceChildren(...nodes: (Node | string)[]) {
			while (this.firstChild) {
				this.removeChild(this.firstChild);
			}
			this.#append("Element.replaceChildren", nodes);
		}
		replaceWith(node: Node | string, ...nodes: (Node | string)[]) {
			this.parentNode?.[after]("Element.replaceWith", this, node, ...nodes);
			this.parentNode?.removeChild(this);
		}
		requestFullScreen(_options?: FullscreenOptions) {
			return Promise.reject();
		}
		requestPointerLock(_options?: {unadjustedMovement?: boolean}) {
			return Promise.reject();
		}
		scroll(x: number, y: number): void;
		scroll(options?: ScrollToOptions): void;
		scroll(_xOrOptions?: number | ScrollToOptions, _y?: number) {
		}
		scrollBy(x: number, y: number): void;
		scrollBy(options?: ScrollToOptions): void;
		scrollBy(_xOrOptions?: number | ScrollToOptions, _y?: number) {
		}
		scrollIntoView(_arg?: boolean | ScrollIntoViewOptions) {
		}
		scrollTo(x: number, y: number): void;
		scrollTo(options?: ScrollToOptions): void;
		scrollTo(_xOrOptions?: number | ScrollToOptions, _y?: number) {
		}
		setAttribute(qualifiedName: string, value: string) {
			const attr = this.#attributes.getNamedItem(qualifiedName);
			if (attr) {
				attr.value = value;
			} else {
				init = true;
				this.#attributes.setNamedItem(new Attr(this.ownerDocument!, this, null, null, qualifiedName, value));
				init = false;
			}
		}
		setAttributeNode(attribute: Attr) {
			this.#attributes.setNamedItem(attribute);
		}
		setAttributeNodeNS(attribute: Attr) {
			this.#attributes.setNamedItemNS(attribute);
		}
		setAttributeNS(namespace: string | null, localName: string, value: string) {
			const attr = this.#attributes.getNamedItemNS(namespace, localName);
			if (attr) {
				attr.value = value;
			} else {
				init = true;
				this.#attributes.setNamedItem(new Attr(this.ownerDocument!, this, namespace, null, localName, value));
				init = false;
			}
		}
		setPointerCapture(_pointerId: number) {
		}
		toggleAttribute(name: string, force?: boolean) {
			if (force === false || this.#attributes.getNamedItem(name)) {
				this.#attributes.removeNamedItem(name);
				return false;
			}
			init = true;
			this.#attributes.setNamedItem(new Attr(this.ownerDocument!, this, null, null, name, ""));
			init = false;
			return true;
		}
	}

	class HTMLElement extends Element {
		constructor (localName: string) {
			if (!init) { // check registry for valid Element type
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super("https://www.w3.org/1999/xhtml/", localName, document);
		}
	}

	class SVGElement extends Element {
		constructor (localName: string) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super("http://www.w3.org/2000/svg", localName, document);
		}
	}

	class MathMLElement extends Element {
		constructor (localName: string) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super("http://www.w3.org/1998/Math/MathML", localName, document);
		}
	}

	class DOMStringMap {
		#element: Element;
		constructor (element: Element) {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			this.#element = element;
			this.#element;
			return new Proxy<DOMStringMap>(this, domStringMapProxyObj);
		}
		[has](name: PropertyKey) {
			return typeof name === "string" ? this.#element.hasAttribute("data-" + camelToKebab(name)) : false;
		}
		[get](name: PropertyKey) {
			return typeof name === "string" ? this.#element.getAttribute("data-" + camelToKebab(name)) : null;
		}
		[set](name: PropertyKey, value: any) {
			if (typeof name === "string") {
				this.#element.setAttribute("data-" + camelToKebab(name), value);
			}
			return true;
		}
		[remove](name: PropertyKey) {
			if (typeof name === "string") {
				this.#element.removeAttribute("data-" + camelToKebab(name));
			}
			return true;
		}
	}

	class DOMRect {
		#x: number;
		#y: number;
		#width: number;
		#height: number;
		constructor(x: number, y: number, width: number, height: number) {
			this.#x = x;
			this.#y = y;
			this.#width = width;
			this.#height = height;
		}
		static fromRect({x = 0, y = 0, width = 0, height = 0}: {x?: number, y?: number, width?: number, height?: number}) {
			return new DOMRect(x, y, width, height);
		}
		get left() {
			return this.#x;
		}
		get top () {
			return this.#y;
		}
		get width() {
			return this.#width;
		}
		get height() {
			return this.#height;
		}
		get right() {
			return this.#x + (this.#width < 0 ? 0 : this.#width);
		}
		get bottom() {
			return this.#y + (this.#height < 0 ? 0 : this.#height);
		}
	}

	class DOMRectList {
		#rects: DOMRect[];
		constructor(...rects: DOMRect[]) {
			this.#rects = rects;
			return new Proxy<DOMRectList>(this, domRectListProxyObj);
		}
		get length() {
			return this.#rects.length;
		}
		item(index: number) {
			return this.#rects[index] ?? null;
		}
		[index: number]: DOMRect;
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
				throw new SyntaxError(`CustomElementRegistry.define: '${JSON.stringify(name)}' is not a valid custom element name`);
			}
			if (!(constructor instanceof Function)) {
				throw new TypeError("CustomElementRegistry.define: Argument 2 is not a constructor.");
			}
			if (this.#customElements.has(name)) {
				throw new DOMException(`CustomElementRegistry.define: '${JSON.stringify(name)}' has already been defined as a custom element`, DOMException.ERROR_NAMES[DOMException.NOT_SUPPORTED_ERR]);
			}
			if (this.#constructors.has(constructor)) {
				throw new DOMException(`CustomElementRegistry.define: '${JSON.stringify(name)}' and '${JSON.stringify(this.#constructors.get(constructor))}' have the same constructor`, DOMException.ERROR_NAMES[DOMException.NOT_SUPPORTED_ERR]);
			}
			if (options?.extends) {
				if (CustomElementRegistry.#nameRE.test(options.extends)) {
					throw new DOMException(`CustomElementRegistry.define: '${JSON.stringify(name)}' cannot extend a custom element`, DOMException.ERROR_NAMES[DOMException.NOT_SUPPORTED_ERR]);
				} else if (!this.#elements.has(options.extends)) {
					throw new DOMException("CustomElementRegistry.define: Operation is not supported", DOMException.ERROR_NAMES[DOMException.NOT_SUPPORTED_ERR]);
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
				throw new DOMException("An attempt was made to use an object that is not, or is no longer, usable", DOMException.ERROR_NAMES[DOMException.INVALID_STATE_ERR]);
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
		["CDATASection", CDATASection],
		["Comment", Comment],
		["ProcessingInstruction", ProcessingInstruction],
		["Document", Document],
		["HTMLDocument", Document],
		["DocumentFragment", DocumentFragment],
		["ShadowRoot", ShadowRoot],
		["Element", Element],
		["HTMLElement", HTMLElement],
		["SVGElement", SVGElement],
		["MathMLElement", MathMLElement],
		["DOMStringMap", DOMStringMap],
		["DOMRect", DOMRect],
		["DOMRectList", DOMRectList],
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
