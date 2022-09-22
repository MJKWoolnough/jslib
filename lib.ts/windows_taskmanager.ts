import {amendNode, bindElement, clearNode, event, eventOnce} from './dom.js';
import {div, footer, ns, slot, style} from './html.js';
import {DesktopElement, ShellElement as BaseShellElement, WindowElement, defaultIcon, desktop, setDefaultIcon, setLanguage, windows} from './windows.js';

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
	item: HTMLDivElement | null;
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
					amendNode(data.item.firstChild, {"window-icon": target.getAttribute("window-icon") ?? undefined});
				}
				break;
			case "window-title":
				if (data.item) {
					amendNode(data.item.firstChild, {"window-title": target.getAttribute("window-title") || ""});
				}
				break;
			case "minimised":
				if (!target.hasAttribute("minimised")) {
					amendNode(data.item?.firstChild, {"maximised": false});
					return;
				}
				if (data.item) {
					amendNode(data.item.firstChild, {"maximised": true});
					return;
				}
				for (const i of taskbar.children) {
					if (i.childElementCount === 0 && i instanceof HTMLDivElement) {
						data.item = i;
						break;
					}
				}
				if (!data.item) {
					amendNode(taskbar, data.item = div());
				}
				const taskbarItem = windows({"window-icon": target.getAttribute("window-icon") ?? undefined, "window-title": target.getAttribute("window-title") ?? undefined, "hide-minimise": true, "maximised": true, "exportparts": "close, minimise, maximise, titlebar, title, controls, icon", "onclose": () => target.close(), "onremove": () => taskbarData.delete(taskbarItem)});
				taskbarData.set(taskbarItem, target);
				amendNode(data.item, taskbarItem);
				taskbarObserver.observe(taskbarItem, taskbarObservations);
				amendNode(target, {"onremove": event(() => taskbarItem.remove(), eventOnce)});
				break;
			}
		      })),
		      taskbar = footer();
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

:host > footer {
	display: flex;
	position: absolute;
	grid-gap: 5px;
	flex-wrap: wrap-reverse;
	width: 100%;
	bottom: 0;
	left: 0;
	pointer-events: none;
}

:host > footer > div {
	width: 200px;
	position: relative;
	pointer-events: auto;
}

:host > footer > div > windows-window:not([maximised]) {
	visibility: hidden;
}

:host > footer > div > windows-window {
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

export const shell = bindElement<ShellElement>(ns, "windows-shell-taskmanager");
