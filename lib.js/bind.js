import {attr, child, value} from './dom.js';
import {Pipe} from './inter.js';

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

const isEventListenerObject = prop => prop instanceof Object && prop.handleEvent instanceof Function,
      processTemplate = (strings, values) => {
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
 *
 * NB: This class should not be used directly as an Item in the nodes module, as the [child] attribute will return a new Node each time it is accessed, instead use Binding[child].
 */
export class Binding {
	#pipe = new Pipe();
	#value;
	#refs = 0;

	constructor(value) {
		this.#value = value;
	}

	get [value]() {
		return this.#value;
	}

	get value() {
		return this.#value;
	}

	set value(v) {
		this.#set(v);
	}

	#set(v) {
		this.#pipe.send(this.#value = v);
	}

	[attr](name) {
		const a = document.createAttributeNS(null, name);
		a.textContent = this.#value + "";

		return this.#node(a);
	}

	get [child]() {
		return this.#node(new Text(this.#value + ""));
	}

	#node(n) {
		return this.#handleRef(n, (n, v) => n.textContent = v + "", n => !!(n instanceof Text && n.parentNode || n instanceof Attr && n.ownerElement));
	}

	#handleRef(r, update, isActive) {
		let ref = r;

		this.#refs++;

		const wref = new WeakRef(r),
		      fn = v => {
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

	handleEvent(e) {
		if (this.#value instanceof Function) {
			this.#value.call(e.currentTarget, e);
		} else if (isEventListenerObject(this.#value)) {
			this.#value.handleEvent(e);
		}
	}

	/** This method returns a new Binding that transforms the result of the template according to the specified function. */
	transform(fn) {
		return this.#handleRef(new ReadOnlyBinding(fn(this.#value)), (n, v) => n.#set(fn(v)), n => n.#refs > 0);
	}

	/** This method runs the provided callback whenever the value changes, passing the function the current value. */
	onChange(fn) {
		const bFn = v => fn(v);

		this.#pipe.receive(bFn);

		return () => this.#pipe.remove(bFn);
	}

	toString() {
		return this.#value + "";
	}

	toJSON() {
		return this.#value;
	}

	static template(strings, ...values) {
		let ref = new ReadOnlyBinding(processTemplate(strings, values));

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

class ReadOnlyBinding extends Binding {
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
export default (v, first, ...bindings) => {
	if (v instanceof Array && first) {
		return Binding.template(v, first, ...bindings);
	}
	return new Binding(v);
};
