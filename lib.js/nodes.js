export const node = Symbol("node"),
noSort = () => 0,
stringSort = new Intl.Collator().compare;

const sortNodes = (root, n) => {
	while (n.p.i && root.s(n.i, n.p.i) * root.o < 0) {
		n.n.p = n.p;
		n.p.n = n.n;
		n.n = n.p;
		const pp = n.p.p;
		n.p.p = n;
		n.p = pp;
		pp.n = n;
	}
	while (n.n.i && root.s(n.i, n.n.i) * root.o > 0) {
		n.n.p = n.p;
		n.p.n = n.n;
		n.p = n.n;
		const nn = n.n.n;
		n.n.n = n;
		n.n = nn;
		nn.p = n;
	}
	if (n.n.i) {
		root.h.insertBefore(n.i[node], n.n.i[node]);
	} else {
		root.h.appendChild(n.i[node]);
	}
	return n;
      },
      getNode = (root, index) => {
	if (index < 0) {
		for (let curr = root.p, pos = index; curr.i; pos++, curr = curr.p) {
			if (pos === 0) {
				return [curr, pos];
			}
		}
	} else if (index < root.l) {
		for (let curr = root.n, pos = index; curr.i; pos--, curr = curr.n) {
			if (pos === 0) {
				return [curr, pos];
			}
		}
	}
	return [root, -1];
      },
      addItemAfter = (root, after, i) => {
	root.l++;
	return sortNodes(root, after.n = after.n.p = {"p": after, "n": after.n, i});
      },
      removeNode = (root, n) => {
	n.p.n = n.n;
	n.n.p = n.p;
	if (n.i[node].parentNode === root.h) {
		root.h.removeChild(n.i[node]);
	}
	root.l--;
      },
      entries = function* (root, start = 0, direction = 1) {
	for (let [curr, pos] = getNode(root, start); curr.i; pos += direction, curr = direction === 1 ? curr.n : curr.p) {
		yield [pos, curr.i];
	}
      },
      pIFn = (name, fn) => {
	if (typeof name === "number") {
		return fn(name);
	} else if (typeof name === "string") {
		const index = parseInt(name);
		if (index.toString() === name) {
			return fn(index);
		}
	}
	return undefined;
      },
      noItemFn = n => ({[node]: n}),
      sort = (root, compareFunction) => {
	if (compareFunction) {
		root.s = compareFunction;
		root.o = 1;
		if (compareFunction === noSort) {
			return;
		}
	}
	let curr = root.n;
	root.n = root.p = root;
	while (curr.i) {
		const next = curr.n;
		curr.p = root.p;
		curr.n = root;
		sortNodes(root, root.p = root.p.n = curr);
		curr = next;
	}
      },
      reverse = root => {
	[root.p, root.n] = [root.n, root.p];
	root.o *= -1;
	for (let curr = root.n; curr.i; curr = curr.n) {
		[curr.n, curr.p] = [curr.p, curr.n];
		root.h.appendChild(curr.i[node]);
	}
      },
      replaceKey = (root, k, item, prev) => {
	const old = root.m.get(k);
	if (old) {
		if (Object.is(old.i, item) && old.p === prev) {
			return;
		}
		removeNode(root, old);
	}
	root.m.set(k, Object.assign(addItemAfter(root, prev, item), {k}));
      },
      realTarget = Symbol("realTarget"),
      proxyObj = {
	has: (target, name) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
	get: (target, name) => pIFn(name, index => target.at(index)) || target[name],
	set: (target, name, value) => pIFn(name, index => {
		target.splice(index, 1, value);
		return true;
	}) || false,
	deleteProperty: (target, name) => pIFn(name, index => target.splice(index, 1).length > 0) || delete target[name]
      };

