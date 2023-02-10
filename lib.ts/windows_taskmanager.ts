import CSS from './css.js';
import {amendNode, bindElement, clearNode, event, eventOnce} from './dom.js';
import {div, footer, ns, slot} from './html.js';
import {DesktopElement, ShellElement as BaseShellElement, WindowElement, defaultIcon, desktop, setDefaultIcon, setLanguage, windows} from './windows.js';

/**
 * The windows_taskmanager module provides a replacement for the {@link module:windows} module {@link windows:ShellElement} that allows `Windows` to be minimised within the shell, appearing as just the title-bar at the bottom of the shell. This module directly re-exports the {@link windows:DesktopElement}, {@link windows:WindowElement}, {@link windows:desktop}, {@link windows:defaultIcon}, {@link windows:setDefaultIcon}, and {@link windows:windows} exports from the {@link module:windows} module.
 *
 * This module directly imports the {@link module:css}, {@link module:dom},{@link module:html}, and {@link module:windows} modules.
 *
 * @module windows_taskbar
 * @requires module:css
 * @requires module:dom
 * @requires module:html
 * @requires module:windows
 */
/** */

export {DesktopElement, WindowElement, desktop, defaultIcon, setDefaultIcon, setLanguage, windows};

const windowObservations = {
	"attributeFilter": ["window-icon", "window-title", "minimised"],
	"attributes": true
      },
      taskbarObservations = {
	"attributeFilter": ["maximised"],
	"attributes": true
      },
      shellStyle = [new CSS().add({
	":host": {
		"display": "block",
		"position": "relative",
		"overflow": "hidden",
		"width": "var(--shell-width, 100%)",
		"height": "var(--shell-height, 100%)",
		">footer": {
			"display": "flex",
			"position": "absolute",
			"grid-gap": "5px",
			"flex-wrap": "wrap-reverse",
			"width": "100%",
			"bottom": 0,
			"left": 0,
			"pointer-events": "none",
			">div": {
				"width": "200px",
				"position": "relative",
				">windows-window": {
					"min-height": "auto",
					"position": "static",
					"pointer-events": "auto",
					"--overlay-on": "none",
					":not([maximised])": {
						"pointer-events": "none",
						"visibility": "hidden"
					}
				}
			}

		}
	},
	"::slotted(windows-window:last-of-type)": {
	      "--overlay-on": "none"
	}
      })];

type Sdata = {
	item: HTMLDivElement | null;
	state: boolean;
}

/**
 * A drop-in replacement for the {@link module:windows} module {@link windows:ShellElement}. Registered with customElements as `windows-shell-taskmanager`.
 *
 * NB: Any {@link windows:WindowElement/addControlButton | custom control buttons} will not be displayed on the title-bar while minimised.
 */
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
		]).adoptedStyleSheets = shellStyle;
	}
}

customElements.define("windows-shell-taskmanager", ShellElement);

export const
/**
 * A {@link dom:DOMBind} that creates a ShellElement.
 */
shell = bindElement<ShellElement>(ns, "windows-shell-taskmanager");
