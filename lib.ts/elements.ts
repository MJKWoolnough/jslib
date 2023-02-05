import type {Binding, Children, DOMBind, Props, PropsObject} from './dom.js';
import {Bound, amendNode, bind, isChildren} from './dom.js';

/**
 * The elements module allows for easy creation of custom elements, with simple attribute and event binding.
 *
 * This module directly imports the {@link dom} and P@link html} modules.
 *
 * @module elements
 */

/** This unexported type is used to change how the elements are created and controlled. */
type Options = {
	/** Each string of this array is a reference to an parameter that is passed to the initialising function. The value for each parameter is taken either from the properties object passed to the [DOMBind](#dom_dombind) creation function, or are specified directly in the constructor of the `classOnly` generated class. */
	args?: string[];
	/** When true, the resulting created element will send an 'attached' event when the element is attached to the document, and a 'removed' event when removed from the document. Has no effect when 'pseudo' is set to true. (default: true) */
	attachRemoveEvent?: boolean;
	/** When true, enables both the 'act' and 'attr' methods on the element class. (default: true) */
	attrs?: boolean;
	/**
	 * When true, the return from the default function will be the generated class, when false the return from the default function will be a @{link dom:DOMBind | DOMBind}. If the `name` option is set to empty string, the class will *not* be registered with the {@link https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry | Custom Elements Registry]}. (default: false)
	 * */
	classOnly?: boolean;
	/** When true, sets the `delegatesFocus` option during `attachShadow` call to true. Has no effect when `pseudo` is set to true. (default: false) */
	delegatesFocus?: boolean;
	/**  Allows the generated class to be extended with a custom class. This extension will be applied before the passed fn function is called. */
	extend?: Function;
	/** When true, sets the slotAssignment option during attachShadow call to "manual". Has no effect when 'pseudo' is set to true. (default: false) */
	manualSlot?: boolean;
	/** Registers a custom element name for the generated element class, instead of a randomly generated one. Has no effect when 'pseudo' is set to true. */
	name?: string;
	/** When true, enables the observeChildren method on the element class. (default: true) */
	observeChildren?: boolean;
	/** When true, the class created is extended from DocumentFragment, instead of HTMLElement, and does not register a custom element. This will act, in many ways, like a custom element, but without a Shadow Root, any children are attached directly to the DOM on appending. (default: false) */
	pseudo?: boolean;
	/** Sets the adoptedStyleSheets options on the Shadow Root. Has no effect when 'pseudo' is set to true. */
	styles?: CSSStyleSheet[];
}

interface ToString {
	toString(): string;
}

type AttrFn = (newValue: ToString) => ToString | void;

type ChildWatchFn = (added: NodeList, removed: NodeList) => void;

/**
 * This class is added to an element created with the (default) function when the `attr` is `true` (or unset).
 *
 * The `act` method allows actions to be taken when attributes on the element are changed. When monitoring a single attribute, the newValue will be the new value assigned to that attribute. When monitoring multiple attributes, an Object will be passed to the function with keys on the attribute names set to the value of that attribute.
 *
 * The `attr` method acts similarly to the `act` method, but will return a {@link dom:Binding}. When monitoring a single attribute, the value of the Binding object will be set the return of the fn function, or just the new attribute value. When monitoring multiple attributes, the value of the Binding object will be set to the return of the fn function. The fn function works similarly to that used in the `act` method.
 */
export type WithAttr = {
	act(name: string | string[], fn: Function): void;
	attr(name: string[], fn: Function): Binding;
	attr(name: string, fn?: Function): Binding;
}

/**
 * This class is added to an element created with the (default) function when the `observeChildren` is `true` (or unset).
 *
 * The observeChildren method sets a callback function that will be called whenever children are added or removed from the element, with the lists of added and removed children.
 *
 * NB: For pseudo-elements, the callback function will not be triggered during construction.
 */
export type WithChildren = {
	observeChildren(fn: ChildWatchFn): void;
}

type ConstructorOf<C> = new(...args: any[]) => C;

