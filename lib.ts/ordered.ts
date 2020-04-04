"use strict";

type sortFunc<T extends Item> = (a: T, b: T) => number;

interface Item {
	node: Node;
}

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

interface ItemOrRoot<T> {
	prev: ItemOrRoot<T>;
	next: ItemOrRoot<T>;
	item: T | undefined;
}

type Callback<T extends Item, U, thisType> = (element: T, index: number, array: thisType) => U;

export const noSort = () => 0,
stringSort = new Intl.Collator().compare;

const data = new WeakMap<SortNode<any, Node>, Root<any>>(),
      sortNodes = <T extends Item>(root: Root<T>, node: ItemNode<T>) => {
	while (node.prev.item && root.sortFn(node.item, node.prev.item) * root.order < 0) {
		node.next.prev = node.prev;
		node.prev.next = node.next;
		node.next = node.prev;
		const pp = node.prev.prev;
		node.prev.prev = node;
		node.prev = pp;
		pp.next = node;
	}
	while (node.next.item && root.sortFn(node.item, node.next.item) * root.order > 0) {
		node.next.prev = node.prev;
		node.prev.next = node.next;
		node.prev = node.next;
		const nn = node.next.next;
		node.next.next = node;
		node.next = nn;
		nn.prev = node;
	}
	if (node.next.item) {
		root.parentNode.insertBefore(node.item.node, node.next.item.node);
	} else {
		root.parentNode.appendChild(node.item.node);
	}
	return node;
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
      removeNode = <T extends Item>(root: Root<T>, node: ItemNode<T>) => {
	node.prev.next = node.next;
	node.next.prev = node.prev;
	root.parentNode.removeChild(node.item.node);
	root.length--;
      },
      entries = function* <T extends Item>(s: SortNode<T, Node>, start = 0, direction = 1): IterableIterator<[number, T]> {
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
      },
      proxyObj = {
	has: <T extends Item>(target: SortNode<T>, name: PropertyKey) => pIFn(name, index => index >= 0 && index <= target.length) || name in target,
	get: <T extends Item>(target: SortNode<T>, name: PropertyKey) => pIFn(name, index => getNode(data.get(target)!, index)[0].item) || (target as any)[name],
	set: <T extends Item>(target: SortNode<T>, name: PropertyKey, value: T) => pIFn(name, index => {
		const root = data.get(target)!,
		      [node] = getNode(root, index);
		if (node.item) {
			root.parentNode.removeChild(node.item.node);
			node.item = value;
			sortNodes(root, node);
		} else {
			addItemAfter(root, root.prev, value);
		}
		return true;
	}) || false,
	deleteProperty: <T extends Item>(target: SortNode<T>, name: PropertyKey) => pIFn(name, index => {
		const root = data.get(target)!,
		      [node] = getNode(root, index);
		if (node.item) {
			removeNode(root, node);
			return true;
		}
	}) || delete (target as any)[name]
      };

export class SortNode<T extends Item, H extends Node = Node> implements Array<T> {
	constructor(parentNode: H, sortFn: sortFunc<T> = noSort) {
		const root = {sortFn, parentNode, length: 0, order: 1} as Root<T, H>,
		      p = new Proxy<SortNode<T, H>>(this, proxyObj);
		data.set(this, root.prev = root.next = root);
		data.set(p, root);
		return p;
	}
	get node(): H {
		return data.get(this)!.parentNode as H;
	}
	get length(): number {
		return data.get(this)!.length;
	}
	concat(...items: ConcatArray<T>[]): T[];
	concat(...items: (T | ConcatArray<T>)[]): T[] {
		return Array.from(this.values()).concat(...items);
	}
	copyWithin(target: number, start?: number, end?: number): this {
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
	fill(value: T, start?: number, end?: number): this {
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
		const root = data.get(this)!;
		for (let curr = root.next, i = 0; curr.item; curr = curr.next, i++) {
			if (callback.call(thisArg, curr.item, i, this)) {
				removeNode(root, curr);
			}
		}
		return this;
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
	flat(depth?: number) {
		return Array.from(this.values()).flat(depth);
	}
	flatMap<U>(callback: Callback<T, U, this>, thisArg?: any) {
		return this.map(callback, thisArg).flat();
	}
	forEach(callback: Callback<T, void, this>, thisArg?: any) {
		for (const [index, item] of entries(this)) {
			callback.call(thisArg, item, index, this);
		}
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
		const root = data.get(this)!;
		[root.prev, root.next] = [root.next, root.prev];
		root.order *= -1;
		for (let curr = root.next; curr.item; curr = curr.next) {
			[curr.next, curr.prev] = [curr.prev, curr.next];
			root.parentNode.appendChild(curr.item.node);
		}
		return this;
	}
	shift(): T | undefined {
		const root = data.get(this)!,
		      first = root.prev;
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
	sort(compareFunction?: sortFunc<T>) {
		const root = data.get(this)!;
		if (compareFunction) {
			root.sortFn = compareFunction;
			root.order = 1;
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
