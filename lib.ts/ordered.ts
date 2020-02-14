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
      getNode = <T extends Item>(root: Root<T>, index: number) => {
	if (index < 0) {
		let curr = root.last, pos = index;
		while (curr) {
			if (pos === 0) {
				return curr;
			}
			pos++;
			curr = curr.prev;
		}
	} else if (index < root.length) {
		let curr = root.first, pos = index;
		while (curr) {
			if (pos === 0) {
				return curr;
			}
			pos--;
			curr = curr.next;
		}
	}
	return null;
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
		const node = getNode(data.get(this)!, index);
		if (node) {
			return node.item;
		}
		return undefined;
	}
	setItem(index: number, item: T) {
		const root = data.get(this)!;
		if (index < root.length) {
			const node = getNode(root, index)!;
			root.parentNode.removeChild(node.item.html);
			node.item = item;
			sortNodes(root, node);
		} else {
			this.push(item);
		}
	}
	*entries(): IterableIterator<[number, T]> {
		const root = data.get(this)!;
		let curr = root.first, pos = 0;
		while (curr) {
			yield([pos, curr.item]);
			pos++;
			curr = curr.next;
		}
	}
	every(callback: Callback<T, any, this>, thisArg?: any) {
		const root = data.get(this)!;
		let curr = root.first, index = 0;
		while (curr) {
			if (!callback.call(thisArg, curr.item, index, this)) {
				return false;
			}
			index++;
			curr = curr.next;
		}
		return true;
	}
	filter(callback: Callback<T, any, this>, thisArg?: any) {
		const filter: T[] = [];
		this.every((item: T, index: number, arr: SortHTML<T>) => {
			if (callback.call(thisArg, item, index, this)) {
				arr.push(item);
			}
			return true;
		});
		return filter;
	}
	find(callback: Callback<T, any, this>, thisArg?: any) {
		let found: T | undefined;
		this.every((item: T, index: number, arr: SortHTML<T>) => {
			if (callback.call(thisArg, item, index, this)) {
				found = item;
				return false;
			}
			return true;
		});
		return found;
	}
	findIndex(callback: Callback<T, any, this>, thisArg?: any) {
		let found = -1;
		this.every((item: T, index: number, arr: SortHTML<T>) => {
			if (callback.call(thisArg, item, index, this)) {
				found = index;
				return false;
			}
			return true;
		});
		return found;
	}
	flatMap<U>(callback: Callback<T, U, this>, thisArg?: any): U[] {
		return this.map(callback, thisArg).flat();
	}
	forEach(callback: Callback<T, void, this>, thisArg?: any) {
		const root = data.get(this)!;
		let curr = root.first, pos = 0;
		while (curr) {
			callback.call(thisArg, curr.item, pos++, this);
			pos++;
			curr = curr.next;
		}
	}
	includes(valueToFind: T, fromIndex?: number) {
		const root = data.get(this)!;
		let curr = fromIndex === undefined ? root.first : getNode(root, fromIndex);
		while(curr) {
			if (Object.is(valueToFind, curr.item)) {
				return true;
			}
			curr = curr.next;
		}
		return false;
	}
	indexOf(searchElement: T, fromIndex?: number) {
		const root = data.get(this)!;
		let curr = fromIndex === undefined ? root.first : getNode(root, fromIndex),
		    pos = fromIndex === undefined ? 0 : fromIndex;
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
	lastIndexOf(searchElement: T, fromIndex?: number): number {
		const root = data.get(this)!;
		let curr = fromIndex === undefined ? root.last : getNode(root, fromIndex),
		    pos = fromIndex === undefined ? root.length - 1 : fromIndex;
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
		this.every((item: T, index: number, arr: SortHTML<T>) => {
			map.push(callback.call(thisArg, item, index, this));
			return true;
		});
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
		[element, ...elements].forEach(item => {
			if (root.last) {
				sortNodes(root, root.last = root.last.next = {prev: root.last, next: null, item});
			} else {
				root.last = root.first = {prev: null, next: null, item};
				root.parentNode.appendChild(item.html);
			}
			root.length++;
		});
		return root.length;
	}
	reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T, initialValue?: T): T | undefined;
	reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: this) => U, initialValue: U): U | undefined {
		const root = data.get(this)!;
		let curr = root.first, pos = 0;
		while(curr) {
			if (initialValue === undefined) {
				initialValue = curr.item;
			} else {
				initialValue = callbackfn(initialValue, curr.item, pos, this);
			}
			curr = curr.next;
			pos++;
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
	slice(begin?: number, end?: number) {
		const root = data.get(this)!,
		      slice: T[] = [];
		if (end === undefined) {
			end = root.length;
		} else if (end < 0) {
			end += root.length;
		}
		let curr = begin === undefined ? root.first : getNode(root, begin),
		    pos = begin === undefined ? 0 : begin;
		while (curr && pos < end) {
			slice.push(curr.item);
			pos++;
			curr = curr.next;
		}
		return slice;
	}
	some(callback: Callback<T, any, this>, thisArg?: any) {
		return !this.every((item: T, index: number, arr: SortHTML<T>) => !callback.call(thisArg, item, index, this));
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
	splice(start: number, deleteCount?: number, ...items: T[]): T[] {
		const root = data.get(this)!, removed: T[] = [];
		let startNode = getNode(root, start),
		    addFrom = startNode ? startNode.prev : null;
		if (startNode && deleteCount) {
			let curr = startNode.next;
			while (curr && deleteCount > 0) {
				removed.push(curr.item);
				removeNode(root, curr);
				deleteCount--;
				curr = curr.next;
			}
		}
		items.forEach(item => {
			if (addFrom) {
				if (addFrom.next) {
					sortNodes(root, addFrom = addFrom.next.prev = addFrom.next = {prev: addFrom, next: addFrom.next, item})
				} else {
					sortNodes(root, addFrom = addFrom.next = root.last = {prev: addFrom, next: null, item});
				}
			} else {
				if (root.first) {
					sortNodes(root, addFrom = root.first = root.first.prev = {prev: null, next: root.first, item});
				} else {
					sortNodes(root, addFrom = root.first = root.last = {prev: null, next: null, item});
				}
			}
			root.length++;
		});
		return removed;
	}
	unshift(element: T, ...elements: T[]): number {
		const root = data.get(this)!;
		[element, ...elements].reverse().forEach(item => {
			if (root.first) {
				sortNodes(root, root.first = root.first.prev = {prev: null, next: root.first, item});
			} else {
				root.first = root.last = {prev: null, next: null, item};
			}
			root.length++;
		});
		return root.length;
	}
	*values() {
		const root = data.get(this)!;
		let curr = root.first;
		while (curr) {
			yield curr.item;
			curr = curr.next;
		}
	}
	[Symbol.iterator]() {
		return this.values();
	}
}