type Cast<A, B> = A extends B ? A : B;

type Narrowable = string | number | bigint | boolean;

type Narrow<A> = Cast<A, [] | (A extends Narrowable ? A : never) | ({[K in keyof A]: Narrow<A[K]>})>;

type RestOf<Arr extends readonly any[]> = Arr extends [arg: any, ...rest: infer Rest] ? Rest : Arr;

type ToPropsObject<Keys extends readonly string[], Values extends readonly (ToString | undefined)[]> = Keys[0] extends string ? (Values[0] extends ToString ? {[K in Keys[0]]: Values[0]} : {[K in Keys[0]]?: Values[0]}) & ToPropsObject<RestOf<Keys>, RestOf<Values>> : PropsObject;

type OptionsFactory <SelectedOptions extends Options, Base extends Node = (SelectedOptions extends {pseudo: true} ? DocumentFragment : HTMLElement) & (SelectedOptions extends {attrs: false} ? {} : WithAttr) & (SelectedOptions extends {observeChildren: false} ? {} : WithChildren)> = <Extension, ArgLength extends number, ArgNames extends readonly [string, ...string[]] & {length: ArgLength}, ArgTypes extends readonly [ToString | undefined, ...(ToString | undefined)[]] & {length: ArgLength}>(options: Options & SelectedOptions & {extend?: (base: ConstructorOf<Base>) => ConstructorOf<Base & Extension>, args?: Narrow<ArgNames>}, fn: ArgNames extends string[] ? (elem: Base & Extension, ...args: ArgTypes) => Children : (elem: Base & Extension) => Children) => SelectedOptions extends {classOnly: true} ? ArgNames extends string[] ? {new(...args: ArgTypes): Base & Extension} : ConstructorOf<Base & Extension> : ArgNames extends string[] ? (properties: ToPropsObject<ArgNames, ArgTypes>, children?: Children) => Base & Extension : DOMBind<Base & Extension>;

type WithClassOption<SelectedOptions extends Options> = OptionsFactory<SelectedOptions & {classOnly?: false}> & OptionsFactory<SelectedOptions & {classOnly: true}>;

type WithChildrenOption<SelectedOptions extends Options> = WithClassOption<SelectedOptions & {observeChildren?: true}> & WithClassOption<SelectedOptions & {observeChildren: false}>;

type WithAttrsOption<SelectedOptions extends Options> = WithChildrenOption<SelectedOptions & {attrs?: true}> & WithChildrenOption<SelectedOptions & {attrs: false}>;

type ElementFactory = WithAttrsOption<{pseudo?: false}> & WithAttrsOption<{pseudo: true}> & ((fn: (elem: HTMLElement & WithAttr & WithChildren) => Children) => DOMBind<HTMLElement & WithAttr & WithChildren>);

class BindFn extends Bound {
	#fn: AttrFn;
	constructor(v: ToString, fn: AttrFn) {
		super(v);
		this.#fn = fn;
	}
	get value() {
		return this.#fn(super.value) ?? Null;
	}
}

class BindMulti extends Bound {
	#fn: AttrFn;
	constructor(elem: Node, names: string[], fn: Function) {
		super(0);
		let calling = false;
		const obj: Record<string, Bound> = {},
		      self = this;
		this.#fn = function(this: Bound, val: ToString) {
			if (!calling) {
				calling = true;
				const o: Record<string, ToString> = {};
				for (const n in obj) {
					o[n] = obj[n] === this ? val : obj[n].value;
				}
				calling = false;
				self.value = fn(o) ?? Null;
			}
			return val;
		};
		for (const n of names) {
			obj[n] = new BindFn(getAttr(elem, n), this.#fn);
		}
		this.#fn(0);
	}
}

