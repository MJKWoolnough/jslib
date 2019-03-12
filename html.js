"use strict";

const childrenArr = function(elem, children) {
	if (typeof children === "string") {
		elem.appendChild(document.createTextNode(children));
	} else if (children) {
		if (children.hasOwnProperty("length")) {
			Array.from(children).forEach(c => childrenArr(elem, c));
		} else if(children instanceof Node) {
			elem.appendChild(children);
		}
	}
      },
      createElements = function(namespace) {
	return function(element, properties, children) {
		const elem = typeof element === "string" ? document.createElementNS(namespace, element) : element instanceof Node ? element : document.createDocumentFragment();
		if (typeof properties === "string" || properties instanceof Array || properties instanceof Node || (typeof children === "object" && !(children instanceof Array) && !(children instanceof Node))) {
			[properties, children] = [children, properties];
		}
		if (typeof properties === "object") {
			Object.keys(properties).forEach(k => {
				const prop = properties[k];
				if (prop !== undefined) {
					if (k.startsWith("on") && prop instanceof Function) {
						elem.addEventListener(k.substr(2), prop.bind(elem));
					} else if (k === "class") {
						elem.classList.add(...prop.split(" "));
					} else {
						elem.setAttribute(k, prop);
					}
				}
			});
		}
		if (typeof children === "string") {
			elem.textContent = children;
		} else {
			childrenArr(elem, children);
		}
		return elem;
	};
      },
      h = Array.from(document.getElementsByTagName("html")),
      createHTML = createElements(h.length > 0 ? h[0].namespaceURI : "http://www.w3.org/1999/xhtml"),
      formatText = function(text, wrapper = null) {
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
      clearElement = function(elem) {
	while (elem.hasChildNodes()) {
		elem.removeChild(elem.lastChild);
	}
      };

export {createElements, createHTML, formatText, clearElement};
