import {createHTML, clearElement} from './html.js';
import {button, div, img, input, span, style, ul, li} from './dom.js';

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

.windowsDragging {
	user-select: none;
}

.windowsDesktop {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
}

.windowsWindow {
	--window-width: auto;
	--window-height: auto;
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

.windowsWindow.windowsResizable {
	padding: 1px;
	border-width: 0;
}

.windowsResizer {
	position: absolute;
	border-color: #000;
	border-style: solid;
	border-width: 0;
	z-index: -1;
}

.windowsResizerTopLeft {
	top: -2px;
	left: -2px;
	width: 10px;
	height: 10px;
	cursor: nwse-resize;
	border-left-width: 3px;
	border-top-width: 3px;
}

.windowsResizerTop {
	top: -2px;
	left: 8px;
	right: 8px;
	border-top-width: 3px;
	cursor: ns-resize;
}

.windowsResizerTopRight {
	top: -2px;
	right: -2px;
	width: 10px;
	height: 10px;
	border-top-width: 3px;
	border-right-width: 3px;
	cursor: nesw-resize;
}

.windowsResizerRight {
	top: 8px;
	right: -2px;
	bottom: 8px;
	border-right-width: 3px;
	cursor: ew-resize;
}

.windowsResizerBottomRight {
	bottom: -2px;
	right: -2px;
	width: 10px;
	height: 10px;
	border-right-width: 3px;
	border-bottom-width: 3px;
	cursor: nwse-resize;
}

.windowsResizerBottom {
	bottom: -2px;
	left: 8px;
	right: 8px;
	border-bottom-width: 3px;
	cursor: ns-resize;
}

.windowsResizerBottomLeft {
	bottom: -2px;
	left: -2px;
	width: 10px;
	height: 10px;
	border-left-width: 3px;
	border-bottom-width: 3px;
	cursor: nesw-resize;
}

.windowsResizerLeft {
	top: 8px;
	left: -2px;
	bottom: 8px;
	border-left-width: 3px;
	cursor: ew-resize;
}

.windowsMinimised {
	display: none;
}

.windowsMaximised {
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
	background-repeat: no-repeat;
	background-position: center;
	background-color: #eee;
	background-size: 1em 1em;
	width: calc(1em + 8px);
	height: calc(1em + 8px);
}

.windowsWindowFocusGrabber {
	position: absolute;
	background-color: RGBA(0, 0, 0, 0.1);
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}

.windowsResizable .windowsWindowFocusGrabber {
	top: -2px;
	left: -2px;
	right: -2px;
	bottom: -2px;
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

.windowsTaskbarTop {
	top: 0;
	left: 0;
	right: 0;
	height: calc(1em + 8px);
	border-bottom: 1px solid #aaa;
	overflow-y: scroll;
}

.windowsTaskbar {
	position: absolute;
	list-style: none;
	padding: 0;
	margin: 0;
	user-select: none;
}

.windowsTaskbar > li {
	float: left;
	margin-right: 2px;
	padding: 2px;
	border: 1px solid #000;
}

.windowsTaskbarBottom.windowsTaskbarAutohide:not(:hover) {
	bottom: calc(-1em - 8px);
	border-top-width: 3px;
}

.windowsTaskbarTop.windowsTaskbarAutohide:not(:hover) {
	top: calc(-1em - 8px);
	border-bottom-width: 3px;
}

.windowsTaskbar > li > img {
	height: 1em;
}

.windowsWindowTitlebarClose {
	background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAS0lEQVR4AbXUMQoAIBTDUO9/6Tq5h2A+uNU3SP2nmr3z6+4kOgpOYAMBgYEgzgiUYBzlmETVeKwH+/dTqK9NUuzg6zXLoV9fvhHFXORcm2UE7mcvAAAAAElFTkSuQmCC);
}

.windowsWindowTitlebarMinimise {
	background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGklEQVR4AWMY+mAUjIJRMAr+U4KHgIFDBgAAtIAv0S+OoIsAAAAASUVORK5CYII=);
}

.windowsWindowTitlebarMaximise {
	background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAIElEQVR4AWMY2eA/JXioGkgmoMjAUQNHDRw1kCI8ZAAAn3lVqxSpx3UAAAAASUVORK5CYII=);
}

.windowsMaximised .windowsWindowTitlebarMaximise {
	background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAALElEQVR4AWNABqPgPyl4gAwkEgwdAykPM/obSCQYGgaiYxolk1EDScJDFgAAUOdXqbMbROIAAAAASUVORK5CYII=);
}

