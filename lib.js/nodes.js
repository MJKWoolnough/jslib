export const node = Symbol("node"),
noSort = () => 0,
stringSort = new Intl.Collator().compare;

const data = new WeakMap(),
      sortNodes = (root, n) => {
	while (n.prev.item && root.sortFn(n.item, n.prev.item) * root.order < 0) {
		n.next.prev = n.prev;
		n.prev.next = n.next;
		n.next = n.prev;
		const pp = n.prev.prev;
		n.prev.prev = n;
		n.prev = pp;
		pp.next = n;
	}
	while (n.next.item && root.sortFn(n.item, n.next.item) * root.order > 0) {
		n.next.prev = n.prev;
		n.prev.next = n.next;
		n.prev = n.next;
		const nn = n.next.next;
		n.next.next = n;
		n.next = nn;
		nn.prev = n;
	}
	if (n.next.item) {
		root.parentNode.insertBefore(n.item[node], n.next.item[node]);
	} else {
		root.parentNode.appendChild(n.item[node]);
	}
	return n;
      },
      getNode = (root, index) => {
	if (index < 0) {
		for (let curr = root.prev, pos = index; curr.item; pos++, curr = curr.prev) {
			if (pos === 0) {
				return [curr, pos];
			}
		}
	} else if (index < root.length) {
		for (let curr = root.next, pos = index; curr.item; pos--, curr = curr.next) {
			if (pos === 0) {
				return [curr, pos];
			}
		}
	}
	return [root, -1];
      },
      addItemAfter = (root, after, item) => {
	root.length++;
	return sortNodes(root, after.next = after.next.prev = {prev: after, next: after.next, item});
      },
      removeNode = (root, n) => {
	n.prev.next = n.next;
	n.next.prev = n.prev;
	root.parentNode.removeChild(n.item[node]);
	root.length--;
      },
      entries = function* (s, start = 0, direction = 1) {
	for (let [curr, pos] = getNode(data.get(s), start); curr.item; pos += direction, curr = direction === 1 ? curr.next : curr.prev) {
		yield [pos, curr.item];
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
      proxyObj = {
	has: (target, name) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
	get: (target, name) => pIFn(name, index => getNode(data.get(target), index)[0].item) || target[name],
	set: (target, name, value) => pIFn(name, index => {
		const root = data.get(target),
		      [n] = getNode(root, index);
		if (n.item) {
			root.parentNode.removeChild(n.item[node]);
			n.item = value;
			sortNodes(root, n);
		} else {
			addItemAfter(root, root.prev, value);
		}
		return true;
	}) || false,
	deleteProperty: (target, name) => pIFn(name, index => {
		const root = data.get(target),
		      [n] = getNode(root, index);
		if (n.item) {
			removeNode(root, n);
			return true;
		}
		return false;
	}) || delete target[name]
      },
      noItemFn = n => ({[node]: n}),
      sort = (t, compareFunction) => {
	const root = data.get(t);
	if (compareFunction) {
		root.sortFn = compareFunction;
		root.order = 1;
		if (compareFunction === noSort) {
			return;
		}
	}
	let curr = root.next;
	root.next = root.prev = root;
	while (curr.item) {
		const next = curr.next;
		curr.prev = root.prev;
		curr.next = root;
		sortNodes(root, root.prev = root.prev.next = curr);
		curr = next;
	}
      },
      reverse = t => {
	const root = data.get(t);
	[root.prev, root.next] = [root.next, root.prev];
	root.order *= -1;
	for (let curr = root.next; curr.item; curr = curr.next) {
		[curr.next, curr.prev] = [curr.prev, curr.next];
		root.parentNode.appendChild(curr.item[node]);
	}
      },
      replaceKey = (root, key, item, prev) => {
	const old = root.map.get(key);
	if (!old) {
		return;
	}
	if (!Object.is(old.item, item) || old.prev != prev) {
		removeNode(root, old);
		root.map.set(key, addItemAfter(root, prev, item));
	}
      };

export class NodeArray {
	constructor(parentNode, sortFn = noSort, elements = []) {
		const root = {sortFn, parentNode, length: 0, order: 1},
		      p = new Proxy(this, proxyObj);
		data.set(this, root.prev = root.next = root);
		data.set(p, root);
		for (const item of elements) {
			addItemAfter(root, root.prev, item);
		}
		return p;
	}
	get [node]() {
		return data.get(this).parentNode;
	}
	get length() {
		return data.get(this).length;
	}
	concat(...items) {
		return Array.from(this.values()).concat(...items);
	}
	copyWithin(target, start, end) {
		throw new Error("invalid");
	}
	*entries() {
		yield *entries(this);
	}
	every(callback, thisArg) {
		for (const [index, item] of entries(this)) {
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
		for (const [index, item] of entries(this)) {
			if (callback.call(thisArg, item, index, this)) {
				filter.push(item);
			}
		}
		return filter;
	}
	filterRemove(callback, thisArg) {
		const root = data.get(this),
		      filtered = [];
		for (let curr = root.next, i = 0; curr.item; curr = curr.next, i++) {
			if (callback.call(thisArg, curr.item, i, this)) {
				removeNode(root, curr);
				filtered.push(curr.item);
			}
		}
		return filtered;
	}
	find(callback, thisArg) {
		for (const [index, item] of entries(this)) {
			if (callback.call(thisArg, item, index, this)) {
				return item;
			}
		}
		return undefined;
	}
	findIndex(callback, thisArg) {
		for (const [index, item] of entries(this)) {
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
		for (const [index, item] of entries(this)) {
			callback.call(thisArg, item, index, this);
		}
	}
	static from(n, itemFn) {
		const s = new NodeArray(n),
		      root = data.get(s);
		for (const c of n.childNodes) {
			const item = itemFn(c);
			if (item) {
				root.prev = root.prev.next = {prev: root.prev, next: root, item};
				root.length++;
			}
		}
		return s;
	}
	includes(valueToFind, fromIndex = 0) {
		for (const [, item] of entries(this, fromIndex)) {
			if (Object.is(valueToFind, item)) {
				return true;
			}
		}
		return false;
	}
	indexOf(searchElement, fromIndex = 0) {
		for (const [index, item] of entries(this, fromIndex)) {
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
		const root = data.get(this);
		for (let i = 0; i < root.length; i++) {
			yield i;
		}
	}
	lastIndexOf(searchElement, fromIndex = 0) {
		for (const [index, item] of entries(this, fromIndex, -1)) {
			if (Object.is(searchElement, item)) {
				return index;
			}
		}
		return -1;
	}
	map(callback, thisArg) {
		const map = [];
		for (const [index, item] of entries(this)) {
			map.push(callback.call(thisArg, item, index, this));
		}
		return map;
	}
	pop() {
		const root = data.get(this),
		      last = root.prev;
		if (last.item) {
			removeNode(root, last);
		}
		return last.item;
	}
	push(element, ...elements) {
		const root = data.get(this);
		addItemAfter(root, root.prev, element);
		elements.forEach(item => addItemAfter(root, root.prev, item));
		return root.length;
	}
	reduce(callbackfn, initialValue) {
		for (const [index, item] of entries(this)) {
			if (initialValue === undefined) {
				initialValue = item;
			} else {
				initialValue = callbackfn(initialValue, item, index, this);
			}
		}
		return initialValue;
	}
	reduceRight(callbackfn, initialValue) {
		for (const [index, item] of entries(this, 0, -1)) {
			if (initialValue === undefined) {
				initialValue = item;
			} else {
				initialValue = callbackfn(initialValue, item, index, this);
			}
		}
		return initialValue;
	}
	reverse() {
		reverse(this);
		return this;
	}
	shift() {
		const root = data.get(this),
		      first = root.next;
		if (first.item) {
			removeNode(root, first);
		}
		return first.item;
	}
	slice(begin = 0, end) {
		const root = data.get(this),
		      slice = [];
		if (end === undefined) {
			end = root.length;
		} else if (end < 0) {
			end += root.length;
		}
		for (const [index, item] of entries(this, begin)) {
			if (index >= end) {
				break;
			}
			slice.push(item);
		}
		return slice;
	}
	some(callback, thisArg) {
		for (const [index, item] of entries(this)) {
			if (callback.call(thisArg, item, index, this)) {
				return true;
			}
		}
		return false;
	}
	sort(compareFunction) {
		sort(this, compareFunction);
		return this;
	}
	splice(start, deleteCount = 0, ...items) {
		const root = data.get(this), removed = [];
		let [curr] = getNode(root, start),
		    adder = curr.prev;
		for (; curr.item && deleteCount > 0; deleteCount--, curr = curr.next) {
			removed.push(curr.item);
			removeNode(root, curr);
		}
		items.forEach(item => adder = addItemAfter(root, adder, item));
		return removed;
	}
	unshift(element, ...elements) {
		const root = data.get(this);
		let adder = addItemAfter(root, root, element);
		elements.forEach(item => adder = addItemAfter(root, adder, item));
		return root.length;
	}
	*values() {
		for (let curr = data.get(this).next; curr.item; curr = curr.next) {
			yield curr.item;
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
	constructor(parentNode, sortFn = noSort, entries = []) {
		const root = {sortFn, parentNode, length: 0, order: 1, map: new Map()};
		data.set(this, root.prev = root.next = root);
		for (const [k, item] of entries) {
			replaceKey(root, k, item, root.prev);
		}
	}
	get [node]() {
		return data.get(this).parentNode;
	}
	get size() {
		return data.get(this).length;
	}
	clear() {
		const root = data.get(this);
		for (let curr = root.next; curr.item; curr = curr.next) {
			removeNode(root, curr);
		}
		root.map.clear();
	}
	delete(k) {
		const root = data.get(this),
		      curr = root.map.get(k);
		if (!curr) {
			return false;
		}
		removeNode(root, curr);
		return root.map.delete(k);
	}
	*entries() {
		for (const [k, v] of data.get(this).map) {
			yield [k, v.item];
		}
	}
	forEach(callbackfn, thisArg = this) {
		data.get(this).map.forEach((v, k) => callbackfn(v.item, k, thisArg));
	}
	get(k) {
		return data.get(this).map.get(k)?.item;
	}
	has(k) {
		return data.get(this).map.has(k);
	}
	insertAfter(k, item, after) {
		const root = data.get(this),
		      a = root.map.get(after);
		if (!a) {
			return false;
		}
		replaceKey(root, k, item, a);
		return true;
	}
	insertBefore(k, item, before) {
		const root = data.get(this),
		      b = root.map.get(before);
		if (!b) {
			return false;
		}
		replaceKey(root, k, item, b.prev);
		return true;
	}
	keys() {
		return data.get(this).map.keys();
	}
	reverse() {
		reverse(this);
		return this;
	}
	set(k, item) {
		const root = data.get(this);
		replaceKey(root, k, item, root.prev);
		return this;
	}
	sort(compareFunction) {
		sort(this, compareFunction);
		return this;
	}
	*values() {
		for (const v of data.get(this).map.values()) {
			yield v.item;
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
