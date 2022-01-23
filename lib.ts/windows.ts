import type {Children, Props} from './dom.js';
import {amendNode, autoFocus, event, eventCapture, walkNode} from './dom.js';
import {button, div, img, input, slot, span, style} from './html.js';
import {ns as svgNS} from './svg.js';

const resizeWindow = (w: WindowElement, direction: number, e: MouseEvent) => {
	const shell = w.parentNode;
	if (dragging || !(shell instanceof ShellElement) || e.button !== 0) {
		return;
	}
	dragging = true;
	amendNode(shell, {"style": {"user-select": "none"}});
	const originalLeft = w.offsetLeft,
	      originalTop = w.offsetTop,
	      originalWidth = w.offsetWidth,
	      originalHeight = w.offsetHeight,
	      grabX = e.clientX,
	      grabY = e.clientY,
	      ac = new AbortController(),
	      {signal} = ac;
	amendNode(shell, {"onmousemove": event((e: MouseEvent) => {
		const dx = e.clientX - grabX,
		      dy = e.clientY - grabY;
		switch (direction) {
			case 0:
			case 1:
			case 2: {
				const height = originalHeight - dy;
				if (height > (parseInt(w.style.getPropertyValue("min-height") || "") || 100)) {
					amendNode(w, {"style": {"--window-top": `${originalTop + dy}px`, "--window-height": `${height}px`}});
				}
			}
			break;
			case 4:
			case 5:
			case 6: {
				const height = originalHeight + dy;
				if (height > (parseInt(w.style.getPropertyValue("min-height") || "") || 100)) {
					amendNode(w, {"style": {"--window-height": `${height}px`}});
				}
			}
		}
		switch (direction) {
			case 2:
			case 3:
			case 4: {
				const width = originalWidth + dx;
				if (width > (parseInt(w.style.getPropertyValue("min-width") || "") || 100)) {
					amendNode(w, {"style": {"--window-width": `${width}px`}});
				}
			}
			break;
			case 0:
			case 7:
			case 6: {
				const width = originalWidth - dx;
				if (width > (parseInt(w.style.getPropertyValue("min-width") || "") || 100)) {
					amendNode(w, {"style": {"--window-left": `${originalLeft + dx}px`, "--window-width": `${width}px`}});
				}
			}
		}
	}, 0, signal), "onmouseup": event((e: MouseEvent) => {
		if (e.button !== 0) {
			return;
		}
		amendNode(shell, {"style": {"user-select": undefined}});
		ac.abort();
		dragging = false;
		w.dispatchEvent(new CustomEvent("resized"));
	}, 0, signal)});
      },
      moveWindow = (w: WindowElement, e: MouseEvent) => {
	const shell = w.parentNode;
	if (dragging || !(shell instanceof ShellElement) || e.button !== 0) {
		return;
	}
	dragging = true;
	amendNode(shell, {"style": {"user-select": "none"}});
	const grabX = e.clientX - w.offsetLeft,
	      grabY = e.clientY - w.offsetTop,
	      ac = new AbortController(),
	      {signal} = ac;
	amendNode(shell, {"onmousemove": event((e: MouseEvent) => {
		const snap = parseInt(shell.getAttribute("snap") || "0"),
		      {offsetLeft: x1, offsetTop: y1, offsetWidth: width, offsetHeight: height} = w,
		      x2 = x1 + width,
		      y2 = y1 + height,
		      x3 = e.clientX - grabX,
		      y3 = e.clientY - grabY,
		      x4 = x3 + width,
		      y4 = y3 + height;
		let mx = 0,
		    my = 0;
		if (snap > 0) {
			if (x1 >= 0 && x3 < 0 && x3 >= -snap) {
				mx = -x3;
			} else if (x2 <= shell.offsetWidth && x4 > shell.offsetWidth && x4 <= shell.offsetWidth + snap) {
				mx = shell.offsetWidth - x4;
			}
			if (y1 >= 0 && y3 < 0 && y3 >= -snap) {
				my = -y3;
			} else if (y2 <= shell.offsetHeight && y4 > shell.offsetHeight && y4 <= shell.offsetHeight + snap) {
				my = shell.offsetHeight - y4;
			}
			for (const e of shell.childNodes) {
				if (e instanceof WindowElement && e !== w) {
					const x5 = e.offsetLeft,
					      y5 = e.offsetTop,
					      x6 = x5 + e.offsetWidth,
					      y6 = y5 + e.offsetHeight;
					if (y3 <= y6 && y4 >= y5) {
						if (x2 <= x5 && x4 >= x5 && x4 <= x5 + snap) {
							mx = x5 - x4;
						} else if (x1 >= x6 && x3 <= x6 && x3 >= x6 - snap) {
							mx = x6 - x3;
						}
					}
					if (x3 <= x6 && x4 >= x5) {
						if (y2 <= y5 && y4 >= y5 && y4 <= y5 + snap) {
							my = y5 - y4;
						} else if (y1 >= y6 && y3 <= y6 && y3 >= y6 - snap) {
							my = y6 - y3;
						}
					}
				}
			}
		}
		amendNode(w, {"style": {"--window-left": (x3 + mx) + "px", "--window-top": (y3 + my) + "px"}});
	}, 0, signal), "onmouseup": event((e: MouseEvent) => {
		if (e.button !== 0) {
			return;
		}
		amendNode(shell, {"style": {"user-select": undefined}});
		ac.abort();
		dragging = false;
		w.dispatchEvent(new CustomEvent("moved"));
	}, 0, signal)});
      };

