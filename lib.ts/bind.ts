import {attr, child, value} from './dom.js';
import {Pipe} from './inter.js';
import {Callable} from './misc.js';

/**
 * This modules contains a Function for creating {@link https://developer.mozilla.org/en-US/docs/Web/API/Attr | Attr} and {@link https://developer.mozilla.org/en-US/docs/Web/API/Text | Text} nodes that update their textContent automatically.
 *
 * This module directly imports the {@link module:dom}, and {@link modile:inter} modules.
 *
 * @module bind
 * @requires module:dom
 * @requires module:inter
 */
/** */

interface BindingFn<T> extends Binding<T> {
	(): T;
	(v?: T): T;
}

interface BindFn {
	<T>(t: T): BindingFn<T>;
	(strings: TemplateStringsArray, ...bindings: any[]): ReadOnlyBinding<string>;
}

const isEventListenerObject = (prop: unknown): prop is EventListenerObject => prop instanceof Object && (prop as EventListenerObject).handleEvent instanceof Function,
      processTemplate = (strings: TemplateStringsArray, values: any[]) => {
	let str = "";

	for (let i = 0; i < strings.length; i++) {
		str += strings[i] + (values[i] ?? "");
	}

	return str;
      };

/**
 * Objects that implement this type can be used in place of both property values and Children in calls to {@link dom:amendNode and {@link dom:clearNode}, as well as the bound element functions from the {@link module:html} and {@link module:svg} modules.
 *
 * When the value on the class is changed, the values of the properties and the child nodes will update accordingly.
 */
export class Binding<T = string> extends Callable<(v: T) => T> {
	#pipe = new Pipe<T>();
	#value: T;
	#refs = 0;

	constructor(value: T) {
		super(function(this: unknown, v: T) {
			if (v instanceof Event && this instanceof EventTarget && this === v.currentTarget) {
				const value = self.value;

				if (value instanceof Function) {
					return value.call(v.currentTarget, v);
				} else if (isEventListenerObject(value)) {
					return value.handleEvent(v);
				}

				return;
			}

			if (arguments.length) {
				self.value = v;
			}

			return self.value;
		});

		const self = this;

		this.#value = value;
	}

	get [value]() {
		return this.#value;
	}

	get value() {
		return this.#value;
	}

	set value(v: T) {
		this.#set(v);
	}

	#set(v: T) {
		this.#pipe.send(this.#value = v);
	}

	[attr](name: string) {
		const a = document.createAttributeNS(null, name);
		a.textContent = this.#value + "";

		return this.#node(a);
	}

	get [child]() {
		return this.#node(new Text(this.#value + ""));
	}

	#node<U extends Text | Attr>(n: U) {
		return this.#handleRef(n, (n, v) => n.textContent = v + "", n => !!(n instanceof Text && n.parentNode || n instanceof Attr && n.ownerElement));
	}

	#handleRef<U extends Text | Attr | ReadOnlyBinding<any>>(r: U, update: (ref: U, value: T) => void, isActive: (ref: U) => boolean) {
		let ref: U | null = r;

		this.#refs++;

		const wref = new WeakRef(r),
		      fn = (v: T) => {
			const r = ref ?? wref.deref();

			if (!r) {
				this.#pipe.remove(fn);
				this.#refs--;

				return;
			}

			ref = isActive(r) ? r : null;

			update(r, v);
		      };

		this.#pipe.receive(fn);

		return r;
	}

	/** This method returns a new Binding that transforms the result of the template according to the specified function. */
	transform<U>(fn: (v: T) => U): ReadOnlyBinding<U> {
		return this.#handleRef(new ReadOnlyBinding(fn(this.#value)), (n, v) => n.#set(fn(v)), n => n.#refs > 0);
	}

	/** This method runs the provided callback whenever the value changes, passing the function the current value. */
	onChange<U>(fn: (v: T) => U) {
		const bFn = (v: T) => fn(v);

		this.#pipe.receive(bFn);

		return () => this.#pipe.remove(bFn);
	}

	toString() {
		return this.#value + "";
	}

	toJSON() {
		return this.#value;
	}

	static template(strings: TemplateStringsArray, ...values: any[]) {
		let ref: Binding | null = new ReadOnlyBinding(processTemplate(strings, values));

		const wref = new WeakRef(ref),
		      cancel = Pipe.any(vals => {
			const r = ref ?? wref.deref();

			if (!r) {
				for (const b of values) {
					if (b instanceof Binding) {
						b.#refs--;
					}
				}

				cancel();

				return;
			}

			ref = r.#refs ? r : null;

			r.#set(processTemplate(strings, vals));
		      }, ...values.map(v => v instanceof Binding ? [v.#pipe, v.value] : v));

		for (const b of values) {
			if (b instanceof Binding) {
				b.#refs++;
			}
		}

		return ref;
	}
}

class ReadOnlyBinding<T> extends Binding<T> {
	get value() {
		return super.value;
	}
}

/**
 * This function can be used either as a normal function, binding a single value, or as a template tag function.
 *
 * When used normally, this function takes a single starting value and returns a {@link Binding} class with that value set.
 *
 * When used as a tag function, this function will return a readonly {@link Binding}  that is bound to all Bind expressions used within the template.
 *
 * Both returned types can be used as attributes or children in {@link dom:amendNode} and {@link dom:clearNode} calls.
 *
 * @typeParam T
 * @param {T} v Value to be bound so it can be changed when assigned to an element attribute or child.
 *
 * @return {Binding} Bound value.
 */
export default (<T>(v: T | TemplateStringsArray, first?: any, ...bindings: any[]) => {
	if (v instanceof Array && first) {
		return Binding.template(v, first, ...bindings);
	}

	return new Binding<T>(v as T) as BindingFn<T>;
}) as BindFn;
