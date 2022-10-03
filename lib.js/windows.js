import {CSS} from './css.js';
import {amendNode, autoFocus, bindElement, clearNode, event, eventCapture} from './dom.js';
import {button, div, img, input, ns, slot, span, style} from './html.js';
import {ns as svgNS} from './svg.js';

const resizeWindow = (w, direction, e) => {
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
	amendNode(shell, {"onmousemove": event(e => {
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
	}, 0, signal), "onmouseup": event(e => {
		if (e.button !== 0) {
			return;
		}
		amendNode(shell, {"style": {"user-select": undefined}});
		ac.abort();
		dragging = false;
		w.dispatchEvent(new CustomEvent("resized"));
	}, 0, signal)});
      },
      moveWindow = (w, e) => {
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
	amendNode(shell, {"onmousemove": event(e => {
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
	}, 0, signal), "onmouseup": event(e => {
		if (e.button !== 0) {
			return;
		}
		amendNode(shell, {"style": {"user-select": undefined}});
		ac.abort();
		dragging = false;
		w.dispatchEvent(new CustomEvent("moved"));
	}, 0, signal)});
      },
      lang = {
	"CANCEL": "Cancel",
	"CLOSE": "Close",
	"MAXIMISE": "Maximise",
	"MINIMISE": "Minimise",
	"OK": "Ok",
	"RESTORE": "Restore"
      },
      shellStyle = new CSS().add(":host", {
	"display": "block",
	"position": "relative",
	"overflow": "hidden",
	"width": "var(--shell-width, 100%)",
	"height": "var(--shell-height, 100%)"
      }).add("::slotted(windows-window)", {
	"--taskmanager-on": "none"
      }).add("::slotted(windows-window:last-of-type)", {
	"--overlay-on": "none" // hack until exportpart is supported
      }) + "",
      desktopStyle = new CSS().add(":host", {
	"position": "absolute",
	"top": 0,
	"left": 0,
	"bottom": 0,
	"right": 0
      }) + "",
      windowStyle = new CSS().add(":host", {
	"position": "absolute",
	"display": "block",
	"background-color": "#fff",
	"color": "#000",
	"border": "1px solid #000",
	"width": "var(--window-width, auto)",
	"height": "var(--window-height, auto)",
	"min-width": "100px",
	"min-height": "100px",
	"top": "var(--window-top, 0)",
	"left": "var(--window-left, 0)",
	"list-style": "none",
	"padding": 0,
	"z-index": 0,
	"([maximised])": {
		"left": 0,
		"right": 0,
		"top": 0,
		"bottom": 0,
		"width": "auto",
		"height": "auto",
		">div:nth-child(3)>div>button:nth-of-type(2)": {
			"background-image": `url('data:image/svg+xml,%3Csvg viewBox="0 0 15 13" xmlns="${svgNS}"%3E%3Cpath d="M1,5 h8 v-1 h-8 v8 h8 v-8 m-3,0 v-3 h8 v8 h-5 m5,-7 h-8" stroke="%23000" fill="none" /%3E%3C/svg%3E')`
		}
	},
	"([resizable])": {
		"border-width": 0,
		">div": {
			":nth-child(2)": {
				"display": "block"
			},
			":nth-child(4)": {
				"overflow": "auto",
				"position": "absolute",
				"bottom": 0,
				"left": 0,
				"right": 0,
				"top": "calc(1em + 6px)"
			},
			":nth-child(5)": {
				"top": "var(calc(--window-resize), -2px)",
				"left": "var(calc(--window-resize), -2px)",
				"bottom": "var(calc(--window-resize), -2px)",
				"right": "var(calc(--window-resize), -2px)"
			}
		}
	},
	">div": {
		":nth-child(2)>div": {
			"position": "absolute",
			"border-color": "currentColor",
			"border-style": "solid",
			"border-width": 0,
			"z-index": -1,
			":nth-child(1)": {
				"top": "-2px",
				"left": "-2px",
				"width": "10px",
				"height": "10px",
				"cursor": "nwse-resize",
				"border-left-width": "3px",
				"border-top-width": "3px"
			},
			":nth-child(2)": {
				"top": "-2px",
				"left": "8px",
				"right": "8px",
				"border-top-width": "3px",
				"cursor": "ns-resize"
			},
			":nth-child(3)": {
				"top": "-2px",
				"right": "-2px",
				"width": "10px",
				"height": "10px",
				"border-top-width": "3px",
				"border-right-width": "3px",
				"cursor": "nesw-resize"
			},
			":nth-child(4)": {
				"top": "8px",
				"right": "-2px",
				"bottom": "8px",
				"border-right-width": "3px",
				"cursor": "ew-resize"
			},
			":nth-child(5)": {
				"bottom": "-2px",
				"right": "-2px",
				"width": "10px",
				"height": "10px",
				"border-right-width": "3px",
				"border-bottom-width": "3px",
				"cursor": "nwse-resize"
			},
			":nth-child(6)": {
				"bottom": "-2px",
				"left": "8px",
				"right": "8px",
				"border-bottom-width": "3px",
				"cursor": "ns-resize"
			},
			":nth-child(7)": {
				"bottom": "-2px",
				"left": "-2px",
				"width": "10px",
				"height": "10px",
				"border-left-width": "3px",
				"border-bottom-width": "3px",
				"cursor": "nesw-resize"
			},
			":nth-child(8)": {
				"top": "8px",
				"left": "-2px",
				"bottom": "8px",
				"border-left-width": "3px",
				"cursor": "ew-resize"
			}
		},
		":nth-child(3)": {
			"white-space": "nowrap",
			"height": "calc(1em + 6px)",
			"background-color": "#aaa",
			"overflow": "hidden",
			"user-select": "none",
			"display": "flex",
			"align-items": "center",
			">span": {
				"margin-right": "calc(3em + 24px)"
			},
			">img": {
				"height": "1em",
				"pointer-events": "none"
			},
			">div": {
				"position": "absolute",
				"right": 0,
				"top": 0,
				">button": {
					":nth-of-type(1)": {
						"background-image": `url('data:image/svg+xml,%3Csvg viewBox="0 0 10 10" xmlns="${svgNS}"%3E%3Cpath d="M1,1 L9,9 M9,1 L1,9" stroke="black" /%3E%3C/svg%3E')`
					},
					":nth-of-type(2)": {
						"background-image": `url('data:image/svg+xml,%3Csvg viewBox="0 0 10 10" xmlns="${svgNS}"%3E%3Cpath d="M9,3 h-8 v-1 h8 v-1 h-8 v8 h8 v-8" stroke="black" fill="none" /%3E%3C/svg%3E')`
					},
					":nth-of-type(3)": {
						"display": "var(--taskmanager-on, block)",
						"background-image": `url('data:image/svg+xml,%3Csvg viewBox="0 0 10 10" xmlns="${svgNS}"%3E%3Cline x1="1" y1="9" x2="9" y2="9" stroke="black" /%3E%3C/svg%3E')`
					}
				}
			},
			" button": {
				"padding": 0,
				"border-width": "2px",
				"float": "right",
				"background-repeat": "no-repeat",
				"background-position": "center",
				"background-color": "#eee",
				"background-size": "1em 1em",
				"width": "calc(1em + 8px)",
				"height": "calc(1em + 8px)"
			}
		},
		":nth-child(4)": {
			"user-select": "contain",
			":not(.hasChild)+div:nth-child(5)": {
				"pointer-events": "none"
			}
		},
		":nth-child(5)": {
			"display": "var(--overlay-on, block)",
			"position": "absolute",
			"background-color": "RGBA(0, 0, 0, 0.1)",
			"top": 0,
			"left": 0,
			"bottom": 0,
			"right": 0
		}
	},
	"([minimised]),>div:nth-child(2),([hide-titlebar])>div:nth-child(3),([hide-close])>div:nth-child(3)>div>button:nth-of-type(1),([hide-maximise])>div:nth-child(3)>div>button:nth-of-type(2),([hide-minimise])>div:nth-child(3)>div>button:nth-of-type(3),([window-hide])>div:nth-child(3)>div>button:nth-of-type(3)": {
		"display": "none"
	}
      }) + "";

