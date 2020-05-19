export type Children = string | Node | Children[];

export type Props = Record<string, number | string | string[] | DOMTokenList | Function | undefined | null>;

const childrenArr = (elem: Node, children: Children) => {
	if (typeof children === "string") {
		elem.appendChild(document.createTextNode(children));
	} else if (Array.isArray(children)) {
		children.forEach((c: Children) => childrenArr(elem, c));
	} else if(children instanceof Node) {
		elem.appendChild(children);
	}
      };


interface cElements {
	(namespace: string): cElement;
	(namespace: "http://www.w3.org/1999/xhtml"): cHTML;
	(namespace: "http://www.w3.org/2000/svg"): cSVG;
}

interface cElement {
	(element: null | DocumentFragment, children?: Children): Node;
	<T extends Node>(element: T, properties?: Props, children?: Children): T;
	<T extends Node>(element: T, children?: Children, properties?: Props): T;
	<T extends Node>(element: T, properties?: Props | Children, children?: Props |Children): T;
	(element: string, properties?: Props, children?: Children): Node;
	(element: string, children?: Children, properties?: Props): Node;
};

interface cHTML extends cElement {
	<K extends keyof HTMLElementTagNameMap>(element: K, properties?: Props, children?: Children): HTMLElementTagNameMap[K];
	<K extends keyof HTMLElementTagNameMap>(element: K, children?: Children, properties?: Props): HTMLElementTagNameMap[K];
};

interface cSVG extends cElement {
	<K extends keyof SVGElementTagNameMap>(element: K, properties?: Props, children?: Children): SVGElementTagNameMap[K];
	<K extends keyof SVGElementTagNameMap>(element: K, children?: Children, properties?: Props): SVGElementTagNameMap[K];
};

export interface DOMBind<T extends Node> {
	(properties?: Props, children?: Children): T;
	(children?: Children, properties?: Props): T;
}

export const createElements: cElements = (namespace: string) => (element: Node | string | null, properties?: Props | Children, children?: Props | Children) => {
	const elem: Node = typeof element === "string" ? document.createElementNS(namespace, element) : element instanceof Node ? element : document.createDocumentFragment();
	if (typeof properties === "string" || properties instanceof Array || properties instanceof Node || (typeof children === "object" && !(children instanceof Array) && !(children instanceof Node))) {
		[properties, children] = [children, properties];
	}
	if (typeof properties === "object" && elem instanceof Element) {
		for (const [k, prop] of Object.entries(properties)) {
			if (prop instanceof Function) {
				if (k.startsWith("on")) {
					elem.addEventListener(k.substr(2), prop);
				}
			} else if (k === "class") {
				if (typeof prop === "string" && prop.length > 0) {
					elem.classList.add(...prop.split(" "));
				} else if ((prop instanceof Array || prop instanceof DOMTokenList) && prop.length > 0) {
					elem.classList.add(...prop);
				}
			} else if (typeof prop === "string" || typeof prop === "number") {
				if (k.startsWith("--")) {
					if (elem instanceof HTMLElement || elem instanceof SVGElement) {
						elem.style.setProperty(k, prop as string);
					}
				} else {
					elem.setAttribute(k, prop as string);
				}
			}
		};
	}
	if (typeof children === "string") {
		elem.textContent = children;
	} else if (children && (children instanceof Array || children instanceof Node)) {
		childrenArr(elem, children);
	}
	return elem;
      },
      createHTML = createElements("http://www.w3.org/1999/xhtml"),
      createSVG = createElements("http://www.w3.org/2000/svg"),
      formatText = (text: string, wrapper?: (text: string) => Node) => {
	const df = document.createDocumentFragment(),
	      fn = wrapper instanceof Function ? wrapper : document.createTextNode.bind(document);
	text.split("\n").forEach((text, n) => {
		if (n > 0) {
			df.appendChild(createHTML("br"));
		}
		df.appendChild(fn(text));
	});
	return df;
      },
      clearElement = <T extends Node>(elem: T) => {
	while (elem.lastChild !== null) {
		elem.removeChild(elem.lastChild);
	}
	return elem;
      },
      removeEventListeners = <T extends ChildNode & Node>(elem: T) => {
	const newElem = elem.cloneNode(false) as T;
	while (elem.firstChild) {
		newElem.appendChild(elem.firstChild);
	}
	elem.replaceWith(newElem);
	return newElem;
      },
      text2HTML = (text: string): Node[] => {
	const d = createHTML("div");
	d.innerHTML = text;
	return Array.from(d.childNodes).map(c => d.removeChild(c));
      },
      autoFocus = <T extends HTMLElement | SVGElement>(node: T) => {
	window.setTimeout(() => node.focus(), 0);
	return node;
      };
