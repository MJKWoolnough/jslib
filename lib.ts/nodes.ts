export const node = Symbol("node"),
noSort = () => 0,
stringSort = new Intl.Collator().compare;

interface Item {
	[node]: Node;
}

type sortFunc<T extends Item> = (a: T, b: T) => number;

type KeyedItemNode<K, T> = ItemNode<T> & {
	k: K;
}

type ItemNode<T> = {
	p: ItemOrRoot<T>;
	n: ItemOrRoot<T>;
	i: T;
}

type Root<T extends Item, H extends Node = Node> = {
	p: ItemOrRoot<T>;
	n: ItemOrRoot<T>;
	i: undefined;
	s: sortFunc<T>;
	h: H;
	l: number;
	o: number;
}

type MapRoot<K, T extends Item, H extends Node = Node> = Root<T, H> & {
	m: Map<K, KeyedItemNode<K, T>>;
}

interface ItemOrRoot<T> {
	p: ItemOrRoot<T>;
	n: ItemOrRoot<T>;
	i: T | undefined;
}

type Callback<T extends Item, U, thisType> = (element: T, index: number, array: thisType) => U;

const sortNodes = (root: Root<any>, n: ItemNode<any>) => {
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
      getNode = <T extends Item>(root: Root<T>, index: number): [ItemOrRoot<T>, number] => {
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
      addItemAfter = <T extends Item>(root: Root<T>, after: ItemOrRoot<T>, i: T) => {
	root.l++;
	return sortNodes(root, after.n = after.n.p = {"p": after, "n": after.n, i});
      },
      removeNode = (root: Root<any>, n: ItemNode<any>) => {
	n.p.n = n.n;
	n.n.p = n.p;
	if (n.i[node].parentNode === root.h) {
		root.h.removeChild(n.i[node]);
	}
	root.l--;
      },
      entries = function* <T extends Item>(root: Root<T>, start = 0, direction = 1): IterableIterator<[number, T]> {
	for (let [curr, pos] = getNode(root, start); curr.i; pos += direction, curr = direction === 1 ? curr.n : curr.p) {
		yield [pos, curr.i];
	}
      },
      pIFn = <T>(name: PropertyKey, fn: (index: number) => T): T | undefined => {
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
      noItemFn = (n: Node) => ({[node]: n}),
      sort = <T extends Item>(root: Root<T>, compareFunction?: sortFunc<T>) => {
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
      reverse = <T extends Item>(root: Root<T>) => {
	[root.p, root.n] = [root.n, root.p];
	root.o *= -1;
	for (let curr = root.n; curr.i; curr = curr.n) {
		[curr.n, curr.p] = [curr.p, curr.n];
		root.h.appendChild(curr.i[node]);
	}
      },
      replaceKey = <K, T extends Item>(root: MapRoot<K, T>, k: K, item: T, prev: ItemOrRoot<T>) => {
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
	has: <T extends Item>(target: NodeArray<T>, name: PropertyKey) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
	get: <T extends Item>(target: NodeArray<T>, name: PropertyKey) => pIFn(name, index => target.at(index)) || (target as any)[name],
	set: <T extends Item>(target: NodeArray<T>, name: PropertyKey, value: T) => pIFn(name, index => {
		target.splice(index, 1, value);
		return true;
	}) || false,
	deleteProperty: <T extends Item>(target: NodeArray<T>, name: PropertyKey) => pIFn(name, index => target.splice(index, 1).length > 0) || delete (target as any)[name]
      };

export class NodeArray<T extends Item, H extends Node = Node> implements Array<T> {
	#root: Root<T, H>;
	[realTarget]: this;
	constructor(h: H, s: sortFunc<T> = noSort, elements: Iterable<T> = []) {
		const root = this.#root = {s, h, l: 0, o: 1} as Root<T, H>,
		      p = new Proxy<NodeArray<T, H>>(this, proxyObj);
		Object.defineProperty(this, realTarget, {"value": this});
		root.p = root.n = root;
		for (const item of elements) {
			addItemAfter(root, root.p, item);
		}
		return p;
	}
	get [node]() {
		return this[realTarget].#root.h;
	}
	get length() {
		return this[realTarget].#root.l;
	}
	at(index: number) {
		const [node, pos] = getNode(this[realTarget].#root, index);
		return pos !== -1 ? node.i : undefined;
	}
	concat(...items: ConcatArray<T>[]): T[];
	concat(...items: (T | ConcatArray<T>)[]): T[] {
		return Array.from(this.values()).concat(...items);
	}
	copyWithin(_target: number, _start?: number, _end?: number): this {
		throw new Error("invalid");
	}
	*entries(): IterableIterator<[number, T]> {
		yield *entries(this[realTarget].#root);
	}
	every(callback: Callback<T, unknown, this>, thisArg?: any) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (!callback.call(thisArg, item, index, this)) {
				return false;
			}
		}
		return true;
	}
	fill(_value: T, _start?: number, _end?: number): this {
		throw new Error("invalid");
	}
	filter(callback: Callback<T, any, this>, thisArg?: any) {
		const filter: T[] = [];
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (callback.call(thisArg, item, index, this)) {
				filter.push(item);
			}
		}
		return filter;
	}
	filterRemove(callback: Callback<T, any, this>, thisArg?: any) {
		const root = this[realTarget].#root,
		      filtered: T[] = [];
		for (let curr = root.n, i = 0; curr.i; curr = curr.n, i++) {
			if (callback.call(thisArg, curr.i, i, this)) {
				removeNode(root, curr);
				filtered.push(curr.i);
			}
		}
		return filtered;
	}
	find(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (callback.call(thisArg, item, index, this)) {
				return item;
			}
		}
		return undefined;
	}
	findIndex(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (callback.call(thisArg, item, index, this)) {
				return index;
			}
		}
		return -1;
	}
	flat<D extends number = 1>(depth?: D) {
		return Array.from(this.values()).flat(depth) as FlatArray<any[], D>;
	}
	flatMap<U extends []>(callback: Callback<T, U, this>, thisArg?: any) {
		return this.map(callback, thisArg).flat();
	}
	forEach(callback: Callback<T, void, this>, thisArg?: any) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			callback.call(thisArg, item, index, this);
		}
	}
	static from<_, H extends Node = Node>(n: H): NodeArray<Item, H>;
	static from<T extends Item, H extends Node = Node>(n: H, itemFn: (node: Node) => T|undefined): NodeArray<T, H>;
	static from<T extends Item = Item, H extends Node = Node>(n: H, itemFn = noItemFn): NodeArray<T, H> {
		const s = new NodeArray<T, H>(n),
		      root = s.#root;
		for (const c of n.childNodes) {
			const i = itemFn(c) as T;
			if (i) {
				root.p = root.p.n = {"p": root.p, n: root, i};
				root.l++;
			}
		}
		return s;
	}
	includes(valueToFind: T, fromIndex = 0) {
		for (const [, item] of entries(this[realTarget].#root, fromIndex)) {
			if (Object.is(valueToFind, item)) {
				return true;
			}
		}
		return false;
	}
	indexOf(searchElement: T, fromIndex = 0) {
		for (const [index, item] of entries(this[realTarget].#root, fromIndex)) {
			if (Object.is(searchElement, item)) {
				return index;
			}
		}
		return -1;
	}
	join(separator?: string) {
		return Array.from(this.values()).join(separator);
	}
	*keys() {
		for (let i = 0; i < this[realTarget].#root.l; i++) {
			yield i;
		}
	}
	lastIndexOf(searchElement: T, fromIndex = 0) {
		for (const [index, item] of entries(this[realTarget].#root, fromIndex, -1)) {
			if (Object.is(searchElement, item)) {
				return index;
			}
		}
		return -1;
	}
	map<U>(callback: Callback<T, U, this>, thisArg?: any) {
		const map: U[] = [];
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
	push(element: T, ...elements: T[]) {
		const root = this[realTarget].#root;
		addItemAfter(root, root.p, element);
		for (const item of elements) {
			addItemAfter(root, root.p, item);
		}
		return root.l;
	}
	reduce<U>(callbackfn: (previousValue: U, currentValue: T, index: number, array: this) => U, initialValue: U): U;
	reduce(callbackfn: (previousValue: T, currentValue: T, index: number, array: this) => T): T;
	reduce(callbackfn: (previousValue: T, currentValue: T, index: number, array: this) => T, initialValue?: T): T | undefined {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (initialValue === undefined) {
				initialValue = item;
			} else {
				initialValue = callbackfn(initialValue, item, index, this);
			}
		}
		return initialValue;
	}
	reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, index: number, array: this) => U, initialValue: U): U;
	reduceRight(callbackfn: (previousValue: T, currentValue: T, index: number, array: this) => T): T;
	reduceRight(callbackfn: (previousValue: T, currentValue: T, index: number, array: this) => T, initialValue?: T): T | undefined {
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
	slice(begin = 0, end?: number) {
		const root = this[realTarget].#root,
		      slice: T[] = [];
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
	some(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of entries(this[realTarget].#root)) {
			if (callback.call(thisArg, item, index, this)) {
				return true;
			}
		}
		return false;
	}
	sort(compareFunction?: sortFunc<T>) {
		sort(this[realTarget].#root, compareFunction);
		return this;
	}
	splice(start: number, deleteCount = 0, ...items: T[]) {
		const root = this[realTarget].#root,
		      removed: T[] = [];
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
	unshift(element: T, ...elements: T[]) {
		const root = this[realTarget].#root;
		let adder = addItemAfter(root, root, element);
		for (const item of elements) {
			adder = addItemAfter(root, adder, item);
		}
		return root.l;
	}
	*values(): IterableIterator<T> {
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
	[n: number]: T;
}

export class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	#root: MapRoot<K, T, H>;
	constructor(h: H, s: sortFunc<T> = noSort, entries: Iterable<[K, T]> = []) {
		const root = this.#root = {s, h, l: 0, o: 1, m: new Map()} as MapRoot<K, T, H>;
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
			removeNode(root, curr as ItemNode<T>);
		}
		root.m.clear();
	}
	delete(k: K) {
		const root = this.#root,
		      curr = root.m.get(k);
		if (!curr) {
			return false;
		}
		removeNode(root, curr);
		return root.m.delete(k);
	}
	*entries(): IterableIterator<[K, T]> {
		for (const [k, v] of this.#root.m) {
			yield [k, v.i];
		}
	}
	forEach(callbackfn: (value: T, key: K, map: NodeMap<K, T>) => void, thisArg: any = this) {
		this.#root.m.forEach((v, k) => callbackfn(v.i, k, thisArg));
	}
	get(k: K) {
		return this.#root.m.get(k)?.i;
	}
	has(k: K) {
		return this.#root.m.has(k);
	}
	insertAfter(k: K, item: T, after: K) {
		const root = this.#root,
		      a = root.m.get(after);
		if (!a) {
			return false;
		}
		replaceKey(root, k, item, a);
		return true;
	}
	insertBefore(k: K, item: T, before: K) {
		const root = this.#root,
		      b = root.m.get(before);
		if (!b) {
			return false;
		}
		replaceKey(root, k, item, b.p);
		return true;
	}
	keyAt(pos: number) {
		for (let curr = this.#root.n; curr.i; pos--, curr = curr.n) {
			if (pos === 0) {
				return (curr as KeyedItemNode<K, T>).k;
			}
		}
		return undefined;
	}
	keys(): IterableIterator<K> {
		return this.#root.m.keys();
	}
	position(key: K) {
		const root = this.#root;
		let count = -1,
		    curr = (root.m.get(key) ?? root) as ItemOrRoot<T>;
		while (curr !== root) {
			curr = curr.p;
			count++;
		}
		return count;
	}
	reverse() {
		reverse(this.#root);
		return this;
	}
	set(k: K, item: T) {
		const root = this.#root;
		replaceKey(root, k, item, root.p);
		return this;
	}
	sort(compareFunction?: sortFunc<T>) {
		sort(this.#root, compareFunction);
		return this;
	}
	*values(): IterableIterator<T> {
		for (const v of this.#root.m.values()) {
			yield v.i;
		}
	}
	*[Symbol.iterator](): IterableIterator<[K, T]> {
		yield* this.entries();
	}
	get [Symbol.species]() {
		return NodeMap;
	}
	get [Symbol.toStringTag]() {
		return "[object NodeMap]";
	}
}
