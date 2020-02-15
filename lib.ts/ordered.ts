"use strict";

type sortFunc<T extends Item> = (a: T, b: T) => number;

interface Item {
	html: Node;
}

type ItemNode<T> = {
	prev: ItemNode<T> | null;
	next: ItemNode<T> | null;
	item: T;
}

type Root<T extends Item> = {
	first: ItemNode<T> | null;
	last: ItemNode<T> | null;
	sortFn: sortFunc<T>;
	parentNode: Node;
	length: number;
	reverse: number;
}

type Callback<T extends Item, U, thisType> = (element: T, index: number, array: thisType) => U;

export const noSort = () => 0,
stringSort = new Intl.Collator().compare;

const data = new WeakMap<SortHTML<any>, Root<any>>(),
      sortNodes = <T extends Item>(root: Root<T>, node: ItemNode<T>) => {
	while (node.prev && root.sortFn(node.item, node.prev.item) * root.reverse < 0) {
		const pp = node.prev.prev;
		node.prev.next = node.next;
		node.next = node.prev;
		node.prev.prev = node;
		node.prev = pp;
	}
	while (node.next && root.sortFn(node.item, node.next.item) * root.reverse > 0) {
		const nn = node.next.next;
		node.next.prev = node.prev;
		node.prev = node.next;
		node.next.next = node;
		node.next = nn;
	}
	if (node.next) {
		root.parentNode.insertBefore(node.item.html, node.next.item.html);
	} else {
		root.parentNode.appendChild(node.item.html);
		root.last = node;
	}
	if (!node.prev) {
		root.first = node;
	}
      },
      getNode = <T extends Item>(root: Root<T>, index: number): [ItemNode<T> | null, number] => {
	if (index < 0) {
		let curr = root.last, pos = index;
		while (curr) {
			if (pos === 0) {
				return [curr, pos];
			}
			pos++;
			curr = curr.prev;
		}
	} else if (index < root.length) {
		let curr = root.first, pos = index;
		while (curr) {
			if (pos === 0) {
				return [curr, pos];
			}
			pos--;
			curr = curr.next;
		}
	}
	return [null, 0];
      },
      addItemAfter = <T extends Item>(root: Root<T>, after: ItemNode<T> | null, item: T) => {
	const node = {prev: after, next: after ? after.next: root.first, item};
	if (after) {
		if (after.next) {
			after.next.prev = node;
		} else {
			root.last = node;
		}
		after.next = node;
	} else {
		if (!root.last) {
			root.last = node;
		}
		root.first = node;
	}
	root.length++;
	sortNodes(root, node);
	return node;
      },
      removeNode = <T extends Item>(root: Root<T>, node: ItemNode<T>) => {
	if (node.prev) {
		node.prev.next = node.next;
	} else {
		root.first = node.next;
	}
	if (node.next) {
		node.next.prev = node.prev;
	} else {
		root.last = node.prev;
	}
	root.parentNode.removeChild(node.item.html);
	root.length--;
      };

