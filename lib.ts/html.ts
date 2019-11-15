interface NestedChildren extends Array<NestedChildren | string | Node>{}

const childrenArr = (elem: Node, children: NestedChildren | string | Node) => {
	if (typeof children === "string") {
		elem.appendChild(document.createTextNode(children));
	} else if (Array.isArray(children)) {
			children.forEach((c:NestedChildren | string | Node) => childrenArr(elem, c));
	} else if(children instanceof Node) {
		elem.appendChild(children);
	}
      };

type Props = Record<string, string | Function>;

type Children = NestedChildren | string | Node;

interface cElements {
	(namespace: string): cElement;
	(namespace: "http://www.w3.org/1999/xhtml"): cHTML;
	(namespace: "http://www.w3.org/2000/svg"): cSVG;
}

interface cElement {
	(element: null, children?: Children): Node;
	<T extends Node>(element: T, properties?: Props, children?: Children): T;
	<T extends Node>(element: T, children?: Children, properties?: Props): T;
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

export const createElements: cElements = (namespace: string) => (element: Node | string | null, properties?: Props | Children, children?: Props | Children) => {
	const elem: Node = typeof element === "string" ? document.createElementNS(namespace, element) : element instanceof Node ? element : document.createDocumentFragment();
	if (typeof properties === "string" || properties instanceof Array || properties instanceof Node || (typeof children === "object" && !(children instanceof Array) && !(children instanceof Node))) {
		[properties, children] = [children, properties];
	}
	if (typeof properties === "object" && elem instanceof Element) {
		Object.entries(properties).filter(([k, prop]) => prop !== undefined).forEach(([k, prop]) => {
			if (k.startsWith("on") && prop instanceof Function) {
				elem.addEventListener(k.substr(2), prop.bind(elem));
			} else if (k === "class") {
				elem.classList.add(...prop.split(" "));
			} else {
				elem.setAttribute(k, prop);
			}
		});
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
      clearElement = (elem: Node) => {
	while (elem.lastChild !== null) {
		elem.removeChild(elem.lastChild);
	}
	return elem;
      };
