import type {Children, Props} from './dom.js';
import {amendNode} from './dom.js';

export class MenuElement extends HTMLElement {
	constructor() {
		super();
	}
}

export class ItemElement extends HTMLElement {
	constructor() {
		super();
	}
}

export class SubMenuElement extends HTMLElement {
	constructor() {
		super();
	}
}

customElements.define("context-menu", MenuElement);
customElements.define("context-item", ItemElement);
customElements.define("context-submenu", SubMenuElement);

export const menu = (props?: Props | Children, children?: Children) => amendNode(new MenuElement(), props, children),
item = (props?: Props | Children, children?: Children) => amendNode(new ItemElement(), props, children),
submenu = (props?: Props | Children, children?: Children) => amendNode(new SubMenuElement(), props, children);
