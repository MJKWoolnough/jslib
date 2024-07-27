import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode, event, eventCapture} from './dom.js';
import {button, div, img, input, slot, span, toggle} from './html.js';
import {autoFocus} from './misc.js';
import {ns as svgNS} from './svg.js';

/**
 * The windows module adds custom elements to implement a windowing system.
 *
 * This module directly imports the {@link module:css}, {@link module:dom}, {@link module:html}, {@link module:misc} and {@link module:svg} modules.
 *
 * @module windows
 * @requires module:css
 * @requires module:dom
 * @requires module:html
 * @requires module:misc
 * @requires module:svg
 */

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
	if (e.target instanceof HTMLButtonElement) {
		return;
	}

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
      shellStyle = [new CSS().add({
	":host": {
		"display": "block",
		"position": "relative",
		"overflow": "hidden",
		"width": "var(--shell-width, 100%)",
		"height": "var(--shell-height, 100%)"
	},
	"::slotted(windows-window)": {
		"--taskmanager-on": "none"
	},
	"::slotted(windows-window:last-of-type)": {
		"--overlay-on": "none" // hack until exportpart is supported
	}
      })],
      desktopStyle = [new CSS().add(":host", {
	"position": "absolute",
	"top": 0,
	"left": 0,
	"bottom": 0,
	"right": 0
      })],
      windowStyle = [new CSS().add(":host", {
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

		">div:nth-child(2)>div>button:nth-of-type(2)": {
			"background-image": `url('data:image/svg+xml,%3Csvg viewBox="0 0 15 13" xmlns="${svgNS}"%3E%3Cpath d="M1,5 h8 v-1 h-8 v8 h8 v-8 m-3,0 v-3 h8 v8 h-5 m5,-7 h-8" stroke="%23000" fill="none" /%3E%3C/svg%3E')`
		}
	},

	"([resizable])": {
		"border-width": 0,

		">div": {
			":nth-child(1)": {
				"display": "block"
			},

			":nth-child(3)": {
				"overflow": "auto",
				"position": "absolute",
				"bottom": 0,
				"left": 0,
				"right": 0,
				"top": "calc(1em + 6px)"
			},

			":nth-child(4)": {
				"top": "var(calc(--window-resize), -2px)",
				"left": "var(calc(--window-resize), -2px)",
				"bottom": "var(calc(--window-resize), -2px)",
				"right": "var(calc(--window-resize), -2px)"
			}
		}
	},

	">div": {
		":nth-child(1)>div": {
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

		":nth-child(2)": {
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

		":nth-child(3)": {
			"user-select": "contain",

			":not(.hasChild)+div:nth-child(5)": {
				"pointer-events": "none"
			}
		},

		":nth-child(4)": {
			"display": "var(--overlay-on, block)",
			"position": "absolute",
			"background-color": "RGBA(0, 0, 0, 0.1)",
			"top": 0,
			"left": 0,
			"bottom": 0,
			"right": 0,
			"pointer-events": "none"
		}
	},

	"([minimised]),>div:nth-child(1),([hide-titlebar])>div:nth-child(2),([hide-close])>div:nth-child(2)>div>button:nth-of-type(1),([hide-maximise])>div:nth-child(2)>div>button:nth-of-type(2),([hide-minimise])>div:nth-child(2)>div>button:nth-of-type(3),([window-hide])>div:nth-child(2)>div>button:nth-of-type(3)": {
		"display": "none"
	}
      })],
      desktopObservedAttrs = Object.freeze(["slot"]),
      windowObservedAttrs = Object.freeze(["maximised", "window-icon", "window-title"]);

let focusingWindow = null, dragging = false;

/**
 * This unexported class provides some methods for both {@link WindowElement} and {@link ShellElement}.
 */
class BaseElement extends HTMLElement {
	/**
	 * The alert method adds an {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/alert | alert}-like window to the {@link WindowElement} or {@link ShellElement} it was called upon.
	 *
	 * The button text is set to the `OK` field of the language object, which can be set with {@link setLanguage}.
	 *
	 * @param {string | Binding} title   Title of the `alert` window.
	 * @param {Children}         message Message to be displayed in the window.
	 * @param {string | Binding} [icon]  Optional icon.
	 *
	 * @return {Promise<boolean>} The returned {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} will resolve to true if the button is clicked, and false if the dialogue window was closed.
	 */
	alert(title, message, icon) {
		return new Promise((resolve, reject) => {
			const w = windows({
				"window-hide": true,
				"window-icon": icon,
				"window-title": title,
				"hide-maximise": true,
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

	/**
	 * The confirm method adds a {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm | confirm}-like window to the {@link WindowElement} or {@link ShellElement} it was called upon.
	 *
	 * The text of the two buttons is set to the `OK` and `CANCEL` fields of the language object, which can be set with {@link setLanguage}.
	 *
	 * @param {string | Binding} title   Title of the `alert` window.
	 * @param {Children}         message Message to be displayed in the window.
	 * @param {string | Binding} [icon]  Optional icon.
	 *
	 * @return {Promise<boolean>} The returned {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} will resolve to true if the `OK` button is clicked, and false if the `CANCEL` button was clicked or the dialogue window was closed.
	 */
	confirm(title, message, icon) {
		return new Promise((resolve, reject) => {
			const w = windows({
				"window-hide": true,
				"window-icon": icon,
				"window-title": title,
				"hide-maximise": true,
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

	/**
	 * The prompt method adds a {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt | prompt}-like window to the {@link WindowElement} or {@link ShellElement} it was called upon.
	 *
	 * The button text is set to the `OK` field of the language object, which can be set with {@link setLanguage}.
	 *
	 * @param {string | Binding} title             Title of the `alert` window.
	 * @param {Children}         message           Message to be displayed in the window.
	 * @param {string}           [defaultValue=""] The default value of the input box.
	 * @param {string | Binding} [icon]            Optional icon.
	 *
	 * @return {Promise<string | null>} The returned {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} will resolve to the text entered if the `OK` button is clicked, or null if the dialogue window was closed.
	 */
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
				"hide-maximise": true,
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

/**
 * The ShellElement class is a CustomElement that can contain a single {@link DesktopElement} and any number of {@link WindowElement}s.
 *
 * This element registers with the name `windows-shell`.
 *
 * This element handles the following attributes.
 *
 * |  Attribute     |  Type  |  Description  |
 * |----------------|--------|---------------|
 * | --shell-height | Number | Used to specify the internal height of the `Shell`. |
 * | --shell-width  | Number | Used to specify the internal width of the `Shell`. |
 */
export class ShellElement extends BaseElement {
	constructor() {
		super();

		if (new.target !== ShellElement) {
			return;
		}

		amendNode(this.attachShadow({"mode": "closed"}), [
			slot({"name": "desktop"}),
			div(slot())
		]).adoptedStyleSheets = shellStyle;
	}

	/**
	 * Adds a {@link WindowElement} to the Shell and focuses it.
	 *
	 * @param {WindowElement} w The WindowElement to add.
	 *
	 * @return {true} Returns true.
	 */
	addWindow(w) {
		if (w.parentNode !== this) {
			amendNode(this, w);
		} else if (w.nextElementSibling) {
			w.focus();
		}

		return true;
	}

	/**
	 * Repositions all {@link WindowElements} within the Shell to make sure they are all visible.
	 */
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
		}
	}
}

/**
 * This class creates a desktop-like space with a {@link ShellElement}.
 */
export class DesktopElement extends HTMLElement {
	constructor() {
		super();

		setTimeout(amendNode, 0, this, {"slot": "desktop"});
		amendNode(this.attachShadow({"mode": "closed"}), slot({"slot": "desktop"})).adoptedStyleSheets = desktopStyle;
	}

	attributeChangedCallback(name, _, newValue) {
		if (name === "slot" && newValue !== "desktop") {
			amendNode(this, {"slot": "desktop"});
		}
	}

	static get observedAttributes() {
		return desktopObservedAttrs;
	}
}

/**
 * The WindowElement class is a CustomElement that can be added to a {@link ShellElement} to provide a window-like interface to the contents of the element.
 *
 * The {@link ShellElement} will determine whether `Windows` can be minimised and how they are handled when they are. The {@link ShellElement} of this module disables minimising. It can be enabled by using the ShellElement of either the {@link module:windows_taskbar} or {@link module_windows_taskmanager} modules.
 *
 * This element registers with the name `windows-windows`.
 *
 * This element handles the following attributes:
 *
 * |  Attribute       |  Type  |  Description  |
 * |------------------|--------|---------------|
 * | hide-close       | Toggle | Hides the `Close` button. |
 * | hide-maximise    | Toggle | Hides the `Maximise` button. |
 * | hide-minimise    | Toggle | Hides the `Minimise` button. |
 * | hide-titlebar    | Toggle | Hides the titlebar. |
 * | maximised        | Toggle | The window will expand to the size of the {@link ShellElement}. |
 * | minimised        | Toggle | The window will be hidden and it will be up to the shell to allow restoring it. |
 * | resizable        | Toggle | Allows the `Window` to be resized. |
 * | window-icon      | String | Sets the window icon. |
 * | window-title     | String | Sets the window title. |
 *
 * In addition, the following CSS variables can be set to modifiy the dimensions of the Window.
 *
 * |  Attribute      |  Description  |
 * |-----------------|---------------|
 * | --window-height | Specifies the height of the `Window`. |
 * | --window-left   | Specifies the `x` coordinate of the `Window`. |
 * | --window-top    | Specifies the `y` coordinate of the `Window`. |
 * | --window-width  | Specifies the width of the `Window`. |
 *
 * Hover text on the default buttons can be modified via the {@link setLanguage} function.
 *
 * The following entries affect this element:
 *
 * |  Entry     |  Default Value  |  Description  |
 * |------------|-----------------|---------------|
 * | `CLOSE`    | "Close"         | Hover text on the 'Close Window' button. |
 * | `MAXIMISE` | "Maximise"      | Hover text on the 'Maximise Window' button. |
 * | `MINIMISE` | "Minimise"      | Hover text on the 'Minimise Window' button. |
 * | `RESTORE`  | "Restore"       | Hover text on the 'Restore Window' button. |
 *
 * The following customs events can be dispatched:
 *
 * |  Event  |  Description  |
 * |---------|---------------|
 * | close   | Dispatched when either the `Close` button is clicked or the {@link WindowElement/close} method is called. |
 * | moved   | Dispatched when the `Window` is dragged around within the shell. |
 * | remove  | Dispatched when the `Window` is removed from the DOM. |
 * | resized | Dispatched when the `Window` is resized. |
 */
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

		amendNode(this.attachShadow({"mode": "closed"}), {"onclick": event(onclick, eventCapture)}, [
			div(Array.from({length: 8}, (_, n) => div({"onmousedown": e => resizeWindow(this, n, e)}))),
			div({"part": "titlebar", "onmousedown": e => moveWindow(this, e), "ondblclick": e => {
				if (!(e.target instanceof HTMLButtonElement) && !this.hasAttribute("hide-maximise")) {
					amendNode(this, {"maximised": toggle});
				}
			}}, [
				this.#icon = img({"part": "icon", "src": defaultIcon}),
				this.#title = span({"part": "title"}),
				div({"part": "controls"}, [
					button({"part": "close", "title": lang["CLOSE"], "onclick": () => this.close()}),
					this.#maximise = button({"part": "maximise", "title": lang["MAXIMISE"], "onclick": () => amendNode(this, {"maximised": toggle})}),
					button({"part": "minimise", "title": lang["MINIMISE"], "onclick": () => amendNode(this, {"minimised": toggle})}),
					this.#extra = span()
				])
			]),
			this.#slot = div(slot()),
			div()
		]).adoptedStyleSheets = windowStyle;

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
		return windowObservedAttrs;
	}

	/**
	 * This method adds a `Window` as a child. If there is already a child, it is added as a child of that `Window`.
	 *
	 * @param {WindowElement} w The child window to be added.
	 * @return {boolean} Returns true if window was successfully added, and false otherwise, which should only occur if this window has no parent.
	 */
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

	/**
	 * The addControlButton method adds additional buttons to the titlebar of the `Window`.
	 *
	 * @param {string}                        icon    The icon to be displayed on the button.
	 * @param {(this: WindowElement) => void} onclick The function to call when the button is clicked.
	 * @param {string | Binding}              [title] An optional title text for the button.
	 *
	 * @return {() => void} A Function to remove the button.
	 */
	addControlButton(icon, onclick, title) {
		const b = button({"style": {"background-image": `url(${JSON.stringify(icon)})`}, "onclick": () => onclick.call(this), title});

		amendNode(this.#extra, b);

		return () => b.remove();
	}

	/** The focus method will unset a set `minimise` attribute and bring the deepest child to the top of the window stack. */
	focus() {
		amendNode(this, {"minimised": false});

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

		if (!this.contains(document.activeElement)) {
			super.focus();
		}
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

export const
/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link ShellElement}.
 */
shell = bindCustomElement("windows-shell", ShellElement),
/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link DesktopElement}.
 */
desktop = bindCustomElement("windows-desktop", DesktopElement),
/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link WindowsElement}.
 */
windows = bindCustomElement("windows-window", WindowElement),
/**
 * This function sets the `defaultIcon` variable, which is the icon used on all `WindowElements` if it isn't overridden.
 *
 * @param {string} icon The icon to be set.
 *
 * @return {string} The icon.
 * */
setDefaultIcon = icon => defaultIcon = icon,
/**
 * The setLanguage function sets the language items used by the {@link ShellElement} and {@link WindowElement} classes.
 *
 * @param {{CANCEL?: string | Binding; CLOSE?: string | Binding; MAXIMISE?: string | Binding; MINIMISE?: string | Binding; OK?: string | Binding; RESTORE?: string | Binding;}} l The language to be changed.
 * 	*/
setLanguage = l => {Object.assign(lang, l)};

/**
 * The current default icon. Can be changed with the {@link setDefaultIcon} function. */
export let defaultIcon = `data:image/svg+xml,%3Csvg viewBox="0 0 14 18" xmlns="${svgNS}"%3E%3Cpath d="M9,1 h-8 v16 h12 v-12 Z v4 h4" stroke="black" fill="none" /%3E%3Cpath d="M3,8 h8 m-8,3 h8 m-8,3 h8" stroke="gray" /%3E%3C/svg%3E`;