export class SortHTML<T extends Item> {
	constructor(parentNode: Node, sortFn: sortFunc<T> = noSort) {
		data.set(this, {first: null, last: null, sortFn, parentNode, length: 0, reverse: 1});
	}
	get html(): Node {
		return data.get(this)!.parentNode;
	}
	get length(): number {
		return data.get(this)!.length;
	}
	getItem(index: number): T | undefined {
		const [node] = getNode(data.get(this)!, index);
		if (node) {
			return node.item;
		}
		return undefined;
	}
	setItem(index: number, item: T) {
		const root = data.get(this)!,
		      [node] = getNode(root, index);
		if (node) {
			root.parentNode.removeChild(node.item.html);
			node.item = item;
			sortNodes(root, node);
		} else {
			addItemAfter(root, root.last, item);
		}
		return item;
	}
	*entries(): IterableIterator<[number, T]> {
		let curr = data.get(this)!.first, pos = 0;
		while (curr) {
			yield([pos, curr.item]);
			pos++;
			curr = curr.next;
		}
	}
	every(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of this.entries()) {
			if (!callback.call(thisArg, item, index, this)) {
				return false;
			}
		}
		return true;
	}
	filter(callback: Callback<T, any, this>, thisArg?: any) {
		const filter: T[] = [];
		for (const [index, item] of this.entries()) {
			if (callback.call(thisArg, item, index, this)) {
				filter.push(item);
			}
		}
		return filter;
	}
	find(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of this.entries()) {
			if (callback.call(thisArg, item, index, this)) {
				return item;
			}
		}
		return undefined;
	}
	findIndex(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of this.entries()) {
			if (callback.call(thisArg, item, index, this)) {
				return index;
			}
		}
		return -1;
	}
	flatMap<U>(callback: Callback<T, U, this>, thisArg?: any): U[] {
		return this.map(callback, thisArg).flat();
	}
	forEach(callback: Callback<T, void, this>, thisArg?: any) {
		for (const [index, item] of this.entries()) {
			callback.call(thisArg, item, index, this);
		}
	}
	includes(valueToFind: T, fromIndex: number = 0) {
		let [curr] = getNode(data.get(this)!, fromIndex);
		while(curr) {
			if (Object.is(valueToFind, curr.item)) {
				return true;
			}
			curr = curr.next;
		}
		return false;
	}
	indexOf(searchElement: T, fromIndex: number = 0) {
		let [curr, pos] = getNode(data.get(this)!, fromIndex);
		while(curr) {
			if (Object.is(searchElement, curr.item)) {
				return pos;
			}
			curr = curr.next;
			pos++;
		}
		return -1;
	}
	*keys() {
		const root = data.get(this)!;
		for (let i = 0; i < root.length; i++) {
			yield i;
		}
	}
	lastIndexOf(searchElement: T, fromIndex: number = 0): number {
		let [curr, pos] = getNode(data.get(this)!, fromIndex);
		while(curr) {
			if (Object.is(searchElement, curr.item)) {
				return pos;
			}
			curr = curr.prev;
			pos--;
		}
		return -1;
	}
	map<U>(callback: Callback<T, U, this>, thisArg?: any): U[] {
		const map: U[] = [];
		for (const [index, item] of this.entries()) {
			map.push(callback.call(thisArg, item, index, this));
		}
		return map;
	}
	pop(): T | undefined {
		const root = data.get(this)!,
		      last = root.last;
		if (last) {
			removeNode(root, last);
			return last.item;
		}
		return undefined;
	}
	push(element: T, ...elements: T[]): number {
		const root = data.get(this)!;
		addItemAfter(root, root.last, element);
		elements.forEach(item => addItemAfter(root, root.last, item));
		return root.length;
	}
	reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: this) => U, initialValue: U): U;
	reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T, initialValue?: T): T | undefined {
		for (const [index, item] of this.entries()) {
			if (initialValue === undefined) {
				initialValue = item;
			} else {
				initialValue = callbackfn(initialValue, item, index, this);
			}
		}
		return initialValue;
	}
	reduceRight(callbackfn: (accumulator: T, currentValue: T, index: number, array: this) => T, initialValue?: T): T;
	reduceRight<U>(callbackfn: (accumulator: U, currentValue: T, index: number, array: this) => U, initialValue: U): U {
		const root = data.get(this)!;
		let curr = root.last, pos = root.length;
		while(curr) {
			pos--;
			if (initialValue === undefined) {
				initialValue = curr.item;
			} else {
				initialValue = callbackfn(initialValue, curr.item, pos, this);
			}
			curr = curr.prev;
		}
		return initialValue;
	}
	reverse() {
		const root = data.get(this)!;
		[root.last, root.first] = [root.first, root.last];
		let curr = root.first;
		root.reverse *= -1;
		while (curr) {
			[curr.next, curr.prev] = [curr.prev, curr.next];
			root.parentNode.appendChild(curr.item.html);
			curr = curr.next;
		}
		return this;
	}
	shift(): T | undefined {
		const root = data.get(this)!,
		      first = root.first;
		if (first) {
			removeNode(root, first);
			return first.item;
		}
		return undefined;
	}
	slice(begin: number = 0, end?: number) {
		const root = data.get(this)!,
		      slice: T[] = [];
		if (end === undefined) {
			end = root.length;
		} else if (end < 0) {
			end += root.length;
		}
		let [curr, pos] = getNode(root, begin);
		while (curr && pos < end) {
			slice.push(curr.item);
			pos++;
			curr = curr.next;
		}
		return slice;
	}
	some(callback: Callback<T, any, this>, thisArg?: any) {
		for (const [index, item] of this.entries()) {
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
			root.reverse = 1;
		}
		if (root.first) {
			let curr = root.first.next;
			root.last = root.first;
			root.first.next = null;
			while (curr) {
				const next = curr.next;
				curr.prev = root.last;
				curr.next = null;
				sortNodes(root, curr.prev.next = root.last = curr);
				curr = next;
			}
		}
		return this;
	}
	splice(start: number, deleteCount: number = 0, ...items: T[]): T[] {
		const root = data.get(this)!, removed: T[] = [];
		let [curr] = getNode(root, start),
		    adder = curr ? curr.prev : null;
		while (curr && deleteCount > 0) {
			removed.push(curr.item);
			removeNode(root, curr);
			deleteCount--;
			curr = curr.next;
		}
		items.forEach(item => adder = addItemAfter(root, adder, item));
		return removed;
	}
	unshift(element: T, ...elements: T[]): number {
		const root = data.get(this)!;
		let adder = addItemAfter(root, null, element);
		elements.forEach(item => adder = addItemAfter(root, adder, item));
		return root.length;
	}
	*values() {
		let curr = data.get(this)!.first;
		while (curr) {
			yield curr.item;
			curr = curr.next;
		}
	}
	[Symbol.iterator]() {
		return this.values();
	}
}
