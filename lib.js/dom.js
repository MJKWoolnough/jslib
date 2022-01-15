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
      },
      isEventListenerOrEventListenerObject = prop => prop instanceof Function || (prop instanceof Object && prop.handleEvent instanceof Function),
      isEventObject = prop => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isStyleObj = prop => prop instanceof Object,
      bitSet = (a, b) => (a & b) === b;

export const makeElement = (elem, properties, children) => {
	if (typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof Node) {
		children = properties;
	} else if (typeof properties === "object" && (elem instanceof HTMLElement || elem instanceof SVGElement)) {
		for (const [k, prop] of Object.entries(properties)) {
			if (isEventObject(prop)) {
				if (k.startsWith("on")) {
					const arr = prop instanceof Array;
					elem[arr && prop[2] ? "removeEventListener" : "addEventListener"](k.substr(2), arr ? prop[0] : prop, arr ? prop[1] : {});
				}
			} else if (prop instanceof Array || prop instanceof DOMTokenList) {
				if (k === "class" && prop.length) {
					elem.classList.add(...prop);
				}
			} else if (typeof prop === "boolean") {
				elem.toggleAttribute(k, prop);
			} else if (prop === undefined) {
				elem.removeAttribute(k);
			} else if (k === "style" && isStyleObj(prop)) {
				for (const k in prop) {
					if (prop[k] === undefined) {
						elem.style.removeProperty(k);
					} else {
						elem.style.setProperty(k, prop[k]);
					}
				}
			} else {
				elem.setAttribute(k, prop.toString());
			}
		};
	}
	if (typeof children === "string") {
		elem.textContent = children;
	} else if (children) {
		childrenArr(elem, children);
	}
	return elem;
      },
      eventOnce = 1,
      eventCapture = 2,
      eventPassive = 4,
      eventRemove = 8,
      event = (fn, options, signal) => [fn, {
		"once": bitSet(options, eventOnce),
		"capture": bitSet(options, eventCapture),
		"passive": bitSet(options, eventPassive),
		signal
      }, bitSet(options, eventRemove)],
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
