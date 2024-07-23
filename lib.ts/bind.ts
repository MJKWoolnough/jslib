import type {BoundAttr, BoundChild} from './dom.js';
import {amendNode, attr, child, isEventListenerObject} from './dom.js';
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
	(v: T): T;
}

interface ReadOnlyBindingFn<T> extends ReadOnlyBinding<T> {
	(): T;
}

interface BindFn {
	<T>(t: T): BindingFn<T>;
	(strings: TemplateStringsArray, ...bindings: any[]): ReadOnlyBindingFn<string>;
	<T, B extends unknown[]>(fn: (...v: {[K in keyof B]: B[K] extends Binding<infer S> ? S : B[K]}) => T, ...bindings: B): ReadOnlyBinding<T>;
}

/**
 * Objects that implement this type can be used in place of both property values and Children in calls to {@link dom:amendNode and {@link dom:clearNode}, as well as the bound element functions from the {@link module:html} and {@link module:svg} modules.
 *
 * When the value on the class is changed, the values of the properties and the child nodes will update accordingly.
 *
 * This class implements a function that can take a new value to set the binding value. This function can also be called with no argument to simply get the value of the binding.
 *
 * @param {T} [v] The value to set the binding to.
 *
 * @returns {T}   The value the binding is set to.
 */
export class Binding<T = string> extends Callable<(v: T) => T> implements BoundAttr, BoundChild {
	#pipe = new Pipe<T>();
	#value: T;
	#refs = 0;

	constructor(value: T) {
		super(function(this: unknown, v: T) {
			if (v instanceof Event && this instanceof EventTarget && this === v.currentTarget) {
				const value = self.#value;

				if (value instanceof Function) {
					return value.call(v.currentTarget, v);
				} else if (isEventListenerObject(value)) {
					return value.handleEvent(v);
				}

				return;
			}

			if (arguments.length && Object.getOwnPropertyDescriptor(Object.getPrototypeOf(self), "value")?.set) {
				self.value = v;
			}

			return self.#value;
		});

		const self = this;

		this.#value = value;
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

	[attr](n: Node, name: string) {
		const fn = (n: Node, v: T) => amendNode(n, {[name]: v});

		fn(n, this.#value);

		return this.#handleRef(n, fn, n => !!n.parentNode);
	}

	get [child]() {
		return this.#handleRef(new Text(this.#value + ""), (n, v) => n.textContent = v + "", n => !!n.parentNode);
	}

	#handleRef<U extends Node | ReadOnlyBinding<any>>(r: U, update: (ref: U, value: T) => void, isActive: (ref: U) => boolean) {
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
		return Binding.#multiple(values => {
			let str = "";

			for (let i = 0; i < strings.length; i++) {
				str += strings[i] + (values[i] ?? "");
			}

			return str;
	      }, values);
	}

	static #multiple<T, B extends readonly any[]>(fn: (b: {[K in keyof B]: B[K] extends Binding<infer U> ? U : B[K]}) => T, values: B) {
		let ref: Binding<T> | null = new ReadOnlyBinding(fn(values.map(v => v instanceof Binding ? v.#value : v) as any));

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

			r.#set(fn(vals as any));
		      }, ...values.map(v => v instanceof Binding ? [v.#pipe, v.#value] : v) as {[K in keyof B]: B[K] extends Binding<infer U> ? [Pipe<U>, U] : B[K]});

		for (const b of values) {
			if (b instanceof Binding) {
				b.#refs++;
			}
		}

		return ref as ReadOnlyBindingFn<T>;
	}

	static multiple<T, B extends readonly unknown[]>(fn: (...v: {[K in keyof B]: B[K] extends Binding<infer U> ? U : B[K]}) => T, ...bindings: B) {
		return Binding.#multiple(values => fn(...values as any), bindings);
	}
}

class ReadOnlyBinding<T> extends Binding<T> {
	get value() {
		return super.value;
	}
}

/**
 * This function can be used as a normal function, binding a single value, as a template tag function, or as a constructor for a MultiBinding.
 *
 * When used normally, this function takes a single starting value and returns a {@link Binding} class with that value set.
 *
 * @typeParam T
 * @param {T} v Value to be bound so it can be changed when assigned to an element attribute or child.
 *
 * @return {Binding<T>} Bound value.
 *
 * When used as a tag function, this function will return a readonly {@link Binding} that is bound to all Bind expressions used within the template.
 *
 * @param {TemplateStringsArray}            v    The strings portions of a temple.
 * @param {...(Binding<unknown> | unknown)} args The non-string portions of a temple, which can include Bindings to watch.
 *
 * @return {ReadonlyBinding<string>} The Binding that will update when one of the passed Bindings is updated.
 *
 * When used to create a MultiBinding, it takes, as the first argument, the function which will combine the values of the passed bindings, and the remaining arguments will be the Bindings or static value.
 *
 * @typeParam T
 * @typeParam {unknown[]} A
 * @typeParam {(Binding<unknown> | unknown>} B
 * @param {(b: ...A) => T} fn       The function to transform the values.
 * @param {...B}           bindings The bindings or static values to be watched and passed to the fn.
 *
 * @return {ReadonlyBinding<T>} The binding that is the result of the fn function, which will be updated when one of the passed Bindings changes.
 *
 * All returned types can be used as attributes or children in {@link dom:amendNode} and {@link dom:clearNode} calls.
 */
export default (<T>(v: T | TemplateStringsArray | ((v: unknown, ...vs: unknown[]) => unknown), ...bindings: unknown[]) => {
	if (bindings.length) {
		if (v instanceof Array) {
			return Binding.template(v, ...bindings);
		}

		if (v instanceof Function) {
			return Binding.multiple(v, ...bindings);
		}
	}

	return new Binding(v);
}) as BindFn;