let focusingWindow = null, dragging = false;

class BaseElement extends HTMLElement {
	alert(title, message, icon) {
		return new Promise((resolve, reject) => {
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
				}}, lang["OK"])))
			      ]);
			this.addWindow(w) || reject(new Error("invalid target"));
		});
	}
	confirm(title, message, icon) {
		return new Promise((resolve, reject) => {
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
					}}, lang["OK"])),
					button({"onclick": () => w.remove()}, lang["CANCEL"])
				])
			      ]);
			this.addWindow(w) || reject(new Error("invalid target"));
		});
	}
	prompt(title, message, defaultValue = "", icon) {
		return new Promise((resolve, reject) => {
			const ok = () => {
				resolve(data.value);
				w.remove();
			      },
			      data = autoFocus(input({"value": defaultValue, "onkeydown": e => {
				switch (e.key) {
				case "Enter":
					ok();
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
				div({"style": "text-align: center"}, button({"onclick": ok}, lang["OK"]))
			      ]);
			this.addWindow(w) || reject(new Error("invalid target"));
		});
	}
}

export class ShellElement extends BaseElement {
	constructor() {
		super();
		if (new.target !== ShellElement) {
			return;
		}
		amendNode(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, shellStyle),
			slot({"name": "desktop"}),
			div(slot())
		]);
	}
	addWindow(w) {
		if (w.parentNode !== this) {
			amendNode(this, w);
		} else if (w.nextElementSibling) {
			w.focus();
		}
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
		super();
		setTimeout(amendNode, 0, this, {"slot": "desktop"});
		amendNode(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, desktopStyle),
			slot({"slot": "desktop"})
		]);
	}
	attributeChangedCallback(name, _, newValue) {
		if (name === "slot" && newValue !== "desktop") {
			amendNode(this, {"slot": "desktop"});
		}
	}
	static get observedAttributes() {
		return ["slot"];
	}
}

