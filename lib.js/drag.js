/**
 * The drag module aids with handling {@link https://developer.mozilla.org/en-US/docs/Web/API/DragEvent | DragEvent}s, allowing the transfer of complex objects without having to resort to encoding as JSON.
 *
 * @module drag
 */
/** */

/**
 * The unexported Transfer interface describes an object that will transfer a `T` to a caller of {@link DragTransfer}<T>.get.
 *
 * @typeParam T
 * @typedef Object Transfer
 * @property {() => T} transfer
 */

/**
 * This unexported type is used by {@link DragFiles} {@link DragFile.is | is} method to mark the {@link https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer | DataTransfer} as existing on a {@link https://developer.mozilla.org/en-US/docs/Web/API/DragEvent | DragEvent}.
 *
 * @typedef DragEvent CheckedDragEvent
 * @property {DataTransfer} dataTransfer
 */

/**
 * This unexported type is used by {@link DragTransfer}s {@link DragTransfer.is | is} method to mark the DragTransfers {@link DataTransfer.get | get} method as guaranteed to return a `T`.
 *
 * @typeParam T
 * @typedef {DataTransfer<T>} CheckedDT
 * @property {(e: DragEvent) => T} get
 */

/**
 * The DragTransfer class is used to register and handle drag targets for drop targets to retrieve.
 *
 * @typeParam T
 */
export class DragTransfer {
	#data = new Map();
	#nextID = 0;
	#format;
	#last = "";
	/**
	 * @param {string} format The format string uniquely identifies the drag type, as per the {@link https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer | DataTransfer)s {@link https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/setData | setData} method.
	 */
	constructor(format) {
		this.#format = format;
	}
	/**
	 * This method registers a {@link Transfer} object, or a function that returns `T`, to this handler and returns a unique key for this objects format. The key can be used with both the {@link DragTransfer.set | set} and {@link DragTransfer.deregister | deregister} methods.
	 *
	 * @param {Transfer<T> | TransferFunc<T>} t The Transfer object or Function to be registered.
	 *
	 * @return {string} Unique ID.
	 */
	register(t) {
		const key = this.#nextID++ + "";

		this.#data.set(key, t);

		return key;
	}
	/**
	 * The get method finds the key associated with this objects format and returns the object linked to it, if available. Returns undefined if the DragEvent has not got this objects format registered, or the key is invalid.
	 *
	 * The {@link https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault | preventDefault} method of the {@link https://developer.mozilla.org/en-US/docs/Web/API/DragEvent | DragEvent} object is called during this method.
	 *
	 * @param {DragEvent} e The DragEvent.
	 *
	 * @return The value, or undefined.
	 */
	get(e) {
		e.preventDefault();

		const t = this.#data.get(e.dataTransfer?.getData(this.#format) || this.#last);

		return t instanceof Function ? t() : t?.transfer();
	}
	/**
	 * This method is used during a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragstart_event | dragstart} to mark the object being dragged. Requires the {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event | DragEvent} and the key returned from the {@link DragTransfer.register | register}method, and optionally takes a drag icon {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement | div} and `x` and `y` offsets from the cursor.
	 *
	 * @param {DragEvent}      e            The DragEvent.
	 * @param {string}         key          The unique key returned from the `register` method.
	 * @param {HTMLDivElement} [icon]       A drag icon.
	 * @param {number}         [xOffset=-5] Icon `X` offset.
	 * @param {number}         [yOffset=-5] Icon `Y` offset.
	 */
	set(e, key, icon, xOffset = -5, yOffset = -5) {
		this.#last = key;

		e.dataTransfer?.setData(this.#format, key);

		if (icon) {
			e.dataTransfer?.setDragImage(icon, xOffset, yOffset);
		}
	}
	/**
	 * This method takes the key returned from the {@link DragTransfer.register | register} method and stops it from being used as a drag target. Required for an item to be garbage collected.
	 *
	 * @param {string} key The unique key returned from the `register` method.
	 */
	deregister(key) {
		this.#data.delete(key);

		if (this.#last === key) {
			this.#last = "";
		}
	}
	/**
	 * To be used in {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event | dragover} and {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event | drop} events, this method determines is the passed {@link https://developer.mozilla.org/en-US/docs/Web/API/DragEvent DragEvent}'s {@link https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/types | DataTransfer.types} array contains this objects format string, marking this object as a {@link CheckedDT} type.
	 *
	 * @param {DragEvent} e The DragEvent.
	 *
	 * @return {boolean} True if passed DragEvent contains the correct format string.
	 */
	is(e) {
		return e.dataTransfer?.types.includes(this.#format) ?? false;
	}
}

/**
 * This class allows for easier use of the {@link https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/files | files} property of the {@link https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer | DataTransfer} object.
 */
export class DragFiles {
	#mimes;
	/**
	 * Takes a spread of mime types that this object will match files against.
	 *
	 * @param {...string} mimes The mime types that this object will respond to.
	 */
	constructor(...mimes) {
		this.#mimes = Object.freeze(mimes);
	}
	/** This array is the list of mime types passed to the constructor. */
	get mimes() { return this.#mimes; }
	/**
	 * This method attaches all files on the {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event | DragEvent} to a returned {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData | FormData} object under the name provided.
	 *
	 * The {@link https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault | preventDefault} method of the {@link https://developer.mozilla.org/en-US/docs/Web/API/DragEvent | DragEvent} object is called during this method.
	 *
	 * @param {DragEvent} e    The DragEvent.
	 * @param {string}    name The form field name.
	 *
	 * @return {FormData}.
	 */
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
	/**
	 * This method checks all items attached to the {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event | DragEvent}, returning true is all items are files that match the mime types provided to the constructor, and false otherwise.
	 *
	 * This method also marks the DragEvent as a {@link CheckedDragEvent} if it returns true.
	 *
	 * @param {DragEvent} e The DragEvent.
	 *
	 * @return {boolean} True if all items on the DragEvent are files matching a registered mime type.
	 */
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

/**
 * This method takes an object of dropEffect keys to arrays of {@link DragTransfer} and {@link DragFiles} objects, and returns a function. The function is to be called during a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event | dragover} event to set the `dropEffect` on the passed {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event | DragEvent}. The icon set is determined by the first DragTransfer or DragFiles object whose format is set on the event.
 *
 * @param {Partial<Record<Effect, (DragTransfer | DragFiles)[]>>} effects An object containing all possible effects to be allowed and their corresponding handlers.
 *
 * @return {(e: DragEvent) => boolean} A function which can be used to set effects, which returns true if one is set.
 */
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
};
