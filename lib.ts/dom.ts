/**
 * The dom module can be used to manipulate DOM elements.
 *
 * @module dom
 */
/** */

interface ToString {
	toString(): string;
}

/**
 * This type represents an Object that uses the `attr` symbol to return a special Attr node.
 **/
export type BoundAttr = {
	[attr]: (n: NodeAttributes, k: string) => void;
}

/**
 * This type represents an Object that uses the `child` symbol to return a special Element or Text node.
 **/
export type BoundChild = {
	[child]: Element | Text;
}

interface mElement {
	<T extends EventTarget | BoundChild>(element: T, properties: Record<`on${string}`, EventListenerObject | EventArray | Function>): T;
	<T extends Node | BoundChild>(element: T, properties?: Props, children?: Children): T;
	<T extends Node | BoundChild>(element: T, children?: Children): T;
	<T extends Node | BoundChild>(element?: T | null, properties?: Props | Children, children?: Children): T;
}

type ClassObj = Record<string, boolean | null>;

type StyleObj = Record<string, ToString | undefined> | CSSStyleDeclaration;

/**
 * This type can be used to set events with {@link amendNode} and {@link clearNode}. The boolean is true if the event is to be removed
 */
type EventArray = [EventListenerOrEventListenerObject, AddEventListenerOptions, boolean];

/**
 * This object is used to set attributes and events on a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node) or {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget | EventTarget} with the {@link amendNode} and {@link clearNode} functions.
 *
 * The keys of this type refer to the attribute names that are to be set. The key determines what type the value should be:
 *
 * |  Key  |  Description  |
 * |-------|---------------|
 * | `on*` | Used to set events. Can be a Function, {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#the_event_listener_callback EventListenerObject}, or {@link EventArray}.|
 * | `class`, `part` | An array of strings, a {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList | DOMTokenList}, or an object with string keys and boolean or undefined values, to be used to toggle classes and parts. For the array and DOMTokenList, if a class or part begins with a `!`, the class/part will be removed, if the class or part begins with a `~`, the class/part will be toggled, otherwise the class or part will be set. For the object, a value that equates to true will set the class or part, and a value that equates to false (except nullables, which will toggle the class) will unset the class or part. |
 * | `style` | A {@link https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration | CSSStyleDeclaration} can be used to set the style directly, or an Object can be used to set individual style properties. |
 * | `*` | For any key, a string or any object with a toString method can be used to set the field explicitly, a number can be used and converted to a string, a boolean can be used to toggle an attribute, and a undefined value can be used to remove an attribute. If a null value is specified, no action will be taken. |
 */
export type PropsObject = Record<string, unknown>;

/**
 * This type represents all possible values for the `properties` param of the {@link amendNode} and {@link clearNode} functions.
 */
export type Props = PropsObject | NamedNodeMap;

/**
 * This type is a string, {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}, {@link https://developer.mozilla.org/en-US/docs/Web/API/NodeList | NodeList}, {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection | HTMLCollection}, {@link Binding}, or a recursive array of those.
 * */
export type Children = string | Node | Children[] | NodeList | HTMLCollection | BoundChild;

/** This type represents a binding of either {@link amendNode} or {@link clearNode} with the first param bound. */
export interface DOMBind<T extends Node> {
	(properties?: Props, children?: Children): T;
	(children?: Children): T;
	[child]: T;
}

interface NodeAttributes extends Node {
	readonly classList: DOMTokenList;
	readonly part: DOMTokenList;
	readonly style: CSSStyleDeclaration;
	removeAttribute(qualifiedName: string): void;
	setAttributeNode(attr: Attr): Attr | null;
	setAttribute(name: string, value: string): void;
	toggleAttribute(qualifiedName: string, force?: boolean): boolean;
}

