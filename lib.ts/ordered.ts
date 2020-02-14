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
	prev: ItemNode<T> | null;
	next: ItemNode<T> | null;
	sortFn: sortFunc<T>;
	parentNode: Node;
	length: number;
	reverse: number;
}

type Callback<T extends Item, U> = (element: T, index: number, array: SortHTML<T>) => U;

export const noSort = () => 0,
stringSort = new Intl.Collator().compare;

const data = new WeakMap<SortHTML<any>, Root<any>>(),
      sortNodes = <T extends Item>(root: Root<T>, node: ItemNode<T>) => {
	// TODO
      },
      getNode = <T extends Item>(root: Root<T>, index: number) => {
	if (index < 0) {
		let curr = root.prev, pos = index;
		while (curr) {
			if (pos === 0) {
				return curr;
			}
			pos++;
			curr = curr.prev;
		}
	} else if (index < root.length) {
		let curr = root.next, pos = index;
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
		root.next = node.next;
	}
	if (node.next) {
		node.next.prev = node.prev;
	} else {
		root.prev = node.prev;
	}
	root.parentNode.removeChild(node.item.html);
	root.length--;
      };

export class SortHTML<T extends Item> {
	constructor(parentNode: Node, sortFn: sortFunc<T> = noSort) {
		data.set(this, {prev: null, next: null, sortFn, parentNode, length: 0, reverse: 1});
	}
	get html() {
		return data.get(this)!.parentNode;
	}
	get length() {
		return data.get(this)!.length;
	}
	getItem(index: number) {
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
	entries() {
		const root = data.get(this)!,
		      entries: [number, T][] = [];
		let curr = root.next, pos = 0;
		while (curr !== null) {
			entries.push([pos, curr.item]);
			pos++;
			curr = curr.next;
		}
		return entries;
	}
	every(callback: Callback<T, any>, thisArg?: any) {
		const root = data.get(this)!
		let curr = root.next, index = 0;
		while (curr !== null) {
			if (!callback.call(thisArg, curr.item, index, this)) {
				return false;
			}
			index++;
			curr = curr.next;
		}
		return true;
	}
	filter(callback: Callback<T, any>, thisArg?: any) {
		const filter: T[] = [];
		this.every((item: T, index: number, arr: SortHTML<T>) => {
			if (callback.call(thisArg, item, index, this)) {
				arr.push(item);
			}
			return true;
		});
		return filter;
	}
	find(callback: Callback<T, any>, thisArg?: any) {
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
	findIndex(callback: Callback<T, any>, thisArg?: any) {
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
	flatMap<U>(callback: Callback<T, U>, thisArg?: any): U[]{
		return this.map(callback, thisArg).flat();
	}
	forEach(callback: Callback<T, void>, thisArg?: any) {
		const root = data.get(this)!;
		let curr = root.next, pos = 0;
		while (curr !== null) {
			callback.call(thisArg, curr.item, pos++, this);
			pos++;
			curr = curr.next;
		}
	}
	includes(valueToFind: T, fromIndex?: number) {
		const root = data.get(this)!;
		let curr = fromIndex === undefined ? root.next : getNode(root, fromIndex);
		while(curr !== null) {
			if (Object.is(valueToFind, curr.item)) {
				return true;
			}
			curr = curr.next;
		}
		return false;
	}
	indexOf(searchElement: T, fromIndex?: number) {
		const root = data.get(this)!;
		let curr = fromIndex === undefined ? root.next : getNode(root, fromIndex),
		    pos = fromIndex === undefined ? 0 : fromIndex;
		while(curr !== null) {
			if (Object.is(searchElement, curr.item)) {
				return pos;
			}
			curr = curr.next;
			pos++;
		}
		return -1;
	}
	keys() {
		return Array.from({length: this.length}, (_, n) => n);
	}
	lastIndexOf(searchElement: T, fromIndex?: number) {
		const root = data.get(this)!;
		let curr = fromIndex === undefined ? root.prev : getNode(root, fromIndex),
		    pos = fromIndex === undefined ? root.length - 1 : fromIndex;
		while(curr !== null) {
			if (Object.is(searchElement, curr.item)) {
				return pos;
			}
			curr = curr.prev;
			pos--;
		}
		return -1;
	}
	map<U>(callback: Callback<T, U>, thisArg?: any): U[] {
		const map: U[] = [];
		this.every((item: T, index: number, arr: SortHTML<T>) => {
			map.push(callback.call(thisArg, item, index, this));
			return true;
		});
		return map;
	}
	pop() {
		const root = data.get(this)!,
		      last = root.prev;
		if (last === null) {
			return undefined;
		}
		removeNode(root, last);
		return last.item;
	}
	push(element: T, ...elements: T[]) {
		const root = data.get(this)!;
		[element, ...elements].forEach(item => {
			if (root.prev === null) {
				root.prev = root.next = {prev: null, next: null, item};
				root.parentNode.appendChild(item.html);
			} else {
				sortNodes(root, root.prev = root.prev.next = {prev: root.prev, next: null, item});
			}
			root.length++;
		});
		return root.length;
	}
	reverse() {
		const root = data.get(this)!;
		[root.prev, root.next] = [root.next, root.prev];
		let curr = root.next;
		while (curr !== null) {
			[curr.next, curr.prev] = [curr.prev, curr.next];
			root.parentNode.appendChild(curr.item.html);
			curr = curr.next;
		}
		root.reverse *= -1;
		return this;
	}
	shift() {
		const root = data.get(this)!,
		      first = root.next;
		if (first === null) {
			return undefined;
		}
		removeNode(root, first);
		return first;
	}
	slice(begin?: number, end?: number) {
		const root = data.get(this)!,
		      slice: T[] = [];
		if (end === undefined) {
			end = root.length;
		} else if (end < 0) {
			end += root.length;
		}
		let curr = begin === undefined ? root.next : getNode(root, begin),
		    pos = begin === undefined ? 0 : begin;
		while (curr !== null && pos < end) {
			slice.push(curr.item);
			pos--;
			curr = curr.next;
		}
		return slice;
	}
	some(callback: Callback<T, any>, thisArg?: any) {
		return !this.every((item: T, index: number, arr: SortHTML<T>) => !callback.call(thisArg, item, index, this));
	}
	sort(compareFunction?: sortFunc<T>) {
		const root = data.get(this)!;
		if (compareFunction) {
			root.sortFn = compareFunction;
		}
		if (root.length > 0) {
			let curr = root.next;
			while (curr !== null) {
				const next = curr.next;
				curr.prev = root.prev;
				curr.next = null;
				sortNodes(root, root.prev = curr);
				root.prev.next = curr = next;
			}
		}
		return this;
	}
	splice(start: number, deleteCount?: number, ...items: T[]) {
		const root = data.get(this)!;
		let startNode = getNode(root, start),
		    addFrom = startNode ? startNode.prev : null;
		if (startNode !== null && deleteCount !== undefined) {
			let curr = startNode.next;
			while (curr !== null && deleteCount > 0) {
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
					sortNodes(root, addFrom = addFrom.next = root.prev = {prev: addFrom, next: null, item});
				}
			} else {
				if (root.next) {
					sortNodes(root, addFrom = root.next = root.next.prev = {prev: null, next: root.next, item});
				} else {
					sortNodes(root, addFrom = root.next = root.prev = {prev: null, next: null, item});
				}
			}
			root.length++;
		});
		return [this.getItem(1)];
	}
	unshift(element: T, ...elements: T[]) {
		const root = data.get(this)!;
		[element, ...elements].reverse().forEach(item => {
			if (root.next === null) {
				root.next = root.prev = {prev: null, next: null, item};
			} else {
				sortNodes(root, root.next = root.next.prev = {prev: null, next: root.next, item});
			}
			root.length++;
		});
		return root.length;
	}
	values() {
		const root = data.get(this)!,
		      values: T[] = [];
		let curr = root.next;
		while (curr !== null) {
			values.push(curr.item);
			curr = curr.next;
		}
		return values;
	}
}
