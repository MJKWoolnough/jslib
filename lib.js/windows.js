import {autoFocus, createHTML, DOMBind, Children, Props} from './dom.js';
import {button, div, img, input, slot, span, style} from './html.js';

export class ShellElement extends HTMLElement {
	constructor() {
		super();
		createHTML(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, ":host{display:block;position:relative;overflow:hidden;width:var(--shell-width,100%);height:var(--shell-height,100%)}::slotted(windows-window){--taskmanager-on:none}::slotted(windows-window:last-of-type){--overlay-on:none}"),
			slot({"name": "desktop"}),
			div(slot())
		]);
	}
	alert(title, message, icon) {
		return new Promise(resolve => {
			const w = windows({
				"icon": icon | noIcon,
				title,
				"hide-maximise": "true",
				"onremove": () => resolve(false)
			}, [
				div(message),
				div({"style": "text-align: center"}, autoFocus(button({"onclick": () => {
					resolve(true);
					w.remove();
				}}, "Ok")))
			]);
			this.appendChild(w);
		});
	}
	confirm(title, message, icon) {
		return new Promise(resolve => {
			const w = windows({
				"icon": icon | noIcon,
				title,
				"hide-maximise": "true",
				"onremove": () => resolve(false)
			}, [
				div(message),
				div({"style": "text-align: center"}, [
					autoFocus(button({"onclick": () => {
						resolve(true);
						w.remove();
					}}, "Ok")),
					button({"onclick": () => {
						resolve(true);
						w.remove();
					}}, "Cancel")
				])
			]);
			this.appendChild(w);
		});
	}
	prompt(title, message, defaultValue, icon) {
		return new Promise(resolve => {
			const data = autoFocus(input({"value": defaultValue || ""})),
			      w = windows({
				"icon": icon | noIcon,
				title,
				"hide-maximise": "true",
				"onremove": () => resolve(null)
			}, [
				div(message),
				data,
				div({"style": "text-align: center"}, button({"onclick": () => {
					resolve(data.value);
					w.remove();
				}}, "Ok"))
			]);
			this.appendChild(w);
		});
	}
}

export class DesktopElement extends HTMLElement {
	constructor() {
		super()
		this.setAttribute("slot", "desktop");
		createHTML(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, ":host{position: absolute;top:0;left:0;bottom:0;right:0}"),
			slot({"slot": "desktop"})
		]);
	}
}

const windowData = new WeakMap(),
      noIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAG1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUUeIgAAAACXRSTlMA/84W08jxyb+UzoCKAAAAdklEQVR4Ae3RAQaAQBCF4WFPsAkBkAAIe4F0ko7Q/SEExHuZhcL/A/B5zARRVN2cJ+MqiN7f9jRpYsaQImYMCTHjiJhxRMw4ImYcETOOiBlPog1pUpYUucuQwxPddwQCOeujqYNwZL7PkXklBAKBQF7qIn+O6ALn8CGyjt4s2QAAAABJRU5ErkJggg==",
      resizeWindow = function(direction, {clientX, clientY}) {
	const shell = this.parentNode;
	if (!(shell instanceof ShellElement) || draggers.get(shell) === true) {
		return;
	}
	draggers.set(shell, true);
	this.style.setProperty("user-select", "none");
	const originalLeft = this.offsetLeft,
	      originalTop = this.offsetTop,
	      originalWidth = this.offsetWidth,
	      originalHeight = this.offsetHeight,
	      grabX = clientX,
	      grabY = clientY,
	      mouseMove = ({clientX, clientY}) => {
		const dx = clientX - grabX,
		      dy = clientY - grabY;
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
					this.style.setProperty("--window-width", `${originalWidth - dx}px`);
				}
			}
		}
	      },
	      mouseUp = () => {
		shell.removeEventListener("mousemove", mouseMove);
		shell.removeEventListener("mouseup", mouseUp);
		draggers.delete(shell);
		shell.style.removeProperty("user-select");
	      };
	shell.addEventListener("mousemove", mouseMove);
	shell.addEventListener("mouseup", mouseUp);
      },
      draggers = new WeakMap(),
      moveWindow = function({clientX, clientY}) {
	const shell = this.parentNode;
	if (!(shell instanceof ShellElement) || draggers.get(shell) === true) {
		return;
	}
	draggers.set(shell, true);
	this.style.setProperty("user-select", "none");
	const grabX = clientX - this.offsetLeft,
	      grabY = clientY - this.offsetTop,
	      mouseMove = e => {
		const x = e.clientX - grabX,
		      y = e.clientY - grabY;
		this.style.setProperty("--window-left", x + "px");
		this.style.setProperty("--window-top", y + "px");
	      },
	      mouseUp = () => {
		shell.removeEventListener("mousemove", mouseMove);
		shell.removeEventListener("mouseup", mouseUp);
		draggers.delete(shell);
		shell.style.removeProperty("user-select");
	      };
	shell.addEventListener("mousemove", mouseMove);
	shell.addEventListener("mouseup", mouseUp);
      },
      closeEvent = new CustomEvent("close", {"cancelable": true}),
      removeEvent = new CustomEvent("remove", {"cancelable": false}),
      childWindows = new Map(),
      childOf = new Map();
