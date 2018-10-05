"use strict";
offer((function() {
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
			const elem = typeof element === "string" ? document.createElementNS(namespace, element) : element;
			if (typeof properties === "string" || properties instanceof Array || properties instanceof Node || (typeof children === "object" && !(children instanceof Array) && !(children instanceof Node))) {
				[properties, children] = [children, properties];
			}
			if (typeof properties === "object") {
				Object.keys(properties).forEach(k => {
					const prop = properties[k];
					if (prop !== undefined) {
						if (k.substr(0, 2) === "on" && prop instanceof Function) {
							elem.addEventListener(k.substr(2), prop.bind(elem));
						} else if (k === "class") {
							elem.classList.add(...prop.split(" "));
						} else {
							elem.setAttribute(k, prop)
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
	      formatText = function(text) {
		const df = document.createDocumentFragment();
		text.split("\n").forEach((t, n) => {
			if (n > 0) {
				df.appendChild(creatHTML("br"));
			}
			df.appendChild(document.createTextNode(child));
		});
		return df;
	      },
	      clearElement = function(elem) {
		while (elem.hasChildNodes()) {
			elem.removeChild(elem.lastChild);
		}
	      };
	return Object.freeze({createElements, createHTML, formatText, clearElement});
}()));
