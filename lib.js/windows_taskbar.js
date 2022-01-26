import contextPlace, {item as contextItem} from './context.js';
import {amendNode, event, eventOnce} from './dom.js';
import {div, img, li, slot, span, style, ul} from './html.js';
import {ShellElement as BaseShellElement, DesktopElement, WindowElement, desktop, defaultIcon, setDefaultIcon, setLanguage, windows} from './windows.js';

export {DesktopElement, WindowElement, desktop, defaultIcon, setDefaultIcon, setLanguage, windows};

const windowObservations = {
	"attributeFilter": ["window-icon", "window-title"],
	"attributes": true
      };

export class ShellElement extends BaseShellElement {
	constructor() {
		super();
		const taskbar = ul({"part": "taskbar"}),
		      self = this,
		      windowData = new Map(),
		      windowObserver = new MutationObserver(list => list.forEach(({target, type, attributeName}) => {
			if (type !== "attributes" || !(target instanceof WindowElement)) {
				return;
			}
			const item = windowData.get(target).firstChild;
			switch (attributeName) {
			case "window-icon":
				amendNode(item, {"src": target.getAttribute("window-icon") ?? undefined});
				break;
			case "window-title":
				amendNode(item, target.getAttribute("window-title") ?? "");
				break;
			}
		      }));
		amendNode(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, `:host{display:block;position:relative;overflow:hidden;width:var(--shell-width,100%);height:var(--shell-height,100%)}::slotted(windows-window:last-of-type){--overlay-on:none}:host>ul{list-style:none;padding:0;position:absolute;bottom:0;left:0;width:100%;height:var(--taskbar-size,4em);margin:0;overflow-y:hidden;overflow-x:auto;background-color:#eee;white-space:nowrap;user-select:none;border-style:solid;border-color:#000;border-width:1px 0 0 0}:host([side="top"])>ul{top:0;bottom:unset;border-width:0 0 1px 0}:host([side="left"])>ul{top:0;width:var(--taskbar-size,4em);border-width:0 1px 0 0}:host([side="right"])>ul{top:0;left:unset;right:0;width:var(--taskbar-size,4em);border-width:0 0 0 1px}:host ::slotted(windows-desktop){padding-bottom:var(--taskbar-size,4em)}:host([side="top"]) ::slotted(windows-desktop){padding-top:var(--taskbar-size,4em);padding-bottom:0}:host([side="left"]) ::slotted(windows-desktop){padding-left:var(--taskbar-size,4em);padding-bottom:0}:host([side="right"]) ::slotted(windows-desktop){padding-right:var(--taskbar-size,4em);padding-bottom:0}:host>ul li{border:1px solid #000;display:inline-block;padding:0;margin:0;overflow:hidden}:host([side="left"])>ul,:host([side="right"])>ul{overflow-y:auto;overflow-x:hidden;height:100%;white-space:unset}:host([side="left"])>ul>li,:host([side="right"])>ul>li{display:list-item}:host>ul img{height:var(--taskbar-size,4em)}:host>ul span{display:inline-block;height:var(--taskbar-size,4em);vertical-align:middle}:host([hide="icon"])>ul img,:host([hide="title"])>ul span{display:none}:host([autohide][side="left"])>ul:not(:hover){width:1px;height:100%;border-width:0 5px 0 0}:host([autohide][side="right"])>ul:not(:hover){width:1px;height:100%;border-width:0 0 0 5px}:host([autohide])>ul:not(:hover){height:1px;border-width:5px 0 0 0}:host([autohide][side="top"])>ul:not(:hover){border-width:0 0 5px 0}:host([autohide])>ul:not(:hover)>*{display:none}`),
			slot({"name": "desktop"}),
			taskbar,
			div(slot({"onslotchange": function() {
				this.assignedElements().forEach(w => {
					if (!(w instanceof WindowElement)) {
						return;
					}
					if (!windowData.has(w) && !w.hasAttribute("window-hide")) {
						const item = taskbar.appendChild(li({"onclick": () => {
							if (w.hasAttribute("minimised")) {
								amendNode(w, {"minimised": false});
								w.focus();
							} else if (w.nextElementSibling) {
								w.focus();
							} else {
								amendNode(w, {"minimised": true});
							}
						      }, "oncontextmenu": e => {
							e.preventDefault();
							contextPlace(self, [e.clientX, e.clientY], [
								w.hasAttribute("minimised") ? contextItem("&Restore", () => {
									amendNode(w, {"minimised": false});
									w.focus();
								}) : contextItem("&Minimise", () => amendNode(w, {"minimised": true})),
								contextItem("&Close", () => w.close())
							]);
						      }}, [
							img({"part": "icon", "src": w.getAttribute("window-icon") || undefined, "title": w.getAttribute("window-title") ?? undefined}),
							span({"part": "title"}, w.getAttribute("window-title") || "")
						      ]));
						windowData.set(w, item);
						amendNode(w, {"onremove": event(() => {
							windowData.delete(w);
							item.remove();
						}, eventOnce)});
						windowObserver.observe(w, windowObservations);
					}
				});
			}}))
		]);
	}
}

customElements.define("windows-shell-taskmanager", ShellElement);

export const shell = (props, children) => amendNode(new ShellElement(), props, children);
