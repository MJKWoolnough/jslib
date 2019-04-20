"use strict";

const childrenArr = (elem, children) => {
	if (typeof children === "string") {
		elem.appendChild(document.createTextNode(children));
	} else if (Array.isArray(children)) {
		children.forEach((c) => childrenArr(elem, c));
	} else if (children instanceof Node) {
		elem.appendChild(children);
	}
      },
      h = Array.from(document.getElementsByTagName("html"));

export const createElements = namespace => (element, properties, children) => {
	const elem = typeof element === "string" ? document.createElementNS(namespace, element) : element instanceof Node ? element : document.createDocumentFragment();
	if (typeof properties === "string" || properties instanceof Array || properties instanceof Node || (typeof children === "object" && !(children instanceof Array) && !(children instanceof Node))) {
		[properties, children] = [children, properties];
	}
	if (typeof properties === "object") {
		Object.entries(properties).filter(([k, prop]) => prop !== undefined).forEach(([k, prop]) => {
			if (k.startsWith("on") && prop instanceof Function) {
				elem.addEventListener(k.substr(2), prop.bind(elem));
			} else if (k === "class" && elem instanceof Element) {
				elem.classList.add(...prop.split(" "));
			} else if (elem instanceof Element) {
				elem.setAttribute(k, prop);
			} else {
				const attr = document.createAttributeNS(namespace, k);
				attr.value = prop;
				elem.appendChild(attr);
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
      formatText = (text, wrapper) => {
	const df = document.createDocumentFragment();
	text.split("\n").forEach((text, n) => {
		if (n > 0) {
			df.appendChild(createHTML("br"));
		}
		if (wrapper instanceof Function) {
			df.appendChild(wrapper(text));
		} else {
			df.appendChild(document.createTextNode(text));
		}
	});
	return df;
      },
      clearElement = elem => {
	while (elem.lastChild !== null) {
		elem.removeChild(elem.lastChild);
	}
      };
