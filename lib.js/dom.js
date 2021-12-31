const childrenArr = (elem, children) => {
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
      deepestChild = elm => {
	while (elm.firstChild) {
		elm = elm.firstChild;
	}
	return elm;
      };

export const makeElement = (elem, properties, children) => {
	if (typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof Node || (typeof children === "object" && !(children instanceof Array) && !(children instanceof Node) && !(children instanceof NodeList))) {
		[properties, children] = [children, properties];
	}
	if (typeof properties === "object" && elem instanceof Element) {
		for (const [k, prop] of Object.entries(properties)) {
			if (prop instanceof Function) {
				const opts = {};
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
						elem.style.setProperty(k, prop[k]);
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
      createDocumentFragment = children => {
	const elem = document.createDocumentFragment();
	if (typeof children === "string") {
		elem.textContent = children;
	} else if (children !== undefined) {
		childrenArr(elem, children);
	}
	return elem;
      },
      clearElement = elem => {
	if (elem instanceof Element) {
		elem.replaceChildren();
	} else {
		while (elem.lastChild !== null) {
			elem.lastChild.remove();
		}
	}
	return elem;
      },
      removeEventListeners = elem => {
	const newElem = elem.cloneNode(false);
	while (elem.firstChild) {
		newElem.appendChild(elem.firstChild);
	}
	if (elem.parentNode) {
		elem.parentNode.replaceChild(newElem, elem);
	}
	return newElem;
      },
      text2HTML = text => {
	const d = document.createElement("template");
	d.innerHTML = text;
	return d.content;
      },
      autoFocus = (node, inputSelect = true) => {
	window.setTimeout(() => {
		node.focus();
		if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && inputSelect) {
			node.select();
		}
	}, 0);
	return node;
      },
      walkNode = function* (elm, self) {
	for (let e = deepestChild(elm); e !== elm; e = e.nextSibling ? deepestChild(e.nextSibling) : e.parentNode) {
		while (yield e) {}
	}
	if (self) {
		while (yield elm) {}
	}
      };
