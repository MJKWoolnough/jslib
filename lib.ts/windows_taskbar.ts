import type {Binding} from './bind.js';
import CSS from './css.js';
import {amendNode, bindCustomElement, event, eventOnce} from './dom.js';
import {div, img, li, slot, span, ul} from './html.js';
import {item, menu} from './menu.js';
import {DesktopElement, ShellElement as BaseShellElement, WindowElement, defaultIcon, desktop, setDefaultIcon, setLanguage as setOtherLanguage, windows} from './windows.js';

/**
 * The windows_taskbar module provides a replacement for the {@link module:windows} module {@link windows:ShellElement} that provides a taskbar for `Windows` to be managed from and allows the `Windows` to be minimised. This module directly re-exports the {@link windows:DesktopElement}, {@link windows:WindowElement}, {@link windows:desktop}, {@link windows:defaultIcon}, {@link windows:setDefaultIcon}, and {@link windows:windows} exports from the {@link module:windows} module.
 *
 * This module directly imports the {@link module:css}, {@link module:dom},{@link module:html}, {@link module:menu}, and {@link module:windows} modules.
 *
 * @module windows_taskbar
 * @requires module:css
 * @requires module:dom
 * @requires module:html
 * @requires module:menu
 * @requires module:windows
 */
/** */

export {DesktopElement, WindowElement, desktop, defaultIcon, setDefaultIcon, windows};

const windowObservations = {
	"attributeFilter": ["window-icon", "window-title"],
	"attributes": true
      },
      menuItems = {
	"CLOSE": '' as string | Binding,
	"MINIMISE": '' as string | Binding,
	"RESTORE": '' as string | Binding
      },
      setMenuLang = (l: Parameters<typeof setOtherLanguage>[0]) => {
	for (const k of ["CLOSE", "MINIMISE", "RESTORE"] as const) {
		const le = l[k];
		if (le) {
			menuItems[k] = le;
		}
	}
      },
      shellStyle = [new CSS().add({
	":host": {
		"display": "block",
		"position": "relative",
		"overflow": "hidden",
		"width": "var(--shell-width, 100%)",
		"height": "var(--shell-height, 100%)",
		">ul": {
			"list-style": "none",
			"padding": 0,
			"position": "absolute",
			"bottom": 0,
			"left": 0,
			"width": "100%",
			"height": "var(--taskbar-size, 4em)",
			"margin": 0,
			"overflow-y": "hidden",
			"overflow-x": "auto",
			"background-color": "#eee",
			"white-space": "nowrap",
			"user-select": "none",
			"border-style": "solid",
			"border-color": "#000",
			"border-width": "1px 0 0 0",
			" li": {
				"border": "1px solid #000",
				"display": "inline-block",
				"padding": 0,
				"margin": 0,
				"overflow": "hidden"
			},
			" img": {
				"height": "var(--taskbar-size, 4em)"
			},
			" span": {
				"display": "inline-block",
				"height": "var(--taskbar-size, 4em)",
				"vertical-align": "middle"
			}
		},
		"([side=\"top\"])": {
			">ul": {
				"top": 0,
				"bottom": "unset",
				"border-width": "0 0 1px 0"
			},
			"::slotted(windows-desktop)": {
				"padding-top": "var(--taskbar-size, 4em)",
				"padding-bottom": 0
			}
		},
		"([side=\"left\"])": {
			">ul": {
				"border-width": "0 1px 0 0"
			},
			" ::slotted(windows-desktop)": {
				"padding-left": "var(--taskbar-size, 4em)",
				"padding-bottom": 0
			}
		},
		"([side=\"right\"])": {
			">ul": {
				"left": "unset",
				"right": 0,
				"border-width": "0 0 0 1px"
			},
			" ::slotted(windows-desktop)": {
				"padding-right": "var(--taskbar-size, 4em)",
				"padding-bottom": 0
			}
		},
		"([side=\"left\"]),([side=\"right\"])": {
			">ul": {
				"top": 0,
				"width": "var(--taskbar-size, 4em)",
				"overflow-y": "auto",
				"overflow-x": "hidden",
				"height": "100%",
				"white-space": "unset",
				">li": {
					"display": "list-item"
				}
			}
		},
		"([autohide]": {
			"[side=\"left\"])>ul:not(:hover)": {
				"width": "1px",
				"height": "100%",
				"border-width": "0 5px 0 0"
			},
			"[side=\"right\"])>ul:not(:hover)": {
				"width": "1px",
				"height": "100%",
				"border-width": "0 0 0 5px"
			},
			")>ul:not(:hover)": {
				"height": "1px",
				"border-width": "5px 0 0 0"
			},
			"[side=\"top\"])>ul:not(:hover)": {
				"border-width": "0 0 5px 0"
			},
			")>ul:not(:hover)>*": {
				"display": "none"
			}
		},
		"([hide=\"icon\"])>ul img,([hide=\"title\"])>ul span": {
			"display": "none"
		}
	},
	"::slotted(windows-window:last-of-type)": {
		"--overlay-on": "none"
	},
	"::slotted(windows-desktop)": {
		"padding-bottom": "var(--taskbar-size, 4em)"
	}
      })];

