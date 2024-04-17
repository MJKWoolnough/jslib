/**
 * The misc module contains various simple, dependency-free functions.
 *
 * @module misc
 */
/** */

export const
/**
 * This function determines whether `v` is a valid integer in the range provided (min <= v <= max).
 *
 * NB: NB: Infinity is not a valid integer.
 *
 * @param {unknown} v              Value to be checked.
 * @param {number} [min=-Infinity] Minimum acceptable value.
 * @param {number} [max=+Infinity] Maximum acceptable value.
 *
 * @return {boolean} `true` if `v` is an integer between `min` and `max` inclusive.
 */
isInt = (v: unknown, min = -Infinity, max = Infinity): v is number => typeof v === "number" && (v|0) === v && v >= min && v <= max,
/**
 * This function determines whether `n` is a valid integer, as determined by the {@link isInt} function, and returns `n` if it is, or `def` otherwise.
 *
 * @param {unknown} n                     The value to be checked.
 * @param {number} [min=-Infinity]        Minimum acceptable value.
 * @param {number} [max=+Infinity]        Maximum acceptable value.
 * @param {number} [def=Math.max(min, 0)] Default value to be returned if `n` is unacceptable.
 *
 * @return {number} The number `n` if it is an integer between `min` and `max` inclusively, or `def` (cast to an integer) otherwise.
 */
checkInt = (n: unknown, min = -Infinity, max = Infinity, def = Math.max(min, 0)) => isInt(n, min, max) ? n : def|0,
/**
 * Modulo function.
 *
 * @param {number} n
 * @param {number} m
 *
 * @return {number} The modulo of `n % m`.
 */
mod = (n: number, m: number) => ((n % m) + m) % m,
/**
 * This function sets a value in a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map | Map}-like structure and returns the value.
 *
 * @typeParam K
 * @typeParam V
 * @param {{set: (K, V) => void}} m Map-like object.
 * @param {K} k                    Key for where value is to be stored.
 * @param {V} v                    Value to be stored.
 *
 * @return {V} The value `v`.
 */
setAndReturn = <K, V>(m: {set: (k: K, v: V) => void}, k: K, v: V) => {
	m.set(k, v);
	return v;
},
/**
 * This functions pushes a value to a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array | Array}-like structure and returns the value.
 *
 * @typeParam V
 * @param {{push: (V) => void}} a The Array-like object to push to.
 * @param {V} v                  The value to be pushed.
 *
 * @return {V} The value `v`.
 */
pushAndReturn = <V>(a: {push: (m: V) => void}, v: V) => {
	a.push(v);
	return v;
},
/**
 * This functions adds a value to a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set | Set}-like structure and returns the value.
 *
 * @typeParam V
 * @param {{add: (V) => void}} a The Set-like object to add to.
 * @param {V} v                 The value to be added.
 *
 * @return {V} The value `v`.
 */
addAndReturn = <V>(s: {add: (m: V) => void}, v: V) => {
	s.add(v);
	return v;
},
/**
 * This function queues the passed function to be run after all previous calls to this function.
 *
 * @param {() => Promise<any>} fn The function to be queued.
 *
 * @return {Promise<void>} Promise that resolves after function runs.
 */
queue = (() => {
	let p = Promise.resolve();
	return (fn: () => Promise<any>) => p = p.finally(fn);
})(),
/**
 * This function will schedule an element to be focused after the after the current event loop finishes. If the element is an {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement | HTMLInputElement} or a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement | HTMLTextAreaElement} the element will also be selected unless the `inputSelect` param is set to false.
 *
 * @typeParam {{focus(): void}} T
 * @param {T} node                     The Node to be focused.
 * @param {boolean} [inputSelect=true] Set to false to stop HTMLInputElements and HTMLTextAreaElements from being `selected`.
 *
 * @return {T} The passed node.
 */
autoFocus = <T extends {focus(): void}>(node: T, inputSelect = true) => {
	window.setTimeout(() => {
		node.focus();
		if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && inputSelect) {
			node.select();
		}
	});
	return node;
},
/**
 * This function converts valid HTML/SVG/MathML text into DOM Nodes.
 *
 * @param {string} text The text to be converted.
 *
 * @return {DocumentFragment} The parsed DOM nodes stored in a {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment}.
 */
text2DOM = (text: string) => {
	const t = document.createElement("template");
	t.innerHTML = text;
	return t.content;
},
/** A function to sort strings. */
stringSort = new Intl.Collator().compare;

/**
 * This class provides a convenient way to extend a Function with class attributes and methods.
 *
 * The child class will need appropriate typing to make it correctly appear as the type of the passed function as well as the child class.
 */
export class Callable<Fn extends Function> extends Function {
	constructor(fn: Fn) {
		false && super();

		return Object.setPrototypeOf(fn, new.target.prototype);
	}
};
