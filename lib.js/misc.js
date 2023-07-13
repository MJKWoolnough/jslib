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
isInt = (v, min = -Infinity, max = Infinity) => typeof v === "number" && (v|0) === v && v >= min && v <= max,
/**
 * This function determines whether `n` is a valid integer, as determined by the {@link isInt} function, and returns `n` if it is, or `def` otherwise.
 *
 * @param {unknown} n              The value to be checked.
 * @param {number} [min=-Infinity] Minimum acceptable value.
 * @param {number} [max=+Infinity] Maximum acceptable value.
 * @param {number} [def=0]         Default value to be returned if `n` is unacceptable.
 *
 * @return {number} The number `n` if it is an integer between `min` and `max` inclusively, or `def` otherwise.
 */
checkInt = (n, min = -Infinity, max = Infinity, def = 0) => isInt(n, min, max) ? n : def,
/**
 * Modulo function.
 *
 * @param {number} n
 * @param {number} m
 *
 * @return {number} The modulo of `n % m`.
 */
mod = (n, m) => ((n % m) + m) % m,
/**
 * This function sets a value in a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map | Map}-like structure and returns the value.
 *
 * @typeParam K
 * @typeParam V
 * @param {{set: (K, V) => any}} m Map-like object.
 * @param {K} k                    Key for where value is to be stored.
 * @param {V} v                    Value to be stored.
 *
 * @return {V} The value `v`.
 */
setAndReturn = (m, k, v) => {
	m.set(k, v);
	return v;
},
/**
 * This functions pushes a value to a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array | Array}-like structure and returns the value.
 *
 * @typeParam V
 * @param {{push: (V) => any}} a The Array-like object to push to.
 * @param {V} v                  The value to be pushed.
 *
 * @return {V} The value `v`.
 */
pushAndReturn = (a, v) => {
	a.push(v);
	return v;
},
/**
 * This functions adds a value to a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set | Set}-like structure and returns the value.
 *
 * @typeParam V
 * @param {{add: (V) => any}} a The Set-like object to add to.
 * @param {V} v                 The value to be added.
 *
 * @return {V} The value `v`.
 */
addAndReturn = (s, v) => {
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
	return fn => p = p.finally(fn);
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
autoFocus = (node, inputSelect = true) => {
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
text2DOM = text => {
	const t = document.createElement("template");
	t.innerHTML = text;
	return t.content;
};
