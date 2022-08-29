import type {Children, Props} from './dom.js';
import {amendNode} from './dom.js';
import {slot, style} from './html.js';

const updateItems = Symbol("addItem");

interface Updater extends Node {
	[updateItems]?: () => void;
}

export class MenuElement extends HTMLElement {
	#s: HTMLSlotElement;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			style({"type": "text/css"}, `
:host, ::slotted(context-item), ::slotted(context-submenu) {
	display: block;
	user-select: none;
}
`),
			this.#s = slot()
		]);
	}
	[updateItems]() {
		this.#s.assign(...Array.from(this.children).filter(e => e instanceof ItemElement || e instanceof SubMenuElement));
	}
	connectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
	disconnectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
	static get observedAttributes() {
		return ["slot"];
	}
}

export class ItemElement extends HTMLElement {
	constructor() {
		super();
	}
	connectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
	disconnectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
}

export class SubMenuElement extends HTMLElement {
	#s: HTMLSlotElement;
	#m: MenuElement | null = null;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			style({"type": "text/css"}, `
::slotted(context-item) {
	display: block;
}
`),
			this.#s = slot()
		]);
	}
	[updateItems]() {
		let set = false;
		this.#m = null;
		for (const c of this.children) {
			if (c instanceof ItemElement && !set) {
				this.#s.assign(c);
				if (this.#m) {
					return;
				}
				set = true;
			} else if (c instanceof MenuElement && !this.#m) {
				this.#m = c;
				if (set) {
					return;
				}
			}
		}
	}
	connectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
	disconnectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
}

customElements.define("context-menu", MenuElement);
customElements.define("context-item", ItemElement);
customElements.define("context-submenu", SubMenuElement);

export const menu = (props?: Props | Children, children?: Children) => amendNode(new MenuElement(), props, children),
item = (props?: Props | Children, children?: Children) => amendNode(new ItemElement(), props, children),
submenu = (props?: Props | Children, children?: Children) => amendNode(new SubMenuElement(), props, children);
