interface ToString {
	toString(): string;
}

interface mElement {
	<T extends EventTarget>(element: T, properties: Record<`on${string}`, EventListenerObject | EventArray | Function>): T;
	<T extends Node>(element: T, properties?: Props, children?: Children): T;
	<T extends Node>(element: T, children?: Children): T;
	<T extends Node>(element?: T | null, properties?: Props | Children, children?: Children): T;
}

type ClassObj = Record<string, boolean | null>;

type StyleObj = Record<string, ToString | undefined> | CSSStyleDeclaration;

type EventArray = [Exclude<EventListenerOrEventListenerObject, Bound> | Bound<EventListenerOrEventListenerObject>, AddEventListenerOptions, boolean];

type PropValue = ToString | string[] | DOMTokenList | Function | EventArray | EventListenerObject | StyleObj | ClassObj | undefined;

export type PropsObject = Record<string, PropValue>;

export type Props = PropsObject | NamedNodeMap;

export type Children = string | Node | Children[] | NodeList | HTMLCollection | Binding;

export interface DOMBind<T extends Node> {
	(properties?: Props, children?: Children): T;
	(children?: Children): T;
}

interface TextContent {
	textContent: string | null;
}

interface BindFn {
	<T extends ToString = ToString>(t: T): Bound<T>;
	(strings: TemplateStringsArray, ...bindings: (Bound | ToString)[]): Binding;
}

interface NodeAttributes extends Node {
	readonly classList: DOMTokenList;
	readonly style: CSSStyleDeclaration;
	getAttributeNode(qualifiedName: string): Attr | null;
	removeAttribute(qualifiedName: string): void;
	setAttribute(qualifiedName: string, value: string): void;
	toggleAttribute(qualifiedName: string, force?: boolean): boolean;
}

const childrenArr = (children: Children, res: (Node | string)[] = []) => {
	if (children instanceof Binding) {
		res.push(children[setNode](new Text(children+"")));
	} else if (typeof children === "string" || children instanceof Node) {
		res.push(children);
	} else if (Array.isArray(children)) {
		for (const c of children) {
			childrenArr(c, res);
		}
	} else if (children instanceof NodeList || children instanceof HTMLCollection) {
		res.push(...children);
	}
	return res;
      },
      isEventListenerObject = (prop: PropValue): prop is EventListenerObject => prop instanceof Object && (prop as EventListenerObject).handleEvent instanceof Function,
      isEventListenerOrEventListenerObject = (prop: PropValue): prop is EventListenerOrEventListenerObject => prop instanceof Function || (isEventListenerObject(prop) && !(prop instanceof Bound)) || prop instanceof Bound && isEventListenerOrEventListenerObject(prop.value),
      isEventObject = (prop: PropValue): prop is (EventArray | EventListenerOrEventListenerObject) => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isClassObj = (prop: ToString | StyleObj | ClassObj): prop is ClassObj => prop instanceof Object && !(prop instanceof Binding),
      isStyleObj = (prop: ToString | StyleObj): prop is StyleObj => prop instanceof CSSStyleDeclaration || (prop instanceof Object && !(prop instanceof Binding)),
      isNodeAttributes = (n: EventTarget): n is NodeAttributes => !!(n as NodeAttributes).style && !!(n as NodeAttributes).classList && !!(n as NodeAttributes).getAttributeNode && !!(n as NodeAttributes).removeAttribute && !!(n as NodeAttributes).setAttribute && !!(n as NodeAttributes).toggleAttribute,
      setNode = Symbol("setNode"),
      update = Symbol("update"),
      remove = Symbol("remove");

export abstract class Binding {
	#set = new Set<WeakRef<TextContent | Binding>>();
	[setNode]<T extends TextContent | Binding>(n: T) {
		this.#set.add(new WeakRef(n));
		return n;
	}
	[update]() {
		const text = this+"";
		for (const wr of this.#set) {
			const ref = wr.deref();
			if (ref) {
				if (ref instanceof Binding) {
					ref[update]();
				} else {
					ref.textContent = text;
				}
			} else {
				this.#set.delete(wr);
			}
		}
	}
	[remove](b: Binding) {
		for (const wr of this.#set) {
			const ref = wr.deref();
			if (!ref || ref === b) {
				this.#set.delete(wr);
			}
		}
	}
	abstract toString(): string;
}

class TemplateBind extends Binding {
	#strings: TemplateStringsArray;
	#bindings: (Bound | ToString)[];
	constructor(strings: TemplateStringsArray, ...bindings: (Bound | ToString)[]) {
		super();
		this.#strings = strings;
		this.#bindings = bindings;
		for (const b of bindings) {
			if (b instanceof Binding) {
				b[setNode](this);
			}
		}
	}
	toString() {
		let str = "";
		for (let i = 0; i < this.#strings.length; i++) {
			str += this.#strings[i] + (this.#bindings[i] ?? "");
		}
		return str;
	}
}