export class WindowElement extends BaseElement {
	#title;
	#icon;
	#extra;
	#slot;
	#child = null;
	#parent = null;
	#maximise;
	constructor() {
		super();
		const onclick = () => this.focus();
		amendNode(this.attachShadow({"mode": "closed"}), [
			style({"type": "text/css"}, windowStyle),
			div(Array.from({length: 8}, (_, n) => div({"onmousedown": e => resizeWindow(this, n, e)}))),
			div({"part": "titlebar", "onmousedown": e => moveWindow(this, e), "ondblclick": e => {
				if (!(e.target instanceof HTMLButtonElement) && !this.hasAttribute("hide-maximise")) {
					this.toggleAttribute("maximised");
				}
			}}, [
				this.#icon = img({"part": "icon", "src": defaultIcon}),
				this.#title = span({"part": "title"}),
				div({"part": "controls"}, [
					button({"part": "close", "title": lang["CLOSE"], "onclick": () => this.close()}),
					this.#maximise = button({"part": "maximise", "title": lang["MAXIMISE"], "onclick": () => this.toggleAttribute("maximised")}),
					button({"part": "minimise", "title": lang["MINIMISE"], "onclick": () => this.toggleAttribute("minimised")}),
					this.#extra = span()
				])
			]),
			this.#slot = div(slot()),
			div({onclick})
		]);
		setTimeout(amendNode, 0, this, {"onmousedown": event(onclick, eventCapture)});
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
			amendNode(p.#slot, {"class": ["!hasChild"]});
			p.#child = null;
			this.#parent = null;
		}
		if (c) {
			c.remove();
			this.#child = null;
		}
		this.dispatchEvent(new CustomEvent("remove"));
	}
	attributeChangedCallback(name, _, newValue) {
		switch (name) {
		case "window-title":
			clearNode(this.#title, {"title": newValue ?? ""}, newValue ?? "");
			break;
		case "window-icon":
			amendNode(this.#icon, {"src": newValue ?? defaultIcon});
			break;
		case "maximised":
			amendNode(this.#maximise, {"title": newValue === null ? lang["MAXIMISE"] : lang["RESTORE"]});
		}
	}
	static get observedAttributes() {
		return ["maximised", "window-icon", "window-title"];
	}
	addWindow(w) {
		if (!this.parentNode) {
			return false;
		}
		if (this.#child) {
			this.#child.addWindow(w);
			return true;
		}
		this.#child = w;
		w.#parent = this;
		amendNode(this.#slot, {"class": ["hasChild"]});
		amendNode(this.parentNode, w);
		return true;
	}
	addControlButton(icon, onclick, title) {
		const b = button({"style": {"background-image": `url(${JSON.stringify(icon)})`}, "onclick": () => onclick.call(this), title});
		amendNode(this.#extra, b);
		return () => b.remove();
	}
	focus() {
		this.toggleAttribute("minimised", false);
		const c = this.#child;
		if (c) {
			c.focus();
			return;
		}
		if (this.parentNode && this.nextElementSibling) {
			focusingWindow = this;
			const scrolls = [],
			      ni = document.createNodeIterator(this, NodeFilter.SHOW_ELEMENT);
			for (let elm = this.#slot; elm; elm = ni.nextNode()) {
				const {scrollTop, scrollLeft} = elm;
				if (scrollTop || scrollLeft) {
					scrolls.push([elm, scrollTop, scrollLeft]);
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

export const shell = bindElement(ns, "windows-shell"),
desktop = bindElement(ns, "windows-desktop"),
windows = bindElement(ns, "windows-window"),
setDefaultIcon = icon => defaultIcon = icon,
setLanguage = l => {Object.assign(lang, l)};

export let defaultIcon = `data:image/svg+xml,%3Csvg viewBox="0 0 14 18" xmlns="${svgNS}"%3E%3Cpath d="M9,1 h-8 v16 h12 v-12 Z v4 h4" stroke="black" fill="none" /%3E%3Cpath d="M3,8 h8 m-8,3 h8 m-8,3 h8" stroke="gray" /%3E%3C/svg%3E`;