let focusingWindow = null;

export class WindowElement extends HTMLElement {
	constructor() {
		super()
		const titleElement = span(),
		      iconElement = img({"src": noIcon});
		windowData.set(this, {titleElement, iconElement});
		createHTML(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, ":host{position:absolute;display:block;background-color:#fff;color:#000;border:1px solid #000;width:var(--window-width,auto);height:var(--window-height,auto);min-width:100px;min-height:100px;top:var(--window-top,0);left:var(--window-left,0);list-style:none;padding:0;z-index:0}:host([maximised]){left:0;right:0;top:0;bottom:0;width:auto;height:auto}:host([resizable]){border-width:0}:host([resizable])>div:nth-child(2){display:block}:host([minimised]),:host>div:nth-child(2),:host([hide-titlebar])>div:nth-child(3),:host([hide-close])>div:nth-child(3) button:nth-of-type(1),:host([hide-maximise])>div:nth-child(3) button:nth-of-type(2),:host([hide-minimise])>div:nth-child(3) button:nth-of-type(3){display:none}:host>div:nth-child(3){white-space:nowrap;height:calc(1em + 6px);background-color:#aaa;overflow:hidden;user-select:none}:host>div:nth-child(3)>span{margin-right:calc(3em + 24px)}:host>div:nth-child(3)>img{height:1em}:host>div:nth-child(3)>div{position:absolute;right:0;top:0}:host>div:nth-child(3) button{padding:0;border-width:2px;float:right;background-repeat:no-repeat;background-position:center;background-color:#eee;background-size:1em 1em;width:calc(1em + 8px);height:calc(1em + 8px)}:host>div:nth-child(3) button:nth-of-type(1){background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAS0lEQVR4AbXUMQoAIBTDUO9/6Tq5h2A+uNU3SP2nmr3z6+4kOgpOYAMBgYEgzgiUYBzlmETVeKwH+/dTqK9NUuzg6zXLoV9fvhHFXORcm2UE7mcvAAAAAElFTkSuQmCC)}:host>div:nth-child(3) button:nth-of-type(2){background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAIElEQVR4AWMY2eA/JXioGkgmoMjAUQNHDRw1kCI8ZAAAn3lVqxSpx3UAAAAASUVORK5CYII=)}:host([maximised])>div:nth-child(3) button:nth-of-type(2){background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAALElEQVR4AWNABqPgPyl4gAwkEgwdAykPM/obSCQYGgaiYxolk1EDScJDFgAAUOdXqbMbROIAAAAASUVORK5CYII=)}:host>div:nth-child(3) button:nth-of-type(3){display:var(--taskmanager-on,block);background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGklEQVR4AWMY+mAUjIJRMAr+U4KHgIFDBgAAtIAv0S+OoIsAAAAASUVORK5CYII=)}:host>div:nth-child(4){user-select:contain}:host>div:nth-child(5){display:var(--overlay-on,block);position:absolute;background-color:rgba(0,0,0,0.1);top:0;left:0;bottom:0;right:0}:host([resizeable])>div:nth-child(5){top:var(calc(--window-resize), -2px);left:var(calc(--window-resize), -2px);bottom:var(calc(--window-resize), -2px);right:var(calc(--window-resize), -2px)}:host>div:nth-child(2)>div{position:absolute;border-color:#000;border-style:solid;border-width:0;z-index:-1}:host>div:nth-child(2)>div:nth-child(1){top:-2px;left:-2px;width:10px;height:10px;cursor:nwse-resize;border-left-width:3px;border-top-width:3px}:host>div:nth-child(2)>div:nth-child(2){top:-2px;left:8px;right:8px;border-top-width:3px;cursor:ns-resize}:host>div:nth-child(2)>div:nth-child(3){top:-2px;right:-2px;width:10px;height:10px;border-top-width:3px;border-right-width:3px;cursor:nesw-resize}:host>div:nth-child(2)>div:nth-child(4){top:8px;right:-2px;bottom:8px;border-right-width:3px;cursor:ew-resize}:host>div:nth-child(2)>div:nth-child(5){bottom:-2px;right:-2px;width:10px;height:10px;border-right-width:3px;border-bottom-width:3px;cursor:nwse-resize}:host>div:nth-child(2)>div:nth-child(6){bottom:-2px;left:8px;right:8px;border-bottom-width:3px;cursor:ns-resize}:host>div:nth-child(2)>div:nth-child(7){bottom:-2px;left:-2px;width:10px;height:10px;border-left-width:3px;border-bottom-width:3px;cursor:nesw-resize}:host>div:nth-child(2)>div:nth-child(8){top:8px;left:-2px;bottom:8px;border-left-width:3px;cursor:ew-resize}"),
			div(Array.from({length: 8}, (_, n) => div({"onmousedown": resizeWindow.bind(this, n)}))),
			div({"onmousedown": moveWindow.bind(this), "ondblclick": () => {
				if (!this.hasAttribute("hide-maximise")) {
					this.toggleAttribute("maximised");
				}
			      }}, [
				iconElement,
				titleElement,
				div([
					button({"onclick": () => {
						if (this.dispatchEvent(closeEvent) && this.parentNode) {
							this.remove();
						}
					}}),
					button({"onclick": () => this.toggleAttribute("maximised")}),
					button({"onclick": () => this.toggleAttribute("minimised")})
				])
			]),
			div(slot()),
			div({"onclick": () => {
				const cw = childWindows.get(this);
				if (cw && cw.length > 0) {
					const c = cw[cw.length-1];
					if (c.nextSibling && this.parentNode) {
						focusingWindow = c;
						this.parentNode.appenChild(c);
					}
					return;
				}
				this.parentNode?.appendChild(this);
			}})
		]);
	}
	connectedCallback() {
		if (focusingWindow === this) {
			focusingWindow = null;
		} else {
			childWindows.set(this, []);
		}
	}
	disconnectedCallback() {
		if (focusingWindow === this) {
			return;
		}
		const p = childOf.get(this);
		if (p) {
			childOf.delete(this);
			const pw = childWindows.get(p);
			pw.splice(pw.indexOf(this), 1);
		}
		childWindows.get(this).forEach(c => c.remove());
		childWindows.delete(this);
		this.dispatchEvent(removeEvent);
	}
	attributeChangedCallback(name, _, newValue) {
		const wd = windowData.get(this);
		switch (name) {
		case "title":
			wd.titleElement.innerText = newValue;
			break;
		case "icon":
			wd.iconElement.setAttribute("src", newValue);
			break;
		}
	}
	static get observedAttributes() {
		return ["title", "icon"];
	}
	alert(title, message, icon) {
		return new Promise((resolve, reject) => {
			const w = windows({
				"icon": icon | noIcon,
				title,
				"hide-maximise": "true",
				"onremove": () => {
					const cw = childWindows.get(this);
					cw.splice(cw.findIndex(c => c === w), 1);
					resolve(false);
				}
			}, [
				div(message),
				div({"style": "text-align: center"}, autoFocus(button({"onclick": () => {
					const cw = childWindows.get(this);
					cw.splice(cw.findIndex(c => c === w), 1);
					resolve(true);
					w.remove();
				}}, "Ok")))
			]);
			this.addWindow(w) || reject(new Error("invalid target"));
		});
	}
	confirm(title, message, icon) {
		return new Promise((resolve, reject) => {
			const w = windows({
				"icon": icon | noIcon,
				title,
				"hide-maximise": "true",
				"onremove": () => {
					const cw = childWindows.get(this);
					cw.splice(cw.findIndex(c => c === w), 1);
					resolve(false);
				}
			}, [
				div(message),
				div({"style": "text-align: center"}, [
					autoFocus(button({"onclick": () => {
						const cw = childWindows.get(this);
						cw.splice(cw.findIndex(c => c === w), 1);
						resolve(true);
						w.remove();
					}}, "Ok")),
					button({"onclick": () => {
						const cw = childWindows.get(this);
						cw.splice(cw.findIndex(c => c === w), 1);
						resolve(true);
						w.remove();
					}}, "Cancel")
				])
			]);
			this.addWindow(w) || reject(new Error("invalid target"));
		});
	}
	prompt(title, message, defaultValue, icon) {
		return new Promise((resolve, reject) => {
			const data = autoFocus(input({"value": defaultValue || ""})),
			      w = windows({
				"icon": icon | noIcon,
				title,
				"hide-maximise": "true",
				"onremove": () => resolve(null)
			}, [
				div(message),
				data,
				div({"style": "text-align: center"}, button({"onclick": () => {
					resolve(data.value);
					w.remove();
				}}, "Ok"))
			]);
			this.addWindow(w) || reject(new Error("invalid target"));
		});
	}
	addWindow(w) {
		if (!this.parentNode) {
			return false;
		}
		childWindows.get(this).push(w);
		childOf.set(w, this);
		this.parentNode.appendChild(w);
		return true;
	}
}

customElements.define("windows-shell", ShellElement);
customElements.define("windows-desktop", DesktopElement);
customElements.define("windows-window", WindowElement);

export const shell = (props, children) => createHTML(new ShellElement(), props, children),
desktop = (props, children) => createHTML(new DesktopElement(), props, children),
windows = (props, children) => createHTML(new WindowElement(), props, children);
