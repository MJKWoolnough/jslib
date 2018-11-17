"use strict"
offer((function() {
	const isIndex = key => Number.isInteger(key) && key >= 0,
	      defaultSort = new Intl.Collator().compare,
	      fns = {
		set: function(target, property, value) {
			const d = data.get(target);
			if (!isIndex(property) || d.jdi) {
				target[property] = value;
				return true;
			}
			data.validateItem(value);
			const o = target.indexOf(value);
			if (o >= 0) {
				if (d.sortFn(value, target[o]) === 0) {
					if (!target[o][d.field].isSameNode(value[d.field])) {
						d.parentNode.replaceChild(value[d.field], target[o][d.field]);
					}
					target[o] = value;
					return true;
				}
				d.parentNode.removeChild(target[o][d.field]);
				target.splice(o, 1);
			}
			let pos = 0;
			for (; pos < target.length; pos++) {
				if ((d.sortFn(value, target[pos]) >= 0) === d.reverse) {
					d.parentNode.insertBefore(value[d.field], target[pos][d.field]);
					target.splice(pos, 0, value);
					return true;
				}
			}
			d.parentNode.appendChild(value[d.field]);
			target.push(value);
			return true;
		},
		deleteProperty: function(target, property) {
			const d = data.get(target);
			if (!isIndex(property) || d.jdi) {
				delete target[property];
				return true;
			}
			d.parentNode.removeChild(target[property][d.field]);
			for (let i = property; i < target.length - 1; i++) {
				target[i] = target[i+1];
			}
			delete target[target.length-1];
			return true;
		}
	      },
	      reset = function(arr, d) {
		while(d.parentNode.hasChildNodes()) {
			d.parentNode.removeChild(d.parentNode.lastChild);
		}
		arr.forEach(e => d.parentNode.appendChild(e[d.field]));
	      },
	      dataMap = new WeakMap(),
	      data = class {
		constructor(parentNode, sortFn = defaultSort, fieldName = "html") {
			this.parentNode = parentNode;
			this.sortFn = sortFn;
			this.fieldName = fieldName;
			this.reverse = false;
			this.jdi = false;
		}
		justDoIt(fn) {
			this.jdi = true;
			fn();
			this.jdi = false;
		}
		validateItem(item) {
			if (!item[this.fieldName]) {
				throw new TypeError("invalid item object");
			}
		}
		static get(arr) {
			if (dataMap.has(arr)) {
				return dataMap.get(arr);
			}
			throw new TypeError("invalid SortHTML");
		}
	      },
	      sortHTML = function(parentNode, sortFn = defaultSort, fieldName = "html") {
		const arr = new SortHTML(),
		      p = new Proxy(arr, fns),
		      d = Object.freeze(new data(parentNode, sortFn, fieldName));
		dataMap.set(arr, d);
		dataMap.set(p, d);
		return p;
	      },
	      SortHTML = class SortHTML extends Array {
		constructor() {
			super();
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
			const ret = [];
			for (let i = 0; i < deleteCount; i++) {
				ret.push(this[start+i]);
				delete this[start+i];
			}
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
