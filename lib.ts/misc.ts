export const isInt = (v: unknown, min = -Infinity, max = Infinity): v is number => typeof v === "number" && (v|0) === v && v >= min && v <= max,
checkInt = (n: unknown, min = -Infinity, max = Infinity, def = 0) => isInt(n, min, max) ? n : def,
mod = (n: number, m: number) => ((n % m) + m) % m,
setAndReturn = <K, V>(m: {set: (k: K, v: V) => any}, k: K, v: V) => {
	m.set(k, v);
	return v;
},
pushAndReturn = <V>(a: {push: (m: V) => any}, v: V) => {
	a.push(v);
	return v;
},
addAndReturn = <V>(s: {add: (m: V) => any}, v: V) => {
	s.add(v);
	return v;
},
queue = (() => {
	let p = Promise.resolve();
	return (fn: () => Promise<any>) => p = p.finally(fn);
})(),
autoFocus = <T extends {focus(): void}>(node: T, inputSelect = true) => {
	window.setTimeout(() => {
		node.focus();
		if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && inputSelect) {
			node.select();
		}
	}, 0);
	return node;
};
