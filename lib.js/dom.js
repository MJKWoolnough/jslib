/**
 * The dom module can be used to manipulate DOM elements.
 *
 * @module dom
 */
/** */

/**
 * This type can be used to set events with {@link amendNode} and {@link clearNode}. The boolean is true if the event is to be removed
 *
 * @typedef {[Exclude<EventListenerOrEventListenerObject, Bound> | Bound<EventListenerOrEventListenerObject>, AddEventListenerOptions, boolean]} EventArray
 */

/**
 * This object is used to set attributes and events on a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node) or {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget | EventTarget} with the {@link amendNode} and {@link clearNode} functions.
 *
 * The keys of this type refer to the attribute names that are to be set. The key determines what type the value should be:
 *
 * |  Key  |  Description  |
 * |-------|---------------|
 * | `on*` | Used to set events. Can be a Function, {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#the_event_listener_callback EventListenerObject}, or {@link EventArray}.|
 * | `class` | An array of strings, a {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList | DOMTokenList}, or an object with string keys and boolean or undefined values, to be used to toggle classes. For the array and DOMTokenList, if a class begins with a `!`, the class will be removed, if the class begins with a `~`, the class will be toggled, otherwise the class will be set. For the object, a value that equates to true will set the class, and a value that equates to false (except nullables, which will toggle the class) will unset the class. |
 * | `style` | A {@link https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration | CSSStyleDeclaration} can be used to set the style directly, or an Object can be used to set individual style properties. |
 * | `*` | For any key, a string or any object with a toString method can be used to set the field explicitly, a number can be used and converted to a string, a boolean can be used to toggle an attribute, and a undefined value can be used to remove an attribute. If a null value is specified, no action will be taken. |
 *
 * @typedef {Record<string, unknown>} PropsObject
 */

/**
 * This type represents all possible values for the `properties` param of the {@link amendNode} and {@link clearNode} functions.
 *
 * @typedef {PropsObject | NamedNodeMap} Props
 */

/**
 * This type is a string, {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}, {@link https://developer.mozilla.org/en-US/docs/Web/API/NodeList | NodeList}, {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection | HTMLCollection}, {@link Binding}, or a recursive array of those.
 *
 * @typedef {string | Node | Children[] | NodeList | HTMLCollection | BoundChild} Children;
 */

/**
 * This type represents a binding of either {@link amendNode} or {@link clearNode} with the first param bound.
 *
 * @typeParam {Node} T
 * @typedef {(properties?: Props, children?: Children): T | (children?: Children): T} DOMBind
 */
/** */

const childrenArr = (children, res = []) => {
	if (isChild(children)) {
		res.push(children[child]);
	} else if (typeof children === "string" || children instanceof Node) {
		res.push(children);
	} else if (Array.isArray(children)) {
		for (const c of children) {
			childrenArr(c, res);
		}
	} else if (children instanceof NodeList || children instanceof HTMLCollection) {
		res.push(...children);
	}
	return res;
      },
      isEventListenerOrEventListenerObject = prop => prop instanceof Function || isEventListenerObject(prop) && (value in prop ? isEventListenerOrEventListenerObject(prop[value]) : true),
      isEventObject = prop => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isClassObj = prop => prop instanceof Object && !isAttr(prop),
      isStyleObj = prop => prop instanceof CSSStyleDeclaration || (prop instanceof Object && !isAttr(prop)),
      isNodeAttributes = n => !!n.style && !!n.classList && !!n.removeAttribute && !!n.setAttributeNode && !!n.toggleAttribute,
      isAttr = prop => prop instanceof Object && attr in prop,
      isChild = children => children instanceof Object && child in children,
      makeAttr = (k, prop) => {
	const attr = document.createAttributeNS(null, k);
	attr.textContent = prop;
	return attr;
      };

