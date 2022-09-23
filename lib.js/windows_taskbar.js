import {item, menu} from './menu.js';
import {amendNode, bindElement, clearNode, event, eventOnce} from './dom.js';
import {div, img, li, ns, slot, span, style, template, ul} from './html.js';
import {DesktopElement, ShellElement as BaseShellElement, WindowElement, defaultIcon, desktop, setDefaultIcon, setLanguage as setOtherLanguage, windows} from './windows.js';

export {DesktopElement, WindowElement, desktop, defaultIcon, setDefaultIcon, windows};

const windowObservations = {
	"attributeFilter": ["window-icon", "window-title"],
	"attributes": true
      },
      underline = {"style": "text-decoration: underline"},
      close = template(),
      minimise = template(),
      restore = template(),
      keys = {
	"CLOSE": '',
	"MINIMISE": '',
	"RESTORE": ''
      },
      setMenuLang = l => {
	for (const [k, t] of [["CLOSE", close], ["MINIMISE", minimise], ["RESTORE", restore]]) {
		const le = l[k];
		if (le) {
			clearNode(t, [span(underline, keys[k] = le.charAt(0)), le.slice(1)]);
		}
	}
      };

setMenuLang({
	"CLOSE": "Close",
	"MINIMISE": "Minimise",
	"RESTORE": "Restore"
});

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
			const itm = windowData.get(target).firstChild;
			switch (attributeName) {
			case "window-icon":
				amendNode(itm, {"src": target.getAttribute("window-icon") ?? undefined});
				break;
			case "window-title":
				amendNode(itm, target.getAttribute("window-title") ?? "");
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
						const itm = li({"onclick": () => {
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
							amendNode(self, menu({"x": e.clientX, "y": e.clientY}, [
								w.hasAttribute("minimised") ? item({"key": keys["RESTORE"], "onselect": () => {
									amendNode(w, {"minimised": false});
									w.focus();
								}}, restore.content.cloneNode(true)) : item({"key": keys["MINIMISE"], "onselect": () => amendNode(w, {"minimised": true})}, minimise.content.cloneNode(true)),
								item({"key": keys["CLOSE"], "onselect": () => w.close()}, close.content.cloneNode(true))
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
		]);
	}
}

customElements.define("windows-shell-taskbar", ShellElement);

export const shell = bindElement(ns, "windows-shell-taskbar"),
setLanguage = l => {
	setOtherLanguage(l);
	setMenuLang(l);
};
