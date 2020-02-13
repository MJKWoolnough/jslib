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
		const root = data.get(this)!;
		if (index < root.length) {
			let curr = root.next, pos = 0;
			while (curr !== null) {
				if (pos === index) {
					return curr.item;
				}
				pos++;
				curr = curr.next;
			}
		}
		return undefined;
	}
	setItem(index: number, item: T) {
		const root = data.get(this)!;
		if (index < root.length) {
			let curr = root.next, pos = 0;
			while (curr !== null) {
				if (pos === index) {
					root.parentNode.removeChild(curr.item.html);
					curr.item = item;
					sortNodes(root, curr);
				}
				pos++;
				curr = curr.next;
			}
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
		let curr = root.next;
		if (fromIndex !== undefined) {
			for (let i = 0; i < fromIndex; i++) {
				if (curr === null) {
					return false;
				}
				curr = curr.next;
			}
		}
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
		let curr = root.next, pos = 0;
		if (fromIndex !== undefined) {
			for (let i = 0; i < fromIndex; i++) {
				if (curr === null) {
					return -1;
				}
				curr = curr.next;
				pos++;
			}
		}
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
		let curr = root.prev, pos = root.length - 1;
		if (fromIndex !== undefined) {
			for (let i = 0; i < fromIndex; i++) {
				if (curr === null) {
					return -1;
				}
				curr = curr.prev;
				pos--;
			}
		}
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
		const root = data.get(this)!;
		if (root.prev === null) {
			return undefined;
		}
		const last = root.prev;
		root.prev = last.prev;
		if (last.prev === null) {
			root.next = null;
		} else {
			last.prev.next = null;
		}
		root.length--;
		root.parentNode.removeChild(last.item.html);
		return last.item;
	}
	push(element: T, ...elements: T[]) {
		const root = data.get(this)!;
		[element, ...elements].forEach(item => {
			if (root.prev === null) {
				root.prev = root.next = {prev: null, next: null, item};
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
		const root = data.get(this)!;
		if (root.next === null) {
			return undefined;
		}
		const first = root.next;
		root.next = first.next;
		if (first.next === null) {
			root.prev = null;
		} else {
			first.next.prev = null;
		}
		root.length--;
		root.parentNode.removeChild(first.item.html);
		return first;
	}
	slice(begin?: number, end?: number) {
		const root = data.get(this)!;
		if (begin === undefined) {
			begin = 0;
		} else if (begin > root.length) {
			return [];
		} else if (begin < 0) {
			begin += root.length;
			if (begin < 0) {
				begin = 0;
			}
		}
		if (end === undefined) {
			end = root.length;
		} else if (end < 0) {
			end += root.length;
		} else if (end > root.length) {
			end = root.length;
		}
		if (end <= begin) {
			return [];
		}
		let curr = root.next, pos = 0;
		for (let i = 0; i < begin; i++) {
			curr = curr!.next;
		}
		const slice: T[] = [];
		for (let i = begin; i < end; i++) {
			slice.push(curr!.item);
			curr = curr!.next;
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
		if (root.length === 0) {
			return [];
		}
		if (start < 0) {
			start += root.length;
			if (start < 0) {
				start = 0;
			}
		}
		if (deleteCount === undefined || start + deleteCount > root.length) {
			deleteCount = root.length - start;
		}
		let curr = root.next, pos = 0;
		for (let i = 0; i < start; i++) {
			curr = curr!.next;
		}
		const slice: T[] = [];
		let adder = curr!.prev;
		for (let i = 0; i < deleteCount; i++) {
			const next = curr!.next;
			root.parentNode.removeChild(curr!.item.html);
			if (curr!.prev) {
				curr!.prev.next = curr!.next;
			} else {
				root.next = curr!.next;
			}
			if (curr!.next) {
				curr!.next.prev = curr!.prev;
			} else {
				root.prev = curr!.prev;
			}
			curr = next;
		}
		items.forEach(item => {
			if (adder) {
				if (adder.next) {
					adder = adder.next.prev = adder.next = {prev: adder, next: adder.next, item}
				} else {
					adder = adder.next = root.prev = {prev: adder, next: null, item};
				}
			} else {
				if (root.next) {
					adder = root.next = root.next.prev = {prev: null, next: root.next, item};
				} else {
					adder = root.next = root.prev = {prev: null, next: null, item};
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
