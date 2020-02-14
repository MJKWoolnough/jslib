"use strict";

export const noSort = () => 0,
stringSort = new Intl.Collator().compare;

const data = new WeakMap(),
      sortNodes = (root, node) => {
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
		root.prev = node;
	}
	if (!node.prev) {
		root.next = node;
	}
      },
      getNode = (root, index) => {
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
      removeNode = (root, node) => {
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

export class SortHTML {
	constructor(parentNode, sortFn = noSort) {
		data.set(this, {prev: null, next: null, sortFn, parentNode, length: 0, reverse: 1});
	}
	get html() {
		return data.get(this).parentNode;
	}
	get length() {
		return data.get(this).length;
	}
	getItem(index) {
		const node = getNode(data.get(this), index);
		if (node) {
			return node.item;
		}
		return undefined;
	}
	setItem(index, item) {
		const root = data.get(this);
		if (index < root.length) {
			const node = getNode(root, index);
			root.parentNode.removeChild(node.item.html);
			node.item = item;
			sortNodes(root, node);
		} else {
			this.push(item);
		}
	}
	*entries() {
		const root = data.get(this);
		let curr = root.next, pos = 0;
		while (curr) {
			yield([pos, curr.item]);
			pos++;
			curr = curr.next;
		}
	}
	every(callback, thisArg) {
		const root = data.get(this);
		let curr = root.next, index = 0;
		while (curr) {
			if (!callback.call(thisArg, curr.item, index, this)) {
				return false;
			}
			index++;
			curr = curr.next;
		}
		return true;
	}
	filter(callback, thisArg) {
		const filter = [];
		this.every((item, index, arr) => {
			if (callback.call(thisArg, item, index, this)) {
				arr.push(item);
			}
			return true;
		});
		return filter;
	}
	find(callback, thisArg) {
		let found;
		this.every((item, index, arr) => {
			if (callback.call(thisArg, item, index, this)) {
				found = item;
				return false;
			}
			return true;
		});
		return found;
	}
	findIndex(callback, thisArg) {
		let found = -1;
		this.every((item, index, arr) => {
			if (callback.call(thisArg, item, index, this)) {
				found = index;
				return false;
			}
			return true;
		});
		return found;
	}
	flatMap(callback, thisArg) {
		return this.map(callback, thisArg).flat();
	}
	forEach(callback, thisArg) {
		const root = data.get(this);
		let curr = root.next, pos = 0;
		while (curr) {
			callback.call(thisArg, curr.item, pos++, this);
			pos++;
			curr = curr.next;
		}
	}
	includes(valueToFind, fromIndex) {
		const root = data.get(this);
		let curr = fromIndex === undefined ? root.next : getNode(root, fromIndex);
		while(curr) {
			if (Object.is(valueToFind, curr.item)) {
				return true;
			}
			curr = curr.next;
		}
		return false;
	}
	indexOf(searchElement, fromIndex) {
		const root = data.get(this);
		let curr = fromIndex === undefined ? root.next : getNode(root, fromIndex),
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
		const root = data.get(this);
		for (let i = 0; i < root.length; i++) {
			yield i;
		}
	}
	lastIndexOf(searchElement, fromIndex) {
		const root = data.get(this);
		let curr = fromIndex === undefined ? root.prev : getNode(root, fromIndex),
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
	map(callback, thisArg) {
		const map = [];
		this.every((item, index, arr) => {
			map.push(callback.call(thisArg, item, index, this));
			return true;
		});
		return map;
	}
	pop() {
		const root = data.get(this),
		      last = root.prev;
		if (last) {
			removeNode(root, last);
			return last.item;
		}
		return undefined;
	}
	push(element, ...elements) {
		const root = data.get(this);
		[element, ...elements].forEach(item => {
			if (root.prev) {
				sortNodes(root, root.prev = root.prev.next = {prev: root.prev, next: null, item});
			} else {
				root.prev = root.next = {prev: null, next: null, item};
				root.parentNode.appendChild(item.html);
			}
			root.length++;
		});
		return root.length;
	}
	reduce(callbackfn, initialValue) {
		const root = data.get(this);
		let curr = root.next, pos = 0;
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
	reduceRight(callbackfn, initialValue) {
		const root = data.get(this);
		let curr = root.prev, pos = root.length;
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
		const root = data.get(this);
		[root.prev, root.next] = [root.next, root.prev];
		let curr = root.next;
		root.reverse *= -1;
		while (curr) {
			[curr.next, curr.prev] = [curr.prev, curr.next];
			root.parentNode.appendChild(curr.item.html);
			curr = curr.next;
		}
		return this;
	}
	shift() {
		const root = data.get(this),
		      first = root.next;
		if (first) {
			removeNode(root, first);
			return first.item;
		}
		return undefined;
	}
	slice(begin, end) {
		const root = data.get(this),
		      slice = [];
		if (end === undefined) {
			end = root.length;
		} else if (end < 0) {
			end += root.length;
		}
		let curr = begin === undefined ? root.next : getNode(root, begin),
		    pos = begin === undefined ? 0 : begin;
		while (curr && pos < end) {
			slice.push(curr.item);
			pos++;
			curr = curr.next;
		}
		return slice;
	}
	some(callback, thisArg) {
		return !this.every((item, index, arr) => !callback.call(thisArg, item, index, this));
	}
	sort(compareFunction) {
		const root = data.get(this);
		if (compareFunction) {
			root.sortFn = compareFunction;
			root.reverse = 1;
		}
		if (root.next) {
			let curr = root.next.next;
			root.prev = root.next;
			root.next.next = null;
			while (curr) {
				const next = curr.next;
				curr.prev = root.prev;
				curr.next = null;
				sortNodes(root, curr.prev.next = root.prev = curr);
				curr = next;
			}
		}
		return this;
	}
	splice(start, deleteCount, ...items) {
		const root = data.get(this), removed = [];
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
		return removed;
	}
	unshift(element, ...elements) {
		const root = data.get(this);
		[element, ...elements].reverse().forEach(item => {
			if (root.next) {
				sortNodes(root, root.next = root.next.prev = {prev: null, next: root.next, item});
			} else {
				root.next = root.prev = {prev: null, next: null, item};
			}
			root.length++;
		});
		return root.length;
	}
	*values() {
		const root = data.get(this);
		let curr = root.next;
		while (curr) {
			yield curr.item;
			curr = curr.next;
		}
	}
	[Symbol.iterator]() {
		return this.values();
	}
}
