import CSS from './css.js';
import {amendNode, bindElement, event, eventCapture, eventRemove} from './dom.js';
import {ns, slot} from './html.js';

/**
 * The menu module adds custom elements to create context-menus.
 *
 * This module directly imports the {@link css}, {@link dom}, and {@link html} modules.
 *
 * @module menu
 */
/** */

/**
 * Type of children applicable to a {@link MenuElement}. Allows {@link ItemElement}, {@link SubMenuElement}, and recursive arrays of both.
 *
 * @typedef {ItemElement | SubMenuElement | MenuItems[]} MenuItems
 */

/**
 * Type of children applicable to a {@link SubMenuElement}. Allows {@link ItemElement}, {@link MenuElement}, and recursive arrays of both.
 *
 * @typedef {ItemElement | MenuElement | SubMenuItems[]} SubMenuItems
 */

const blur = Symbol("blur"),
      disconnect = Symbol("disconnect"),
      itemElement = Symbol("itemElement"),
      menuElement = Symbol("menuElement"),
      menuStyle = [new CSS().add({
	":host": {
		"outline": "none",
		"display": "inline-flex",
		"flex-flow": "column wrap"
	},
	"::slotted(menu-item),::slotted(menu-submenu)": {
		"display": "block",
		"user-select": "none"
	}
      })],
      submenuStyle = [new CSS().add({
	":host": {
		"position": "relative"
	},
	"::slotted(menu-item)": {
		"display": "block"
	}
      })];

/**
 * The MenuElement class represents a context-menu that is displayed as a hovering list on the page. It can contain any number of {@link ItemElement}s and {@link SubMenuElement}s, which will be the elements of the list.
 *
 * When the MenuElement is attached to the DOM (non-{@link SubMenuElement}) is will use any `x` and `y` attributes on the element to determine the location of the menu on screen. It will attempt to place, within the {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent | offsetParent}, the top-left corner of the menu at the `x` and `y` coordinates specified, but will try the right corners if there is not enough space to the left and the bottom corners if there is not enough space below. If there is not enough space for the menu, the fallback coordinates for both attributes is `0, 0`.
 */
export class MenuElement extends HTMLElement {
	#s;
	#c;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), this.#s = slot()).adoptedStyleSheets = menuStyle;
		setTimeout(amendNode, 0, this, {"tabindex": -1, "onblur": () => this[blur](), "onkeydown": e => {
			const da = document.activeElement;
			switch (e.key) {
			case "Escape":
				if (!(this.parentNode instanceof SubMenuElement)) {
					da?.blur?.();
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
							m.#s.assignedNodes()[0]?.focus();
						}
					});
				}
				break;
			case "Tab":
				e.preventDefault();
			case "ArrowDown":
			case "ArrowUp":
				const an = this.#s.assignedNodes().filter(e => !e.hasAttribute("disabled")),
				      pos = an.findIndex(e => e.contains(da));
				an.at(e.key === "ArrowUp" ? pos < 0 ? pos : pos - 1 : (pos + 1) % an.length)?.focus();
				break;
			default:
				const ans = this.#s.assignedNodes().filter(i => i.getAttribute("key") === e.key && !i.hasAttribute("disabled"));
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
			amendNode(window, {"onmousedown": event(this.#c = e => {
				if (!this.contains(e.target)) {
					this.remove();
				}
			}, eventCapture)});
			const {offsetParent} = this,
			      x = parseInt(this.getAttribute("x") ?? "0") || 0,
			      y = parseInt(this.getAttribute("y") ?? "0") || 0;
			amendNode(this, {"style": {"position": "absolute", "left": undefined, "top": undefined, "width": undefined, "max-height": offsetParent.clientHeight + "px", "visibility": "hidden"}});
			setTimeout(() => {
				const width = Math.max(this.offsetWidth, this.scrollWidth) * 2 - this.clientWidth;
				amendNode(this, {"style": {"visibility": undefined, "position": "absolute", "width": width + "px", "left": Math.max(x + width < offsetParent.clientWidth ? x : x - width, 0) + "px", "top": Math.max(y + this.offsetHeight < offsetParent.clientHeight ? y : y - this.offsetHeight, 0) + "px"}});
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

/**
 * The ItemElement class represents items within a menu. It can be used either directly in a {@link MenuElement}, or in a {@link SubMenuElement} as its representative element. It can contain any structure, which will be what appears in the menu.
 *
 * The action of the element is defined with a custom `select` event, which is called when the element is selected. Unless the `select` event cancels the event ({@link https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault | preventDefault}) the menu will close after the event is executed.
 *
 * When used directly in a {@link MenuElement}, the `key` attribute sets a possible quick access key, values of which should be one of the {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values | Keyboard event key values}.
 *
 * When used directly in a {@link MenuElement}, the `disable` attribute makes the item unselectable and unfocusable.
 */
export class ItemElement extends HTMLElement {
	constructor() {
		super();
		setTimeout(amendNode, 0, this, {"tabindex": -1, "onblur": () => this.parentNode?.[blur]?.(), "onclick": () => this.select(), "onmouseover": () => {
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

/**
 * The SubMenuElement class defines an element which is a MenuItem. It It should contain a single {@link ItemElement} and a single {@link MenuElement}.
 *
 * The ItemElement will be displayed in the parent {@link MenuElement} and the child MenuElement will be the menu that is displayed when this element is selected. The placement works similarly to that of {@link MenuElement}, in that it will attempt to put the top-left corner of the new menu at the top-right of the SubMenuElement selected, moving up as necessary, and will move to the left of the SubMenuElement is there is not enough space to the right.
 *
 * The `key` attribute sets a possible quick access key, values of which should be one of the {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values | Keyboard event key values}.
 *
 * The `disable` attribute makes the item unselectable and unfocusable.
 */
export class SubMenuElement extends HTMLElement {
	#s;
	#p;
	#m = null;
	#i = null;
	#f = false;
	constructor() {
		super();
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			this.#s = slot(),
			this.#p = slot()
		]).adoptedStyleSheets = submenuStyle;
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
				let offsetParent = this,
				    xShift = 0,
				    yShift = 0;
				while (offsetParent instanceof MenuElement || offsetParent instanceof SubMenuElement) {
					xShift += offsetParent.offsetLeft - offsetParent.clientWidth + offsetParent.offsetWidth;
					yShift += offsetParent.offsetTop - offsetParent.clientHeight + offsetParent.offsetHeight;
					offsetParent = offsetParent.offsetParent;
				}
				amendNode(this, {"open": true});
				this.#p.assign(amendNode(m, {"style": {"position": "absolute", "left": undefined, "top": undefined, "width": undefined, "max-height": offsetParent.clientHeight + "px", "visibility": "hidden"}}));
				setTimeout(() => {
					const width = Math.max(m.offsetWidth, m.scrollWidth) * 2 - m.clientWidth;
					amendNode(m, {"style": {"visibility": undefined, "position": "absolute", "width": width + "px", "left": Math.max(xShift + width + this.offsetWidth < offsetParent.clientWidth ? this.offsetWidth : -width, -xShift) + "px", "top": Math.max(yShift + m.offsetHeight < offsetParent.clientHeight ? 0 : this.offsetHeight - m.offsetHeight, -yShift) + "px"}});
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
			this.parentNode?.[blur]?.();
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

export const
/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link MenuElement}.
 */
menu = bindElement<MenuElement>(ns, "menu-menu"),
/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link ItemElement}.
 */
item = bindElement<ItemElement>(ns, "menu-item"),
/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link SubMenuElement}.
 */
submenu = bindElement<SubMenuElement>(ns, "menu-submenu");
