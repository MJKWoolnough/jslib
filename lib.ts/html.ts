interface NestedChildren extends Array<NestedChildren | string | Node>{}

const childrenArr = (elem: Node, children: NestedChildren | string | Node) => {
	if (typeof children === "string") {
		elem.appendChild(document.createTextNode(children));
	} else if (Array.isArray(children)) {
			children.forEach((c:NestedChildren | string | Node) => childrenArr(elem, c));
	} else if(children instanceof Node) {
		elem.appendChild(children);
	}
      },
      h = Array.from(document.getElementsByTagName("html"));

export const createElements = (namespace: string) => (element: Node | string, properties?: Object | NestedChildren, children?: Object | NestedChildren) => {
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
      createHTML = createElements(h.length > 0 && h[0].namespaceURI !== null ? h[0].namespaceURI : "http://www.w3.org/1999/xhtml"),
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
