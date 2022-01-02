import type {Children, Props} from './dom.js';
import {makeElement} from './dom.js';

export class ContextMenu extends HTMLElement {
}

export class ContextItem extends HTMLElement {
}

export class ContextTitle extends HTMLElement {
}

customElements.define("context-menu", ContextMenu);
customElements.define("context-item", ContextItem);
customElements.define("context-title", ContextTitle);

export const contextMenu = (props?: Props | Children, children?: Props | Children) => makeElement(new ContextMenu(), props, children),
contextItem = (props?: Props | Children, children?: Props | Children) => makeElement(new ContextItem(), props, children),
contextTitle = (props?: Props | Children, children?: Props | Children) => makeElement(new ContextTitle(), props, children);
