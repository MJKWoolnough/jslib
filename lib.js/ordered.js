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
		root.last = node;
	}
	if (!node.prev) {
		root.first = node;
	}
      },
      getNode = (root, index) => {
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
      addItemAfter = (root, after, item) => {
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
      removeNode = (root, node) => {
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
      },
      entries = function* (s, start = 1, direction = 1) {
	let [curr, pos] = getNode(data.get(s), start);
	while (curr) {
		yield [pos, curr.item];
		pos += direction;
		curr = direction === 1 ? curr.next : curr.prev;
	}
      };

export class SortHTML {
	constructor(parentNode, sortFn = noSort) {
		data.set(this, {first: null, last: null, sortFn, parentNode, length: 0, reverse: 1});
	}
	get html() {
		return data.get(this).parentNode;
	}
	get length() {
		return data.get(this).length;
	}
	getItem(index) {
		const [node] = getNode(data.get(this), index);
		if (node) {
			return node.item;
		}
		return undefined;
	}
	setItem(index, item) {
		const root = data.get(this),
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
	*entries() {
		yield *entries(this);
	}
	every(callback, thisArg) {
		for (const [index, item] of entries(this)) {
			if (!callback.call(thisArg, item, index, this)) {
				return false;
			}
		}
		return true;
	}
	filter(callback, thisArg) {
		const filter = [];
		for (const [index, item] of entries(this)) {
			if (callback.call(thisArg, item, index, this)) {
				filter.push(item);
			}
		}
		return filter;
	}
	find(callback, thisArg) {
		for (const [index, item] of entries(this)) {
			if (callback.call(thisArg, item, index, this)) {
				return item;
			}
		}
		return undefined;
	}
	findIndex(callback, thisArg) {
		for (const [index, item] of entries(this)) {
			if (callback.call(thisArg, item, index, this)) {
				return index;
			}
		}
		return -1;
	}
	flatMap(callback, thisArg) {
		return this.map(callback, thisArg).flat();
	}
	forEach(callback, thisArg) {
		for (const [index, item] of entries(this)) {
			callback.call(thisArg, item, index, this);
		}
	}
	includes(valueToFind, fromIndex = 0) {
		for (const [_, item] of entries(this, fromIndex)) {
			if (Object.is(valueToFind, item)) {
				return true;
			}
		}
		return false;
	}
	indexOf(searchElement, fromIndex = 0) {
		for (const [index, item] of entries(this, fromIndex)) {
			if (Object.is(searchElement, item)) {
				return index;
			}
		}
		return -1;
	}
	*keys() {
		const root = data.get(this);
		for (let i = 0; i < root.length; i++) {
			yield i;
		}
	}
	lastIndexOf(searchElement, fromIndex = 0) {
		for (const [index, item] of entries(this, fromIndex, -1)) {
			if (Object.is(searchElement, item)) {
				return index;
			}
		}
		return -1;
	}
	map(callback, thisArg) {
		const map = [];
		for (const [index, item] of entries(this)) {
			map.push(callback.call(thisArg, item, index, this));
		}
		return map;
	}
	pop() {
		const root = data.get(this),
		      last = root.last;
		if (last) {
			removeNode(root, last);
			return last.item;
		}
		return undefined;
	}
	push(element, ...elements) {
		const root = data.get(this);
		addItemAfter(root, root.last, element);
		elements.forEach(item => addItemAfter(root, root.last, item));
		return root.length;
	}
	reduce(callbackfn, initialValue) {
		for (const [index, item] of entries(this)) {
			if (initialValue === undefined) {
				initialValue = item;
			} else {
				initialValue = callbackfn(initialValue, item, index, this);
			}
		}
		return initialValue;
	}
	reduceRight(callbackfn, initialValue) {
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
		const root = data.get(this);
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
	shift() {
		const root = data.get(this),
		      first = root.first;
		if (first) {
			removeNode(root, first);
			return first.item;
		}
		return undefined;
	}
	slice(begin = 0, end) {
		const root = data.get(this),
		      slice = [];
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
	some(callback, thisArg) {
		for (const [index, item] of entries(this)) {
			if (callback.call(thisArg, item, index, this)) {
				return true;
			}
		}
		return false;
	}
	sort(compareFunction) {
		const root = data.get(this);
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
	splice(start, deleteCount = 0, ...items) {
		const root = data.get(this), removed = [];
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
	unshift(element, ...elements) {
		const root = data.get(this);
		let adder = addItemAfter(root, null, element);
		elements.forEach(item => adder = addItemAfter(root, adder, item));
		return root.length;
	}
	*values() {
		let curr = data.get(this).first;
		while (curr) {
			yield curr.item;
			curr = curr.next;
		}
	}
	[Symbol.iterator]() {
		return this.values();
	}
}
