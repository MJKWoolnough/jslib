import type {Children, Props} from './dom.js';
import {makeElement} from './dom.js';
import {div, slot} from './html.js';

export class ContextMenu extends HTMLElement {
	constructor() {
		super();
		this.setAttribute("slot", "context-menu");
		makeElement(this.attachShadow({"mode": "closed"}), [
			div(slot({"name": "context-item"}))
		]);
	}
}

export class ContextItem extends HTMLElement {
	constructor() {
		super();
		this.setAttribute("slot", "context-item");
	}
}

export class ContextTitle extends HTMLElement {
	constructor() {
		super();
		this.setAttribute("slot", "context-title");
	}
}

customElements.define("context-menu", ContextMenu);
customElements.define("context-item", ContextItem);
customElements.define("context-title", ContextTitle);

export const contextMenu = (props?: Props | Children, children?: Props | Children) => makeElement(new ContextMenu(), props, children),
contextItem = (props?: Props | Children, children?: Props | Children) => makeElement(new ContextItem(), props, children),
contextTitle = (props?: Props | Children, children?: Props | Children) => makeElement(new ContextTitle(), props, children);