const childrenArr = (children: Children, res: (Node | string)[] = []) => {
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
      isEventListenerObject = (prop: unknown): prop is EventListenerObject => prop instanceof Object && (prop as EventListenerObject).handleEvent instanceof Function,
      isEventListenerOrEventListenerObject = (prop: any): prop is EventListenerOrEventListenerObject => prop instanceof Function || isEventListenerObject(prop),
      isEventObject = (prop: unknown): prop is (EventArray | EventListenerOrEventListenerObject) => isEventListenerOrEventListenerObject(prop) || (prop instanceof Array && prop.length === 3 && isEventListenerOrEventListenerObject(prop[0]) && prop[1] instanceof Object && typeof prop[2] === "boolean"),
      isClassObj = (prop: unknown): prop is ClassObj => prop instanceof Object && !isAttr(prop),
      isStyleObj = (prop: unknown): prop is StyleObj => prop instanceof CSSStyleDeclaration || (prop instanceof Object && !isAttr(prop)),
      isNodeAttributes = (n: EventTarget): n is NodeAttributes => !!(n as NodeAttributes).style && !!(n as NodeAttributes).classList && !!(n as NodeAttributes).removeAttribute && !!(n as NodeAttributes).setAttributeNode && !!(n as NodeAttributes).toggleAttribute && !!(n as NodeAttributes).setAttribute,
      isAttr = (prop: any): prop is BoundAttr => prop instanceof Object && attr in prop,
      isChild = (children: any): children is BoundChild => children instanceof Object && child in children,
      toggleSym = Symbol("toggle"),
      wrapElem = <T extends Element>(name: string, fn: () => T) => Object.defineProperties((props?: Props | Children, children?: Children) => amendNode(fn(), props, children), {"name": {"value": name}, [child]: {"get": fn}}) as DOMBind<T>;

export const
/** This symbol is used to denote a special Object that provides its own Children. */
child = Symbol.for("dom-child"),
/** This symbol is used to denote a method on an object that will take an attribute name and return a new Attr Node. */
attr = Symbol.for("dom-attr"),
/**
 * This function determines whether the passed in object can be used as a {@link Children} type.
 *
 * @param {Props | Children} propertiesOrChildren The value to be checked for 'Children'-ness.
 *
 * @return {boolean} True is the passed value can be assigned to a Children type.
 */
isChildren = (propertiesOrChildren: Props | Children): propertiesOrChildren is Children => propertiesOrChildren instanceof Array || typeof propertiesOrChildren === "string" || propertiesOrChildren instanceof Element || propertiesOrChildren instanceof DocumentFragment || propertiesOrChildren instanceof Text || isChild(propertiesOrChildren) || propertiesOrChildren instanceof NodeList || propertiesOrChildren instanceof HTMLCollection,
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
 * @typeParam {EventTarget | BoundChild | null} T
 * @param {T} [element]                   The EventTarget or Node to be modified.
 * @param {Props | Children} [properties] The properties to be added to the EventTarget or Node. Can be omitted with Children in its place.
 * @param {Children} [children]           Children to be added to a Node. Should be omitted if `properties` was set to a Children type.
 *
 * @return {T} The passed EventTarget, Node, or BoundChild.
 */
amendNode: mElement = (element?: EventTarget | BoundChild | null, properties?: Props | Children, children?: Children) => {
	const node = isChild(element) ? element[child] : element;

	if (properties && isChildren(properties)) {
		children = properties;
	} else if (properties instanceof NamedNodeMap && node instanceof Element) {
		for (const prop of properties) {
			node.setAttributeNode(prop.cloneNode() as Attr);
		}
	} else if (node && typeof properties === "object") {
		const isNode = isNodeAttributes(node);
		for (const k in properties) {
			const prop = properties[k as keyof Props];
			if (isEventObject(prop) && k.startsWith("on")) {
				const arr = prop instanceof Array;
				node[arr && prop[2] ? "removeEventListener" : "addEventListener"](k.slice(2), arr ? prop[0] : prop, arr ? prop[1] : false);
			} else if (isNode) {
				if (typeof prop === "boolean") {
					if (k === "checked" && node instanceof HTMLInputElement) {
						node.checked = prop;
					}

					node.toggleAttribute(k, prop);
				} else if (prop === toggle) {
					if (k === "checked" && node instanceof HTMLInputElement) {
						node.checked = !node.checked;
					}

					node.toggleAttribute(k);
				} else if (prop instanceof Function && toggleSym in prop) {
					prop(node.toggleAttribute(k));
				} else if (prop === undefined) {
					node.removeAttribute(k);
				} else if (prop instanceof Array || prop instanceof DOMTokenList) {
					if ((k === "class" || k === "part") && prop.length) {
						const attr = k === "class" ? "classList" : "part";

						for (const c of prop) {
							const f = c.slice(0, 1),
							      m = f !== '!' && (f !== '~' || undefined);

							node[attr].toggle(m ? c : c.slice(1), m);
						}
					}
				} else if ((k === "class" || k === "part") && isClassObj(prop)) {
					const attr = k === "class" ? "classList" : "part";

					for (const k in prop) {
						node[attr].toggle(k, prop[k] ?? undefined);
					}
				} else if (k === "style" && isStyleObj(prop)) {
					for (const [k, p] of prop instanceof CSSStyleDeclaration ? Array.from(prop, k => [k, prop.getPropertyValue(k)]) : Object.entries(prop)) {
						if (p === undefined) {
							node.style.removeProperty(k);
						} else {
							node.style.setProperty(k, p.toString());
						}
					}
				} else if (prop instanceof Attr) {
					node.setAttributeNode(prop);
				} else if (isAttr(prop)) {
					prop[attr](node, k);
				} else if (prop !== null) {
					if (k === "value" && (node instanceof HTMLInputElement || node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement) && typeof prop === "string") {
						node.value = prop;
					}

					node.setAttribute(k, prop as string);
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
	return element;
},
/**
 * This function binds the amendNode function with the first argument to to `document.createElementNS(ns, value)`. In addition, this function sets the name of the function to `value`.
 * @typeParam {Element} T
 * @param {string} ns    Namespace of the bound element.
 * @param {string} value Name of the element.
 *
 * @return {(props? Props | Children, children?: Children) => DOMBind<T>} Function used to create a `T` element with the specified properties and/or children.
 * */
bindElement = <T extends Element>(ns: string, value: string) => wrapElem(value, () => document.createElementNS(ns, value) as T),
/**
 * This function acts as bindElement, but with Custom Elements, first defining the element and then acting as bindElement.
 *
 * @typeParam {HTMLElement} T
 *
 * @param {string} name                          Name of the custom element.
 * @param {CustomElementConstructor} constructor Constructor of the Custom Element
 * @param {ElementDefinitionOptions} [options]   Options to pass to customElements.define.
 *
 * @return {(props? Props | Children, children?: Children) => DOMBind<T>} Function used to create a `T` element with the specified properties and/or children.
 * */
bindCustomElement = <T extends HTMLElement>(name: string, constructor: {new (...params: any[]): T}, options?: ElementDefinitionOptions | undefined) => {
	customElements.define(name, constructor, options);

	return wrapElem(options?.extends ?? name, () => new constructor());
},
/**
 * Can be passed to the {@link event} function to set the `once` property on an event.
 */
eventOnce = 1,
/**
 * Can be passed to the {@link event} function to set the `capture` property on an event.
 */
eventCapture = 2,
/**
 * Can be passed to the {@link event} function to set the `passive` property on an event.
 */
eventPassive = 4,
/**
 * Can be passed to the {@link event} function to set the event to be removed.
 */
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
event = (fn: Function | EventListenerObject, options: number, signal?: AbortSignal): EventArray => [fn as EventListenerOrEventListenerObject, {"once": !!(options&eventOnce), "capture": !!(options&eventCapture), "passive": !!(options&eventPassive), signal}, !!(options&eventRemove)],
/**
 * This function creates a {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment} that contains any {@link Children} passed to it, as with {@link amendNode}.
 *
 * @param {Children} [children] Children to be added to a new DocumentFragment.
 *
 * @return {DocumentFragment} A DocumentFragment with specified children attached.
 */
createDocumentFragment = (children?: Children) => {
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
 * @param {Props | Children} [properties] The properties to be added to the EventTarget or Node. Can be omitted with Children in its place.
 * @param {Children} [Children]           Children to be added to the Node. Should be omitted if `properties` was set to a Children type.
 *
 * @return {T} The Node being cleared.
 */
clearNode: mElement = (n?: Node | BoundChild, properties?: Props | Children, children?: Children) => {
	if (!n) {
		return n;
	}

	const node = isChild(n) ? n[child] : n;

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
	return amendNode(n, properties, children);
},
/**
 * This function can be used directly in the params object of a amendNode call to toggle an attribute on or off (depending on it's previous state); e.g.
 *
 * amendNode(myNode, {"attr": toggle});
 *
 * If a callback is provided, then it will be called with the eventual state of the toggle; e.g.
 *
 * amendNode(myNode, {"attr": toggle(state => myState = state)});
 *
 * @param {(v: boolean) => void} fn The callback function to receive the state.
 *
 * @return {(v: boolean) => void} Wrapped callback function that will be recognised by amendNode.
 */
toggle = (fn: (v: boolean) => void) => Object.assign((v: boolean) => fn(v), {[toggleSym]: null});