const attrs = new WeakMap<Node, Map<string, Bound>>(),
      getAttr = (elem: Node, name: string) => {
	const attrMap = attrs.get(elem)!;
	return attrMap.get(name) ?? setAndReturn(attrMap, name, bind((elem as HTMLElement).getAttribute(name) ?? Null));
      },
      cw = new WeakMap<Node, ChildWatchFn[]>(),
      childObserver = new MutationObserver(list => {
	for (const record of list) {
		if (record.type === "childList") {
			for (const fn of cw.get(record.target) ?? []) {
				fn(record.addedNodes, record.removedNodes);
			}
		}
	}
      }),
      setAttr = (elem: Node, name: string, value: ToString | null) => {
	const attr = attrs.get(elem)?.get(name);
	return attr ? (attr.value = value === null ? attr.value ? Null : name : value) !== Null : null;
      },
      setAndReturn = <K, V>(m: {set: (k: K, v: V) => any}, k: K, v: V) => {
	      m.set(k, v);
	      return v;
      },
      act = (c: Node, names: string | string[], fn: (newValue: ToString) => void) => {
	if (names instanceof Array) {
		return new BindMulti(c, names, fn);
	} else {
		const attr = getAttr(c, names);
		fn(attr.value);
		return new BindFn(attr, fn);
	}
      },
      attr = (c: Node, names: string | string[], fn?: AttrFn) => {
	if (names instanceof Array) {
		return new BindMulti(c, names, fn!);
	}
	const attr = getAttr(c, names);
	return fn instanceof Function ? new BindFn(attr, fn) : attr;
      },
      childList = {"childList": true},
      classes: (ConstructorOf<HTMLElement> | undefined)[] = Array.from({"length": 8}),
      getClass = (addRemove: boolean, handleAttrs: boolean, children: boolean): ConstructorOf<HTMLElement> => classes[(+addRemove << 2) | (+handleAttrs << 1) | +children] ??= addRemove ? class extends getClass(false, handleAttrs, children) {
	connectedCallback() {
		this.dispatchEvent(new CustomEvent("attached"));
	}
	disconnectedCallback() {
		this.dispatchEvent(new CustomEvent("removed"));
	}
      } : handleAttrs ? class extends getClass(false, false, children) {
	#acts: Binding[] = [];
	constructor() {
		super();
		attrs.set(this, new Map());
	}
	act(names: string | string[], fn: (newValue: ToString) => void) {
		this.#acts.push(act(this, names, fn));
	}
	attr(names: string | string[], fn?: AttrFn) {
		return attr(this, names, fn);
	}
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
		setAttr(this, "on" + type, listener) ?? super.addEventListener(type, listener, options);
	}
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
		setAttr(this, "on" + type, Null) === null ?? super.removeEventListener(type, listener, options);
	}
	toggleAttribute(qualifiedName: string, force?: boolean) {
		return setAttr(this, qualifiedName, force ?? null) ?? super.toggleAttribute(qualifiedName, force);
	}
	setAttribute(qualifiedName: string, value: ToString) {
		setAttr(this, qualifiedName, value) ?? super.setAttribute(qualifiedName, value as string);
	}
	setAttributeNode(attribute: Attr) {
		const attr = this.getAttributeNode(attribute.name);
		return setAttr(this, attribute.name, "realValue" in attribute ? attribute.realValue ?? Null : attribute.value) === null ? super.setAttributeNode(attribute) : attr;
	}
	removeAttribute(qualifiedName: string) {
		setAttr(this, qualifiedName, Null) ?? super.removeAttribute(qualifiedName);
	}
	removeAttributeNode(attribute: Attr) {
		return setAttr(this, attribute.name, Null) === null ? super.removeAttributeNode(attribute) : attribute;
	}
      } : children ? class extends HTMLElement {
	constructor() {
		super();
		childObserver.observe(this, childList);
	}
	observeChildren(fn: ChildWatchFn) {
		(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
	}
      } : HTMLElement,
      pseudos: (ConstructorOf<DocumentFragment> | undefined)[] = Array.from({"length": 4}),
      noop = () => {},
      classList = Object.freeze({toggle: noop}),
      style = Object.freeze({removeProperty: noop, setProperty: noop}),
      getPseudo = (handleAttrs: boolean, children: boolean): ConstructorOf<DocumentFragment> => pseudos[+handleAttrs | (+children << 1)] ??= children ? class extends getPseudo(handleAttrs, false) {
	observeChildren(fn: ChildWatchFn) {
		(cw.get(this) ?? setAndReturn(cw, this, [])).push(fn);
	}
      } : handleAttrs ? class extends DocumentFragment {
	#acts: Binding[] = [];
	readonly classList = classList;
	readonly style = style;
	constructor() {
		super();
		attrs.set(this, new Map());
	}
	act(names: string | string[], fn: (newValue: ToString) => void) {
		this.#acts.push(act(this, names, fn));
	}
	attr(names: string | string[], fn?: AttrFn) {
		return attr(this, names, fn);
	}
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, _options?: boolean | AddEventListenerOptions) {
		setAttr(this, "on" + type, listener);
	}
	removeEventListener(type: string, _listener: EventListenerOrEventListenerObject, _options?: boolean | EventListenerOptions) {
		setAttr(this, "on" + type, Null);
	}
	getAttribute(_qualifiedName: string) {
		return null;
	}
	getAttributeNode(_qualifiedName: string) {
		return null;
	}
	toggleAttribute(qualifiedName: string, force?: boolean) {
		return setAttr(this, qualifiedName, force ?? null);
	}
	setAttribute(qualifiedName: string, value: string) {
		setAttr(this, qualifiedName, value);
	}
	setAttributeNode(attribute: Attr) {
		setAttr(this, attribute.name, "realValue" in attribute ? attribute.realValue ?? Null : attribute.value);
		return null;
	}
	removeAttribute(qualifiedName: string) {
		setAttr(this, qualifiedName, Null);
	}
	removeAttributeNode(attribute: Attr) {
		this.removeAttribute(attribute.name);
		return null;
	}
      } : DocumentFragment,
      genName = () => {
	let name;
	while(customElements.get(name = String.fromCharCode(...Array.from({"length": 11}, (_, n) => n === 5 ? 45 : 97 + Math.floor(Math.random() * 26))))) {}
	return name;
      },
      noExtend = <T extends ConstructorOf<HTMLElement> | ConstructorOf<DocumentFragment>>(v: T) => v;

