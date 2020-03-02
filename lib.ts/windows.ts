import {createHTML, clearElement} from './html.js';
import {button, div, img, span, style, ul, li} from './dom.js';

declare const pageLoad: Promise<void>;
pageLoad.then(() => document.head.appendChild(style({"type": "text/css"}, `
.windowsShell {
	--shell-width: 100%;
	--shell-height: 100%;
	position: relative;
	overflow: hidden;
	width: var(--shell-width);
	height: var(--shell-height);
}

.windowsDesktop {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
}

.windowsWindow {
	--window-width: 50%;
	--window-height: 50%;
	--window-top: 0;
	--window-left: 0;
	position: absolute;
	background-color: #fff;
	border: 1px solid #000;
	width: var(--window-width);
	height: var(--window-height);
	top: var(--window-top);
	left: var(--window-left);
	list-style: none;
	padding: 0;
	user-select: contain;
	z-index: 0;
}

.windowsWindow.minimised {
	display: none;
}

.windowsWindow.maximised {
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	width: auto;
	height: auto;
}

.windowsWindowTitlebar {
	background-color: #aaa;
	user-select: none;
	overflow: hidden;
	height: calc(1em + 4px);
}

.windowsWindowTitlebar > img {
	height: calc(1em);
}

.windowsWindowTitlebar > button {
	padding: 0;
	border-width: 2px;
	float: right;
}

.windowsWindowFocusGrabber {
	position: absolute;
	background-color: RGBA(0, 0, 0, 0.1);
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}

.windowsWindow:last-child > .windowsWindowFocusGrabber {
	display: none;
}

.windowsNoTaskbar {
	list-style: none;
	padding: 0;
	display: grid;
	grid-gap: 5px;
	grid-template-columns: repeat(auto-fit, 200px);
	position: absolute;
	bottom: 0;
	transform: scaleY(-1);
	width: 100%;

}

.windowsNoTaskbar > li {
	transform: scaleY(-1);
	border: 1px solid #000;
}

.windowsNoTaskbar > li.hidden {
	visibility: hidden;
}

.windowsTaskbarBottom {
	bottom: 0;
	left: 0;
	right: 0;
	height: calc(1em + 8px);
	border-top: 1px solid #aaa;
	overflow-y: scroll;
}

.windowsTaskbar {
	position: absolute;
	list-style: none;
	padding: 0;
	margin: 0;
}

.windowsTaskbar > li {
	float: left;
	margin-right: 2px;
	padding: 2px;
	border: 1px solid #000;
}

.windowsTaskbar > li > img {
	height: 1em;
}
`)));

export enum Side {
	Bottom,
	Left,
	Right,
	Top,
}

export class Taskbar {
	html: HTMLUListElement;
	windows = new Map<Window, windowDetails>();
	onTop: boolean;
	constructor(side: Side, stayOnTop = false, autoHide = false) {
		let classes = "windowsTaskbar";
		switch (side) {
		case Side.Top:
			classes += " windowsTaskbarTop";
			break;
		case Side.Left:
			classes += " windowsTaskbarLeft";
			break;
		case Side.Right:
			classes += " windowsTaskbarRight";
			break;
		case Side.Bottom:
		default:
			classes += " windowsTaskbarBottom";
		}
		if (autoHide) {
			classes += " windowsTaskbarAutohide";
		}
		this.onTop = stayOnTop
		this.html = ul({"class": classes});
	}
	addWindow(w: Window) {
		this.windows.set(w, {item: this.html.appendChild(li({"onclick": () => {
			if (!w.html.nextElementSibling || w.html.classList.contains("minimised")) {
				w.onMinimiseToggle()
			} else {
				w.onFocus();
			}
		}}, [
			img({"src": w.icon}),
			span(w.title)
		]))});
	}
	minimiseWindow(w: Window) {}
	removeWindow(w: Window) {
		this.html.removeChild(this.windows.get(w)!.item!);
	}
}

type windowDetails = {
	item?: HTMLLIElement;
}

