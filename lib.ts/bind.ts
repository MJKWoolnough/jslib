import {attr, child, value} from './dom.js';
import {Pipe} from './inter.js';

/**
 * This modules contains a Function for creating {@link https://developer.mozilla.org/en-US/docs/Web/API/Attr | Attr} and {@link https://developer.mozilla.org/en-US/docs/Web/API/Text | Text} nodes that update their textContent automatically.
 *
 * This module directly imports the {@link module:dom} module.
 *
 * @module bind
 * @requires module:dom
 */
/** */

interface BindFn {
	<T>(t: T): Binding<T>;
	(strings: TemplateStringsArray, ...bindings: any[]): TemplateBind;
}

const isEventListenerObject = (prop: unknown): prop is EventListenerObject => prop instanceof Object && (prop as EventListenerObject).handleEvent instanceof Function,
      binding = Symbol("binding");

/**
 * Objects that implement this type can be used in place of both property values and Children in calls to {@link dom:amendNode and {@link dom:clearNode}, as well as the bound element functions from the {@link module:html} and {@link module:svg} modules.
 *
 * When the value on the class is changed, the values of the properties and the child nodes will update accordingly.
 */
export class Binding<T = string> {
	#pipe = new Pipe<T>
	#value: T;
	#refs = 0;

	constructor(value: T) {
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
		const t = new Text(this.#value + "");

		return this.#node(t);
	}

	#node<U extends Text | Attr>(n: U) {
		let node: U | null = n;

		this.#refs++;

		const ref = new WeakRef(n),
		      fn = (v: T) => {
			const n = node ?? ref.deref();

			if (!n) {
				this.#pipe.remove(fn);
				this.#refs--;

				return;
			}

			node = n instanceof Text && n.parentNode || n instanceof Attr && n.ownerElement ? n : null;

			n.textContent = v + "";
		      };

		this.#pipe.receive(fn);
		Object.assign(n, {[binding]: this});

		return n;
	}

	handleEvent(e: Event) {
		if (this.#value instanceof Function) {
			this.#value.call(e.currentTarget, e);
		} else if (isEventListenerObject(this.#value)) {
			this.#value.handleEvent(e);
		}
	}

	transform<U>(fn: (v: T) => U): TransformedBinding<U> {
		let tb: TransformedBinding<U> | null = new TransformedBinding(fn(this.#value));

		this.#refs++;

		const ref = new WeakRef(tb!),
		      bFn = (v: T) => {
			const b = tb ?? ref.deref();

			if (!b) {
				this.#pipe.remove(bFn);
				this.#refs--;

				return;
			}

			b.#set(fn(v))

			tb = b.#refs ? b : null;
		      };

		this.#pipe.receive(bFn);

		return tb!;
	}

	onChange<U>(fn: (v: T) => U) {
		const bFn = (v: T) => fn(v);

		this.#pipe.receive(bFn);

		return () => this.#pipe.remove(bFn);
	}

	toString() {
		return this.#value + "";
	}
}

const processTemplate = (strings: TemplateStringsArray, ...values: any[]) => {
	let str = "";

	for (let i = 0; i < strings.length; i++) {
		str += strings[i] + (values[i] ?? "");
	}

	return str;
      };

class TemplateBind extends Binding<string> {
	constructor(strings: TemplateStringsArray, ...values: any[]) {
		const vals: any[] = [];
		
		let debounce = -1;

		for (const v of values) {
			if (v instanceof Binding) {
				const index = vals.length;

				v.onChange(val => {
					vals[index] = val;

					if (debounce === -1) {
						debounce = setTimeout(() => {
							super.value = processTemplate(strings, vals);
							debounce = -1;
						});
					}
				});

				vals.push(v.value);
			} else {
				vals.push(v);
			}
		}

		super(processTemplate(strings, vals));
	}

	get value() {
		return super.value;
	}
}

class TransformedBinding<T> extends Binding<T> {
	get value() {
		return super.value;
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
export default (<T>(v: T | TemplateStringsArray, first?: any, ...bindings: any[]) => {
	if (v instanceof Array && first) {
		return new TemplateBind(v, first, ...bindings);
	}
	return new Binding<T>(v as T);
}) as BindFn;
