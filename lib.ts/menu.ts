import CSS from './css.js';
import {amendNode, bindElement, event, eventCapture, eventRemove} from './dom.js';
import {ns, slot} from './html.js';

export type MenuItems = ItemElement | SubMenuElement | MenuItems[];

export type SubMenuItems = ItemElement | MenuElement | SubMenuItems[];

const blur = Symbol("blur"),
      disconnect = Symbol("disconnect"),
      itemElement = Symbol("itemElement"),
      menuElement = Symbol("menuElement"),
      menuStyle = new CSS().add(":host", {
	"outline": "none",
	"display": "inline-flex",
	"flex-flow": "column wrap"
      }).add("::slotted(menu-item),::slotted(menu-submenu)", {
	"display": "block",
	"user-select": "none"
      }),
      submenuStyle = new CSS().add(":host", {
	"position": "relative"
      }).add("::slotted(menu-item)", {
	"display": "block"
      });

export class MenuElement extends HTMLElement {
	#s: HTMLSlotElement;
	#c?: Function;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), this.#s = slot()).adoptedStyleSheets = [menuStyle];
		setTimeout(amendNode, 0, this, {"tabindex": -1, "onblur": () => this[blur](), "onkeydown": (e: KeyboardEvent) => {
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
							(m.#s.assignedNodes()[0] as ItemElement | SubMenuElement | undefined)?.focus();
						}
					});
				}
				break;
			case "Tab":
				e.preventDefault();
			case "ArrowDown":
			case "ArrowUp":
				const an = (this.#s.assignedNodes() as (ItemElement | SubMenuElement)[]).filter(e => !e.hasAttribute("disabled")),
				      pos = an.findIndex(e => e.contains(da));
				an.at(e.key === "ArrowUp" ? pos < 0 ? pos : pos - 1 : (pos + 1) % an.length)?.focus();
				break;
			default:
				const ans = (this.#s.assignedNodes() as (ItemElement | SubMenuElement)[]).filter(i => i.getAttribute("key") === e.key && !i.hasAttribute("disabled"));
				ans.at((ans.findIndex(e => e.contains(da)) + 1) % ans.length)?.focus();
				if (ans.length === 1) {
					ans[0]?.select();
				}
			}
			e.stopPropagation();
		}});
		new MutationObserver(() => this.#s.assign(...Array.from(this.children).filter(e => e instanceof ItemElement || e instanceof SubMenuElement))).observe(this, {"childList": true});
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
	connectedCallback() {
		if (!(this.parentNode instanceof SubMenuElement)) {
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
		setTimeout(amendNode, 0, this, {"tabindex": -1, "onblur": () => (this.parentNode as MenuElement | SubMenuElement | null)?.[blur]?.(), "onclick": () => this.select(), "onmouseover": () => {
			if (document.activeElement !== this) {
				this.focus();
			}
		}});
	}
	focus() {
		if (!this.hasAttribute("disabled") && (!(this.parentNode instanceof SubMenuElement) || !this.parentNode.hasAttribute("disabled"))) {
			super.focus();
		}
	}
	select() {
		if (!this.hasAttribute("disabled")) {
			if (this.parentNode instanceof SubMenuElement) {
				this.parentNode.select();
			} else if (this.dispatchEvent(new CustomEvent("select", {"cancelable": true}))) {
				this.blur();
			}
		}
	}
}

export class SubMenuElement extends HTMLElement {
	#s: HTMLSlotElement;
	#p: HTMLSlotElement;
	#m: MenuElement | null = null;
	#i: ItemElement | null = null;
	#f = false;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			this.#s = slot(),
			this.#p = slot()
		]).adoptedStyleSheets = [submenuStyle];
		new MutationObserver(() => {
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
		}).observe(this, {"childList": true});
	}
	select() {
		if (!this.hasAttribute("disabled")) {
			const m = this.#m;
			if (m) {
				let offsetParent: Element | null = this,
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
			(this.parentNode as MenuElement | SubMenuElement | null)?.[blur]?.();
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

export const menu = bindElement<MenuElement>(ns, "menu-menu"),
item = bindElement<ItemElement>(ns, "menu-item"),
submenu = bindElement<SubMenuElement>(ns, "menu-submenu");