setMenuLang({
	"CLOSE": "Close",
	"MINIMISE": "Minimise",
	"RESTORE": "Restore"
});

/**
 * A drop-in replacement for the {@link module:windows} module {@link windows:ShellElement}. Registered with customElements as `windows-shell-taskbar`.
 *
 * The ShellElement class can accept the following attributes:
 *
 * |  Attribute  |  Description  |
 * |-------------|---------------|
 * | autohide    | When set this attribute will hide the taskbar when it is not being hovered over. |
 * | side        | When set to one of left, right, or top, is used to change the side on which the taskbar will reside. It defaults to the bottom. |
 * | hide        | This attribute can be set to one of icon or title, which will hide either the icon or the text title of the window on the taskbar. |
 *
 * In addition the `--taskbar-size` style var can be used to set the width (or height, if vertical) of the taskbar.
 */
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

			const itm = windowData.get(target)!.firstChild!;

			switch (attributeName) {
			case "window-icon":
				amendNode(itm, {"src": target.getAttribute("window-icon") ?? undefined});

				break;
			case "window-title":
				amendNode(itm, target.getAttribute("window-title") ?? "");
			}
		      }));

		amendNode(this.attachShadow({"mode": "closed"}), [
			slot({"name": "desktop"}),
			taskbar,
			div(slot({"onslotchange": function(this: HTMLSlotElement) {
				this.assignedElements().forEach(w => {
					if (!(w instanceof WindowElement)) {
						return;
					}

					if (!windowData.has(w) && !w.hasAttribute("window-hide")) {
						const itm = li({"onclick": () => {
							if (w.hasAttribute("minimised")) {
								amendNode(w, {"minimised": false});
								w.focus();
							} else if (w.nextElementSibling) {
								w.focus();
							} else {
								amendNode(w, {"minimised": true});
							}
						      }, "oncontextmenu": (e: MouseEvent) => {
							e.preventDefault();
							amendNode(self, menu({"x": e.clientX, "y": e.clientY}, [
								w.hasAttribute("minimised") ? item({"key": (menuItems["RESTORE"]+"").charAt(0), "onselect": () => {
									amendNode(w, {"minimised": false});
									w.focus();
								}}, menuItems["RESTORE"]) : item({"key": (menuItems["MINIMISE"]+"").charAt(0), "onselect": () => amendNode(w, {"minimised": true})}, menuItems["MINIMISE"]),
								item({"key": (menuItems["CLOSE"]+"").charAt(0), "onselect": () => w.close()}, menuItems["CLOSE"])
							]));
						      }}, [
							img({"part": "icon", "src": w.getAttribute("window-icon") || undefined, "title": w.getAttribute("window-title") ?? undefined}),
							span({"part": "title"}, w.getAttribute("window-title") || "")
						      ]);

						amendNode(taskbar, itm);
						windowData.set(w, itm);
						amendNode(w, {"onremove": event(() => {
							windowData.delete(w);
							itm.remove();
						}, eventOnce)});
						windowObserver.observe(w, windowObservations);
					}
				});
			}}))
		]).adoptedStyleSheets = shellStyle;
	}
}

export const
/**
 * A {@link dom:DOMBind} that creates a ShellElement.
 */
shell = bindCustomElement("windows-shell-taskbar", ShellElement),
/**
 * A replacement for the {@link windows:setLanguage} function, which in addition to calling the original, sets the language entries used for the context menu for the items on the taskbar. The menu access keys are set to the first character of the entry.
 */
setLanguage = (l: Parameters<typeof setOtherLanguage>[0]) => {
	setOtherLanguage(l);
	setMenuLang(l);
};
