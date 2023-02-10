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
 * | `on*` | Used to set events. Can be a Function, [EventListenerObject](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#the_event_listener_callback), or [EventArray](#dom_eventarray).|
 * | `class` | An array of strings, a [DOMTokenList](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList), or an object with string keys and boolean or undefined values, to be used to toggle classes. For the array and DOMTokenList, if a class begins with a `!`, the class will be removed, if the class begins with a `~`, the class will be toggled, otherwise the class will be set. For the object, a value that equates to true will set the class, and a value that equates to false (except nullables, which will toggle the class) will unset the class. |
 * | `style` | A [CSSStyleDeclaration](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration) can be used to set the style directly, or an Object can be used to set individual style properties. |
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
 * @typedef {string | Node | Children[] | NodeList | HTMLCollection | Binding} Children;
 */

/**
 * This type represents a binding of either {@link amendNode} or {@link clearNode} with the first param bound.
 *
 * @typeParam {Node} T
 * @typedef {(properties?: Props, children?: Children): T | (children?: Children): T} DOMBind
 */

const childrenArr = (children, res = []) => {
	if (children instanceof Binding) {
		res.push(children[setNode](new Text(children+"")));
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
      isEventListenerObject = prop => prop instanceof Object && prop.handleEvent instanceof Function,
      isEventListenerOrEventListenerObject = prop => prop instanceof Bound ? isEventListenerOrEventListenerObject(prop.value) : prop instanceof Function || isEventListenerObject(prop),
      isEventObject = prop => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isClassObj = prop => prop instanceof Object && !(prop instanceof Binding),
      isStyleObj = prop => prop instanceof CSSStyleDeclaration || (prop instanceof Object && !(prop instanceof Binding)),
      isNodeAttributes = n => !!n.style && !!n.classList && !!n.removeAttribute && !!n.setAttributeNode && !!n.toggleAttribute,
      setNode = Symbol("setNode"),
      update = Symbol("update"),
      remove = Symbol("remove");

/**
 * An abstract class that is a parent class of both of the return types from the {@link bind} function.
 */
export class Binding {
	#set = new Set();
	#st = -1;
	#cleanSet(b) {
		if (b) {
			this.#set.delete(b);
		}
		for (const n of Array.from(this.#set)) {
			if (n instanceof WeakRef) {
				const ref = n.deref();
				if (!ref || ref === b) {
					this.#set.delete(n);
				} else if (n instanceof Binding && n.#set.size || n instanceof Text && n.parentNode || n instanceof Attr && n.ownerElement) {
					this.#set.delete(n);
					this.#set.add(ref);
				}
			} else if (n instanceof Binding && !n.#set.size || n instanceof Text && !n.parentNode || n instanceof Attr && !n.ownerElement) {
				this.#set.delete(n);
				this.#set.add(new WeakRef(n));
			}
		}
		if (this.#st !== -1) {
			clearTimeout(this.#st);
			this.#st = -1;
		}
		if (this.#set.size) {
			this.#st = setTimeout(this.#to ??= () => this.#cleanSet(), 50000 + Math.floor(Math.random() * 20000));
		}
	}
	[setNode](n) {
		this.#cleanSet();
		this.#set.add(n);
		return n;
	}
	[update]() {
		const text = this+"";
		for (const wr of this.#set) {
			const n = wr instanceof WeakRef ? wr.deref() : wr;
			if (n instanceof Binding) {
				n[update]();
			} else if (n) {
				n.textContent = text;
			}
		}
		this.#cleanSet();
	}
	[remove](b) {
		this.#cleanSet(b);
	}
}

class TemplateBind extends Binding {
	#strings;
	#bindings;
	constructor(strings, ...bindings) {
		super();
		this.#strings = strings;
		this.#bindings = bindings;
		for (const b of bindings) {
			if (b instanceof Binding) {
				b[setNode](this);
			}
		}
	}
	toString() {
		let str = "";
		for (let i = 0; i < this.#strings.length; i++) {
			str += this.#strings[i] + (this.#bindings[i] ?? "");
		}
		return str;
	}
}

/**
 * Objects that implement this type can be used in place of both property values and Children in calls to {@link amendNode and {@link clearNode}, as well as the bound element functions from the [html.js](#html) and [svg.js](#svg) modules.
 *
 * When the value on the class is changed, the values of the properties and the child nodes will update accordingly.
 */
export class Bound extends Binding {
	#value;
	constructor(v) {
		super();
		this.#value = v;
		if (v instanceof Binding) {
			v[setNode](this);
		}
	}
	get value() { return this.#value instanceof Bound ? this.#value.value : this.#value; }
	set value(v) {
		if (this.#value !== v) {
			if (this.#value instanceof Binding) {
				this.#value[remove](this);
			}
			this.#value = v;
			if (v instanceof Binding) {
				v[setNode](this);
			}
		}
		this[update]();
	}
	handleEvent(e) {
		const v = this.value;
		if (v instanceof Function) {
			v.call(e.currentTarget, e);
		} else if (isEventListenerObject(v)) {
			v.handleEvent(e);
		}
	}
	toString() {
		return this.value.toString();
	}
}

export const
/**
 * This function determines whether the passed in object can be used as a {@link Children} type.
 *
 * @param {Props | Children} propertiesOrChildren The value to be checked for 'Children'-ness.
 *
 * @return {boolean} True is the passed value can be assigned to a Children type.
 */
isChildren = propertiesOrChildren => typeof propertiesOrChildren === "string" || propertiesOrChildren instanceof Array || propertiesOrChildren instanceof NodeList || propertiesOrChildren instanceof HTMLCollection || propertiesOrChildren instanceof Node || propertiesOrChildren instanceof Binding,
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
 * @param {Children} [Children]           Children to be added to a Node. Should be ommitted if `properties` was set to a Children type.
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
					const attr = Object.assign(document.createAttributeNS(null, k), {"realValue": prop});
					attr.textContent = prop + "";
					node.setAttributeNode(prop instanceof Binding ? prop[setNode](attr) : attr);
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
		while (node.lastChild !== null) {
			node.lastChild.remove();
		}
	}
	return amendNode(node, properties, children);
},
/**
 * This function can be used either as a normal function, binding a single value, or as a template tag function.
 *
 * When used normally, this function takes a single starting value and returns a {@link Bound} class with that value set.
 *
 * When used as a tag function, this function will return a type that is bound to all Bind expressions used within the template.
 *
 * Both returned types can be used as attributes or children in amendNode and clearNode calls.
 *
 * @typeParam {ToString} T
 * @param {T} v Value to be bound so it can be changed when assigned to an element attribute or child.
 *
 * @return {Binding} Bound value.
 */
bind = (v, first, ...bindings) => {
	if (v instanceof Array && first) {
		return new TemplateBind(v, first, ...bindings);
	}
	return new Bound(v);
};
