"use strict";

const isIndex = key => {
	const i = parseInt(key)
	return parseInt(i) >= 0 && i.toString() === key;
      },
      sameSort = (arr, index, sortFn, reverse) => (index === 0 || sortFn(arr[index-1], arr[index]) * reverse >= 0) && (index === arr.length - 1 || sortFn(arr[index], arr[index+1]) * reverse >= 0),
      defaultSort = new Intl.Collator().compare,
      dataSymbol = Symbol("data"),
      remove = (target, index, data) => {
	data.parentNode.removeChild(target[index].html);
	for (let i = index; i < target.length - 1; i++) {
		target[i] = target[i+1];
	}
	delete target[target.length-1];
	target.length--;
	return true;
      },
      reset = (arr, d) => {
	let nextSibling = arr[arr.length-1].html;
	if (nextSibling !== d.parentNode.lastChild) {
		d.parentNode.appendChild(nextSibling);
	}
	for (let i = arr.length - 2; i >= 0; i--) {
		const thisNode = arr[i].html;
		if (nextSibling.previousSibling !== thisNode) {
			d.parentNode.insertBefore(thisNode, nextSibling);
		}
		nextSibling = thisNode;
	}
      },
      fns = {
	set: (target, property, value) => {
		const d = getData(target);
		if (!isIndex(property) || d.jdi) {
			target[property] = value;
			return true;
		}
		if (!(value instanceof Object && value.html instanceof Node)) {
			throw new TypeError("invalid item object");
		}
		const index = parseInt(property);
		if (index < target.length) {
			if (target[index] === value && sameSort(target, index, d.sortFn, d.reverse)) {
				return true;
			}
			remove(target, index, d);
		}
		const oldPos = target.indexOf(value);
		if (oldPos >= 0) {
			if (sameSort(target, oldPos, d.sortFn, d.reverse)) {
				return true;
			}
			remove(target, oldPos, d);
		}
		let pos = 0;
		for (; pos < target.length; pos++) {
			if ((d.sortFn(value, target[pos]) * d.reverse <= 0)) {
				d.parentNode.insertBefore(value.html, target[pos].html);
				for (let i = target.length; i > pos; i--) {
					target[i] = target[i-1];
				}
				target[pos] = value;
				return true;
			}
		}
		d.parentNode.appendChild(value.html);
		target[target.length] = value;
		return true;
	},
	deleteProperty: (target, property) => {
		const d = getData(target);
		if (!isIndex(property) || d.jdi) {
			delete target[property];
			return true;
		}
		remove(target, parseInt(property), d);
		return true;
	}
      },
      getData = arr => {
	if (arr.hasOwnProperty(dataSymbol)) {
		return arr[dataSymbol];
	}
	throw new TypeError("invalid SortHTML");
      };

class SortHTML extends Array {
	constructor(parentNode, sortFn = defaultSort) {
		super();
		Object.defineProperty(this, dataSymbol, {value: {parentNode, sortFn, reverse: 1, jdi: false}});
	}
	push(element, ...elements) {
		this[this.length] = element;
		elements.forEach(e => this.push(e));
		return this.length;
	}
	reverse() {
		const d = getData(this);
		d.reverse *= -1;
		if (this.length > 1) {
			d.jdi = true;
			super.reverse();
			d.jdi = false;
			reset(this, d);
		}
		return this;
	}
	shift() {
		const d = getData(this);
		d.jdi = true;
		const i = super.shift();
		d.jdi = false;
		if (d.parentNode.firstChild) {
			d.parentNode.removeChild(d.parentNode.firstChild);
		}
		return i;
	}
	sort(sortFn) {
		const d = getData(this);
		d.sortFn = sortFn;
		if (this.length > 1) {
			d.jdi = true;
			super.sort(sortFn);
			d.jdi = false;
			reset(this, d);
		}
		return this;
	}
	splice(start, deleteCount = Infinity, ...items) {
		if (deleteCount > this.length - start) {
			deleteCount = this.length - start;
		}
		const d = getData(this);
		for (let i = 0; i < deleteCount; i++) {
			d.parentNode.removeChild(this[start+i].html);
		}
		d.jdi = true;
		const ret = super.splice(start, deleteCount);
		d.jdi = false;
		items.forEach(i => this.push(i));
		return ret;
	}
	unshift(item, ...items) {
		this.push(item);
		items.forEach(i => this.push(i));
		return this.length;
	}
	update() {
		const d = getData(this);
		d.jdi = true;
		super.sort(d.sortFn);
		d.jdi = false;
		reset(this, d);
	}
	get html() {return getData(this).parentNode;}
	static get [Symbol.species]() {return Array;}
}

export default (parentNode, sortFn = defaultSort) =>  new Proxy(new SortHTML(parentNode, sortFn), fns);