export class Bound<T extends ToString = ToString> extends Binding {
	#value: T;
	constructor(v: T) {
		super();
		this.#value = v;
		if (v instanceof Binding) {
			v[setNode](this);
		}
	}
	get value() { return this.#value instanceof Bound ? this.#value.value : this.#value; }
	set value(v: T) {
		if (this.#value !== v) {
			if (this.#value instanceof Binding) {
				this.#value[remove](this);
			}
			this.#value = v;
			if (v instanceof Binding) {
				v[setNode](this);
			}
		}
		this[update]();
	}
	handleEvent(e: Event) {
		const v = this.value;
		if (v instanceof Function) {
			v.call(e.currentTarget, e);
		} else if (isEventListenerObject(v)) {
			v.handleEvent(e);
		}
	}
	toString() {
		return this.value.toString();
	}
}

export const isChildren = (properties: Props | Children): properties is Children => typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof HTMLCollection || properties instanceof Node || properties instanceof Binding,
amendNode: mElement = (node?: EventTarget | null, properties?: Props | Children, children?: Children) => {
	if (properties && isChildren(properties)) {
		children = properties;
	} else if (properties instanceof NamedNodeMap && node instanceof Element) {
		for (const prop of properties) {
			node.setAttributeNode(prop.cloneNode() as Attr);
		}
	} else if (node && typeof properties === "object") {
		const isNode = isNodeAttributes(node);
		for (const k in properties) {
			const prop = properties[k as keyof Props];
			if (isEventObject(prop) && k.startsWith("on")) {
				const arr = prop instanceof Array;
				node[arr && prop[2] ? "removeEventListener" : "addEventListener"](k.slice(2), arr ? prop[0] : prop, arr ? prop[1] : false);
			} else if (isNode) {
				if (typeof prop === "boolean") {
					node.toggleAttribute(k, prop);
				} else if (prop === undefined) {
					node.removeAttribute(k);
				} else if (prop instanceof Array || prop instanceof DOMTokenList) {
					if (k === "class" && prop.length) {
						for (let c of prop) {
							const f = c.slice(0, 1),
							      m = f !== '!' && (f !== '~' || undefined);
							node.classList.toggle(m ? c : c.slice(1), m);
						}
					}
				} else if (k === "class" && isClassObj(prop)) {
					for (const k in prop) {
						node.classList.toggle(k, prop[k] ?? undefined);
					}
				} else if (k === "style" && isStyleObj(prop)) {
					for (const [k, p] of prop instanceof CSSStyleDeclaration ? Array.from(prop, k => [k, prop.getPropertyValue(k)]) : Object.entries(prop)) {
						if (p === undefined) {
							node.style.removeProperty(k);
						} else {
							node.style.setProperty(k, p.toString());
						}
					}
				} else {
					node.setAttribute(k, prop as string);
					if (prop instanceof Binding) {
						const p = node.getAttributeNode(k);
						if (p) {
							prop[setNode](p);
						}
					}
				}
			}
		}
	}
	if (node instanceof Node) {
		if (typeof children === "string" && !node.firstChild) {
			node.textContent = children;
		} else if (children) {
			if (children instanceof Node) {
				node.appendChild(children);
			} else if (node instanceof Element || node instanceof DocumentFragment) {
				node.append(...childrenArr(children));
			} else {
				node.appendChild(createDocumentFragment(children));
			}
		}
	}
	return node;
},
bindElement = <T extends Element>(ns: string, value: string) => Object.defineProperty((props?: Props | Children, children?: Children) => amendNode(document.createElementNS(ns, value) as T, props, children), "name", {value}),
eventOnce = 1,
eventCapture = 2,
eventPassive = 4,
eventRemove = 8,
event = (fn: Function | Exclude<EventListenerObject, Bound> | Bound<Function | EventListenerObject>, options: number, signal?: AbortSignal): EventArray => [fn as EventListenerOrEventListenerObject, {"once": !!(options&eventOnce), "capture": !!(options&eventCapture), "passive": !!(options&eventPassive), signal}, !!(options&eventRemove)],
createDocumentFragment = (children?: Children) => {
	const df = document.createDocumentFragment();
	if (typeof children === "string") {
		df.textContent = children;
	} else if (children instanceof Node) {
		df.append(children);
	} else if (children !== undefined) {
		df.append(...childrenArr(children));
	}
	return df;
},
clearNode: mElement = (node?: Node, properties?: Props | Children, children?: Children) => {
	if (!node) {
		return node;
	}
	if (properties && isChildren(properties)) {
		properties = void (children = properties);
	}
	if (typeof children === "string") {
		children = void (node.textContent = children);
	} else if (children && node instanceof Element) {
		children = void node.replaceChildren(...childrenArr(children));
	} else {
		while (node.lastChild !== null) {
			node.lastChild.remove();
		}
	}
	return amendNode(node, properties, children);
},
bind = (<T extends ToString>(v: T | TemplateStringsArray, first?: Bound | ToString, ...bindings: (Bound | ToString)[]) => {
	if (v instanceof Array && first) {
		return new TemplateBind(v, first, ...bindings);
	}
	return new Bound<T>(v as T);
}) as BindFn;
