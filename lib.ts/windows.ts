import {autoFocus, createHTML, DOMBind, Children, Props} from './dom.js';
import {button, div, img, input, slot, span, style} from './html.js';

type Wdata = {
	titleElement: HTMLSpanElement;
	iconElement: HTMLImageElement;
}

const windowData = new WeakMap<WindowElement, Wdata>(),
      snapTo = (shell: ShellElement, w: WindowElement, x3: number, y3: number) => {
	const snap = parseInt(shell.getAttribute("snap") || "0"),
	      {offsetLeft: x1, offsetTop: y1, offsetWidth: width, offsetHeight: height} = w,
	      x2 = x1 + width, y2 = y1 + height,
	      x4 = x3 + width, y4 = y3 + height,
	      mv = [0, 0];
	if (snap > 0) {
		if (x1 >= 0 && x3 < 0 && x3 >= -snap) {
			mv[0] = -x3;
		} else if (x2 <= shell.offsetWidth && x4 > shell.offsetWidth && x4 <= shell.offsetWidth + snap) {
			mv[0] = shell.offsetWidth - x4;
		}
		if (y1 >= 0 && y3 < 0 && y3 >= -snap) {
			mv[1] = -y3;
		} else if (y2 <= shell.offsetHeight && y4 > shell.offsetHeight && y4 <= shell.offsetHeight + snap) {
			mv[1] = shell.offsetHeight - y4;
		}
		(Array.from(shell.childNodes).filter(e => e instanceof WindowElement && e !== w) as WindowElement[]).forEach(e => {
			const x5 = e.offsetLeft, y5 = e.offsetTop,
			      x6 = x5 + e.offsetWidth, y6 = y5 + e.offsetHeight;
			if (y3 <= y6 && y4 >= y5) {
				if (x2 <= x5 && x4 >= x5 && x4 <= x5 + snap) {
					mv[0] = x5 - x4;
				} else if (x1 >= x6 && x3 <= x6 && x3 >= x6 - snap) {
					mv[0] = x6 - x3;
				}
			}
			if (x3 <= x6 && x4 >= x5) {
				if (y2 <= y5 && y4 >= y5 && y4 <= y5 + snap) {
					mv[1] = y5 - y4;
				} else if (y1 >= y6 && y3 <= y6 && y3 >= y6 - snap) {
					mv[1] = y6 - y3;
				}
			}
		});
	}
	return mv;
      },
      resizeWindow = function(this: WindowElement, direction: number, e: MouseEvent) {
	const shell = this.parentNode;
	if (dragging || !(shell instanceof ShellElement) || e.button !== 0) {
		return;
	}
	dragging = true;
	shell.style.setProperty("user-select", "none");
	const originalLeft = this.offsetLeft,
	      originalTop = this.offsetTop,
	      originalWidth = this.offsetWidth,
	      originalHeight = this.offsetHeight,
	      grabX = e.clientX,
	      grabY = e.clientY,
	      mouseMove = (e: MouseEvent) => {
		const dx = e.clientX - grabX,
		      dy = e.clientY - grabY;
		switch (direction) {
			case 0:
			case 1:
			case 2: {
				const height = originalHeight - dy;
				if (height > 100) {
					this.style.setProperty("--window-top", `${originalTop + dy}px`);
					this.style.setProperty("--window-height", `${height}px`);
				}
			}
			break;
			case 4:
			case 5:
			case 6: {
				const height = originalHeight + dy;
				if (height > 100) {
					this.style.setProperty("--window-height", `${height}px`);
				}
			}
		}
		switch (direction) {
			case 2:
			case 3:
			case 4: {
				const width = originalWidth + dx;
				if (width > 100) {
					this.style.setProperty("--window-width", `${width}px`);
				}
			}
			break;
			case 0:
			case 7:
			case 6: {
				const width = originalWidth - dx;
				if (width > 100) {
					this.style.setProperty("--window-left", `${originalLeft + dx}px`);
					this.style.setProperty("--window-width", `${width}px`);
				}
			}
		}
	      },
	      mouseUp = (e: MouseEvent) => {
		if (e.button !== 0) {
			return;
		}
		shell.removeEventListener("mousemove", mouseMove);
		shell.removeEventListener("mouseup", mouseUp);
		shell.style.removeProperty("user-select");
		dragging = false;
		this.dispatchEvent(new CustomEvent("resized"));
	      };
	shell.addEventListener("mousemove", mouseMove);
	shell.addEventListener("mouseup", mouseUp);
      },
      moveWindow = function(this: WindowElement, e: MouseEvent) {
	const shell = this.parentNode;
	if (dragging || !(shell instanceof ShellElement) || e.button !== 0) {
		return;
	}
	dragging = true;
	this.style.setProperty("user-select", "none");
	const grabX = e.clientX - this.offsetLeft,
	      grabY = e.clientY - this.offsetTop,
	      mouseMove = (e: MouseEvent) => {
		const x = e.clientX - grabX,
		      y = e.clientY - grabY,
		      [mx, my] = snapTo(shell, this, x, y);
		this.style.setProperty("--window-left", (x + mx) + "px");
		this.style.setProperty("--window-top", (y + my) + "px");
	      },
	      mouseUp = (e: MouseEvent) => {
		if (e.button !== 0) {
			return;
		}
		shell.removeEventListener("mousemove", mouseMove);
		shell.removeEventListener("mouseup", mouseUp);
		shell.style.removeProperty("user-select");
		dragging = false;
		this.dispatchEvent(new CustomEvent("moved"));
	      };
	shell.addEventListener("mousemove", mouseMove);
	shell.addEventListener("mouseup", mouseUp);
      },
      childWindows = new Map<WindowElement, WindowElement>(),
      childOf = new Map<WindowElement, WindowElement>(),
      alertFn = (parent: WindowElement|ShellElement, title: string, message: string, icon?: string) => new Promise<boolean>((resolve, reject) => {
	const w = windows({
		"window-hide": true,
		"window-icon": icon || noIcon,
		"window-title": title,
		"hide-maximise": "true",
		"onremove": () => resolve(false)
	}, [
		div(message),
		div({"style": "text-align: center"}, autoFocus(button({"onclick": () => {
			resolve(true);
			w.remove();
		}}, "Ok")))
	]);
	parent.addWindow(w) || reject(new Error("invalid target"));
      }),
      confirmFn = (parent: WindowElement|ShellElement, title: string, message: string, icon?: string) => new Promise<boolean>((resolve, reject) => {
	const w = windows({
		"window-hide": true,
		"window-icon": icon || noIcon,
		"window-title": title,
		"hide-maximise": "true",
		"onremove": () => resolve(false)
	}, [
		div(message),
		div({"style": "text-align: center"}, [
			autoFocus(button({"onclick": () => {
				resolve(true);
				w.remove();
			}}, "Ok")),
			button({"onclick": () => w.remove()}, "Cancel")
		])
	]);
	parent.addWindow(w) || reject(new Error("invalid target"));
      }),
      promptFn = (parent: WindowElement|ShellElement, title: string, message: string, defaultValue?: string, icon?: string) => new Promise<string|null>((resolve, reject) => {
	const ok = button({"onclick": () => {
		resolve(data.value);
		w.remove();
	      }}, "Ok"),
	      data = autoFocus(input({"value": defaultValue || "", "onkeydown": (e: KeyboardEvent) => {
		switch (e.key) {
		case "Enter":
			ok.click();
			break;
		case "Escape":
			w.remove();
		}
	      }})),
	      w = windows({
		"window-hide": true,
		"window-icon": icon || noIcon,
		"window-title": title,
		"hide-maximise": "true",
		"onremove": () => resolve(null)
	}, [
		div(message),
		data,
		div({"style": "text-align: center"}, ok)
	]);
	parent.addWindow(w) || reject(new Error("invalid target"));
      });