.windowsAlert div:last-child, .windowsConfirm div:last-child, .windowsPrompt div:last-child {
	text-align: center;
}
`)));

export enum Side {
	Bottom,
//	Left,
//	Right,
	Top,
}

const shells = new WeakMap<Shell, shellData>(),
      taskbars = new WeakMap<Taskbar, taskbarData>(),
      noPropagation = (e: Event) => e.stopPropagation(),
      closeTrue = () => Promise.resolve(true),
      noIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAG1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUUeIgAAAACXRSTlMA/84W08jxyb+UzoCKAAAAdklEQVR4Ae3RAQaAQBCF4WFPsAkBkAAIe4F0ko7Q/SEExHuZhcL/A/B5zARRVN2cJ+MqiN7f9jRpYsaQImYMCTHjiJhxRMw4ImYcETOOiBlPog1pUpYUucuQwxPddwQCOeujqYNwZL7PkXklBAKBQF7qIn+O6ALn8CGyjt4s2QAAAABJRU5ErkJggg==",
      windowWidth = "--window-width",
      windowHeight = "--window-height",
      windowTop = "--window-top",
      windowLeft = "--window-left";

type taskbarData = {
	html: HTMLUListElement;
	windows: Map<Window, windowDetails>;
	onTop: boolean;
};

export class Taskbar {
	constructor(side: Side, stayOnTop = false, autoHide = false) {
		let classes = "windowsTaskbar";
		switch (side) {
		case Side.Top:
			classes += " windowsTaskbarTop";
			break;
/*		case Side.Left:
			classes += " windowsTaskbarLeft";
			break;
		case Side.Right:
			classes += " windowsTaskbarRight";
			break;*/
		case Side.Bottom:
		default:
			classes += " windowsTaskbarBottom";
		}
		if (autoHide) {
			classes += " windowsTaskbarAutohide";
		}
		taskbars.set(this, {
			html: ul({"class": classes}),
			windows: new Map<Window, windowDetails>(),
			onTop: stayOnTop
		});
	}
	get html() {
		return taskbars.get(this)!.html;
	}
	get onTop() {
		return taskbars.get(this)!.onTop;
	}
	addWindow(w: Window) {
		const self = taskbars.get(this)!;
		self.windows.set(w, {item: self.html.appendChild(li({"onclick": () => {
			if (!w.html.nextElementSibling || w.html.classList.contains("windowsMinimised")) {
				w.onMinimiseToggle()
			} else {
				w.onFocus();
			}
		}}, [
			w.icon ? img({"src": w.icon}) : [],
			span(w.title)
		]))});
	}
	minimiseWindow(w: Window) {}
	removeWindow(w: Window) {
		const self = taskbars.get(this)!;
		self.html.removeChild(self.windows.get(w)!.item!);
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
			w.icon ? img({"src": w.icon}) : [],
			span(w.title),
			w.onClose ? button({"class": "windowsWindowTitlebarClose", "onclick": w.onExit.bind(w)}) : [],
			button({"class": "windowsWindowTitlebarMaximise", "onclick": this.restoreWindow.bind(this, w)}),
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

class Window {
	html: HTMLLIElement;
	shell: shellData;
	onClose?: () => Promise<boolean>;
	icon = noIcon;
	title: string;
	maximiseButton?: HTMLButtonElement;
	parent: Window | null = null;
	child: Window | null = null;
	constructor(shell: shellData, title: string, content: HTMLDivElement, options: WindowOptions) {
		this.shell = shell;
		this.title = title;
		const params: Record<string, string> = {
			"class": "windowsWindow"
		      },
		      parts: HTMLElement[] = [];
		if (options.resizeable) {
			params["class"] += " windowsResizable";
			parts.push(..."TopRight Top TopLeft Left BottomLeft Bottom BottomRight Right".split(" ").map((d, n) => div({"class": `windowsResizer windowsResizer${d}`, "onmousedown": shell.resizeWindow.bind(shell, this, n)})));
		}
		if (options.size) {
			params[windowWidth] = options.size.width.toString() + "px";
			params[windowHeight] = options.size.height.toString() + "px";
		}
		if (options.position) {
			params[windowLeft] = options.position.x.toString() + "px";
			params[windowTop] = options.position.y.toString() + "px";
		} else {
			params[windowLeft] = "0px";
			params[windowTop] = "0px";
		}
		if (options.icon) {
			this.icon = options.icon;
		} else if (options.icon === "") {
			this.icon = "";
		}
		if (options.showTitlebar) {
			const controls: HTMLButtonElement[] = [],
			      tbobj: Record<string, string | Function> = {
				"class": "windowsWindowTitlebar",
				"onmousedown": shell.windowMove.bind(shell, this)
			      };
			if (options.showClose) {
				controls.push(button({"class": "windowsWindowTitlebarClose", "onclick": this.onExit.bind(this), "onmousedown": noPropagation}));
				this.onClose = closeTrue;
			}
			if (options.showMaximise || options.showMaximize) {
				controls.push(this.maximiseButton = button({"class": "windowsWindowTitlebarMaximise" + (options.maximised || options.maximized ? " windowsMaximised" : ""), "onclick": this.onMaximiseToggle.bind(this), "onmousedown": noPropagation}));
				tbobj["ondblclick"] = this.onMaximiseToggle.bind(this);
			}
			if (options.showMinimise || options.showMinimize) {
				controls.push(button({"class": "windowsWindowTitlebarMinimise", "onclick": this.onMinimiseToggle.bind(this), "onmousedown": noPropagation}));
			}
			parts.push(div(tbobj, [
				this.icon ? img({"src": this.icon}) : [],
				span(title),
				controls
			]));
		}
		if (options.onClose) {
			this.onClose = options.onClose;
		}
		parts.push(content);
		parts.push(div({"class": "windowsWindowFocusGrabber", "onmousedown": this.onFocus.bind(this)}));
		this.html = li(params, parts);
	}
	onMinimiseToggle() {
		if (this.html.classList.toggle("windowsMinimised")) {
			this.shell.minimiseWindow(this);
		} else {
			this.shell.focusWindow(this);
		}
	}
	onMaximiseToggle() {
		if (this.maximiseButton) {
			this.html.classList.toggle("windowsMaximised");
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
		const grabX = e.clientX - parseInt(w.html.style.getPropertyValue(windowLeft).slice(0, -2)),
		      grabY = e.clientY - parseInt(w.html.style.getPropertyValue(windowTop).slice(0, -2)),
		      mouseMove = (e: MouseEvent) => {
			const x = e.clientX - grabX,
			      y = e.clientY - grabY;
			w.html.style.setProperty(windowLeft, x + "px");
			w.html.style.setProperty(windowTop, y + "px");
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
	addDialog(w: Window, options?: DialogOptions) {
		while (w.child) {
			w = w.child;
		}
		const dOptions = options ? {
			"showTitlebar": options.showTitlebar,
			"icon": options.icon,
			"showClose": options.showClose,
			"size": options.size,
			"position": options.position,
			"onClose": options.onClose
		      } : {};
		if (options === undefined || options.position === undefined) {
			dOptions["position"] = {
				"x": parseInt(w.html.style.getPropertyValue(windowLeft).slice(0, -2)),
				"y": parseInt(w.html.style.getPropertyValue(windowTop).slice(0, -2))
			};
		}
		const content = div({"class": "windowWindowsContent"}),
		      d = new Window(this, (options && options.title) || "", content, dOptions);
		d.html.classList.add("windowsDialog");
		this.windows.appendChild(d.html);
		this.windowData.set(content, d);
		w.child = d;
		d.parent = w;
		return content;
	}
	removeWindow(w: Window) {
		if (w.child) {
			this.focusWindow(w.child);
			return;
		}
		if (w.parent) {
			w.parent.child = null;
		}
		if (w.parent === null) {
			this.taskbar.removeWindow(w);
		}
		this.windows.removeChild(w.html);
	}
	minimiseWindow(w: Window) {
		w.html.classList.add("windowsMinimised");
		if (this.windows.childNodes.length > 1 && this.windows.firstChild !== w.html) {
			this.windows.insertBefore(w.html, this.windows.firstChild);
		}
		this.taskbar.minimiseWindow(w);
	}
	focusWindow(w: Window) {
		if (this.windows.childNodes.length > 1) {
			while (w.child) {
				w = w.child;
			}
			this.windows.appendChild(w.html);
		}
	}
	resizeWindow(w: Window, direction: number, e: MouseEvent) {
		if (this.dragging) {
			return;
		}
		this.dragging = true;
		this.html.classList.add("windowsDragging");
		const originalLeft = parseInt(w.html.style.getPropertyValue(windowLeft).slice(0, -2)),
		      originalTop = parseInt(w.html.style.getPropertyValue(windowTop).slice(0, -2)),
		      originalWidth = w.html.offsetWidth,
		      originalHeight = w.html.offsetHeight,
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
						w.html.style.setProperty(windowTop, `${originalTop + dy}px`);
						w.html.style.setProperty(windowHeight, `${height}px`);
					}
				}
				break;
				case 4:
				case 5:
				case 6: {
					const height = originalHeight + dy;
					if (height > 100) {
						w.html.style.setProperty(windowHeight, `${height}px`);
					}
				}
			}
			switch (direction) {
				case 0:
				case 7:
				case 6: {
					const width = originalWidth + dx;
					if (width > 100) {
						w.html.style.setProperty(windowWidth, `${width}px`);
					}
				}
				break;
				case 2:
				case 3:
				case 4: {
					const width = originalWidth - dx;
					if (width > 100) {
						w.html.style.setProperty(windowLeft, `${originalLeft + dx}px`);
						w.html.style.setProperty(windowWidth, `${originalWidth - dx}px`);
					}
				}
			}
		      },
		      mouseUp = () => {
			this.html.removeEventListener("mousemove", mouseMove);
			this.html.removeEventListener("mouseup", mouseUp);
			this.dragging = false;
			this.html.classList.remove("windowsDragging");
		      };
		this.html.addEventListener("mousemove", mouseMove);
		this.html.addEventListener("mouseup", mouseUp);
	}
	getWindow(w: HTMLDivElement) {
		const window = this.windowData.get(w);
		if (window) {
			return window;
		}
		throw new Error("invalid Window");
	}
}

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
	addDialog(w: HTMLDivElement, options?: DialogOptions) {
		const shellData = shells.get(this)!;
		return shellData.addDialog(shellData.getWindow(w), options);
	}
	alert(w: HTMLDivElement, title: string, message: string, icon?: string) {
		if (icon === undefined) {
			icon = noIcon;
		}
		const self = this;
		return new Promise<boolean>(resolve => createHTML(this.addDialog(w, {
			"title": title,
			"showTitlebar": true,
			"icon": icon,
			"showClose": true,
			"onClose": () => {
				resolve(false);
				return Promise.resolve(true);
			}
		}), {"class": "windowsAlert"}, [
			div(message),
			div(button("Ok", {"onclick": function (this: HTMLButtonElement) {
				self.removeWindow(this.parentNode!.parentNode as HTMLDivElement);
				resolve(true);
			}}))
		]));
	}
	confirm(w: HTMLDivElement, title: string, message: string, icon?: string) {
		if (icon === undefined) {
			icon = noIcon;
		}
		const self = this;
		return new Promise<boolean>(resolve => createHTML(this.addDialog(w, {
			"title": title,
			"showTitlebar": true,
			"icon": icon,
			"showClose": true,
			"onClose": () => {
				resolve(false);
				return Promise.resolve(true);
			}
		}), {"class": "windowsConfirm"}, [
			div(message),
			div([
				button("Ok", {"onclick": function (this: HTMLButtonElement) {
					self.removeWindow(this.parentNode!.parentNode as HTMLDivElement);
					resolve(true);
				}}),
				button("Cancel", {"onclick": function(this: HTMLButtonElement) {
					self.removeWindow(this.parentNode!.parentNode as HTMLDivElement);
					resolve(false);
				}})
			])
		]));
	}
	prompt(w: HTMLDivElement, title: string, message: string, defaultValue?: string, icon?: string) {
		if (icon === undefined) {
			icon = noIcon;
		}
		const self = this,
		      data = input({"value": defaultValue || ""});
		return new Promise<string|null>(resolve => createHTML(this.addDialog(w, {
			"title": title,
			"showTitlebar": true,
			"icon": icon,
			"showClose": true,
			"onClose": () => {
				resolve(null);
				return Promise.resolve(true);
			}
		}), {"class": "windowsPrompt"}, [
			div(message),
			data,
			div([
				button("Ok", {"onclick": function (this: HTMLButtonElement) {
					self.removeWindow(this.parentNode!.parentNode as HTMLDivElement);
					resolve(data.value);
				}}),
				button("Cancel", {"onclick": function(this: HTMLButtonElement) {
					self.removeWindow(this.parentNode!.parentNode as HTMLDivElement);
					resolve(null);
				}})
			])
		]));
	}
	moveWindow(w: HTMLDivElement, pos: Position) {
		const window = shells.get(this)!.getWindow(w);
		window.html.style.setProperty(windowLeft, `${pos.x}px`);
		window.html.style.setProperty(windowTop, `${pos.y}px`);
	}
	resizeWindow(w: HTMLDivElement, size: Size) {
		const window = shells.get(this)!.getWindow(w);
		window.html.style.setProperty(windowWidth, `${size.width}px`);
		window.html.style.setProperty(windowHeight, `${size.height}px`);
	}
	removeWindow(w: HTMLDivElement) {
		const shellData = shells.get(this)!;
		shellData.removeWindow(shellData.getWindow(w));
	}
}

export type Size = {
	width: number;
	height: number;
}

export type Position = {
	x: number;
	y: number;
}

export type WindowOptions = {
	showTitlebar?: boolean;
	icon?: string;
	showClose?: boolean;
	showMaximise?: boolean;
	showMaximize?: boolean;
	showMinimise?: boolean;
	showMinimize?: boolean;
	resizeable?: boolean;
	size?: Size;
	position?: Position;
	maximised?: boolean;
	maximized?: boolean;
	showOnTaskbar?: boolean;
	onClose?: () => Promise<boolean>;
}

export type DialogOptions = {
	showTitlebar?: boolean;
	title?: string;
	icon?: string;
	showClose?: boolean;
	size?: Size;
	position?: Position;
	onClose?: () => Promise<boolean>;
}