export const
/** This symbol is used to denote a special Object that provides its own Children. */
child = Symbol("child"),
/** This symbol is used to denote a method on an object that will take an attribute name and return a new Attr Node. */
attr = Symbol("attr"),
/** This symbol is used to denote a special Object that might be an EventListener. */
value = Symbol("value"),
/**
 * This function determines whether the passed in object can be used as a {@link Children} type.
 *
 * @param {Props | Children} propertiesOrChildren The value to be checked for 'Children'-ness.
 *
 * @return {boolean} True is the passed value can be assigned to a Children type.
 */
isChildren = propertiesOrChildren => propertiesOrChildren instanceof Array || typeof propertiesOrChildren === "string" || propertiesOrChildren instanceof Element || propertiesOrChildren instanceof DocumentFragment || propertiesOrChildren instanceof Text || isChild(propertiesOrChildren) || propertiesOrChildren instanceof NodeList || propertiesOrChildren instanceof HTMLCollection,
/** */
isEventListenerObject = prop => prop instanceof Object && prop.handleEvent instanceof Function,
/**
 * This function is used to set attributes and children on {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}s, and events on {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}s and other {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget | EventTarget}s.
 *
 * If the element passed is a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement | HTMLElement} or {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGElement | SVGElement}, then a properties param is processed, applying attributes as per the {@link PropsObject} type. Likewise, any events are set or unset on a passed {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget | EventTarget}, as per the {@link PropsObject} type.
 *
 * For any Node, the children are set according to the {@link Children} value.
 *
 * This function returns the element passed to it.
 *
 * NB: Due to how this function uses instanceof to determine what can be applied to it, it will fail in unexpected ways with types created from proxies of the DOM classes, such as those used with {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/open | window.open}.
 *
 * @typeParam {EventTarget | null} T
 * @param {T} [node]                      The EventTarget or Node to be modified.
 * @param {Props | Children} [properties] The properties to be added to the EventTarget or Node. Can be ommitted with Children in its place.
 * @param {Children} [children]           Children to be added to a Node. Should be ommitted if `properties` was set to a Children type.
 *
 * @return {T} The passed EventTarget or Node.
 */
amendNode = (node, properties, children) => {
	if (properties && isChildren(properties)) {
		children = properties;
	} else if (properties instanceof NamedNodeMap && node instanceof Element) {
		for (const prop of properties) {
			node.setAttributeNode(prop.cloneNode());
		}
	} else if (node && typeof properties === "object") {
		const isNode = isNodeAttributes(node);
		for (const k in properties) {
			const prop = properties[k];
			if (isEventObject(prop) && k.startsWith("on")) {
				const arr = prop instanceof Array;
				node[arr && prop[2] ? "removeEventListener" : "addEventListener"](k.slice(2), arr ? prop[0] : prop, arr ? prop[1] : false);
			} else if (isNode) {
				if (typeof prop === "boolean") {
					node.toggleAttribute(k, prop);
				} else if (prop === undefined) {
					node.removeAttribute(k);
				} else if (prop instanceof Array || prop instanceof DOMTokenList) {
					if (k === "class" && prop.length) {
						for (let c of prop) {
							const f = c.slice(0, 1),
							      m = f !== '!' && (f !== '~' || undefined);
							node.classList.toggle(m ? c : c.slice(1), m);
						}
					}
				} else if (k === "class" && isClassObj(prop)) {
					for (const k in prop) {
						node.classList.toggle(k, prop[k] ?? undefined);
					}
				} else if (k === "style" && isStyleObj(prop)) {
					for (const [k, p] of prop instanceof CSSStyleDeclaration ? Array.from(prop, k => [k, prop.getPropertyValue(k)]) : Object.entries(prop)) {
						if (p === undefined) {
							node.style.removeProperty(k);
						} else {
							node.style.setProperty(k, p.toString());
						}
					}
				} else if (prop !== null) {
					node.setAttributeNode(prop instanceof Attr ? prop : Object.assign(isAttr(prop) ? prop[attr](k) : makeAttr(k, prop), {"realValue": prop}));
				}
			}
		}
	}
	if (node instanceof Node) {
		if (typeof children === "string" && !node.firstChild) {
			node.textContent = children;
		} else if (children) {
			if (children instanceof Node) {
				node.appendChild(children);
			} else if (node instanceof Element || node instanceof DocumentFragment) {
				node.append(...childrenArr(children));
			} else {
				node.appendChild(createDocumentFragment(children));
			}
		}
	}
	return node;
},
/**
 * This function binds the amendNode function with the first argument to to `document.createElementNS(ns, value)`. In addition, this function sets the name of the function to `value`.
 * @typeParam {Element} T
 * @param {string} ns    Namespace of the bound element.
 * @param {string} value Name of the element.
 *
 * @return {(props? Props | Children, children?: Children) => T} Function used to create a `T` element with the specified properties and/or children.
 * */
