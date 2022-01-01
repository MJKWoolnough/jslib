import {clearElement, makeElement} from './dom.js';
import {div, li, slot, style, ul} from './html.js';
import {ShellElement as BaseShellElement, WindowElement, DesktopElement, windows, desktop} from './windows.js';

export {WindowElement, DesktopElement, windows, desktop};

const windowObservations = {
	"attributeFilter": ["window-icon", "window-title", "minimised"],
	"attributes": true
      },
      taskbarObservations = {
	"attributeFilter": ["maximised"],
	"attributes": true
      };

export class ShellElement extends BaseShellElement {
	constructor() {
		super();
		let state = false;
		const windowData = new Map(),
		      taskbarData = new Map(),
		      taskbarObserver = new MutationObserver(list => list.forEach(({target, type, attributeName}) => {
			if (type === "attributes" && attributeName === "maximised" && target instanceof WindowElement && !target.hasAttribute("maximised")) {
				const w = taskbarData.get(target);
				w.removeAttribute("minimised");
				w.focus();
			}
		      })),
		      windowObserver = new MutationObserver(list => list.forEach(({target, type, attributeName}) => {
			if (type !== "attributes" || !(target instanceof WindowElement)) {
				return;
			}
			let data = windowData.get(target);
			switch (attributeName) {
			case "window-icon":
				if (data.item) {
					if (target.hasAttribute("window-icon")) {
						data.item.firstChild.setAttribute("window-icon", target.getAttribute("window-icon"));
					} else {
						data.item.firstChild.removeAttribute("window-icon");
					}
				}
				break;
			case "window-title":
				if (data.item) {
					data.item.firstChild.setAttribute("window-title", target.getAttribute("window-title") || "");
				}
				break;
			case "minimised":
				if (!target.hasAttribute("minimised")) {
					return;
				}
				if (data.item) {
					data.item.firstChild.setAttribute("maximised", "");
					return;
				}
				if (!Array.from(taskbar.children).some(i => {
					if (i.childElementCount === 0 && i instanceof HTMLLIElement) {
						data.item = i;
						return true;
					}
					return false;
				})) {
					data.item = taskbar.appendChild(li());
				}
				const taskbarItem = windows({"window-icon": target.getAttribute("window-icon") ?? undefined, "window-title": target.getAttribute("window-title") ?? undefined, "hide-minimise": "", "maximised": "", "exportparts": "close, minimise, maximise, titlebar, title, controls, icon", "onclose": e => {
					target.close();
					e.preventDefault();
				}, "onremove": () => taskbarData.delete(taskbarItem)});
				taskbarData.set(taskbarItem, target);
				taskbarObserver.observe(data.item.appendChild(taskbarItem), taskbarObservations);
				target.addEventListener("onremove",  () => taskbarItem.remove(), {"once": true});
			break;
			}
		      })),
		      taskbar = ul();
		makeElement(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, ":host{display:block;position:relative;overflow:hidden;width:var(--shell-width,100%);height:var(--shell-height,100%)}::slotted(windows-window:last-of-type){--overlay-on:none}:host>ul{list-style:none;padding:0;display:grid;position:absolute;transform:scaleY(-1);grid-gap:5px;grid-template-columns:repeat(auto-fit,200px);width:100%;bottom:0;left:0}:host>ul>li{transform:scaleY(-1)}:host>ul>li>windows-window:not([maximised]){visibility:hidden}:host>ul>li>windows-window{min-height:auto;position:static;--overlay-on:none}"),
			slot({"name": "desktop"}),
			taskbar,
			div(slot({"onslotchange": function() {
				state = !state;
				this.assignedElements().forEach(w => {
					if (!(w instanceof WindowElement)) {
						return;
					}
					if (windowData.has(w)) {
						windowData.get(w).state = state;
					} else if (!w.hasAttribute("window-hide")) {
						windowObserver.observe(w, windowObservations);
						windowData.set(w, {item: null, state});
					}
				});
				windowData.forEach((data, w) => {
					if (data.state !== state) {
						if (data.item) {
							clearElement(data.item);
						}
						windowData.delete(w);
					}
				});
			}}))
		]);
	}
}

customElements.define("windows-shell-taskmanager", ShellElement);

export const shell = (props, children) => makeElement(new ShellElement(), props, children);
