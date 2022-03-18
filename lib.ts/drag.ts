interface Transfer<T> {
	transfer(): T;
}

interface CheckedDragEvent extends DragEvent {
	dataTransfer: DataTransfer;
}

interface CheckedDT<T> extends DragTransfer<T> {
	get(e: DragEvent): T;
}

interface Is {
	is(e: DragEvent): boolean;
}

type EffectRecord = Partial<Record<"none" | "copy" | "link" | "move", Is[]>>;

export class DragTransfer<T = any> {
	#data = new Map<string, Transfer<T>>();
	#nextID = 0;
	#format: string;
	constructor(format: string) {
		this.#format = format;
	}
	register(t: Transfer<T>) {
		const key = this.#nextID++ + "";
		this.#data.set(key, t);
		return key;
	}
	get(e: DragEvent): T | undefined {
		return this.#data.get(e.dataTransfer?.getData(this.#format) ?? "")?.transfer();
	}
	set(e: DragEvent, key: string, icon?: HTMLDivElement, xOffset = -5, yOffset = -5) {
		e.dataTransfer?.setData(this.#format, key);
		if (icon) {
			e.dataTransfer?.setDragImage(icon, xOffset, yOffset);
		}
	}
	deregister(key: string) {
		this.#data.delete(key);
	}
	is(e: DragEvent): this is CheckedDT<T> {
		return e.dataTransfer?.types.includes(this.#format) ?? false;
	}
}

export class DragFiles {
	mimes: Readonly<string[]>;
	constructor(...mimes: string[]) {
		this.mimes = Object.freeze(mimes);
	}
	asForm(e: DragEvent, name: string) {
		const f = new FormData();
		if (e.dataTransfer) {
			for (const file of e.dataTransfer.files) {
				f.append(name, file);
			}
		}
		return f;
	}
	is(e: DragEvent): e is CheckedDragEvent {
		if (e.dataTransfer?.types.includes("Files")) {
			for (const i of e.dataTransfer.items) {
				if (i["kind"] !== "file" || !this.mimes.includes(i["type"])) {
					return false;
				}
			}
		}
		return true;
	}
}

export const setDragEffect = (effects: EffectRecord) => (e: DragEvent) => {
	for (const effect in effects) {
		for (const key of effects[effect as keyof EffectRecord] ?? []) {
			if (key.is(e)) {
				e.preventDefault();
				e.dataTransfer!.dropEffect = effect as keyof EffectRecord;
				return true;
			}
		}
	}
	return false;
};
