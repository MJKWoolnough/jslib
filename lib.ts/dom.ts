interface ToString {
	toString(): string;
}

interface mElement {
	<T extends Node>(element: T, properties?: Props, children?: Children): T;
	<T extends Node>(element: T, children?: Children): T;
	<T extends Node>(element: T, properties?: Props | Children, children?: Children): T;
}

type StyleObj = Record<string, ToString | undefined> | CSSStyleDeclaration;

type EventArray = [EventListenerOrEventListenerObject, AddEventListenerOptions, boolean];

type PropValue = ToString | string[] | DOMTokenList | Function | EventArray | EventListenerObject | StyleObj | undefined;

export type Props = Record<string, PropValue>;

export type Children = string | Node | Children[] | NodeList | HTMLCollection;

export interface DOMBind<T extends Node> {
	(properties?: Props, children?: Children): T;
	(children?: Children): T;
}

const childrenArr = (node: Node, children: Children) => {
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
      deepestChild = (node: Node) => {
	while (node.firstChild) {
		node = node.firstChild;
	}
	return node;
      },
      isEventListenerOrEventListenerObject = (prop: PropValue): prop is EventListenerOrEventListenerObject => prop instanceof Function || (prop instanceof Object && (prop as EventListenerObject).handleEvent instanceof Function),
      isEventObject = (prop: PropValue): prop is (EventArray | EventListenerOrEventListenerObject) => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isStyleObj = (prop: ToString | StyleObj): prop is StyleObj => prop instanceof CSSStyleDeclaration || prop instanceof Object;

export const amendNode: mElement = (node: Node, properties?: Props | Children, children?: Children) => {
	if (typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof HTMLCollection || properties instanceof Node) {
		children = properties;
	} else if (typeof properties === "object") {
		for (const [k, prop] of Object.entries(properties)) {
			if (isEventObject(prop)) {
				if (k.startsWith("on") && node instanceof EventTarget) {
					const arr = prop instanceof Array;
					node[arr && prop[2] ? "removeEventListener" : "addEventListener"](k.substr(2), arr ? prop[0] : prop, arr ? prop[1] : false);
				}
			} else if (node instanceof HTMLElement || node instanceof SVGElement) {
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
event = (fn: Function | EventListenerObject, options: number, signal?: AbortSignal): EventArray => [fn as EventListenerOrEventListenerObject, {"once": !!(options&eventOnce), "capture": !!(options&eventCapture), "passive": !!(options&eventPassive), signal}, !!(options&eventRemove)],
createDocumentFragment = (children?: Children) => {
	const df = document.createDocumentFragment();
	if (typeof children === "string") {
		df.textContent = children;
	} else if (children !== undefined) {
		childrenArr(df, children);
	}
	return df;
},
clearNode: mElement = (node: Node, properties?: Props | Children, children?: Children) => {
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
autoFocus = <T extends HTMLElement | SVGElement>(node: T, inputSelect = true) => {
	window.setTimeout(() => {
		node.focus();
		if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && inputSelect) {
			node.select();
		}
	}, 0);
	return node;
},
walkNode = function* (elm: Node, self = false): Generator<Node, true | undefined> {
	for (let e = deepestChild(elm); e !== elm; e = e.nextSibling ? deepestChild(e.nextSibling) : e.parentNode!) {
		while (yield e) {}
	}
	if (self) {
		while (yield elm) {}
	}
	return;
};