export const
/**
 * The Null value is used by the act and attrs methods to indicate the non-existence of a value. It can act as a noop function, an empty string, an empty iterator, and NaN depending on how it is used.
 *
 * As this may be passed to any function passed to the act and attr methods, it should either be checked for directly (with an equality check), or used in a way in which it will be coerced to the correct data type.
 */
Null = Object.freeze(Object.assign(() => {}, {
	toString(){
		return "";
	},
	handleEvent() {},
	*[Symbol.iterator]() {},
	[Symbol.toPrimitive](hint: string) {
		return hint === "number" ? NaN : "";
	}
}));

/**
 * The default export of the elements module is a function that can be used to create custom elements. The Type `T` is determined by the {@link Options} provided. The following table shows how setting options affects the type of `T`:
 *
 * |  attrs  |  observeChildren  |  pseudo  |  T  |
 * |---------|-------------------|----------|-----|
 * | true    | true              | false    | {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement | HTMLElement} & {@link WithAttr} & {@link WithChildren} |
 * | true    | false             | false    | {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement | HTMLElement} & {@link WithAttr} |
 * | false   | true              | false    | {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement | HTMLElement} & {@link WithChildren} |
 * | false   | false             | false    | {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement | HTMLElement} |
 * | true    | true              | true     | {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment} & {@link WithAttr} & {@link WithChildren} |
 * | true    | false             | true     | {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment} & {@link WithAttr} |
 * | false   | true              | true     | {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment} & {@link WithChildren} |
 * | false   | false             | true     | {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment} |
 *
 * In addition, the type `T` can be further modified by the use of the `extend` Option, which will add a custom class to the prototype chain, allowing its methods and field to be used, including during the initialising `fn` call. As the `fn` initialising function will not have access to any private class members, it is recommended to either use Symbols, or a data sharing Class, such as {@link inter:Pickup}, to allow access to private fields.
 *
 * When the `args` Option is specified, the `fn` call (and the `classOnly` constructor) gain a number of parameters equal to the number of strings specified. For the [DOMBind](#dom_dombind) output, these parameters must be set in the [Props](#dom_props) object passed to the function with the key being the name specified in the array. For the `classOnly` output, these values must be specified manually in the constructor call. The default type for these parameters is ToString, but can be specified in the `fn` to set the type in both the DOMBind-like Props object, and the constructor call of the `classOnly` return. NB: When using the `args` options with the intention of creating the new element without the use of the returned class/function (e.g. directly from HTML) then you *should* make all of the args optional as there is no other way to pass attributes to the initialisation function during construction of the element.
 *
 * The {@link dom:Children} returned from passed `fn` function are added either to the {@link https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot | ShadowRoot}, if the `pseudo` Option is `false`, or to the {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment}, if the `pseudo` Option is `true`.
 *
 * If the `classOnly` Option is set to `false` (or unset), the resulting {@link dom:DOMBind} can be used in the same way as any other DOMBind, creating your (pseudo-)element and applying the attributes and children accordingly.
 *
 * If the `classOnly` Option is set to `true`, the function will just return the generated class constructor, without creating a DOMBind function.
 *
 * @param {((elem: Node, ...args: (ToString | undefined)[]) => Children) | Options} optionsOrFn Either an {@link Options} object, or the initialising function.
 * @param {(elem: Node, ...args: (ToString | undefined)[]) => Children)} [fn]                   If the first arg is an {@link Options} object, then this must be the initialising function.
 *
 * @return {Class | DOMBind}
 */
