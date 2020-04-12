const childrenArr = (elem, children) => {
	if (typeof children === "string") {
		elem.appendChild(document.createTextNode(children));
	} else if (Array.isArray(children)) {
		children.forEach((c) => childrenArr(elem, c));
	} else if (children instanceof Node) {
		elem.appendChild(children);
	}
      };

export const createElements = namespace => (element, properties, children) => {
	const elem = typeof element === "string" ? document.createElementNS(namespace, element) : element instanceof Node ? element : document.createDocumentFragment();
	if (typeof properties === "string" || properties instanceof Array || properties instanceof Node || (typeof children === "object" && !(children instanceof Array) && !(children instanceof Node))) {
		[properties, children] = [children, properties];
	}
	if (typeof properties === "object" && elem instanceof Element) {
		Object.entries(properties).filter(([k, prop]) => prop !== undefined).forEach(([k, prop]) => {
			if (k.startsWith("on") && prop instanceof Function) {
				elem.addEventListener(k.substr(2), prop.prototype ? prop.bind(elem) : prop);
			} else if (k === "class") {
				if (prop) {
					elem.classList.add(...prop.split(" "));
				}
			} else if (k.startsWith("--") && (elem instanceof HTMLElement || elem instanceof SVGElement)) {
				elem.style.setProperty(k, prop);
			} else {
				elem.setAttribute(k, prop);
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
      createHTML = createElements("http://www.w3.org/1999/xhtml"),
      createSVG = createElements("http://www.w3.org/2000/svg"),
      formatText = (text, wrapper) => {
	const df = document.createDocumentFragment(),
	      fn = wrapper instanceof Function ? wrapper : document.createTextNode.bind(document);
	text.split("\n").forEach((text, n) => {
		if (n > 0) {
			df.appendChild(createHTML("br"));
		}
		df.appendChild(fn(text));
	});
	return df;
      },
      clearElement = elem => {
	while (elem.lastChild !== null) {
		elem.removeChild(elem.lastChild);
	}
	return elem;
      },
      text2HTML = text => {
	const d = createHTML("div");
	d.innerHTML = text;
	return Array.from(d.childNodes).map(c => d.removeChild(c));
      },
      autoFocus = node => {
	window.setTimeout(() => node.focus(), 0);
	return node;
      };