let focusingWindow: WindowElement | null = null, dragging = false;

abstract class BaseElement extends HTMLElement {
	alert(title: string, message: string, icon?: string) {
		return new Promise<boolean>((resolve, reject) => {
			const w = windows({
				"window-hide": true,
				"window-icon": icon,
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
			this.addWindow(w) || reject(new Error("invalid target"));
		});
	}
	confirm(title: string, message: string, icon?: string) {
		return new Promise<boolean>((resolve, reject) => {
			const w = windows({
				"window-hide": true,
				"window-icon": icon,
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
			this.addWindow(w) || reject(new Error("invalid target"));
		});
	}
	prompt(title: string, message: string, defaultValue?: string, icon?: string) {
		return new Promise<string|null>((resolve, reject) => {
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
				"window-icon": icon,
				"window-title": title,
				"hide-maximise": "true",
				"onremove": () => resolve(null)
			}, [
				div(message),
				data,
				div({"style": "text-align: center"}, ok)
			]);
			this.addWindow(w) || reject(new Error("invalid target"));
		});
	}
	abstract addWindow(w: WindowElement): boolean;
}

export class ShellElement extends BaseElement {
	constructor() {
		super();
		if (new.target !== ShellElement) {
			return;
		}
		amendNode(this.attachShadow({"mode": "closed"}), [
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
	addWindow(w: WindowElement) {
		amendNode(this, w);
		return true;
	}
	realignWindows() {
		const {offsetWidth: tw, offsetHeight: th} = this;
		for (const e of this.childNodes) {
			if (e instanceof WindowElement) {
				const {offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h} = e;
				if (x + w > tw) {
					amendNode(e, {"style": {"--window-left": Math.max(tw - w, 0) + "px"}});
				} else if (x < 0) {
					amendNode(e, {"style": {"--window-left": "0px"}});
				}
				if (y + h > th) {
					amendNode(e, {"style": {"--window-top": Math.max(th - h) + "px"}});
				} else if (y < 0) {
					amendNode(e, {"style": {"--window-top": "0px"}});
				}
			}
		};
	}
}

export class DesktopElement extends HTMLElement {
	constructor() {
		super()
		amendNode(this, {"slot": "desktop"});
		amendNode(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, ":host{position:absolute;top:0;left:0;bottom:0;right:0}"),
			slot({"slot": "desktop"})
		]);
	}
}

export class WindowElement extends BaseElement {
	#title: HTMLSpanElement;
	#icon: HTMLImageElement;
	#extra: HTMLSpanElement;
	#slot: HTMLDivElement;
	#child: WindowElement | null = null;
	#parent: WindowElement | null = null;
	constructor() {
		super();
		const onclick = () => this.focus();
		amendNode(this.attachShadow({"mode": "closed"}), [
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
:host([hide-close]) > div:nth-child(3) > div > button:nth-of-type(1),
:host([hide-maximise]) > div:nth-child(3) > div > button:nth-of-type(2),
:host([hide-minimise]) > div:nth-child(3) > div > button:nth-of-type(3),
:host([window-hide]) > div:nth-child(3) > div > button:nth-of-type(3) {
	display: none;
}

:host > div:nth-child(3) {
	white-space: nowrap;
	height: calc(1em + 6px);
	background-color: #aaa;
	overflow: hidden;
	user-select: none;
	display: flex;
	align-items: center;
}

:host > div:nth-child(3) > span {
	margin-right: calc(3em + 24px);
}

:host > div:nth-child(3) > img {
	height: 1em;
	pointer-events: none;
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

:host > div:nth-child(3) > div > button:nth-of-type(1) {
	background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 10 10" xmlns="${svgNS}"%3E%3Cpath d="M1,1 L9,9 M9,1 L1,9" stroke="black" /%3E%3C/svg%3E');
}

:host > div:nth-child(3) > div> button:nth-of-type(2) {
	background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 10 10" xmlns="${svgNS}"%3E%3Cpath d="M9,3 h-8 v-1 h8 v-1 h-8 v8 h8 v-8" stroke="black" fill="none" /%3E%3C/svg%3E');
}

:host([maximised]) > div:nth-child(3) > div > button:nth-of-type(2) {
	background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 15 13" xmlns="${svgNS}"%3E%3Cpath d="M1,5 h8 v-1 h-8 v8 h8 v-8 m-3,0 v-3 h8 v8 h-5 m5,-7 h-8" stroke="%23000" fill="none" /%3E%3C/svg%3E');
}

:host > div:nth-child(3) > div> button:nth-of-type(3) {
	display: var(--taskmanager-on, block);
	background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 10 10" xmlns="${svgNS}"%3E%3Cline x1="1" y1="9" x2="9" y2="9" stroke="black" /%3E%3C/svg%3E');
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

:host > div:nth-child(4):not(.hasChild) + div:nth-child(5) {
	pointer-events: none;
}

:host > div:nth-child(5) {
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
			div(Array.from({length: 8}, (_, n) => div({"onmousedown": (e: MouseEvent) => resizeWindow(this, n, e)}))),
			div({"part": "titlebar", "onmousedown": (e: MouseEvent) => moveWindow(this, e), "ondblclick": (e: Event) => {
				if (!(e.target instanceof HTMLButtonElement) && !this.hasAttribute("hide-maximise")) {
					this.toggleAttribute("maximised");
				}
			}}, [
				this.#icon = img({"part": "icon", "src": defaultIcon}),
				this.#title = span({"part": "title"}),
				div({"part": "controls"}, [
					button({"part": "close", "onclick": () => this.close()}),
					button({"part": "maximise", "onclick": () => this.toggleAttribute("maximised")}),
					button({"part": "minimise", "onclick": () => this.toggleAttribute("minimised")}),
					this.#extra = span()
				])
			]),
			this.#slot = div(slot()),
			div({onclick})
		]);
		amendNode(this, {"onmousedown": event(onclick, eventCapture)});
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
		const p = this.#parent,
		      c = this.#child;
		if (p) {
			p.#slot.classList.toggle("hasChild", false);
			p.#child = null;
			this.#parent = null;
		}
		if (c) {
			c.remove();
			this.#child = null;
		}
		this.dispatchEvent(new CustomEvent("remove", {"cancelable": false}));
	}
	attributeChangedCallback(name: string, _: string, newValue: string) {
		switch (name) {
		case "window-title":
			this.#title.textContent = newValue;
			break;
		case "window-icon":
			amendNode(this.#icon, {"src": newValue ?? defaultIcon});
			break;
		}
	}
	static get observedAttributes() {
		return ["window-title", "window-icon"];
	}
	addWindow(w: WindowElement) {
		if (!this.parentNode) {
			return false;
		}
		if (this.#child) {
			this.#child.addWindow(w);
			return true;
		}
		this.#child = w;
		w.#parent = this;
		this.#slot.classList.toggle("hasChild", true);
		amendNode(this.parentNode, w);
		return true;
	}
	addControlButton(icon: string, onclick: (this: WindowElement) => void, title?: string) {
		const b = this.#extra.appendChild(button({"style": {"background-image": `url(${JSON.stringify(icon)})`}, "onclick": () => onclick.call(this), title}));
		return () => b.remove();
	}
	focus() {
		const c = this.#child;
		if (c) {
			c.focus();
			return;
		}
		if (this.parentNode && this.nextElementSibling) {
			focusingWindow = this;
			const s = this.#slot,
			      {scrollTop, scrollLeft} = s,
			      scrolls: [Element, number, number][] = scrollTop || scrollLeft ? [[s, scrollTop, scrollLeft]] : [];
			for (const elm of walkNode(this, true)) {
				if (elm instanceof Element) {
					const {scrollTop, scrollLeft} = elm;
					if (scrollTop || scrollLeft) {
						scrolls.push([elm, scrollTop, scrollLeft]);
					}
				}
			}
			amendNode(this.parentNode, this);
			for (const [elm, scrollTop, scrollLeft] of scrolls) {
				elm.scrollTop = scrollTop;
				elm.scrollLeft = scrollLeft;
			}
		}
		super.focus();
	}
	close() {
		if (this.#child) {
			this.#child.focus();
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

export const shell = (props?: Props | Children, children?: Children) => amendNode(new ShellElement(), props, children),
desktop = (props?: Props | Children, children?: Children) => amendNode(new DesktopElement(), props, children),
windows = (props?: Props | Children, children?: Children) => amendNode(new WindowElement(), props, children),
setDefaultIcon = (icon: string) => defaultIcon = icon;

export let defaultIcon = `data:image/svg+xml,%3Csvg viewBox="0 0 14 18" xmlns="${svgNS}"%3E%3Cpath d="M9,1 h-8 v16 h12 v-12 Z v4 h4" stroke="black" fill="none" /%3E%3Cpath d="M3,8 h8 m-8,3 h8 m-8,3 h8" stroke="gray" /%3E%3C/svg%3E`;
