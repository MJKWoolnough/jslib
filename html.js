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
	      },
	      layers = function(container, loader) {
		const layers = [],
		      closer = function(closerFn) {
			clearElement(container);
			const elm = layers.pop();
			if (elm !== undefined) {
				container.appendChild(elm);
			} else {
				window.removeEventListener("keypress", keyPress);
			}
			if (closerFn instanceof Function) {
				closerFn();
			}
		      },
		      keyPress = function(e) {
			if (loading) {
				return false;
			}
			e = e || window.event;
			if (e.keyCode === 27) {
				closer();
			}
		      },
		      closeLoadingLayer = function() {
			loading = false;
			container.removeChild(container.lastChild);
		      },
		      defaultLoader = loader ? loader : createHTML("div", {"class": "loading"});
		let loading = false;
		return Object.freeze({
			"addLayer": closerFn => {
				if (layers.length === 0) {
					window.addEventListener("keypress", keyPress);
				}
				if (container.hasChildNodes()) {
					const df = document.createDocumentFragment();
					while (container.hasChildNodes()) {
						df.appendChild(container.firstChild);
					}
					layers.push(df);
				}
				return container.appendChild(createHTML("div", createHTML("span", {"class": "closer", "onclick": closer.bind(null, closerFn)}, "X")));
			},
			"removeLayer": closer,
			"loading": function(p, loadDiv) {
				if (loadDiv === undefined) {
					loadDiv = defaultLoader;
				}
				loading = true;
				container.appendChild(loadDiv);
				return p.finally(closeLoadingLayer);
			}
		});
	      };
	return Object.freeze({createElements, createHTML, formatText, clearElement, layers});
}()));
