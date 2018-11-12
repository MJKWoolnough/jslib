"use strict"
offer((function() {
	const objects = new WeakMap(),
	      check = function(method, object, item) {
		if (!objects.has(object)) {
			throw new TypeError("invalid Ordered object");
		}
		if (!(html in item && item.html instanceof Node)) {
			throw new TypeError("invalid item object");
		}
		method(objects.get(object), item);
	      },
	      add = function(o, item) {
		const {lessFn, parentNode, list} = o,
		      i = list.indexOf(item)
		if (i >= 0) {
			return i;
		}
		let pos = 0;
		for(; pos < list.length; pos++) {
			if (lessFn(item, list[pos])) {
				break;
			}
		}
		if (pos === list.length) {
			parentNode.appendChild(item.html);
		} else {
			parentNode.insertBefore(item.html, list[pos].html);
		}
		list.splice(pos, 0, item);
		return pos;
	      },
	      remove = function(o, item) {
		const {parentNode, list} = o,
		      pos = list.indexOf(item);
		if (pos >= 0) {
			parentNode.removeChild(item.html);
			list.splice(pos, 1);
		}
		return pos;
	      },
	      update = function(o, item) {
		const {list} = o;
		list.splice(list.indexOf(item), 1);
		return add(o, item);
	      };
	class Ordered {
		constructor(lessFn, parentNode) {
			if (!(lessFn instanceof Function)) {
				throw TypeError("first argument to Ordered constructor needs to be a sorting function");
			}
			if (!(parentNode instanceof Node)) {
				throw TypeError("second argument to Ordered constructor must be a Node object");
			}
			const list = [];
			objects.set(this, Object.freeze({lessFn, parentNode, list}));
		}
		add(item) {
			return check(add, this, item);
		}
		remove(item) {
			return check(remove, this, item);
		}
		update(item) {
			return check(update, this, item);
		}
	}
	return {Ordered};
}()));
