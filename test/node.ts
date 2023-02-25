{
	const ILLEGAL_CONSTRUCTOR = "Illegal constructor.";

	class Node extends EventTarget {
		constructor() {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class DOMTokenList {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class HTMLCollection {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class CSSStyleDeclaration {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class NodeList {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class NamedNodeMap {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class Attr extends Node {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class CharacterData extends Node {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class Text extends CharacterData {
	}

	class Document extends Node {
	}

	class DocumentFragment extends Node {
	}

	class ShadowRoot extends DocumentFragment {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class Element extends Node {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class HTMLElement extends Element {
		constructor () {
			if (!init) { // check registry for valid Element type
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class SVGElement extends Element {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class MathMLElement extends Element {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class DOMStringMap {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class Location {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class Storage {
		#storage = new Map<string, string>();

		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
		get length() {
			return 0;
		}
		key(index: number) {
			Array.from(this.#storage.keys())[index] ?? null;
		}
		getItem(keyName: string) {
			return this.#storage.get(keyName) ?? null
		}
		setItem(keyName: string, keyValue: string) {
			this.#storage.set(keyName, keyValue);
		}
		removeItem(keyName: string) {
			this.#storage.delete(keyName);
		}
		clear() {
			this.#storage.clear();
		}
	}

	class Window extends EventTarget {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class WebSocket extends EventTarget {
	}

	class XMLHttpRequestEventTarget extends EventTarget {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class XMLHttpRequest extends XMLHttpRequestEventTarget {
	}

	class XMLHttpRequestUpload extends XMLHttpRequestEventTarget {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super();
		}
	}

	class CustomEvent extends Event {
	}

	class UIEvent extends Event {
	}

	class MouseEvent extends UIEvent {
	}

	class KeyboardEvent extends UIEvent {
	}

	class StyleSheet {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	class CSSStyleSheet extends StyleSheet {
	}



	class MutationObserver {
	}

	class MutationEvent extends Event {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
			super("MutationEvent");
		}
	}

	class MutationRecord {
		constructor () {
			if (!init) {
				throw new TypeError(ILLEGAL_CONSTRUCTOR);
			}
		}
	}

	let init = true;

	for (const [name, val] of [
		["Node", Node],
		["DOMTokenList", DOMTokenList],
		["HTMLCollection", HTMLCollection],
		["CSSStyleDeclaration", CSSStyleDeclaration],
		["NodeList", NodeList],
		["NamedNodeMap", NamedNodeMap],
		["Attr", Attr],
		["CharacterData", CharacterData],
		["Text", Text],
		["Document", Document],
		["HTMLDocument", Document],
		["DocumentFragment", DocumentFragment],
		["ShadowRoot", ShadowRoot],
		["Element", Element],
		["HTMLElement", HTMLElement],
		["SVGElement", SVGElement],
		["MathMLElement", MathMLElement],
		["DOMStringMap", DOMStringMap],
		["Location", Location],
		["Storage", Storage],
		["Window", Window],
		["WebSocket", WebSocket],
		["XMLHttpRequestEventTarget", XMLHttpRequestEventTarget],
		["XMLHttpRequest", XMLHttpRequest],
		["XMLHttpRequestUpload", XMLHttpRequestUpload],
		["CustomEvent", CustomEvent],
		["UIEvent", UIEvent],
		["MouseEvent", MouseEvent],
		["KeyboardEvent", KeyboardEvent],
		["StyleSheet", StyleSheet],
		["CSSStyleSheet", CSSStyleSheet],
		["MutationObserver", MutationObserver],
		["MutationEvent", MutationEvent],
		["MutationRecord", MutationRecord],
		["document", new Document()],
		["window", new Window()],
	]) {
		Object.assign(globalThis, name, val);
	}

	init = false;
}
