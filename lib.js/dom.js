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
      isEventListenerOrEventListenerObject = props => props instanceof Function || props.handleEvent instanceof Function,
      isEventOptions = props => props.eventOptions instanceof Object,
      isStyleObj = props => !(props.toString instanceof Function),
      bitSet = (a, b) => (a & b) === b;

export const makeElement = (elem, properties, children) => {
	if (typeof properties === "string" || properties instanceof Array || properties instanceof NodeList) {
		children = properties;
	} else if (typeof properties === "object" && (elem instanceof HTMLElement || elem instanceof SVGElement)) {
		for (const [k, prop] of Object.entries(properties)) {
			if (isEventListenerOrEventListenerObject(prop)) {
				const opts = {};
				let ev = k,
				    remove = false;
				if (prop instanceof Function) {
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
				} else if (isEventOptions(prop)) {
					Object.assign(opts, prop.eventOptions);
					remove = !!prop.eventRemove;
				}
				if (ev.startsWith("on")) {
					(remove ? elem.removeEventListener : elem.addEventListener)(ev.substr(2), prop, opts);
				}
			} else if (prop instanceof Array || prop instanceof DOMTokenList) {
				if (k === "class" && prop.length) {
					elem.classList.add(...prop);
				}
			} else if (typeof prop === "boolean") {
				elem.toggleAttribute(k, prop);
			} else if (prop === undefined) {
				elem.removeAttribute(k);
			} else if (!isStyleObj(prop)) {
				elem.setAttribute(k, prop.toString());
			} else if (k === "style") {
				for (const k in prop) {
					if (prop[k] === undefined) {
						elem.style.removeProperty(k);
					} else {
						elem.style.setProperty(k, prop[k]);
					}
				}
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
      event = (handleEvent, options) => ({
	handleEvent,
	"eventOptions": {
		"once": bitSet(options, eventOnce),
		"capture": bitSet(options, eventCapture),
		"passive": bitSet(options, eventPassive),
	},
	"eventRemove": bitSet(options, eventRemove),
      }),
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
