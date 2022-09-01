import type {Children, Props} from './dom.js';
import {amendNode} from './dom.js';
import {slot, style} from './html.js';

const updateItems = Symbol("addItem"),
      blur = Symbol("blur");

interface Updater extends Node {
	[updateItems]?: () => void;
	[blur]?: () => void;
}

export class MenuElement extends HTMLElement {
	#s: HTMLSlotElement;
	#x = 0;
	#y = 0;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			style({"type": "text/css"}, `
:host {
	outline: none;
}
:host(:not([scroll])) {
	display: inline-flex;
	flex-flow: column wrap;
}
:host([scroll]) {
	overflow-y: scroll;
}
::slotted(menu-item), ::slotted(menu-submenu) {
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
		}, "tabindex": -1, "onblur": () => this[blur]()});
	}
	attributeChangedCallback(name: string, _: string, newValue: string) {
		const v = parseInt(newValue);
		if (!isNaN(v)) {
			switch (name) {
			case "x":
				this.#x = v;
				break;
			case "y":
				this.#y = v;
			}
		}
	}
	static get observedAttributes() {
		return ["x", "y"];
	}
	[blur]() {
		setTimeout(() => {
			if (!this.contains(document.activeElement)) {
				(this.parentNode as Updater | null)?.[blur]?.();
				this.remove();
			}
		});
	}
	[updateItems]() {
		this.#s.assign(...Array.from(this.children).filter(e => e instanceof ItemElement || e instanceof SubMenuElement));
	}
	connectedCallback() {
		if (this.parentNode instanceof SubMenuElement) {
			this.parentNode[updateItems]();
		} else {
			const {offsetParent} = this;
			amendNode(this, {"style": {"position": "absolute", "left": undefined, "top": undefined, "width": undefined, "max-width": offsetParent!.clientWidth + "px", "max-height": offsetParent!.clientHeight + "px", "visibility": "hidden"}});

			setTimeout(() => {
				const scroll = this.hasAttribute("scroll"),
				      width = scroll ? this.offsetWidth : this.scrollWidth + this.scrollWidth - this.clientWidth;
				amendNode(this, {"style": {"visibility": undefined, "position": "absolute", "width": this.hasAttribute("scroll") ? undefined : width + "px", "left": Math.max(this.#x + width < offsetParent!.clientWidth ? this.#x : this.#x - width, 0) + "px", "top": Math.max(this.#y + this.offsetHeight < offsetParent!.clientHeight ? this.#y : this.#y - this.offsetHeight, 0) + "px"}});
				this.focus();
			});
		}
	}
	disconnectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
}

export class ItemElement extends HTMLElement {
	constructor() {
		super();
		amendNode(this, {"tabindex": -1, "onblur": () => (this.parentNode as Updater | null)?.[blur]?.()});
	}
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
	focus() {
		for (const c of this.children) {
			if (c instanceof ItemElement) {
				c.focus();
				return;
			}
		}
	}
	[blur]() {
		(this.parentNode as Updater | null)?.[blur]?.();
	}
}

customElements.define("menu-menu", MenuElement);
customElements.define("menu-item", ItemElement);
customElements.define("menu-submenu", SubMenuElement);

export const menu = (props?: Props | Children, children?: Children) => amendNode(new MenuElement(), props, children),
item = (props?: Props | Children, children?: Children) => amendNode(new ItemElement(), props, children),
submenu = (props?: Props | Children, children?: Children) => amendNode(new SubMenuElement(), props, children);
