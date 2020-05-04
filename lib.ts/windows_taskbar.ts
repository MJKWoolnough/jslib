import {DOMBind, Children, Props} from './dom.js';
import {createHTML, div, img, li, slot, span, style, ul} from './html.js';
import {ShellElement as BaseShellElement, WindowElement, DesktopElement, windows, desktop, noIcon} from './windows.js';
import contextPlace, {item as contextItem} from './context.js';

export {WindowElement, DesktopElement, windows, desktop};

const windowObservations = {
	"attributeFilter": ["window-icon", "window-title"],
	"attributes": true
      };

export class ShellElement extends BaseShellElement {
	constructor() {
		super();
		const taskbar = ul({"part": "taskbar"}),
		      self = this,
		      windowData = new Map<WindowElement, HTMLLIElement>(),
		      windowObserver = new MutationObserver(list => list.forEach(({target, type, attributeName}) => {
			if (type !== "attributes" || !(target instanceof WindowElement)) {
				return;
			}
			let item = windowData.get(target)!;
			switch (attributeName) {
			case "window-icon":
				if (target.hasAttribute("window-icon")) {
					(item.firstChild as HTMLImageElement).setAttribute("src", target.getAttribute("window-icon")!);
				} else {
					(item.firstChild as HTMLImageElement).removeAttribute("src");
				}
				break;
			case "window-title":
				(item.lastChild as HTMLSpanElement).innerText = target.getAttribute("window-title") || "";
				break;
			}
		      }));
		createHTML(this.attachShadow({"mode": "closed"}), [
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
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: var(--taskbar-size, 4em);
	margin: 0;
	overflow-y: hidden;
	overflow-x: auto;
	background-color: #eee;
	white-space: nowrap;
	user-select: none;
	border-style: solid;
	border-color: #000;
	border-width: 1px 0 0 0;
}

:host([side="top"]) > ul {
	top: 0;
	bottom: unset;
	border-width: 0 0 1px 0;
}

:host([side="left"]) > ul {
	top: 0;
	width: var(--taskbar-size, 4em);
	border-width: 0 1px 0 0;
}

:host([side="right"]) > ul {
	top: 0;
	left: unset;
	right: 0;
	width: var(--taskbar-size, 4em);
	border-width: 0 0 0 1px;
}

:host ::slotted(windows-desktop) {
	padding-bottom: var(--taskbar-size, 4em);
}

:host([side="top"]) ::slotted(windows-desktop) {
	padding-top: var(--taskbar-size, 4em);
	padding-bottom: 0;
}

:host([side="left"]) ::slotted(windows-desktop) {
	padding-left: var(--taskbar-size, 4em);
	padding-bottom: 0;
}

:host([side="right"]) ::slotted(windows-desktop) {
	padding-right: var(--taskbar-size, 4em);
	padding-bottom: 0;
}

:host > ul li {
	border: 1px solid #000;
	display: inline-block;
	padding: 0;
	margin: 0;
	overflow: hidden;
}

:host([side="left"]) > ul, :host([side="right"]) > ul {
	overflow-y: auto;
	overflow-x: hidden;
	height: 100%;
	white-space: unset;
}

:host([side="left"]) > ul > li, :host([side="right"]) > ul > li {
	display: list-item;
}

:host > ul img {
	height: var(--taskbar-size, 4em);
}

:host > ul span {
	display: inline-block;
	height: var(--taskbar-size, 4em);
	vertical-align: middle;
}

:host([hide="icon"]) > ul img, :host([hide="title"]) > ul span {
	display: none;
}

:host([autohide][side="left"]) > ul:not(:hover) {
	width: 1px;
	height: 100%;
	border-width: 0 5px 0 0;
}

:host([autohide][side="right"]) > ul:not(:hover) {
	width: 1px;
	height: 100%;
	border-width: 0 0 0 5px;
}

:host([autohide]) > ul:not(:hover) {
	height: 1px;
	border-width: 5px 0 0 0;
}

:host([autohide][side="top"]) > ul:not(:hover) {
	border-width: 0 0 5px 0;
}

:host([autohide]) > ul:not(:hover) > * {
	display: none;
}
`),
			slot({"name": "desktop"}),
			taskbar,
			div(slot({"onslotchange": function(this: HTMLSlotElement) {
				this.assignedElements().forEach(w => {
					if (!(w instanceof WindowElement)) {
						return;
					}
					if (!windowData.has(w) && !w.hasAttribute("window-hide")) {
						const item = taskbar.appendChild(li({"onclick": () => {
							if (w.hasAttribute("minimised")) {
								w.removeAttribute("minimised");
								w.focus();
							} else if (w.nextElementSibling) {
								w.focus();
							} else {
								w.setAttribute("minimised", "");
							}
						      }, "oncontextmenu": (e: MouseEvent) => {
							e.preventDefault();
							contextPlace(self, [e.clientX, e.clientY], [
								w.hasAttribute("minimised") ? contextItem("&Restore", () => {
									w.removeAttribute("minimised");
									w.focus();
								}) : contextItem("&Minimise", () => {
									w.setAttribute("minimised", "");
								}),
								contextItem("&Close", () => w.close())
							]);
						      }}, [
							img({"part": "icon", "src": w.getAttribute("window-icon") || noIcon, "title": w.getAttribute("window-title")}),
							span({"part": "title"}, w.getAttribute("window-title") || "")
						      ]));
						windowData.set(w, item);
						w.addEventListener("remove", () => {
							windowData.delete(w);
							item.remove();
						}, {"once": true});
						windowObserver.observe(w, windowObservations);
					}
				});
			}}))
		      ]);
	}
}

customElements.define("windows-shell-taskmanager", ShellElement);

export const shell: DOMBind<ShellElement> = (props?: Props | Children, children?: Props | Children) => createHTML(new ShellElement(), props, children);