let focusingWindow: WindowElement | null = null, dragging = false;

export class ShellElement extends HTMLElement {
	constructor() {
		super();
		if (new.target !== ShellElement) {
			return;
		}
		createHTML(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, `
:host {
	display: block;
	position: relative;
	overflow: hidden;
	width: var(--shell-width, 100%);
	height: var(--shell-height, 100%);
}

::slotted(windows-window) {
	--taskmanager-on: none;
}

::slotted(windows-window:last-of-type) {
	--overlay-on: none; /* hack until exportpart is supported */
}
`),
			slot({"name": "desktop"}),
			div(slot())
		]);
	}
	alert(title: string, message: string, icon?: string) {
		return alertFn(this, title, message, icon);
	}
	confirm(title: string, message: string, icon?: string) {
		return confirmFn(this, title, message, icon);
	}
	prompt(title: string, message: string, defaultValue?: string, icon?: string) {
		return promptFn(this, title, message, defaultValue, icon);
	}
	addWindow(w: WindowElement) {
		this.appendChild(w);
		return true;
	}
	realignWindows() {
		const {offsetWidth: tw, offsetHeight: th} = this;
		(Array.from(this.childNodes).filter(e => e instanceof WindowElement) as WindowElement[]).forEach(e => {
			const {offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h} = e;
			if (x + w > tw) {
				e.style.setProperty("--window-left", Math.max(tw - w, 0) + "px");
			} else if (x < 0) {
				e.style.setProperty("--window-left", "0px");
			}
			if (y + h > th) {
				e.style.setProperty("--window-top", Math.max(th - h) + "px");
			} else if (y < 0) {
				e.style.setProperty("--window-top", "0px");
			}
		});
	}
}

