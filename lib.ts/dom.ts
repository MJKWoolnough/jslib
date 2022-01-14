interface ToString {
	toString(): string;
}

type StyleObj = Record<string, ToString | undefined>;

export type Children = string | Node | Children[] | NodeList;

type PropValue = ToString | string[] | DOMTokenList | Function | EventListenerObjectWithOptions | StyleObj | undefined;

export type Props = Record<string, PropValue>;

type EventListenerObjectWithOptions = EventListenerObject & {
	eventOptions?: AddEventListenerOptions;
	eventRemove?: boolean;
}

const childrenArr = (elem: Node, children: Children) => {
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
      deepestChild = (elm: Node) => {
	while (elm.firstChild) {
		elm = elm.firstChild;
	}
	return elm;
      },
      isEventListenerOrEventListenerObject = (props: PropValue): props is EventListenerOrEventListenerObject => props instanceof Function || (props as EventListenerObject).handleEvent instanceof Function,
      isEventOptions = (prop: EventListenerObject): prop is EventListenerObjectWithOptions => (prop as EventListenerObjectWithOptions).eventOptions instanceof Object,
      isStyleObj = (prop: ToString | StyleObj): prop is StyleObj => prop instanceof Object,
      bitSet = (a: number, b: number) => (a & b) === b;

interface mElement {
	<T extends Node>(element: T, properties?: Props, children?: Children): T;
	<T extends Node>(element: T, children?: Children): T;
	<T extends Node>(element: T, properties?: Props | Children, children?: Children): T;
}

export interface DOMBind<T extends Node> {
	(properties?: Props, children?: Children): T;
	(children?: Children): T;
}

export const makeElement: mElement = (elem: Node, properties?: Props | Children, children?: Children) => {
	if (typeof properties === "string" || properties instanceof Array || properties instanceof NodeList || properties instanceof Node) {
		children = properties;
	} else if (typeof properties === "object" && (elem instanceof HTMLElement || elem instanceof SVGElement)) {
		for (const [k, prop] of Object.entries(properties) as [string, PropValue][]) {
			if (prop && isEventListenerOrEventListenerObject(prop)) {
				if (k.startsWith("on")) {
					const opts: AddEventListenerOptions = {};
					let remove = false;
					if (isEventOptions(prop)) {
						Object.assign(opts, prop.eventOptions);
						remove = !!prop.eventRemove;
					}
					(remove ? elem.removeEventListener : elem.addEventListener).call(elem, k.substr(2), prop, opts);
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
						elem.style.setProperty(k, prop[k] as string);
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
      event = <T extends Event>(handleEvent: (e: T) => void, options: number, signal?: AbortSignal): EventListenerObjectWithOptions => ({
	handleEvent,
	"eventOptions": {
		"once": bitSet(options, eventOnce),
		"capture": bitSet(options, eventCapture),
		"passive": bitSet(options, eventPassive),
		signal
	},
	"eventRemove": bitSet(options, eventRemove),
      }),
      createDocumentFragment = (children?: Children) => {
	const elem = document.createDocumentFragment();
	if (typeof children === "string") {
		elem.textContent = children;
	} else if (children !== undefined) {
		childrenArr(elem, children);
	}
	return elem;
      },
      clearElement = <T extends Node>(elem: T) => {
	if (elem instanceof Element) {
		elem.replaceChildren();
	} else {
		while (elem.lastChild !== null) {
			elem.lastChild.remove();
		}
	}
	return elem;
      },
      text2HTML = (text: string): DocumentFragment => {
	const d = document.createElement("template");
	d.innerHTML = text;
	return d.content;
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
