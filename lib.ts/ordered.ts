"use strict";

type sortFunc<T extends Item> = (a: T, b: T) => number;

type ItemNode<T> = {
	prev: ItemOrRoot<T>;
	next: ItemOrRoot<T>;
	item: T;
}

type Root<T extends Item, H extends Node = Node> = {
	prev: ItemOrRoot<T>;
	next: ItemOrRoot<T>;
	item: undefined;
	sortFn: sortFunc<T>;
	parentNode: H;
	length: number;
	order: number;
}

type MapRoot<K, T extends Item, H extends Node = Node> = Root<T, H> & {
	map: Map<K, ItemNode<T>>;
}

interface ItemOrRoot<T> {
	prev: ItemOrRoot<T>;
	next: ItemOrRoot<T>;
	item: T | undefined;
}

type Callback<T extends Item, U, thisType> = (element: T, index: number, array: thisType) => U;

export const node = Symbol("node"),
noSort = () => 0,
stringSort = new Intl.Collator().compare;

interface Item {
	[node]: Node;
}

const data = new WeakMap<NodeArray<any, Node> | NodeMap<any, any, Node>, Root<any> | MapRoot<any, any>>(),
      sortNodes = <T extends Item>(root: Root<T>, n: ItemNode<T>) => {
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
      getNode = <T extends Item>(root: Root<T>, index: number): [ItemOrRoot<T>, number] => {
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
      addItemAfter = <T extends Item>(root: Root<T>, after: ItemOrRoot<T>, item: T) => {
	root.length++;
	return sortNodes(root, after.next = after.next.prev = {prev: after, next: after.next, item});
      },
      removeNode = <T extends Item>(root: Root<T>, n: ItemNode<T>) => {
	n.prev.next = n.next;
	n.next.prev = n.prev;
	root.parentNode.removeChild(n.item[node]);
	root.length--;
      },
      entries = function* <T extends Item>(s: NodeArray<T, Node>, start = 0, direction = 1): IterableIterator<[number, T]> {
	for (let [curr, pos] = getNode(data.get(s)!, start); curr.item; pos += direction, curr = direction === 1 ? curr.next : curr.prev) {
		yield [pos, curr.item];
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
      proxyObj = {
	has: <T extends Item>(target: NodeArray<T>, name: PropertyKey) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
	get: <T extends Item>(target: NodeArray<T>, name: PropertyKey) => pIFn(name, index => getNode(data.get(target)!, index)[0].item) || (target as any)[name],
	set: <T extends Item>(target: NodeArray<T>, name: PropertyKey, value: T) => pIFn(name, index => {
		const root = data.get(target)!,
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
	deleteProperty: <T extends Item>(target: NodeArray<T>, name: PropertyKey) => pIFn(name, index => {
		const root = data.get(target)!,
		      [n] = getNode(root, index);
		if (n.item) {
			removeNode(root, n);
			return true;
		}
		return false;
	}) || delete (target as any)[name]
      },
      noItemFn = (n: Node) => ({[node]: n}),
      sort = <T extends Item>(t: NodeArray<any, Node> | NodeMap<any, any, Node>, compareFunction?: sortFunc<T>) => {
	const root = data.get(t)!;
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
      reverse = (t: NodeArray<any, Node> | NodeMap<any, any, Node>) =>{
	const root = data.get(t)!;
	[root.prev, root.next] = [root.next, root.prev];
	root.order *= -1;
	for (let curr = root.next; curr.item; curr = curr.next) {
		[curr.next, curr.prev] = [curr.prev, curr.next];
		root.parentNode.appendChild(curr.item[node]);
	}
      };

export class NodeArray<T extends Item, H extends Node = Node> implements Array<T> {
	constructor(parentNode: H, sortFn: sortFunc<T> = noSort, elements: Iterable<T> = []) {
		const root = {sortFn, parentNode, length: 0, order: 1} as Root<T, H>,
		      p = new Proxy<NodeArray<T, H>>(this, proxyObj);
		data.set(this, root.prev = root.next = root);
		data.set(p, root);
		for (const item of elements) {
			addItemAfter(root, root.prev, item);
		}
		return p;
	}
	get [node](): H {
		return data.get(this)!.parentNode as H;
	}
	get length(): number {
		return data.get(this)!.length;
	}
	concat(...items: ConcatArray<T>[]): T[];
	concat(...items: (T | ConcatArray<T>)[]): T[] {
		return Array.from(this.values()).concat(...items);
	}
	copyWithin(_target: number, _start?: number, _end?: number): this {
		throw new Error("invalid");
	}
	*entries(): IterableIterator<[number, T]> {
		yield *entries<T>(this);
	}
	every(callback: Callback<T, unknown, this>, thisArg?: any) {
		for (const [index, item] of entries(this)) {
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
		for (const [index, item] of entries(this)) {
			if (callback.call(thisArg, item, index, this)) {
				filter.push(item);
			}
		}
		return filter;
	}
	filterRemove(callback: Callback<T, any, this>, thisArg?: any) {
		const root = data.get(this)!,
		      filtered: T[] = [];
		for (let curr = root.next, i = 0; curr.item; curr = curr.next, i++) {
			if (callback.call(thisArg, curr.item, i, this)) {
				removeNode(root, curr);
				filtered.push(curr.item);
			}
		}
		return filtered;
	}
	find(callback: Callback<T, any, this>, thisArg?: any): T | undefined {
		for (const [index, item] of entries<T>(this)) {
			if (callback.call(thisArg, item, index, this)) {
				return item;
			}
		}
		return undefined;
	}
	findIndex(callback: Callback<T, any, this>, thisArg?: any): number {
		for (const [index, item] of entries<T>(this)) {
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
		for (const [index, item] of entries(this)) {
			callback.call(thisArg, item, index, this);
		}
	}
	static from<_, H extends Node = Node>(n: H): NodeArray<Item, H>;
	static from<T extends Item, H extends Node = Node>(n: H, itemFn: (node: Node) => T|undefined): NodeArray<T, H>;
	static from<T extends Item = Item, H extends Node = Node>(n: H, itemFn = noItemFn): NodeArray<T, H> {
		const s = new NodeArray<T, H>(n),
		      root = data.get(s)!;
		for (const c of n.childNodes) {
			const item = itemFn(c);
			if (item) {
				root.prev = root.prev.next = {prev: root.prev, next: root, item};
				root.length++;
			}
		}
		return s;
	}
	includes(valueToFind: T, fromIndex: number = 0) {
		for (const [, item] of entries(this, fromIndex)) {
			if (Object.is(valueToFind, item)) {
				return true;
			}
		}
		return false;
	}
	indexOf(searchElement: T, fromIndex: number = 0): number {
		for (const [index, item] of entries<T>(this, fromIndex)) {
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
		const root = data.get(this)!;
		for (let i = 0; i < root.length; i++) {
			yield i;
		}
	}
	lastIndexOf(searchElement: T, fromIndex: number = 0): number {
		for (const [index, item] of entries<T>(this, fromIndex, -1)) {
			if (Object.is(searchElement, item)) {
				return index;
			}
		}
		return -1;
	}
	map<U>(callback: Callback<T, U, this>, thisArg?: any) {
		const map: U[] = [];
		for (const [index, item] of entries(this)) {
			map.push(callback.call(thisArg, item, index, this));
		}
		return map;
	}
	pop(): T | undefined {
		const root = data.get(this)!,
		      last = root.prev;
		if (last.item) {
			removeNode(root, last);
		}
		return last.item;
	}
	push(element: T, ...elements: T[]) {
		const root: Root<T> = data.get(this)!;
		addItemAfter(root, root.prev, element);
		elements.forEach(item => addItemAfter(root, root.prev, item));
		return root.length;
	}
	reduce<U>(callbackfn: (previousValue: U, currentValue: T, index: number, array: this) => U, initialValue: U): U;
	reduce(callbackfn: (previousValue: T, currentValue: T, index: number, array: this) => T): T;
	reduce(callbackfn: (previousValue: T, currentValue: T, index: number, array: this) => T, initialValue?: T): T | undefined {
		for (const [index, item] of entries(this)) {
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
	shift(): T | undefined {
		const root = data.get(this)!,
		      first = root.next;
		if (first.item) {
			removeNode(root, first);
		}
		return first.item;
	}
	slice(begin: number = 0, end?: number) {
		const root = data.get(this)!,
		      slice: T[] = [];
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
	some(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of entries(this)) {
			if (callback.call(thisArg, item, index, this)) {
				return true;
			}
		}
		return false;
	}
	sort(compareFunction?: sortFunc<T>): this {
		sort(this, compareFunction);
		return this;
	}
	splice(start: number, deleteCount: number = 0, ...items: T[]) {
		const root = data.get(this)!, removed: T[] = [];
		let [curr] = getNode(root, start),
		    adder = curr.prev;
		for (; curr.item && deleteCount > 0; deleteCount--, curr = curr.next) {
			removed.push(curr.item);
			removeNode(root, curr);
		}
		items.forEach(item => adder = addItemAfter(root, adder, item));
		return removed;
	}
	unshift(element: T, ...elements: T[]): number {
		const root = data.get(this)!;
		let adder = addItemAfter(root, root, element);
		elements.forEach(item => adder = addItemAfter(root, adder, item));
		return root.length;
	}
	*values(): IterableIterator<T> {
		for (let curr = data.get(this)!.next; curr.item; curr = curr.next) {
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
	[n: number]: T;
}

export class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	constructor(parentNode: H, sortFn: sortFunc<T> = noSort, entries: Iterable<[K, T]> = []) {
		const root = {sortFn, parentNode, length: 0, order: 1, map: new Map()} as MapRoot<K, T, H>;
		data.set(this, root.prev = root.next = root);
		for (const [k, item] of entries) {
			root.map.set(k, addItemAfter(root, root.prev, item));
		}
	}
	get [node](): H {
		return data.get(this)!.parentNode as H;
	}
	get size(): number {
		return data.get(this)!.length;
	}
	clear() {
		const root = data.get(this) as MapRoot<K, T, H>;
		for (let curr = root.next; curr.item; curr = curr.next) {
			removeNode(root, curr as ItemNode<T>);
		}
		root.map.clear();
	}
	delete(k: K) {
		const root = data.get(this) as MapRoot<K, T, H>,
		      curr = root.map.get(k);
		if (!curr) {
			return false;
		}
		removeNode(root, curr);
		return root.map.delete(k);
	}
	*entries(): IterableIterator<[K, T]> {
		for (const [k, v] of (data.get(this) as MapRoot<K, T, H>).map) {
			yield [k, v.item];
		}
	}
	forEach(callbackfn: (value: T, key: K, map: NodeMap<K, T>) => void, thisArg: any = this) {
		(data.get(this) as MapRoot<K, T, H>).map.forEach((v, k) => callbackfn(v.item, k, thisArg));
	}
	get(k: K): T | undefined {
		return (data.get(this) as MapRoot<K, T, H>).map.get(k)?.item;
	}
	has(k: K): boolean {
		return (data.get(this) as MapRoot<K, T, H>).map.has(k);
	}
	keys(): IterableIterator<K> {
		return (data.get(this) as MapRoot<K, T, H>).map.keys();
	}
	reverse() {
		reverse(this);
		return this;
	}
	set(k: K, item: T) {
		const root = data.get(this) as MapRoot<K, T, H>;
		root.map.set(k, addItemAfter(root, root.prev, item));
		return this;
	}
	sort(compareFunction?: sortFunc<T>) {
		sort(this, compareFunction);
		return this;
	}
	*values(): IterableIterator<T> {
		for (const v of (data.get(this) as MapRoot<K, T, H>).map.values()) {
			yield v.item;
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
