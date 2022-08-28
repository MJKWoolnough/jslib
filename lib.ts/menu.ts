import type {Children, Props} from './dom.js';
import {amendNode} from './dom.js';
import {slot, style} from './html.js';

const updateItems = Symbol("addItem");

export class MenuElement extends HTMLElement {
	#s: HTMLSlotElement;
	constructor() {
		super();
		amendNode(this, {"slot": "menu"});
		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			style({"type": "text/css"}, `
:host, ::slotted(context-item), ::slotted(context-submenu){
	display: block;
}
			`),
			this.#s = slot()
		]);
	}
	[updateItems]() {
		this.#s.assign(...Array.from(this.children).filter(e => e instanceof ItemElement || e instanceof SubMenuElement));
	}
	attributeChangedCallback(name: string, _: string, newValue: string) {
		if (name === "slot" && newValue !== "menu") {
			amendNode(this, {"slot": "menu"});
		}
	}
	static get observedAttributes() {
		return ["slot"];
	}
}

export class ItemElement extends HTMLElement {
	constructor() {
		super();
		amendNode(this, {"slot": "menu-item"});
	}
	connectedCallback() {
		if (this.parentNode instanceof MenuElement) {
			this.parentNode[updateItems]();
		}
	}
}

export class SubMenuElement extends HTMLElement {
	constructor() {
		super();
		amendNode(this, {"slot": "menu-item"});
		amendNode(this.attachShadow({"mode": "closed"}), slot());
	}
	connectedCallback() {
		if (this.parentNode instanceof MenuElement) {
			this.parentNode[updateItems]();
		}
	}
}

customElements.define("context-menu", MenuElement);
customElements.define("context-item", ItemElement);
customElements.define("context-submenu", SubMenuElement);

export const menu = (props?: Props | Children, children?: Children) => amendNode(new MenuElement(), props, children),
item = (props?: Props | Children, children?: Children) => amendNode(new ItemElement(), props, children),
submenu = (props?: Props | Children, children?: Children) => amendNode(new SubMenuElement(), props, children);