class NoTaskbar {
	html = ul({"class": "windowsNoTaskbar"});
	windows = new Map<Window, windowDetails>();
	get onTop() {
		return false;
	}
	addWindow(window: Window) {
		this.windows.set(window, {});
	}
	minimiseWindow(w: Window) {
		const window = this.windows.get(w)!;
		if (window.item) {
			window.item.classList.remove("hidden");
			return;
		}
		const children = createHTML(null, [
			img({"src": w.icon}),
			span(w.title),
			w.onClose ? button("🗙", {"class": "windowsWindowTitlebarClose", "onclick": w.onExit.bind(w)}) : [],
			button("🗗", {"class": "windowsWindowTitlebarMaximise", "onclick": this.restoreWindow.bind(this, w)}),
		      ]);
		if (!Array.from(this.html.childNodes).some((h: ChildNode) => {
			if (h.childNodes.length === 0) {
				const li = h as HTMLLIElement;
				li.appendChild(children);
				li.classList.remove("hidden");
				li.setAttribute("title", w.title);
				window.item = li;
				return true;
			}
			return false;
		})) {
			window.item = this.html.appendChild(li({"class": "windowsWindowTitlebar", "title": w.title, "ondblclick": this.restoreWindow.bind(this, w)}, children));
		}
	}
	restoreWindow(w: Window) {
		this.windows.get(w)!.item!.classList.add("hidden");
		w.onMinimiseToggle();
	}
	removeWindow(w: Window) {
		const window = this.windows.get(w);
		if (window) {
			if (window.item) {
				window.item.classList.remove("hidden");
				window.item.classList.add("hidden");
				clearElement(window.item);
			}
			this.windows.delete(w);
		}
	}
}

const noPropagation = (e: Event) => e.stopPropagation(), closeTrue = () => Promise.resolve(true), noIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAG1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUUeIgAAAACXRSTlMA/84W08jxyb+UzoCKAAAAdklEQVR4Ae3RAQaAQBCF4WFPsAkBkAAIe4F0ko7Q/SEExHuZhcL/A/B5zARRVN2cJ+MqiN7f9jRpYsaQImYMCTHjiJhxRMw4ImYcETOOiBlPog1pUpYUucuQwxPddwQCOeujqYNwZL7PkXklBAKBQF7qIn+O6ALn8CGyjt4s2QAAAABJRU5ErkJggg==";
let windowID = 0;

class Window {
	html: HTMLLIElement;
	shell: shellData;
	onClose?: () => Promise<boolean>;
	icon = noIcon;
	title: string;
	maximiseButton ?: HTMLButtonElement;
	constructor(shell: shellData, title: string, content: HTMLDivElement, options: WindowOptions) {
		this.shell = shell;
		this.title = title;
		let width: string, height: string;
		if (options.size) {
			width = options.size.width.toString() + "px";
			height = options.size.height.toString() + "px";
		} else {
			width = "50%";
			height = "50%";
		}
		const parts: HTMLElement[] = [],
		      self = this;
		if (options.icon) {
			this.icon = options.icon;
		}
		if (options.showTitlebar) {
			const controls: HTMLButtonElement[] = [],
			      tbobj: Record<string, string | Function> = {
				"class": "windowsWindowTitlebar",
				"onmousedown": shell.windowMove.bind(shell, this)
			      },
			      thisID = ++windowID;
			if (options.showClose) {
				controls.push(button("🗙", {"class": "windowsWindowTitlebarClose", "onclick": () => {
					shell.taskbar.removeWindow(this);
					shell.removeWindow(this);
				}, "onmousedown": noPropagation}));
				this.onClose = closeTrue;
			}
			if (options.onClose) {
				this.onClose = options.onClose;
			}
			if (options.showMaximise || options.showMaximize) {
				const max = options.maximised || options.maximized;
				controls.push(this.maximiseButton = button(max ? "🗗" : "🗖", {"class": "windowsWindowTitlebarMaximise" + (max ? " maximised" : ""), "onclick": this.onMaximiseToggle.bind(this), "onmousedown": noPropagation}));
				tbobj["ondblclick"] = this.onMaximiseToggle.bind(this);
			}
			if (options.showMinimise || options.showMinimize) {
				controls.push(button("🗕", {"class": "windowsWindowTitlebarMinimise", "onclick": this.onMinimiseToggle.bind(this), "onmousedown": noPropagation}));
			}
			parts.push(div(tbobj, [
				img({"src": this.icon}),
				span(title),
				controls
			]));
		}
		parts.push(content);
		parts.push(div({"class": "windowsWindowFocusGrabber", "onmousedown": this.onFocus.bind(this)}));
		this.html = li({"class": "windowsWindow", "--window-width": width, "--window-height": height, "--window-top": "0px", "--window-left": "0px"}, parts);
	}
	onMinimiseToggle() {
		if (this.html.classList.toggle("minimised")) {
			this.shell.minimiseWindow(this);
		} else {
			this.shell.focusWindow(this);
		}
	}
	onMaximiseToggle() {
		if (this.maximiseButton) {
			if (this.html.classList.toggle("maximised")) {
				this.maximiseButton.innerText = "🗗";
			} else {
				this.maximiseButton.innerText = "🗖";
			}
		}
	}
	onFocus() {
		this.shell.focusWindow(this);
	}
	onExit() {
		if (!this.onClose) {
			this.shell.removeWindow(this);
			return;
		}
		this.onClose().then(b => {
			if (b) {
				this.shell.removeWindow(this);
			}
		});
	}
}

