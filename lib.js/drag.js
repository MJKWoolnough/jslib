export class DragTransfer {
	#data = new Map();
	#nextID = 0;
	#format;
	#last = "";
	constructor(format) {
		this.#format = format;
	}
	register(t) {
		const key = this.#nextID++ + "";
		this.#data.set(key, t);
		return key;
	}
	get(e) {
		e.preventDefault();
		const t = this.#data.get(e.dataTransfer?.getData(this.#format) || this.#last);
		return t instanceof Function ? t() : t?.transfer(this.#format);
	}
	set(e, key, icon, xOffset = -5, yOffset = -5) {
		this.#last = key;
		e.dataTransfer?.setData(this.#format, key);
		if (icon) {
			e.dataTransfer?.setDragImage(icon, xOffset, yOffset);
		}
	}
	deregister(key) {
		this.#data.delete(key);
		if (this.#last === key) {
			this.#last = "";
		}
	}
	is(e) {
		return e.dataTransfer?.types.includes(this.#format) ?? false;
	}
}

export class DragFiles {
	#mimes;
	constructor(...mimes) {
		this.#mimes = Object.freeze(mimes);
	}
	get mimes() { return this.#mimes; }
	asForm(e, name) {
		const f = new FormData();
		if (e.dataTransfer) {
			e.preventDefault();
			for (const file of e.dataTransfer.files) {
				f.append(name, file);
			}
		}
		return f;
	}
	is(e) {
		if (e.dataTransfer?.types.includes("Files")) {
			for (const i of e.dataTransfer.items) {
				if (i["kind"] !== "file" || !this.#mimes.includes(i["type"])) {
					return false;
				}
			}
			return true;
		}
		return false;
	}
}

export const setDragEffect = effects => e => {
	if (e.dataTransfer) {
		for (const effect in effects) {
			for (const key of effects[effect] ?? []) {
				if (key.is(e)) {
					e.preventDefault();
					e.dataTransfer.dropEffect = effect;
					return true;
				}
			}
		}
	}
	return false;
}
