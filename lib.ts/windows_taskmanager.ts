import type {Children, Props} from './dom.js';
import {amendNode, clearNode, event, eventOnce} from './dom.js';
import {div, li, slot, style, ul} from './html.js';
import {ShellElement as BaseShellElement, DesktopElement, WindowElement, desktop, defaultIcon, setDefaultIcon, setLanguage, windows} from './windows.js';

export {DesktopElement, WindowElement, desktop, defaultIcon, setDefaultIcon, setLanguage, windows};

const windowObservations = {
	"attributeFilter": ["window-icon", "window-title", "minimised"],
	"attributes": true
      },
      taskbarObservations = {
	"attributeFilter": ["maximised"],
	"attributes": true
      };

type Sdata = {
	item: HTMLLIElement|null;
	state: boolean;
}

export class ShellElement extends BaseShellElement {
	constructor() {
		super();
		let state = false;
		const windowData = new Map<WindowElement, Sdata>(),
		      taskbarData = new Map<WindowElement, WindowElement>(),
		      taskbarObserver = new MutationObserver(list => list.forEach(({target, type, attributeName}) => {
			if (type === "attributes" && attributeName === "maximised" && target instanceof WindowElement && !target.hasAttribute("maximised")) {
				amendNode(taskbarData.get(target)!, {"minimised": false}).focus();
			}
		      })),
		      windowObserver = new MutationObserver(list => list.forEach(({target, type, attributeName}) => {
			if (type !== "attributes" || !(target instanceof WindowElement)) {
				return;
			}
			const data = windowData.get(target)!;
			switch (attributeName) {
			case "window-icon":
				if (data.item) {
					amendNode(data.item.firstChild!, {"window-icon": target.getAttribute("window-icon") ?? undefined});
				}
				break;
			case "window-title":
				if (data.item) {
					amendNode(data.item.firstChild!, {"window-title": target.getAttribute("window-title") || ""});
				}
				break;
			case "minimised":
				if (!target.hasAttribute("minimised")) {
					return;
				}
				if (data.item) {
					amendNode(data.item.firstChild!, {"maximised": true});
					return;
				}
				for (const i of taskbar.children) {
					if (i.childElementCount === 0 && i instanceof HTMLLIElement) {
						data.item = i;
						break;
					}
				}
				if (!data.item) {
					amendNode(taskbar, data.item = li());
				}
				const taskbarItem = windows({"window-icon": target.getAttribute("window-icon") ?? undefined, "window-title": target.getAttribute("window-title") ?? undefined, "hide-minimise": true, "maximised": true, "exportparts": "close, minimise, maximise, titlebar, title, controls, icon", "onclose": () => target.close(), "onremove": () => taskbarData.delete(taskbarItem)});
				taskbarData.set(taskbarItem, target);
				amendNode(data.item, taskbarItem);
				taskbarObserver.observe(taskbarItem, taskbarObservations);
				amendNode(target, {"onremove": event(() => taskbarItem.remove(), eventOnce)});
				break;
			}
		      })),
		      taskbar = ul();
		amendNode(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, `
:host {
	display: block;
	position: relative;
	overflow: hidden;
	width: var(--shell-width, 100%);
	height: var(--shell-height, 100%);
}

::slotted(windows-window:last-of-type) {
	--overlay-on: none;
}

:host > ul {
	list-style: none;
	padding: 0;
	display: grid;
	position: absolute;
	transform: scaleY(-1);
	grid-gap: 5px;
	grid-template-columns: repeat(auto-fit, 200px);
	width: 100%;
	bottom: 0;
	left: 0;
}

:host > ul > li {
	transform: scaleY(-1);
}

:host > ul > li > windows-window:not([maximised]) {
	visibility: hidden;
}

:host > ul > li > windows-window {
	min-height: auto;
	position: static;
	--overlay-on: none;
}
`),
			slot({"name": "desktop"}),
			taskbar,
			div(slot({"onslotchange": function(this: HTMLSlotElement) {
				state = !state;
				for (const w of this.assignedElements()) {
					if (!(w instanceof WindowElement)) {
						return;
					}
					if (windowData.has(w)) {
						windowData.get(w)!.state = state;
					} else if (!w.hasAttribute("window-hide")) {
						windowObserver.observe(w, windowObservations);
						windowData.set(w, {item: null, state});
					}
				};
				for (const [w, data] of windowData.entries()) {
					if (data.state !== state) {
						if (data.item) {
							clearNode(data.item);
						}
						windowData.delete(w);
					}
				};
			}}))
		]);
	}
}

customElements.define("windows-shell-taskmanager", ShellElement);

export const shell = (props?: Props | Children, children?: Children) => amendNode(new ShellElement(), props, children);
