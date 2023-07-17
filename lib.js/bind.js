import {attr, child, value} from './dom.js';

/**
 * This modules contains a Function for creating {@link https://developer.mozilla.org/en-US/docs/Web/API/Attr | Attr} and {@link https://developer.mozilla.org/en-US/docs/Web/API/Text | Text} nodes that update their textContent automatically.
 *
 * This module directly imports the {@link module:dom} module.
 *
 * @module bind
 * @requires module:dom
 */
/** */

const setNode = Symbol("setNode"),
      update = Symbol("update"),
      remove = Symbol("remove"),
      isEventListenerObject = prop => prop instanceof Object && prop.handleEvent instanceof Function;

/**
 * An abstract class that is a parent class of both of the return types from the {@link bind} function.
 */
export class Binding {
	#set = new Set();
	#to;
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
	[attr](k) {
		const a = document.createAttributeNS(null, k);
		a.textContent = this + "";
		return this[setNode](a);
	}
	get [child]() {
		return this[setNode](new Text(this + ""));
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
 * Objects that implement this type can be used in place of both property values and Children in calls to {@link dom:amendNode and {@link dom:clearNode}, as well as the bound element functions from the {@link module:html} and {@link module:svg} modules.
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
	[value]() {
		return this.value;
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
		return this.value?.toString() ?? "";
	}
	transform(fn) {
		const tb = new TransformedBound(this, fn);

		this[setNode](tb);

		return tb;
	}
}

class TransformedBound extends Binding {
	#bound;
	#fn;
	constructor(b, fn) {
		super();
		this.#bound = b;
		this.#fn = fn;
	}

	get value() { return this.#fn(this.#bound.value); }

	toString() {
		return this.value + "";
	}
}

/**
 * This function can be used either as a normal function, binding a single value, or as a template tag function.
 *
 * When used normally, this function takes a single starting value and returns a {@link Bound} class with that value set.
 *
 * When used as a tag function, this function will return a type that is bound to all Bind expressions used within the template.
 *
 * Both returned types can be used as attributes or children in {@link dom:amendNode} and {@link dom:clearNode} calls.
 *
 * @typeParam T
 * @param {T} v Value to be bound so it can be changed when assigned to an element attribute or child.
 *
 * @return {Binding} Bound value.
 */
export default (v, first, ...bindings) => {
	if (v instanceof Array && first) {
		return new TemplateBind(v, first, ...bindings);
	}
	return new Bound(v);
};
