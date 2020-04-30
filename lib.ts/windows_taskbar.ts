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
		      windowObserver = new MutationObserver(list => list.forEach(({target, type, attributeName, }) => {
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
	right: 0;
	height: 4em;
	margin: 0;
	overflow: hidden;
	background-color: #eee;
}

:host > ul li {
	border: 1px solid #000;
	float: left;
	padding: 0;
	margin: 0;
}

:host > ul img {
	height: 100%;
}

:host > ul span {
	display: inline-block;
	height: 100%;
	vertical-align: middle;
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
							      console.log(e.clientX, e.clientY);
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
							img({"part": "icon", "src": w.getAttribute("window-icon") || noIcon, "title": w.getAttribute("window-title") || ""}),
							span({"part": "title"}, w.getAttribute("window-title") || "")
						      ])),
						      removeFn = () => {
							windowData.delete(w);
							item.remove();
							w.removeEventListener("remove", removeFn);
						      };
						windowData.set(w, item);
						w.addEventListener("remove", removeFn);
						windowObserver.observe(w, windowObservations);
					}
				});
			}}))
		      ]);
	}
}

customElements.define("windows-shell-taskmanager", ShellElement);

export const shell: DOMBind<ShellElement> = (props?: Props | Children, children?: Props | Children) => createHTML(new ShellElement(), props, children);
