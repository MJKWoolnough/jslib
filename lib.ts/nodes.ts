/**
 * The nodes module contains Classes for aiding in the accessing of DOM {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}s.
 *
 * @module nodes
 */
/** */

export const
/**
 * This {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol | Symbol} is used to specify the {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | link} of a type.
 */
node = Symbol("node"),
/** A sorting function that does no sorting. */
noSort = () => 0,
/** A function to sort strings. */
stringSort = new Intl.Collator().compare,
/**
 * A function that extends an HTMLElement based class, adding a [node] field set to `this`. Can be used with the {@link mod:elements} library as an extender function.
 */
addNodeRef = <T extends new(...a: any[]) => HTMLElement>(b: T) => class extends b { [node] = this; };

/**
 * This unexported type satisfies any type has used the {@link node} {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol | Symbol} to delegate a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node} element.
 */
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
	const pos = index;
	if (index < 0) {
		index++;
		for (let curr = root.p; curr.i; index++, curr = curr.p) {
			if (!index) {
				return [curr, root.l + pos];
			}
		}
	} else if (index < root.l) {
		for (let curr = root.n; curr.i; index--, curr = curr.n) {
			if (!index) {
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
		if (old.i === item && old.p === prev) {
			return;
		}
		removeNode(root, old);
	}
	root.m.set(k, Object.assign(addItemAfter(root, prev, item), {k}));
      },
      realTarget = Symbol("realTarget"),
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
      proxyObj = {
	has: <T extends Item>(target: NodeArray<T>, name: PropertyKey) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
	get: <T extends Item>(target: NodeArray<T>, name: PropertyKey) => pIFn(name, index => target.at(index)) || (target as any)[name],
	set: <T extends Item>(target: NodeArray<T>, name: PropertyKey, value: T) => pIFn(name, index => !!target.splice(index, 1, value)) || false,
	deleteProperty: <T extends Item>(target: NodeArray<T>, name: PropertyKey) => pIFn(name, index => target.splice(index, 1).length > 0) || delete (target as any)[name]
      };

/**
 * This class provides {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array | Array}-like access to DOM {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}s, allowing them to be sorted and accessed via position-based indexes.
 *
 * This type implements all fields and methods of the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array | Array} interface, except for the following changes:
 *
 * |  Field  |  Type  |  Differences |
 * |---------|--------|--------------|
 * | [node]  | Node   | New field to access base {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}. |
 * | concat | Method | Returns a normal Array, not a NodeArray. |
 * | {@link NodeArray/constructor} | constructor} | Constructor | Takes very different params to initialise a NodeArray. |
 * | copyWithin | Method | Not applicable and throws an error. |
 * | fill | Method | Not applicable and throws an error. |
 * | filterRemove | Method | New method that works like `filter` but also removes the filtered items. |
 * | {@link NodeArray/from | from} | Static Method | Takes very different params to initialise a NodeArray. |
 * | {@link NodeArray/reverse} | Method | Reverses the sorting of the {@link Item}s. |
 * | slice | Method | Returns a normal Array, not a NodeArray. |
 * | {@link NodeArray/sort | sort} | Method | Sorts the {@link Item}s. |
 *
 * @typeParam {Node} H
 * @typeParam {Item} T
 */
export class NodeArray<T extends Item, H extends Node = Node> implements Array<T> {
	#root: Root<T, H>;
	[realTarget]!: this;
	/**
	 * The NodeArray constructor takes a parent element, onto which all {@link Item} elements will be attached, an optional starting sort function, and an optional set of starting elements of type `T`.
	 *
	 * The sorting function is used to order {@link Item}s as they are inserted.
	 *
	 * The NodeArray type is wrapped with a Proxy to implement {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array | Array}-like indexing.
	 *
	 * @param {H} h                    A parent element, onto which all {@link Item} elements will be attached.
	 * @param {Function} [s]           An optional starting sort function.
	 * @param {Iterable<T>} [elements] An optional set of starting elements of type `T`.
	 */
	constructor(h: H, s: sortFunc<T> = noSort, elements: Iterable<T> = []) {
		const root = this.#root = {s, h, l: 0, o: 1} as Root<T, H>;
		Object.defineProperty(this, realTarget, {"value": this});
		root.p = root.n = root;
		for (const item of elements) {
			addItemAfter(root, root.p, item);
		}
		return new Proxy<NodeArray<T, H>>(this, proxyObj);
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
	findLast<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): S | undefined;
	findLast(callback: Callback<T, any, this>, thisArg?: any): T | undefined;
	findLast<S extends T>(callback: Callback<T, any, this> | ((value: T, index: number, array: T[]) => value is S), thisArg?: any) {
		for (const [index, item] of entries(this[realTarget].#root, -1, -1)) {
			if (callback.call(thisArg, item, index, this)) {
				return item;
			}
		}
		return undefined;
	}
	findLastIndex(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of entries(this[realTarget].#root, -1, -1)) {
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
	static from<T extends Item, H extends Node = Node>(n: H, itemFn: (node: Node) => T | undefined): NodeArray<T, H>;
	/**
	 * This function will create a NodeArray from the given parent {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}, iterating over every child and running the itemFn to generate an {@link Item}  to be append to the NodeArray.
	 *
	 * @param {H} n Parent Node.
	 * @param {(node: Node) => T | undefined} [itemFn] Function to create Items from nodes.
	 *
	 * @return {NodeArray<H, T>}
	 */
	static from<T extends Item = Item, H extends Node = Node>(n: H, itemFn: Function = noItemFn): NodeArray<T, H> {
		const s = new NodeArray<T, H>(n),
		      root = s[realTarget].#root;
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
			if (valueToFind === item) {
				return true;
			}
		}
		return false;
	}
	indexOf(searchElement: T, fromIndex = 0) {
		for (const [index, item] of entries(this[realTarget].#root, fromIndex)) {
			if (searchElement === item) {
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
	lastIndexOf(searchElement: T, fromIndex = -1) {
		for (const [index, item] of entries(this[realTarget].#root, fromIndex, -1)) {
			if (searchElement === item) {
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
		for (const [index, item] of entries(this[realTarget].#root, -1, -1)) {
			if (initialValue === undefined) {
				initialValue = item;
			} else {
				initialValue = callbackfn(initialValue, item, index, this);
			}
		}
		return initialValue;
	}
	/**
	 * The reverse method reverse the position of each {@link Item} and reverses the sorting algorithm.
	 *
	 * @return {NodeArray} Returns `this`.
	 */
	reverse(): this {
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
		if (begin <= -root.l) {
			begin = 0;
		}
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
	/**
	 * The sort method works much like the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort | Array.sort} method, but new items will be inserted according to the sorting function provided.
	 *
	 * Running this function with no param will result in the NodeArray being re-sorted according to the existing sorting function.
	 *
	 * @return {NodeArray} Returns `this`.
	 */
	sort(compareFunction?: sortFunc<T>): this {
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
	toSpliced(start: number, deleteCount = 0, ...items: T[]) {
		const root = this[realTarget].#root,
		      toRet: T[] = [];

		if (start < 0) {
			start += root.l;
		}

		for (let curr = root.n; curr.i; curr = curr.n) {
			if (toRet.length === start) {
				if (deleteCount > 0) {
					deleteCount--;

					continue;
				}

				toRet.push(...items);
				items = [];
			}

			toRet.push(curr.i);
		}

		toRet.push(...items);

		return toRet;
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
	with(target: number, value: T) {
		const root = this[realTarget].#root;

		if (target < 0) {
			target += root.l;
		}

		if (target < 0 || target >= root.l) {
			throw RangeError("invalid or out-of-range index");
		}

		const toRet: T[] = [];

		for (const [index, item] of entries(root)) {
			toRet.push(index === target ? value : item);
		}

		return toRet;
	}
	*[Symbol.iterator]() {
		yield* this.values();
	}
	get [Symbol.unscopables]() {
		return {
			__proto__: null,
			"at": true,
			"copyWithin": true,
			"entries": true,
			"fill": true,
			"find": true,
			"findIndex": true,
			"findLast": true,
			"findLastIndex": true,
			"flat": true,
			"flatMap": true,
			"includes": true,
			"keys": true,
			"toLocaleString": undefined,
			"toString": undefined,
			"values": true
		};
	}
	[n: number]: T;
}

/**
 * This class provides {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map | Map}-like access to DOM {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}s, allowing them to be sorted and accessed via keys.
 *
 * This type implements all fields and methods of the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map | Map} interface, except for the following changes:
 *
 * |  Field  |  Type  |  Differences |
 * |---------|--------|--------------|
 * | [node]  | Node   | New field to access base {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}. |
 * | {@link NodeMap/constructor | constructor} | Constructor | Takes very different params to initialise a NodeMap. |
 * | {@link NodeMap/insertAfter | insertAfter} | Method | Inserts an {@link Item} after another. |
 * | {@link NodeMap/insertBefore | insertBefore} | Method | Inserts an {@link Item} before another. |
 * | {@link NodeMap/keyAt | keyAt} | Method | Returns the key of the {@link Item} at the specified position. |
 * | {@link NodeMap/position | position} | Method | Returns the position of the {@link Item} specified by the key. |
 * | {@link NodeMap/reSet | reSet} | Method | Changes the key for an item. |
 * | {@link NodeMap/reverse | reverse} | Method | Reverses the sorting of the {@link Item}s. |
 * | {@link NodeMap/sort | sort} | Method | Sorts the {@link Item}s. |
 *
 * @typeParam K
 * @typeParam {Item} T
 * @typeParam {Node} H
 */
export class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	#root: MapRoot<K, T, H>;
	/**
	 * The NodeMap constructor takes a parent element, onto which all {@link Item} elements will be attached, an optional starting sort function, and an optional set of starting elements of type `T`.
	 *
	 * The sorting function is used to order {@link Item}s as they are inserted.
	 *
	 * @param {H} h The parent element, onto which all {@link Item} elements will be attached.
	 * @param {Function} s An optional starting sort function.
	 * @param {Iterable<[K, T]>} entries An optional set of starting elements of type `T`.
	 */
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
		this.#root.m.forEach((v, k) => callbackfn.call(thisArg, v.i, k, this));
	}
	get(k: K) {
		return this.#root.m.get(k)?.i;
	}
	has(k: K) {
		return this.#root.m.has(k);
	}
	/**
	 * The insertAfter method will insert a new {@link Item} after the {@link Item} denoted by the `after` key.
	 *
	 * @param {K} k The new key.
	 * @param {T} item The new item.
	 * @param {K} after The key to insert after.
	 *
	 * @return {boolean}  Will return `true` unless the `after` key cannot be found, in which case it will return false.
	 */
	insertAfter(k: K, item: T, after: K): boolean {
		const root = this.#root,
		      a = root.m.get(after);
		if (!a) {
			return false;
		}
		replaceKey(root, k, item, a);
		return true;
	}
	/**
	 * The insertBefore method will insert a new {@link Item} before the {@link Item} denoted by the `before` key.
	 *
	 * @param {K} k The new key.
	 * @param {T} item The new item.
	 * @param {K} before The key to insert before.
	 *
	 * @return {boolean}  Will return `true` unless the `after` key cannot be found, in which case it will return false.
	 */
	insertBefore(k: K, item: T, before: K): boolean {
		const root = this.#root,
		      b = root.m.get(before);
		if (!b) {
			return false;
		}
		replaceKey(root, k, item, b.p);
		return true;
	}
	/**
	 * The keyAt method returns the position of the key in within the sorted {@link Item}. It returns undefined if there is nothing at the specified position.
	 *
	 * @param {number} pos The position to retrieve the key of.
	 *
	 * @return {K | undefined} The key, if it was found, or undefined.
	 */
	keyAt(pos: number): K | undefined {
		while (pos < 0) {
			pos += this.#root.l;
		}
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
	/**
	 * The position method returns the current sorted position of the {@link Item} described by the key.
	 *
	 * @param {K} key The key to find the position of.
	 *
	 * @return {number} The position of the key, or `-1` if it was not found.
	 */
	position(key: K): number {
		const root = this.#root;
		let count = -1,
		    curr = (root.m.get(key) ?? root) as ItemOrRoot<T>;
		while (curr !== root) {
			curr = curr.p;
			count++;
		}
		return count;
	}
	/**
	 * The reset method changes the key assigned to an {@link Item} without performing any sorting.
	 *
	 * @param {K} k The key to be replaced.
	 * @param {K} j The key replace with.
	 */
	reSet(k: K, j: K) {
		const root = this.#root,
		      i = root.m.get(k);
		if (i) {
			root.m.delete(k);
			i.k = j;
			root.m.set(j, i);
		}
	}
	/**
	 * The reverse method reverse the position of each {@link Item} and reverses the sorting algorithm.
	 *
	 * @return {NodeMap} Returns `this`.
	 */
	reverse(): this {
		reverse(this.#root);
		return this;
	}
	set(k: K, item: T) {
		const root = this.#root;
		replaceKey(root, k, item, root.p);
		return this;
	}
	/**
	 * The sort method sorts the {@link Item}s, and new items will be inserted according to the sorting function provided.
	 *
	 * Running this function with no param will result in the NodeMap being re-sorted according to the existing sorting function.
	 *
	 * @return {NodeMap} Returns `this`.
	 */
	sort(compareFunction?: sortFunc<T>): this {
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
