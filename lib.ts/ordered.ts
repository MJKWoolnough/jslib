"use strict";

type sortFunc<T extends Item> = (a: T, b: T) => number;

interface Item {
	html: Node;
}

type ItemNode<T> = {
	prev: ItemOrRoot<T>;
	next: ItemOrRoot<T>;
	item: T;
}

type Root<T extends Item> = {
	prev: ItemOrRoot<T>;
	next: ItemOrRoot<T>;
	item: undefined;
	sortFn: sortFunc<T>;
	parentNode: Node;
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

const data = new WeakMap<SortHTML<any>, Root<any>>(),
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
		root.parentNode.insertBefore(node.item.html, node.next.item.html);
	} else {
		root.parentNode.appendChild(node.item.html);
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
	root.parentNode.removeChild(node.item.html);
	root.length--;
      },
      entries = function* <T extends Item>(s: SortHTML<T>, start = 0, direction = 1): IterableIterator<[number, T]> {
	for (let [curr, pos] = getNode(data.get(s)!, start); curr.item; pos += direction, curr = direction === 1 ? curr.next : curr.prev) {
		yield [pos, curr.item];
	}
      };

export class SortHTML<T extends Item> {
	constructor(parentNode: Node, sortFn: sortFunc<T> = noSort) {
		const root = {sortFn, parentNode, length: 0, order: 1} as Root<T>;
		root.prev = root.next = root;
		data.set(this, root);
	}
	get html(): Node {
		return data.get(this)!.parentNode;
	}
	get length(): number {
		return data.get(this)!.length;
	}
	getItem(index: number): T {
		const [node] = getNode(data.get(this)!, index);
		return node.item;
	}
	setItem(index: number, item: T): T {
		const root = data.get(this)!,
		      [node] = getNode(root, index);
		if (node.item) {
			root.parentNode.removeChild(node.item.html);
			node.item = item;
			sortNodes(root, node);
		} else {
			addItemAfter(root, root.prev, item);
		}
		return item;
	}
	*entries() {
		yield *entries<T>(this);
	}
	every(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of entries(this)) {
			if (!callback.call(thisArg, item, index, this)) {
				return false;
			}
		}
		return true;
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
	find(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of entries<T>(this)) {
			if (callback.call(thisArg, item, index, this)) {
				return item;
			}
		}
		return undefined;
	}
	findIndex(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of entries<T>(this)) {
			if (callback.call(thisArg, item, index, this)) {
				return index;
			}
		}
		return -1;
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
	indexOf(searchElement: T, fromIndex: number = 0) {
		for (const [index, item] of entries<T>(this, fromIndex)) {
			if (Object.is(searchElement, item)) {
				return index;
			}
		}
		return -1;
	}
	*keys() {
		const root = data.get(this)!;
		for (let i = 0; i < root.length; i++) {
			yield i;
		}
	}
	lastIndexOf(searchElement: T, fromIndex: number = 0) {
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
	reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: this) => U, initialValue: U): U;
	reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T, initialValue?: T): T | undefined {
		for (const [index, item] of entries(this)) {
			if (initialValue === undefined) {
				initialValue = item;
			} else {
				initialValue = callbackfn(initialValue, item, index, this);
			}
		}
		return initialValue;
	}
	reduceRight<U>(callbackfn: (accumulator: U, currentValue: T, index: number, array: this) => U, initialValue: U): U;
	reduceRight(callbackfn: (accumulator: T, currentValue: T, index: number, array: this) => T, initialValue?: T): T | undefined {
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
			root.parentNode.appendChild(curr.item.html);
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
}
