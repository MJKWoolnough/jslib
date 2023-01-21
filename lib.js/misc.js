export const isInt = (v, min = -Infinity, max = Infinity) => typeof v === "number" && (v|0) === v && v >= min && v <= max,
checkInt = (n, min = -Infinity, max = Infinity, def = 0) => isInt(n, min, max) ? n : def,
mod = (n, m) => ((n % m) + m) % m,
setAndReturn = (m, k, v) => {
	m.set(k, v);
	return v;
},
pushAndReturn = (a, v) => {
	a.push(v);
	return v;
},
addAndReturn = (s, v) => {
	s.add(v);
	return v;
},
queue = (() => {
	let p = Promise.resolve();
	return fn => p = p.finally(fn);
})(),
autoFocus = (node, inputSelect = true) => {
	window.setTimeout(() => {
		node.focus();
		if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && inputSelect) {
			node.select();
		}
	}, 0);
	return node;
};
