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
:host, ::slotted(menu-item), ::slotted(menu-submenu) {
	display: block;
	user-select: none;
}
`),
			this.#s = slot()
		]);
		amendNode(this, {"onclick": (e: MouseEvent) => {
			let t = e.target as ParentNode | null;
			while (t && t !== this) {
				if (t instanceof ItemElement || t instanceof SubMenuElement) {
					t.select();
					break;
				}
				t = t.parentNode;
			}
		}});
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
}

export class ItemElement extends HTMLElement {
	connectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
	disconnectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
	select() {
		if (this.parentNode instanceof SubMenuElement) {
			this.parentNode.select();
		} else {
			this.dispatchEvent(new CustomEvent("select"));
		}
	}
}

export class SubMenuElement extends HTMLElement {
	#s: HTMLSlotElement;
	#p: HTMLSlotElement;
	#m: MenuElement | null = null;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			style({"type": "text/css"}, `
::slotted(menu-item) {
	display: block;
}
`),
			this.#s = slot(),
			this.#p = slot()
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
	select() {
		if (this.#m) {
			this.#p.assign(this.#m);
		}
	}
}

customElements.define("menu-menu", MenuElement);
customElements.define("menu-item", ItemElement);
customElements.define("menu-submenu", SubMenuElement);

export const menu = (props?: Props | Children, children?: Children) => amendNode(new MenuElement(), props, children),
item = (props?: Props | Children, children?: Children) => amendNode(new ItemElement(), props, children),
submenu = (props?: Props | Children, children?: Children) => amendNode(new SubMenuElement(), props, children);
