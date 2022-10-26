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

type EventArray = [Exclude<EventListenerOrEventListenerObject, Bind> | Bind<EventListenerOrEventListenerObject>, AddEventListenerOptions, boolean];

type PropValue = ToString | string[] | DOMTokenList | Function | EventArray | EventListenerObject | StyleObj | ClassObj | undefined;

export type PropsObject = Record<string, PropValue>;

export type Props = PropsObject | NamedNodeMap;

export type Children = string | Node | Children[] | NodeList | HTMLCollection | Binder;

export interface DOMBind<T extends Node> {
	(properties?: Props, children?: Children): T;
	(children?: Children): T;
}

interface FocusElement {
	focus(): void;
}

interface TextContent {
	textContent: string | null;
}

interface BindFn {
	<T extends ToString = ToString>(t: T): Bind<T>;
	(strings: TemplateStringsArray, ...bindings: (Bind | ToString)[]): Binder;
}

const childrenArr = (node: Node, children: Children) => {
	if (children instanceof Binder) {
		const t = new Text(children+"");
		children[setNode](t);
		node.appendChild(t);
	} else if (typeof children === "string") {
		node.appendChild(document.createTextNode(children));
	} else if (Array.isArray(children)) {
		for (const c of children) {
			childrenArr(node, c);
		}
	} else if (children instanceof Node) {
		node.appendChild(children);
	} else if (children instanceof NodeList || children instanceof HTMLCollection) {
		for (const c of Array.from(children)) {
			node.appendChild(c);
		}
	}
      },
      isEventListenerObject = (prop: PropValue): prop is EventListenerObject => prop instanceof Object && (prop as EventListenerObject).handleEvent instanceof Function,
      isEventListenerOrEventListenerObject = (prop: PropValue): prop is EventListenerOrEventListenerObject => prop instanceof Function || (isEventListenerObject(prop) && !(prop instanceof Bind)) || prop instanceof Bind && isEventListenerOrEventListenerObject(prop.value),
      isEventObject = (prop: PropValue): prop is (EventArray | EventListenerOrEventListenerObject) => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isClassObj = (prop: ToString | StyleObj | ClassObj): prop is ClassObj => prop instanceof Object,
      isStyleObj = (prop: ToString | StyleObj): prop is StyleObj => prop instanceof CSSStyleDeclaration || prop instanceof Object,
      setNode = Symbol("setNode"),
      update = Symbol("update"),
      remove = Symbol("remove");

abstract class Binder {
	#set = new Set<WeakRef<TextContent | Binder>>();
	[setNode](n: TextContent | Binder) {
		this.#set.add(new WeakRef(n));
	}
	[update]() {
		const text = this+"";
		for (const wr of this.#set) {
			const ref = wr.deref();
			if (ref) {
				if (ref instanceof Binder) {
					ref[update]();
				} else {
					ref.textContent = text;
				}
			} else {
				this.#set.delete(wr);
			}
		}
	}
	[remove](b: Binder) {
		for (const wr of this.#set) {
			const ref = wr.deref();
			if (!ref || ref === b) {
				this.#set.delete(wr);
			}
		}
	}
	abstract toString(): string;
}

class TemplateBind extends Binder {
	#strings: TemplateStringsArray;
	#bindings: (Bind | ToString)[];
	constructor(strings: TemplateStringsArray, ...bindings: (Bind | ToString)[]) {
		super();
		this.#strings = strings;
		this.#bindings = bindings;
		for (const b of bindings) {
			if (b instanceof Binder) {
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

export class Bind<T extends ToString = ToString> extends Binder {
	#value: T;
	constructor(v: T) {
		super();
		this.#value = v;
		if (v instanceof Binder) {
			v[setNode](this);
		}
	}
	get value() { return this.#value instanceof Bind ? this.#value.value : this.#value; }
	set value(v: T) {
		if (this.#value !== v) {
			if (this.#value instanceof Binder) {
				this.#value[remove](this);
			}
			this.#value = v;
			if (v instanceof Binder) {
				v[setNode](this);
			}
		}
		this[update]();
	}
	handleEvent(e: Event) {
		if (this.#value instanceof Function) {
			this.#value.call(e.currentTarget, e);
		} else if (isEventListenerObject(this.#value)) {
			this.#value.handleEvent(e);
		}
	}
	toString() {
		return this.#value.toString();
	}
}

export const amendNode: mElement = (node?: EventTarget | null, properties?: Props | Children, children?: Children) => {
	if (typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof HTMLCollection || properties instanceof Node || properties instanceof Binder) {
		children = properties;
	} else if (properties instanceof NamedNodeMap && node instanceof Element) {
		for (const prop of properties) {
			node.setAttributeNode(prop.cloneNode() as Attr);
		}
	} else if (node && typeof properties === "object") {
		for (const k in properties) {
			const prop = properties[k as keyof Props];
			if (isEventObject(prop) && k.startsWith("on")) {
				const arr = prop instanceof Array;
				node[arr && prop[2] ? "removeEventListener" : "addEventListener"](k.slice(2), arr ? prop[0] : prop, arr ? prop[1] : false);
			} else if (node instanceof HTMLElement || node instanceof SVGElement) {
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
					if (prop instanceof Binder) {
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
			childrenArr(node, children);
		}
	}
	return node;
},
bindElement = <T extends Element>(ns: string, value: string) => Object.defineProperty((props?: Props | Children, children?: Children) => amendNode(document.createElementNS(ns, value) as T, props, children), "name", {value}),
eventOnce = 1,
eventCapture = 2,
eventPassive = 4,
eventRemove = 8,
event = (fn: Function | Exclude<EventListenerObject, Bind> | Bind<Function | EventListenerObject>, options: number, signal?: AbortSignal): EventArray => [fn as EventListenerOrEventListenerObject, {"once": !!(options&eventOnce), "capture": !!(options&eventCapture), "passive": !!(options&eventPassive), signal}, !!(options&eventRemove)],
createDocumentFragment = (children?: Children) => {
	const df = document.createDocumentFragment();
	if (typeof children === "string") {
		df.textContent = children;
	} else if (children !== undefined) {
		childrenArr(df, children);
	}
	return df;
},
clearNode: mElement = (node?: Node, properties?: Props | Children, children?: Children) => {
	if (!node) {
		return node;
	}
	if (typeof properties === "string") {
		children = properties = void (node.textContent = properties);
	} else if (typeof children === "string") {
		children = void (node.textContent = children);
	} else if (node instanceof Element) {
		node.replaceChildren();
	} else {
		while (node.lastChild !== null) {
			node.lastChild.remove();
		}
	}
	return amendNode(node, properties, children);
},
autoFocus = <T extends FocusElement>(node: T, inputSelect = true) => {
	window.setTimeout(() => {
		node.focus();
		if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && inputSelect) {
			node.select();
		}
	}, 0);
	return node;
},
bind = (<T extends ToString>(v: T | TemplateStringsArray, first?: Bind | ToString, ...bindings: (Bind | ToString)[]) => {
	if (v instanceof Array && first) {
		return new TemplateBind(v, first, ...bindings);
	}
	return new Bind<T>(v as T);
}) as BindFn;
