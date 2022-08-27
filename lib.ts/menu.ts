import type {Children, Props} from './dom.js';
import {amendNode} from './dom.js';
import {slot} from './html.js';

export class MenuElement extends HTMLElement {
	constructor() {
		super();
		amendNode(this, {"slot": "menu"});
		amendNode(this.attachShadow({"mode": "closed"}), [
			slot({"name": "menu-item"})
		]);
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
	attributeChangedCallback(name: string, _: string, newValue: string) {
		if (name === "slot" && newValue !== "menu-item") {
			amendNode(this, {"slot": "menu-item"});
		}
	}
	static get observedAttributes() {
		return ["slot"];
	}
}

export class SubMenuElement extends HTMLElement {
	constructor() {
		super();
		amendNode(this, {"slot": "menu-item"});

	}
	attributeChangedCallback(name: string, _: string, newValue: string) {
		if (name === "slot" && newValue !== "menu-item") {
			amendNode(this, {"slot": "menu-item"});
		}
		amendNode(this.attachShadow({"mode": "closed"}), [
			slot({"name": "menu-item"})
		]);
	}
	static get observedAttributes() {
		return ["slot"];
	}
}

customElements.define("context-menu", MenuElement);
customElements.define("context-item", ItemElement);
customElements.define("context-submenu", SubMenuElement);

export const menu = (props?: Props | Children, children?: Children) => amendNode(new MenuElement(), props, children),
item = (props?: Props | Children, children?: Children) => amendNode(new ItemElement(), props, children),
submenu = (props?: Props | Children, children?: Children) => amendNode(new SubMenuElement(), props, children);