bindElement = (ns, value) => Object.defineProperty((props, children) => amendNode(document.createElementNS(ns, value), props, children), "name", {value}),
/** Can be passed to the {@link event} function to set the `once` property on an event. */
eventOnce = 1,
/** Can be passed to the {@link event} function to set the `capture` property on an event. */
eventCapture = 2,
/** Can be passed to the {@link event} function to set the `passive` property on an event. */
eventPassive = 4,
/** Can be passed to the {@link event} function to set the event to be removed. */
eventRemove = 8,
/**
 * This helper function is used to create {@link EventArray}s.
 *
 * @param {Function | Exclude<EventListenerObject, Bound> | Bound<Function | EventListenerObject>} fn An Event Function or a EventListenerObject, or a {@link Bound} version of those.
 * @param {number} options                                                                            The options param is a bitmask created by ORing together the {@link eventOnce}, {@link eventCapture}, {@link eventPassive}, and {@link eventRemove} constants, as per need.
 * @param {AbortSignal} [signal]                                                                      The `signal` param can be used to set a {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to the `signal` option of the {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener | addEventListener} call. This will be unused in a event removal context.
 *
 * @return {EventArray} An array that can be used with {@link amendNode}, {@link clearNode}, or any DOMBind function to add or remove an event, as specified.
 */
event = (fn, options, signal) => [fn, {"once": !!(options&eventOnce), "capture": !!(options&eventCapture), "passive": !!(options&eventPassive), signal}, !!(options&eventRemove)],
/**
 * This function creates a {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment} that contains any {@link Children} passed to it, as with {@link amendNode}.
 *
 * @param {Children} [children] Children to be added to a new DocumentFragment.
 *
 * @return {DocumentFragment} A DocumentFragment with specified children attached.
 */
createDocumentFragment = children => {
	const df = document.createDocumentFragment();
	if (typeof children === "string") {
		df.textContent = children;
	} else if (children instanceof Node) {
		df.append(children);
	} else if (children !== undefined) {
		df.append(...childrenArr(children));
	}
	return df;
},
/**
 * This function acts identically to {@link amendNode} except that it clears any children before amending.
 *
 * @typeParam {Node} T
 * @param {Props | Children} [properties] The properties to be added to the EventTarget or Node. Can be ommitted with Children in its place.
 * @param {Children} [Children]           Children to be added to the Node. Should be ommitted if `properties` was set to a Children type.
 *
 * @return {T} The Node being cleared.
 */
clearNode = (node, properties, children) => {
	if (!node) {
		return node;
	}
	if (properties && isChildren(properties)) {
		properties = void (children = properties);
	}
	if (typeof children === "string") {
		children = void (node.textContent = children);
	} else if (children && node instanceof Element) {
		children = void node.replaceChildren(...childrenArr(children));
	} else {
		while (node.lastChild) {
			node.lastChild.remove();
		}
	}
	return amendNode(node, properties, children);
};

/**
 * This type represents an Object that uses the `attr` symbol to return a special Attr node.
 *
 * @typedef {Object} BoundAttr
 * @property {(k: string) => Attr} {@link attr}
 **/

/**
 * This type represents an Object that uses the `child` symbol to return a special Element or Text node.
 *
 * @typedef {Object} BoundChild
 * @property {Element | Text} {@link Child}
 **/
