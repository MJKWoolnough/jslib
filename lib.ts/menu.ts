import type {Children, Props} from './dom.js';
import {amendNode, event, eventCapture, eventRemove} from './dom.js';
import {slot, style} from './html.js';

export type MenuItems = MenuItem | MenuItems[];

export type SubMenuItems = ItemElement | MenuElement | SubMenuItems[];

const updateItems = Symbol("addItem"),
      blur = Symbol("blur"),
      disconnect = Symbol("disconnect"),
      itemElement = Symbol("itemElement"),
      menuElement = Symbol("menuElement");

interface Updater extends Node {
	[updateItems]?: () => void;
	[blur]?: () => void;
}

export class MenuElement extends HTMLElement {
	#s: HTMLSlotElement;
	#c?: Function;
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
			const da = document.activeElement;
			switch (e.key) {
			case "Escape":
				if (!(this.parentNode instanceof SubMenuElement)) {
					(da as HTMLElement | null)?.blur?.();
				}
			case "ArrowLeft":
				if (this.parentNode instanceof SubMenuElement) {
					this.parentNode[itemElement]()?.focus();
				}
				break;
			case "Enter":
				if (da instanceof ItemElement) {
					da.select();
				}
				break;
			case "ArrowRight":
				const s = da?.parentNode;
				if (da instanceof ItemElement && s instanceof SubMenuElement) {
					s.select();
					setTimeout(() => {
						const m = s[menuElement]();
						if (m) {
							(m.#s.assignedNodes()[0] as MenuItem | undefined)?.focus();
						}
					});
				}
				break;
			case "Tab":
				e.preventDefault();
			case "ArrowDown":
			case "ArrowUp":
				const an = this.#s.assignedNodes() as MenuItem[],
				      pos = an.findIndex(e => e.contains(da));
				an.at(e.key === "ArrowUp" ? pos < 0 ? pos : pos - 1 : (pos + 1) % an.length)?.focus();
				break;
			default:
				const ans = (this.#s.assignedNodes() as MenuItem[]).filter(i => i.getAttribute("key") === e.key);
				ans.at((ans.findIndex(e => e.contains(da)) + 1) % ans.length)?.focus();
				if (ans.length === 1) {
					ans[0]?.select();
				}
			}
			e.stopPropagation();
		}});
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
		this.#s.assign(...Array.from(this.children).filter(e => e instanceof MenuItem));
	}
	connectedCallback() {
		if (this.parentNode instanceof SubMenuElement) {
			this.parentNode[updateItems]();
		} else {
			amendNode(window, {"onmousedown": event(this.#c = (e: MouseEvent) => {
				if (!this.contains(e.target as Node)) {
					this.remove();
				}
			}, eventCapture)});
			const {offsetParent} = this,
			      x = parseInt(this.getAttribute("x") ?? "0") || 0,
			      y = parseInt(this.getAttribute("y") ?? "0") || 0;
			amendNode(this, {"style": {"position": "absolute", "left": undefined, "top": undefined, "width": undefined, "max-height": offsetParent!.clientHeight + "px", "visibility": "hidden"}});

			setTimeout(() => {
				const width = Math.max(this.offsetWidth, this.scrollWidth) * 2 - this.clientWidth;
				amendNode(this, {"style": {"visibility": undefined, "position": "absolute", "width": width + "px", "left": Math.max(x + width < offsetParent!.clientWidth ? x : x - width, 0) + "px", "top": Math.max(y + this.offsetHeight < offsetParent!.clientHeight ? y : y - this.offsetHeight, 0) + "px"}});
				this.focus();
			});
		}
	}
	disconnectedCallback() {
		if (this.#c) {
			amendNode(window, {"onmousedown": event(this.#c, eventCapture | eventRemove)});
			this.#c = undefined;
		}
		(this.parentNode as Updater | null)?.[updateItems]?.();
		for (const c of this.children) {
			if (c instanceof SubMenuElement) {
				c[disconnect]();
			}
		}
	}
}

abstract class MenuItem extends HTMLElement {
	connectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
	disconnectedCallback() {
		(this.parentNode as Updater | null)?.[updateItems]?.();
	}
	abstract select(): void;
}

export class ItemElement extends MenuItem {
	constructor() {
		super();
		amendNode(this, {"tabindex": -1, "onblur": () => (this.parentNode as Updater | null)?.[blur]?.(), "onclick": () => this.select(), "onmouseover": () => {
			if (document.activeElement !== this) {
				this.focus();
			}
		}});
	}
	select() {
		if (this.parentNode instanceof SubMenuElement) {
			this.parentNode.select();
		} else if (this.dispatchEvent(new CustomEvent("select", {"cancelable": true}))) {
			this.blur();
		}
	}
}

export class SubMenuElement extends MenuItem {
	#s: HTMLSlotElement;
	#p: HTMLSlotElement;
	#m: MenuElement | null = null;
	#i: ItemElement | null = null;
	#f = false;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			style({"type": "text/css"}, `
:host {
	position: relative;
}
::slotted(menu-item) {
	display: block;
}
`),
			this.#s = slot(),
			this.#p = slot()
		]);
	}
	[updateItems]() {
		this.#i = null;
		this.#m = null;
		for (const c of this.children) {
			if (!this.#i && c instanceof ItemElement) {
				this.#s.assign(this.#i = c);
				if (this.#m) {
					return;
				}
			} else if (!this.#m && c instanceof MenuElement) {
				this.#m = c;
				if (this.#i) {
					return;
				}
			}
		}
		if (!this.#i) {
			this.#s.assign();
		}
		if (!this.#m) {
			this.#p.assign();
		}
	}
	select() {
		const m = this.#m;
		if (m) {
			let offsetParent = this.offsetParent,
			    xShift = 0,
			    yShift = 0;
			while (offsetParent instanceof MenuElement || offsetParent instanceof SubMenuElement) {
				xShift += offsetParent.offsetLeft - offsetParent.clientWidth + offsetParent.offsetWidth;
				yShift += offsetParent.offsetTop - offsetParent.clientHeight + offsetParent.offsetHeight;
				offsetParent = offsetParent.offsetParent;
			}
			amendNode(this, {"open": true});
			this.#p.assign(amendNode(m, {"style": {"position": "absolute", "left": undefined, "top": undefined, "width": undefined, "max-height": offsetParent!.clientHeight + "px", "visibility": "hidden"}}));
			setTimeout(() => {
				const width = Math.max(m.offsetWidth, m.scrollWidth) * 2 - m.clientWidth;
				amendNode(m, {"style": {"visibility": undefined, "position": "absolute", "width": width + "px", "left": Math.max(xShift + width + this.offsetWidth < offsetParent!.clientWidth ? this.offsetWidth : -width, -xShift) + "px", "top": Math.max(yShift + m.offsetHeight < offsetParent!.clientHeight ? 0 : this.offsetHeight - m.offsetHeight, -yShift) + "px"}});
				this.#f = true;
				m.focus();
			});
		}
	}
	[itemElement]() {
		return this.#i;
	}
	[menuElement]() {
		return this.#m;
	}
	focus() {
		this.#i?.focus();
	}
	[blur]() {
		if (this.#f) {
			this.#f = false;
		} else {
			amendNode(this, {"open": false});
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
		amendNode(this, {"open": false});
		this.#p.assign();
	}
}

customElements.define("menu-menu", MenuElement);
customElements.define("menu-item", ItemElement);
customElements.define("menu-submenu", SubMenuElement);

export const menu = (props?: Props | MenuItems, children?: MenuItems) => amendNode(new MenuElement(), props, children),
item = (props?: Props | Children, children?: Children) => amendNode(new ItemElement(), props, children),
submenu = (props?: Props | SubMenuItems, children?: SubMenuItems) => amendNode(new SubMenuElement(), props, children);