export default ((optionsOrFn: ((elem: Node, ...args: (ToString | undefined)[]) => Children) | Options, fn: (elem: Node, ...args: (ToString | undefined)[]) => Children) => {
	fn ??= optionsOrFn as (elem: Node, ...args: (ToString | undefined)[]) => Children;
	const options = optionsOrFn instanceof Function ? {} : optionsOrFn,
	      {args = [], attachRemoveEvent = true, attrs = true, observeChildren = true, pseudo = false, styles = [], delegatesFocus = false, manualSlot = false, extend = noExtend, classOnly = false} = options,
	      {name = pseudo ? "" : genName()} = options,
	      shadowOptions: ShadowRootInit = {"mode": "closed", "slotAssignment": manualSlot ? "manual" : "named", delegatesFocus},
	      element = pseudo ? class extends (extend as (<T extends ConstructorOf<DocumentFragment>, V extends T>(base: T) => V))(getPseudo(attrs, observeChildren)) {
		constructor(...args: (ToString | undefined)[]) {
			super();
			amendNode(this, fn.call(null, this, ...args));
			if (observeChildren) {
				childObserver.observe(this, childList);
			}
		}
	      } : class extends (extend as (<T extends ConstructorOf<HTMLElement>, V extends T>(base: T) => V))(getClass(attachRemoveEvent, attrs, observeChildren)) {
		constructor(...args: (ToString | undefined)[]) {
			super();
			amendNode(this.attachShadow(shadowOptions), fn.call(null, this, ...args)).adoptedStyleSheets = styles;
		}
	      };
	if (!pseudo && !(classOnly && name === "")) {
		customElements.define(name, element as CustomElementConstructor);
	}
	return Object.defineProperty(classOnly ? element : (properties?: Props | Children, children?: Children) => {
		const eArgs: (ToString | undefined)[] = args.map(() => undefined);
		let props = properties;
		if (args.length && properties && !isChildren(properties) && !(properties instanceof NamedNodeMap)) {
			let pos = 0;
			props = Object.assign({}, properties);
			for (const a of args) {
				const v = properties[a];
				if (v) {
					eArgs[pos] = v;
					delete props[a];
				}
				pos++;
			}
		}
		return amendNode(new element(...eArgs), props, children);
	}, "name", {"value": name}) as any;
}) as ElementFactory;
