"use strict"
offer((function() {
	const isIndex = key => parseInt(key).toString() === key && key >= 0,
	      sameSort = (arr, index, sortFn) => (index === 0 || sortFn(arr[index-1], arr[index]) >= 0) && (index === arr.length - 1 || sortFn(arr[index], arr[index+1]) >= 0),
	      defaultSort = new Intl.Collator().compare,
	      dataSymbol = Symbol("data"),
	      set =  function(target, property, value) {
		const d = getData(target);
		if (!isIndex(property) || d.jdi) {
			target[property] = value;
			return true;
		}
		if (!value[d.fieldName]) {
			throw new TypeError("invalid item object");
		}
		const index = parseInt(property);
		if (index < target.length) {
			if (target[index] === value && sameSort(target, index, d.sortFn)) {
				return true;
			}
			remove(target, index, d);
		}
		const oldPos = target.indexOf(value);
		if (oldPos >= 0) {
			if (sameSort(target, oldPos, d.sortFn)) {
				return true;
			}
			remove(target, oldPos, d);
		}
		let pos = 0;
		for (; pos < target.length; pos++) {
			if ((d.sortFn(value, target[pos]) >= 0) === d.reverse) {
				d.parentNode.insertBefore(value[d.fieldName], target[pos][d.fieldName]);
				for (let i = target.length; i > pos; i--) {
					target[i] = target[i-1];
				}
				target[pos] = value;
				return true;
			}
		}
		d.parentNode.appendChild(value[d.fieldName]);
		target[target.length] = value;
		return true;
	      },
	      deleteProperty = function(target, property) {
		const d = getData(target);
		if (!isIndex(property) || d.jdi) {
			delete target[property];
			return true;
		}
		remove(target, parseInt(property), d);
		return true;
	      },
	      remove = function(target, index, data) {
		data.parentNode.removeChild(target[index][data.fieldName]);
		for (let i = index; i < target.length - 1; i++) {
			target[i] = target[i+1];
		}
		delete target[target.length-1];
		target.length--;
		return true;
	      },
	      reset = function(arr, d) {
		while(d.parentNode.hasChildNodes()) {
			d.parentNode.removeChild(d.parentNode.lastChild);
		}
		arr.forEach(e => d.parentNode.appendChild(e[d.fieldName]));
	      },
	      fns = {set, deleteProperty},
	      getData = function(arr) {
		if (arr.hasOwnProperty(dataSymbol)) {
			return arr[dataSymbol];
		}
		throw new TypeError("invalid SortHTML");
	      },
	      sortHTML = function(parentNode, sortFn = defaultSort, fieldName = "html") {
		return new Proxy(new SortHTML(parentNode, sortFn, fieldName), fns);
	      },
	      SortHTML = class SortHTML extends Array {
		constructor(parentNode, sortFn = defaultSort, fieldName = "html") {
			super();
			Object.defineProperty(this, dataSymbol, {value: {parentNode, sortFn, fieldName, reverse: false, jdi: false}});
		}
		push(element, ...elements) {
			this[this.length] = element;
			elements.forEach(e => this.push(e));
			return this.length;
		}
		reverse() {
			const d = getData(this);
			d.reverse = true;
			d.jdi = true;
			super.reverse();
			d.jdi = false;
			reset(this, d);
		}
		shift() {
			const d = getData(this);
			d.jdi = true;
			const i = super.shift();
			d.jdi = false;
			d.parentNode.removeChild(d.parentNode.firstChild);
			return i;
		}
		sort(sortFn) {
			const d = getData(this);
			d.sortFn = sortFn;
			d.jdi = true;
			super.sort(sortFn);
			d.jdi = false;
			reset(this, d);
		}
		splice(start, deleteCount = Infinity, ...items) {
			if (deleteCount > this.length - start) {
				deleteCount = this.length - start;
			}
			const d = getData(this);
			for (let i = 0; i < deleteCount; i++) {
				d.parentNode.removeChild(this[start+i][d.fieldName]);
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
		get html() {return getData(this).parentNode;}
		static get [Symbol.species]() {return Array;}
	      };
	return {sortHTML};
}()));