export class DesktopElement extends HTMLElement {
	constructor() {
		super()
		this.setAttribute("slot", "desktop");
		createHTML(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, ":host{position:absolute;top:0;left:0;bottom:0;right:0}"),
			slot({"slot": "desktop"})
		]);
	}
}

export class WindowElement extends HTMLElement {
	constructor() {
		super()
		const titleElement = span({"part": "title"}),
		      iconElement = img({"part": "icon", "src": noIcon}),
		      onclick = () => this.focus();
		windowData.set(this, {titleElement, iconElement});
		createHTML(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, `
:host {
	position: absolute;
	display: block;
	background-color: #fff;
	color: #000;
	border: 1px solid #000;
	width: var(--window-width, auto);
	height: var(--window-height, auto);
	min-width: 100px;
	min-height: 100px;
	top: var(--window-top, 0);
	left: var(--window-left, 0);
	list-style: none;
	padding: 0;
	z-index: 0;
}

:host([maximised]) {
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	width: auto;
	height: auto;
}

:host([resizable]) {
	border-width: 0;
}

:host([resizable]) > div:nth-child(2) {
	display: block;
}

:host([minimised]),
:host > div:nth-child(2),
:host([hide-titlebar]) > div:nth-child(3),
:host([hide-close]) > div:nth-child(3) button:nth-of-type(1),
:host([hide-maximise]) > div:nth-child(3) button:nth-of-type(2),
:host([hide-minimise]) > div:nth-child(3) button:nth-of-type(3),
:host([window-hide]) > div:nth-child(3) button:nth-of-type(3) {
	display: none;
}

:host > div:nth-child(3) {
	white-space: nowrap;
	height: calc(1em + 6px);
	background-color: #aaa;
	overflow: hidden;
	user-select: none;
}

:host > div:nth-child(3) > span {
	margin-right: calc(3em + 24px);
}

:host > div:nth-child(3) > img {
	height: 1em;
}

:host > div:nth-child(3) > div {
	position: absolute;
	right: 0;
	top: 0;
}

:host > div:nth-child(3) button {
	padding: 0;
	border-width: 2px;
	float: right;
	background-repeat: no-repeat;
	background-position: center;
	background-color: #eee;
	background-size: 1em 1em;
	width: calc(1em + 8px);
	height: calc(1em + 8px);
}

:host > div:nth-child(3) button:nth-of-type(1) {
	background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M1,1 L9,9 M9,1 L1,9" stroke="black" /%3E%3C/svg%3E');
}

:host > div:nth-child(3) button:nth-of-type(2) {
	background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M9,3 h-8 v-1 h8 v-1 h-8 v8 h8 v-8" stroke="black" fill="none" /%3E%3C/svg%3E');
}

:host([maximised]) > div:nth-child(3) button:nth-of-type(2) {
	background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 15 13" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M1,5 h8 v-1 h-8 v8 h8 v-8 m-3,0 v-3 h8 v8 h-5 m5,-7 h-8" stroke="%23000" fill="none" /%3E%3C/svg%3E');
}

:host > div:nth-child(3) button:nth-of-type(3) {
	display: var(--taskmanager-on, block);
	background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"%3E%3Cline x1="1" y1="9" x2="9" y2="9" stroke="black" /%3E%3C/svg%3E');
}

:host > div:nth-child(4) {
	user-select: contain;
}

:host([resizable]) > div:nth-child(4) {
	overflow: auto;
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	top: calc(1em + 6px);
}

:host > div:nth-child(5) {
	pointer-events: none;
	display: var(--overlay-on, block);
	position: absolute;
	background-color: RGBA(0, 0, 0, 0.1);
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
}

:host([resizeable]) > div:nth-child(5) {
	top: var(calc(--window-resize), -2px);
	left: var(calc(--window-resize), -2px);
	bottom: var(calc(--window-resize), -2px);
	right: var(calc(--window-resize), -2px);
}

:host > div:nth-child(2) > div {
	position: absolute;
	border-color: currentColor;
	border-style: solid;
	border-width: 0;
	z-index: -1;
}

:host > div:nth-child(2) > div:nth-child(1) {
	top: -2px;
	left: -2px;
	width: 10px;
	height: 10px;
	cursor: nwse-resize;
	border-left-width: 3px;
	border-top-width: 3px;
}

:host > div:nth-child(2) > div:nth-child(2) {
	top: -2px;
	left: 8px;
	right: 8px;
	border-top-width: 3px;
	cursor: ns-resize;
}

:host > div:nth-child(2) > div:nth-child(3) {
	top: -2px;
	right: -2px;
	width: 10px;
	height: 10px;
	border-top-width: 3px;
	border-right-width: 3px;
	cursor: nesw-resize;
}

:host > div:nth-child(2) > div:nth-child(4) {
	top: 8px;
	right: -2px;
	bottom: 8px;
	border-right-width: 3px;
	cursor: ew-resize;
}

:host > div:nth-child(2) > div:nth-child(5) {
	bottom: -2px;
	right: -2px;
	width: 10px;
	height: 10px;
	border-right-width: 3px;
	border-bottom-width: 3px;
	cursor: nwse-resize;
}

:host > div:nth-child(2) > div:nth-child(6) {
	bottom: -2px;
	left: 8px;
	right: 8px;
	border-bottom-width: 3px;
	cursor: ns-resize;
}

:host > div:nth-child(2) > div:nth-child(7) {
	bottom: -2px;
	left: -2px;
	width: 10px;
	height: 10px;
	border-left-width: 3px;
	border-bottom-width: 3px;
	cursor: nesw-resize;
}

:host > div:nth-child(2) > div:nth-child(8) {
	top: 8px;
	left: -2px;
	bottom: 8px;
	border-left-width: 3px;
	cursor: ew-resize;
}
`),
			div(Array.from({length: 8}, (_, n) => div({"onmousedown": resizeWindow.bind(this, n)}))),
			div({"part": "titlebar", "onmousedown": moveWindow.bind(this), "ondblclick": (e: Event) => {
				if (!(e.target instanceof HTMLButtonElement) && !this.hasAttribute("hide-maximise")) {
					this.toggleAttribute("maximised");
				}
			      }}, [
				iconElement,
				titleElement,
				div({"part": "controls"}, [
					button({"part": "close", "onclick": () => this.close()}),
					button({"part": "maximise", "onclick": () => this.toggleAttribute("maximised")}),
					button({"part": "minimise", "onclick": () => this.toggleAttribute("minimised")})
				])
			]),
			div(slot()),
			div({onclick})
		]);
		this.addEventListener("mousedown", onclick, {"capture": true});
	}
	connectedCallback() {
		if (focusingWindow === this) {
			focusingWindow = null;
		}
	}
	disconnectedCallback() {
		if (focusingWindow === this) {
			return;
		}
		const p = childOf.get(this),
		      c = childWindows.get(this);
		if (p) {
			childWindows.delete(p);
			childOf.delete(this);
		}
		if (c) {
			c.remove();
			childWindows.delete(this);
		}
		this.dispatchEvent(new CustomEvent("remove", {"cancelable": false}));
	}
	attributeChangedCallback(name: string, _: string, newValue: string) {
		const wd = windowData.get(this)!;
		switch (name) {
		case "window-title":
			wd.titleElement.innerText = newValue;
			break;
		case "window-icon":
			wd.iconElement.setAttribute("src", newValue);
			break;
		}
	}
	static get observedAttributes() {
		return ["window-title", "window-icon"];
	}
	alert(title: string, message: string, icon?: string) {
		return alertFn(this, title, message, icon);
	}
	confirm(title: string, message: string, icon?: string) {
		return confirmFn(this, title, message, icon);
	}
	prompt(title: string, message: string, defaultValue?: string, icon?: string) {
		return promptFn(this, title, message, defaultValue, icon);
	}
	addWindow(w: WindowElement) {
		if (!this.parentNode) {
			return false;
		}
		if (childWindows.has(this)) {
			childWindows.get(this)!.addWindow(w);
			return true;
		}
		childWindows.set(this, w);
		childOf.set(w, this);
		this.parentNode.appendChild(w);
		return true;
	}
	focus() {
		const c = childWindows.get(this);
		if (c) {
			c.focus();
			return;
		}
		if (this.parentNode && this.nextElementSibling) {
			focusingWindow = this;
			this.parentNode.appendChild(this);
		}
		super.focus();
	}
	close() {
		if (childWindows.has(this)) {
			childWindows.get(this)!.focus();
		} else if (this.dispatchEvent(new CustomEvent("close", {"cancelable": true}))) {
			this.remove();
			return true;
		}
		return false;
	}
}

customElements.define("windows-shell", ShellElement);
customElements.define("windows-desktop", DesktopElement);
customElements.define("windows-window", WindowElement);

export const shell: DOMBind<ShellElement> = (props?: Props | Children, children?: Props | Children) => createHTML(new ShellElement(), props, children),
desktop: DOMBind<DesktopElement> = (props?: Props | Children, children?: Props | Children) => createHTML(new DesktopElement(), props, children),
windows: DOMBind<WindowElement> = (props?: Props | Children, children?: Props | Children) => createHTML(new WindowElement(), props, children),
noIcon = 'data:image/svg+xml,%3Csvg viewBox="0 0 14 18" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M9,1 h-8 v16 h12 v-12 Z v4 h4" stroke="black" fill="none" /%3E%3Cpath d="M3,8 h8 m-8,3 h8 m-8,3 h8" stroke="gray" /%3E%3C/svg%3E';