export class NodeArray {
	#root;
	constructor(h, s = noSort, elements = []) {
		const root = this.#root = {s, h, l: 0, o: 1};
		Object.defineProperty(this, realTarget, {"value": this});
		root.p = root.n = root;
		for (const item of elements) {
			addItemAfter(root, root.p, item);
		}
		return new Proxy(this, proxyObj);
	}
	get [node]() {
		return this[realTarget].#root.h;
	}
	get length() {
		return this[realTarget].#root.l;
	}
	at(index) {
		const [node, pos] = getNode(this[realTarget].#root, index);
		return pos !== -1 ? node.i : undefined;
	}
	concat(...items) {
		return Array.from(this.values()).concat(...items);
	}
	copyWithin(target, start, end) {
		throw new Error("invalid");
	}
	*entries() {
		yield *entries(this[realTarget].#root);
	}
	every(callback, thisArg) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (!callback.call(thisArg, item, index, this)) {
				return false;
			}
		}
		return true;
	}
	fill(value, start, end) {
		throw new Error("invalid");
	}
	filter(callback, thisArg) {
		const filter = [];
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (callback.call(thisArg, item, index, this)) {
				filter.push(item);
			}
		}
		return filter;
	}
	filterRemove(callback, thisArg) {
		const root = this[realTarget].#root,
		      filtered = [];
		for (let curr = root.n, i = 0; curr.i; curr = curr.n, i++) {
			if (callback.call(thisArg, curr.i, i, this)) {
				removeNode(root, curr);
				filtered.push(curr.i);
			}
		}
		return filtered;
	}
	find(callback, thisArg) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (callback.call(thisArg, item, index, this)) {
				return item;
			}
		}
		return undefined;
	}
	findIndex(callback, thisArg) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (callback.call(thisArg, item, index, this)) {
				return index;
			}
		}
		return -1;
	}
	flat(depth) {
		return Array.from(this.values()).flat(depth);
	}
	flatMap(callback, thisArg) {
		return this.map(callback, thisArg).flat();
	}
	forEach(callback, thisArg) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			callback.call(thisArg, item, index, this);
		}
	}
	static from(n, itemFn = noItemFn) {
		const s = new NodeArray(n),
		      root = s.#root;
		for (const c of n.childNodes) {
			const i = itemFn(c);
			if (i) {
				root.p = root.p.n = {"p": root.p, n: root, i};
				root.l++;
			}
		}
		return s;
	}
	includes(valueToFind, fromIndex = 0) {
		for (const [, item] of entries(this[realTarget].#root, fromIndex)) {
			if (Object.is(valueToFind, item)) {
				return true;
			}
		}
		return false;
	}
	indexOf(searchElement, fromIndex = 0) {
		for (const [index, item] of entries(this[realTarget].#root, fromIndex)) {
			if (Object.is(searchElement, item)) {
				return index;
			}
		}
		return -1;
	}
	join(separator) {
		return Array.from(this.values()).join(separator);
	}
	*keys() {
		for (let i = 0; i < this[realTarget].#root.l; i++) {
			yield i;
		}
	}
	lastIndexOf(searchElement, fromIndex = 0) {
		for (const [index, item] of entries(this[realTarget].#root, fromIndex, -1)) {
			if (Object.is(searchElement, item)) {
				return index;
			}
		}
		return -1;
	}
	map(callback, thisArg) {
		const map = [];
		for (const [index, item] of entries(this[realTarget].#root)) {
			map.push(callback.call(thisArg, item, index, this));
		}
		return map;
	}
	pop() {
		const root = this[realTarget].#root,
		      last = root.p;
		if (last.i) {
			removeNode(root, last);
		}
		return last.i;
	}
	push(element, ...elements) {
		const root = this[realTarget].#root;
		addItemAfter(root, root.p, element);
		for (const item of elements) {
			addItemAfter(root, root.p, item);
		}
		return root.l;
	}
	reduce(callbackfn, initialValue) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (initialValue === undefined) {
				initialValue = item;
			} else {
				initialValue = callbackfn(initialValue, item, index, this);
			}
		}
		return initialValue;
	}
	reduceRight(callbackfn, initialValue) {
		for (const [index, item] of entries(this[realTarget].#root, 0, -1)) {
			if (initialValue === undefined) {
				initialValue = item;
			} else {
				initialValue = callbackfn(initialValue, item, index, this);
			}
		}
		return initialValue;
	}
	reverse() {
		reverse(this[realTarget].#root);
		return this;
	}
	shift() {
		const root = this[realTarget].#root,
		      first = root.n;
		if (first.i) {
			removeNode(root, first);
		}
		return first.i;
	}
	slice(begin = 0, end) {
		const root = this[realTarget].#root,
		      slice = [];
		if (end === undefined) {
			end = root.l;
		} else if (end < 0) {
			end += root.l;
		}
		for (const [index, item] of entries(root, begin)) {
			if (index >= end) {
				break;
			}
			slice.push(item);
		}
		return slice;
	}
	some(callback, thisArg) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (callback.call(thisArg, item, index, this)) {
				return true;
			}
		}
		return false;
	}
	sort(compareFunction) {
		sort(this[realTarget].#root, compareFunction);
		return this;
	}
	splice(start, deleteCount = 0, ...items) {
		const root = this[realTarget].#root,
		      removed = [];
		let [curr] = getNode(root, start),
		    adder = curr.p;
		for (; curr.i && deleteCount > 0; deleteCount--, curr = curr.n) {
			removed.push(curr.i);
			removeNode(root, curr);
		}
		for (const item of items) {
			adder = addItemAfter(root, adder, item);
		}
		return removed;
	}
	unshift(element, ...elements) {
		const root = this[realTarget].#root;
		let adder = addItemAfter(root, root, element);
		for (const item of elements) {
			adder = addItemAfter(root, adder, item);
		}
		return root.l;
	}
	*values() {
		for (let curr = this[realTarget].#root.n; curr.i; curr = curr.n) {
			yield curr.i;
		}
	}
	*[Symbol.iterator]() {
		yield* this.values();
	}
	[Symbol.unscopables]() {
		return {
			"copyWithin": true,
			"entries": true,
			"fill": true,
			"find": true,
			"findIndex": true,
			"includes": true,
			"keys": true,
			"values": true
		}
	}
}

export class NodeMap {
	#root;
	constructor(h, s = noSort, entries = []) {
		const root = this.#root = {s, h, l: 0, o: 1, m: new Map()};
		root.p = root.n = root;
		for (const [k, item] of entries) {
			replaceKey(root, k, item, root.p);
		}
	}
	get [node]() {
		return this.#root.h;
	}
	get size() {
		return this.#root.l;
	}
	clear() {
		const root = this.#root;
		for (let curr = root.n; curr.i; curr = curr.n) {
			removeNode(root, curr);
		}
		root.m.clear();
	}
	delete(k) {
		const root = this.#root,
		      curr = root.m.get(k);
		if (!curr) {
			return false;
		}
		removeNode(root, curr);
		return root.m.delete(k);
	}
	*entries() {
		for (const [k, v] of this.#root.m) {
			yield [k, v.i];
		}
	}
	forEach(callbackfn, thisArg = this) {
		this.#root.m.forEach((v, k) => callbackfn(v.i, k, thisArg));
	}
	get(k) {
		return this.#root.m.get(k)?.i;
	}
	has(k) {
		return this.#root.m.has(k);
	}
	insertAfter(k, item, after) {
		const root = this.#root,
		      a = root.m.get(after);
		if (!a) {
			return false;
		}
		replaceKey(root, k, item, a);
		return true;
	}
	insertBefore(k, item, before) {
		const root = this.#root,
		      b = root.m.get(before);
		if (!b) {
			return false;
		}
		replaceKey(root, k, item, b.p);
		return true;
	}
	keyAt(pos) {
		while (pos < 0) {
			pos += this.#root.l;
		}
		for (let curr = this.#root.n; curr.i; pos--, curr = curr.n) {
			if (pos === 0) {
				return curr.k;
			}
		}
		return undefined;
	}
	keys() {
		return this.#root.m.keys();
	}
	position(key) {
		const root = this.#root;
		let count = -1,
		    curr = (root.m.get(key) ?? root);
		while (curr !== root) {
			curr = curr.p;
			count++;
		}
		return count;
	}
	reSet(k, j) {
		const root = this.#root,
		      i = root.m.get(k);
		if (i) {
			this.delete(j);
			i.k = j;
			root.m.set(j, i);
		}
	}
	reverse() {
		reverse(this.#root);
		return this;
	}
	set(k, item) {
		const root = this.#root;
		replaceKey(root, k, item, root.p);
		return this;
	}
	sort(compareFunction) {
		sort(this.#root, compareFunction);
		return this;
	}
	*values() {
		for (const v of this.#root.m.values()) {
			yield v.i;
		}
	}
	*[Symbol.iterator]() {
		yield* this.entries();
	}
	get [Symbol.species]() {
		return NodeMap;
	}
	get [Symbol.toStringTag]() {
		return "[object NodeMap]";
	}
}
