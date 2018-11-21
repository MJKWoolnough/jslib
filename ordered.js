"use strict"
offer((function() {
	const isIndex = key => parseInt(key).toString() === key && key >= 0,
	      defaultSort = new Intl.Collator().compare,
	      dataSymbol = Symbol("data"),
	      fns = {
		set: function(target, property, value) {
			const d = data.get(target);
			if (!isIndex(property) || d.jdi) {
				target[property] = value;
				return true;
			}
			d.validateItem(value);
			const o = target.indexOf(value);
			if (o >= 0) {
				if (d.sortFn(value, target[o]) === 0) {
					if (!target[o][d.fieldName].isSameNode(value[d.fieldName])) {
						d.parentNode.replaceChild(value[d.fieldName], target[o][d.fieldName]);
					}
					target[o] = value;
					return true;
				}
				d.parentNode.removeChild(target[o][d.fieldName]);
				target.splice(o, 1);
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
			target.push(value);
			return true;
		},
		deleteProperty: function(target, property) {
			const d = data.get(target);
			if (!isIndex(property) || d.jdi) {
				delete target[property];
				return true;
			}
			d.parentNode.removeChild(target[property][d.fieldName]);
			for (let i = parseInt(property); i < target.length - 1; i++) {
				target[i] = target[i+1];
			}
			delete target[target.length-1];
			target.length--;
			return true;
		}
	      },
	      reset = function(arr, d) {
		while(d.parentNode.hasChildNodes()) {
			d.parentNode.removeChild(d.parentNode.lastChild);
		}
		arr.forEach(e => d.parentNode.appendChild(e[d.fieldName]));
	      },
	      data = class {
		constructor(parentNode, sortFn = defaultSort, fieldName = "html") {
			this.parentNode = parentNode;
			this.sortFn = sortFn;
			this.fieldName = fieldName;
			this.reverse = false;
			this.jdi = false;
		}
		validateItem(item) {
			if (!item[this.fieldName]) {
				throw new TypeError("invalid item object");
			}
		}
		static get(arr) {
			if (arr.hasOwnProperty(dataSymbol)) {
				return arr[dataSymbol];
			}
			throw new TypeError("invalid SortHTML");
		}
	      },
	      sortHTML = function(parentNode, sortFn = defaultSort, fieldName = "html") {
		return new Proxy(new SortHTML(parentNode, sortFn, fieldName), fns);
	      },
	      SortHTML = class SortHTML extends Array {
		constructor(parentNode, sortFn = defaultSort, fieldName = "html") {
			super();
			Object.defineProperty(this, dataSymbol, {value: new data(parentNode, sortFn, fieldName)});
		}
		reverse() {
			const d = data.get(this);
			d.reverse = true;
			d.jdi = true;
			super.reverse();
			d.jdi = false;
			reset(this, d);
		}
		shift() {
			const d = data.get(this);
			d.jdi = true;
			const i = super.shift();
			d.jdi = false;
			d.parentNode.removeChild(d.parentNode.firstChild);
			return i;
		}
		sort(sortFn) {
			const d = data.get(this);
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
			const d = data.get(this);
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
		get html() {return data.get(this).parentNode;}
		static get [Symbol.species]() {return Array;}
	      };
	return {sortHTML};
}()));
