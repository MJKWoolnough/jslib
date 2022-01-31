const childrenArr = (node, children) => {
	if (typeof children === "string") {
		node.appendChild(document.createTextNode(children));
	} else if (Array.isArray(children)) {
		for (const c of children) {
			childrenArr(node, c);
		}
	} else if (children instanceof Node) {
		node.appendChild(children);
	} else if (children instanceof NodeList || children instanceof HTMLCollection) {
		for (const c of Array.from(children)) {
			node.appendChild(c);
		}
	}
      },
      isEventListenerOrEventListenerObject = prop => prop instanceof Function || (prop instanceof Object && prop.handleEvent instanceof Function),
      isEventObject = prop => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isStyleObj = prop => prop instanceof CSSStyleDeclaration || prop instanceof Object;

export const amendNode = (node, properties, children) => {
	if (typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof HTMLCollection || properties instanceof Node) {
		children = properties;
	} else if (typeof properties === "object") {
		for (const [k, prop] of Object.entries(properties)) {
			if (isEventObject(prop)) {
				if (k.startsWith("on") && node instanceof EventTarget) {
					const arr = prop instanceof Array;
					node[arr && prop[2] ? "removeEventListener" : "addEventListener"](k.substr(2), arr ? prop[0] : prop, arr ? prop[1] : false);
				}
			} else if (node instanceof HTMLElement || elem instanceof SVGElement) {
				if (prop instanceof Array || prop instanceof DOMTokenList) {
					if (k === "class" && prop.length) {
						for (let c of prop) {
							const f = c.slice(0, 1),
							      m = f !== '!' && (f !== '~' || undefined);
							node.classList.toggle(m ? c : c.slice(1), m);
						}
					}
				} else if (typeof prop === "boolean") {
					node.toggleAttribute(k, prop);
				} else if (prop === undefined) {
					node.removeAttribute(k);
				} else if (k === "style" && isStyleObj(prop)) {
					for (const [k, p] of prop instanceof CSSStyleDeclaration ? Array.from(prop, k => [k, prop.getPropertyValue(k)]) : Object.entries(prop)) {
						if (p === undefined) {
							node.style.removeProperty(k);
						} else {
							node.style.setProperty(k, p.toString());
						}
					}
				} else {
					node.setAttribute(k, prop.toString());
				}
			}
		};
	}
	if (typeof children === "string" && !node.firstChild) {
		node.textContent = children;
	} else if (children) {
		childrenArr(node, children);
	}
	return node;
},
eventOnce = 1,
eventCapture = 2,
eventPassive = 4,
eventRemove = 8,
event = (fn, options, signal) => [fn, {"once": !!(options&eventOnce), "capture": !!(options&eventCapture), "passive": !!(options&eventPassive), signal}, !!(options&eventRemove)],
createDocumentFragment = children => {
	const df = document.createDocumentFragment();
	if (typeof children === "string") {
		df.textContent = children;
	} else if (children !== undefined) {
		childrenArr(df, children);
	}
	return df;
},
clearNode = (node, properties, children) => {
	if (typeof properties === "string") {
		children = properties = void (node.textContent = properties);
	} else if (typeof children === "string") {
		children = void (node.textContent = children);
	} else if (node instanceof Element) {
		node.replaceChildren();
	} else {
		while (node.lastChild !== null) {
			node.lastChild.remove();
		}
	}
	return amendNode(node, properties, children);
},
autoFocus = (node, inputSelect = true) => {
	window.setTimeout(() => {
		node.focus();
		if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && inputSelect) {
			node.select();
		}
	}, 0);
	return node;
};