export type ShellOptions = {
	desktop?: Node;
	taskbar?: Taskbar;
	resolution: Size;
}

class shellData {
	html: HTMLDivElement;
	windows = ul();
	windowData = new WeakMap<HTMLDivElement, Window>();
	taskbar: Taskbar | NoTaskbar;
	dragging = false;
	constructor(options?: ShellOptions) {
		const children: Node[] = [], params: Record<string, string> = {"class": "windowsShell"};
		if (options) {
			if (options.desktop) {
				children.push(div({"class": "windowsDesktop"}, options.desktop));
			}
			if (options.resolution) {
				params["--shell-width"] = options.resolution.width.toString() + "px";
				params["--shell-height"] = options.resolution.height.toString() + "px";
			}
			if (options.taskbar) {
				this.taskbar = options.taskbar;
			} else {
				this.taskbar = new NoTaskbar();
			}
		} else {
			this.taskbar = new NoTaskbar();
		}
		if (this.taskbar.onTop) {
			children.push(this.windows, this.taskbar.html);
		} else {
			children.push(this.taskbar.html, this.windows);
		}
		this.html = div(params, children);
	}
	windowMove(w: Window, e: MouseEvent) {
		if (this.dragging) {
			return;
		}
		this.dragging = true;
		const grabX = e.clientX - parseInt(w.html.style.getPropertyValue("--window-left").slice(0, -2)),
		      grabY = e.clientY - parseInt(w.html.style.getPropertyValue("--window-top").slice(0, -2)),
		      mouseMove = (e: MouseEvent) => {
			const x = e.clientX - grabX,
			      y = e.clientY - grabY;
			w.html.style.setProperty("--window-left", x + "px");
			w.html.style.setProperty("--window-top", y + "px");
		      },
		      mouseUp = () => {
			this.html.removeEventListener("mousemove", mouseMove);
			this.html.removeEventListener("mouseup", mouseUp);
			this.dragging = false;
		      };
		this.html.addEventListener("mousemove", mouseMove);
		this.html.addEventListener("mouseup", mouseUp);
	}
	addWindow(title: string, options?: WindowOptions) {
		const content = div({"class": "windowWindowsContent"}),
		      w = new Window(this, title, content, options || {});
		this.windows.appendChild(w.html);
		if (options && (options.showOnTaskbar || options.showMinimise || options.showMinimize)) {
			this.taskbar.addWindow(w);
		}
		this.windowData.set(content, w);
		return content;
	}
	removeWindow(w: Window) {
		this.taskbar.removeWindow(w);
		this.windows.removeChild(w.html);
	}
	minimiseWindow(w: Window) {
		w.html.classList.add("minimised");
		if (this.windows.childNodes.length > 1 && this.windows.firstChild !== w.html) {
			this.windows.insertBefore(w.html, this.windows.firstChild);
		}
		this.taskbar.minimiseWindow(w);
	}
	focusWindow(w: Window) {
		if (this.windows.childNodes.length > 1) {
			this.windows.appendChild(w.html);
		}
	}
}

const shells = new Map<Shell, shellData>();

export class Shell {
	constructor(options?: ShellOptions) {
		shells.set(this, new shellData(options))
	}
	get html() {
		return shells.get(this)!.html;
	}
	addWindow(title: string, options?: WindowOptions) {
		return shells.get(this)!.addWindow(title, options);
	}
	removeWindow(w: HTMLDivElement) {
		const shellData = shells.get(this)!,
		      window = shellData.windowData.get(w);
		if (window) {
			shellData.removeWindow(window);
		}
	}
}

export type Size = {
	width: number;
	height: number;
}

export type WindowOptions = {
	showTitlebar?: boolean;
	icon?: string;
	title?: string;
	showClose?: boolean;
	showMaximise?: boolean;
	showMaximize?: boolean;
	showMinimise?: boolean;
	showMinimize?: boolean;
	resizeable?: boolean;
	size?: Size;
	maximised?: boolean;
	maximized?: boolean;
	showOnTaskbar?: boolean;
	onClose?: () => Promise<boolean>;
}
