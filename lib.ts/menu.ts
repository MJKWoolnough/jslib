import type {Children, Props} from './dom.js';
import {amendNode} from './dom.js';
import {slot, style} from './html.js';

const updateItems = Symbol("addItem"),
      blur = Symbol("blur"),
      disconnect = Symbol("disconnect");

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
	display: inline-flex;
	flex-flow: column wrap;
}
::slotted(menu-item), ::slotted(menu-submenu) {
	display: block;
	user-select: none;
}
`),
			this.#s = slot()
		]);
		amendNode(this, {"tabindex": -1, "onblur": () => this[blur](), "onkeydown": (e: KeyboardEvent) => {
			switch (e.key) {
			case "Escape":
				if (this.parentNode instanceof SubMenuElement) {
					for (const c of this.parentNode.children) {
						if (c instanceof ItemElement) {
							c.focus();
							break;
						}
					}
				} else {
					(document.activeElement as HTMLElement | null)?.blur?.();
				}
				break;
			case "Enter":
				if (document.activeElement instanceof ItemElement) {
					document.activeElement.select();
				}
				break;
			case "ArrowRight":
				if (document.activeElement instanceof ItemElement && document.activeElement.parentNode instanceof SubMenuElement) {
					const s = document.activeElement.parentNode;
					s.select();
					setTimeout(() => {
						for (const c of s.children) {
							if (c instanceof MenuElement) {
								for (const d of c.children) {
									if (d instanceof ItemElement || d instanceof SubMenuElement) {
										d.focus();
										break;
									}
								}
								break;
							}
						}
					})
				}
				break;
			}
			e.stopPropagation();
		}});
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
				if (this.parentNode instanceof SubMenuElement) {
					this.parentNode[blur]();
				} else {
					this.remove();
				}
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
				const width = Math.max(this.offsetWidth, this.scrollWidth) * 2 - this.clientWidth;
				amendNode(this, {"style": {"visibility": undefined, "position": "absolute", "width": width + "px", "left": Math.max(this.#x + width < offsetParent!.clientWidth ? this.#x : this.#x - width, 0) + "px", "top": Math.max(this.#y + this.offsetHeight < offsetParent!.clientHeight ? this.#y : this.#y - this.offsetHeight, 0) + "px"}});
				this.focus();
			});
		}
	}
	disconnectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
		for (const c of this.children) {
			if (c instanceof SubMenuElement) {
				c[disconnect]();
			}
		}
	}
}

export class ItemElement extends HTMLElement {
	constructor() {
		super();
		amendNode(this, {"tabindex": -1, "onblur": () => (this.parentNode as Updater | null)?.[blur]?.(), "onclick": () => this.select()});
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
		} else if (this.dispatchEvent(new CustomEvent("select", {"cancelable": true}))) {
			this.blur();
		}
	}
}

export class SubMenuElement extends HTMLElement {
	#s: HTMLSlotElement;
	#p: HTMLSlotElement;
	#m: MenuElement | null = null;
	#f = false;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			style({"type": "text/css"}, `
:host {
	position: relative;
}
::slotted(menu-item), ::slotted(menu-menu) {
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
			const m = this.#m;
			let offsetParent = this.offsetParent,
			    xShift = 0,
			    yShift = 0;
			while (offsetParent instanceof MenuElement || offsetParent instanceof SubMenuElement) {
				xShift += offsetParent.offsetLeft;
				yShift += offsetParent.offsetTop;
				offsetParent = offsetParent.offsetParent;
			}
			this.#p.assign(amendNode(m, {"style": {"position": "absolute", "left": undefined, "top": undefined, "width": undefined, "max-width": offsetParent!.clientWidth + "px", "max-height": offsetParent!.clientHeight + "px", "visibility": "hidden"}}));
			setTimeout(() => {
				const width = Math.max(m.offsetWidth, m.scrollWidth) * 2 - m.clientWidth;
				amendNode(m, {"style": {"visibility": undefined, "position": "absolute", "width": width + "px", "left": Math.max(xShift + width + this.offsetWidth < offsetParent!.clientWidth ? this.offsetWidth : -width, -xShift) + "px", "top": Math.max(yShift + m.offsetHeight < offsetParent!.clientHeight ? 0 : this.offsetHeight - m.offsetHeight, -yShift) + "px"}});
				this.#f = true;
				m.focus();
			});
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
		if (this.#f) {
			this.#f = false;
		} else {
			this.#p.assign();
			(this.parentNode as Updater | null)?.[blur]?.();
		}
	}
	[disconnect]() {
		for (const c of this.#m?.children ?? []) {
			if (c instanceof SubMenuElement) {
				c[disconnect]();
			}
		}
		this.#p.assign();
	}
}

customElements.define("menu-menu", MenuElement);
customElements.define("menu-item", ItemElement);
customElements.define("menu-submenu", SubMenuElement);

export const menu = (props?: Props | Children, children?: Children) => amendNode(new MenuElement(), props, children),
item = (props?: Props | Children, children?: Children) => amendNode(new ItemElement(), props, children),
submenu = (props?: Props | Children, children?: Children) => amendNode(new SubMenuElement(), props, children);
