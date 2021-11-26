interface ToString {
	toString(): string;
}

export type Children = string | Node | Children[] | NodeList;

export type Props = Record<string, ToString | ToString[] | DOMTokenList | Function | Record<string, ToString | undefined> | undefined>;

const childrenArr = (elem: Node, children: Children) => {
	if (typeof children === "string") {
		elem.appendChild(document.createTextNode(children));
	} else if (Array.isArray(children)) {
		for (const c of children) {
			childrenArr(elem, c);
		}
	} else if (children instanceof Node) {
		elem.appendChild(children);
	} else if (children instanceof NodeList) {
		for (const c of children) {
			elem.appendChild(c);
		}
	}
      },
      deepestChild = (elm: Node) => {
	while (elm.firstChild) {
		elm = elm.firstChild;
	}
	return elm;
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
	<T extends Node>(element: T, properties?: Props | Children, children?: Props | Children): T;
	(element: string, properties?: Props, children?: Children): Node;
	(element: string, children?: Children, properties?: Props): Node;
}

interface cHTML extends cElement {
	<K extends keyof HTMLElementTagNameMap>(element: K, properties?: Props, children?: Children): HTMLElementTagNameMap[K];
	<K extends keyof HTMLElementTagNameMap>(element: K, children?: Children, properties?: Props): HTMLElementTagNameMap[K];
}

interface cSVG extends cElement {
	<K extends keyof SVGElementTagNameMap>(element: K, properties?: Props, children?: Children): SVGElementTagNameMap[K];
	<K extends keyof SVGElementTagNameMap>(element: K, children?: Children, properties?: Props): SVGElementTagNameMap[K];
}

export interface DOMBind<T extends Node> {
	(properties?: Props, children?: Children): T;
	(children?: Children, properties?: Props): T;
}

export const createElements: cElements = (namespace: string) => (element: Node | string | null, properties?: Props | Children, children?: Props | Children) => {
	const elem: Node = typeof element === "string" ? document.createElementNS(namespace, element) : element instanceof Node ? element : document.createDocumentFragment();
	if (typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof Node || (typeof children === "object" && !(children instanceof Array) && !(children instanceof Node) && !(children instanceof NodeList))) {
		[properties, children] = [children, properties];
	}
	if (typeof properties === "object" && elem instanceof Element) {
		for (const [k, prop] of Object.entries(properties)) {
			if (prop instanceof Function) {
				const opts: AddEventListenerOptions = {};
				let ev = k;
				Loop:
				while (true) {
					switch (ev.charAt(0)) {
					case '1':
						opts["once"] = true;
						break;
					case 'C':
						opts["capture"] = true;
						break;
					case 'P':
						opts["passive"] = true;
						break;
					default:
						break Loop;
					}
					ev = ev.slice(1);
				}
				if (ev.startsWith("on")) {
					elem.addEventListener(ev.substr(2), prop, opts);
				}
			} else if (k === "class" && (prop instanceof Array || prop instanceof DOMTokenList) && prop.length > 0) {
				elem.classList.add(...prop);
			} else if (k === "style" && typeof prop === "object" && (elem instanceof HTMLElement || elem instanceof SVGElement)) {
				for (const k in prop) {
					if (prop[k] === undefined) {
						elem.style.removeProperty(k);
					} else {
						elem.style.setProperty(k, prop[k] as string);
					}
				}
			} else if (typeof prop === "boolean") {
				elem.toggleAttribute(k, prop);
			} else if (prop === undefined) {
				elem.removeAttribute(k);
			} else if (prop.toString instanceof Function) {
				elem.setAttribute(k, prop.toString());
			}
		};
	}
	if (typeof children === "string") {
		elem.textContent = children;
	} else if (children && (children instanceof Array || children instanceof Node || children instanceof NodeList)) {
		childrenArr(elem, children);
	}
	return elem;
      },
      htmlNS = "http://www.w3.org/1999/xhtml",
      svgNS = "http://www.w3.org/2000/svg",
      createHTML = createElements(htmlNS),
      createSVG = createElements(svgNS),
      createDocumentFragment = (children?: Children) => {
	const elem = document.createDocumentFragment();
	if (typeof children === "string") {
		elem.textContent = children;
	} else if (children && (children instanceof Array || children instanceof Node)) {
		childrenArr(elem, children);
	}
	return elem;
      },
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
      removeEventListeners = <T extends Node>(elem: T) => {
	const newElem = elem.cloneNode(false) as T;
	while (elem.firstChild) {
		newElem.appendChild(elem.firstChild);
	}
	if (elem.parentNode) {
		elem.parentNode.replaceChild(newElem, elem);
	}
	return newElem;
      },
      text2HTML = (text: string): Node[] => {
	const d = createHTML("div");
	d.innerHTML = text;
	return Array.from(d.childNodes).map(c => d.removeChild(c));
      },
      autoFocus = <T extends HTMLElement | SVGElement>(node: T, inputSelect = true) => {
	window.setTimeout(() => {
		node.focus();
		if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && inputSelect) {
			node.select();
		}
	}, 0);
	return node;
      },
      walkNode = function* (elm: Node, self = false) {
	for (let e = deepestChild(elm); e !== elm; e = e.nextSibling ? deepestChild(e.nextSibling) : e.parentNode!) {
		yield e;
	}
	if (self) {
		yield elm;
	}
      };
