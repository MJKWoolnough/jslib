import {button, div, span, style} from './dom.js';

declare const pageLoad: Promise<void>;
pageLoad.then(() => document.head.appendChild(style({"type": "text/css"}, `.windowsShell {
	overflow: hidden;
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
}

.windowsWindowTitlebarClose, .windowsWindowTitlebarMaximise, .windowsWindowTitlebarMinimise {
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
	bottom :0;
}

.windowsWindow:last-child > .windowsWindowFocusGrabber {
	display: none;
}`)));

export enum Side {
	Bottom,
	Left,
	Right,
	Top,
}

class Taskbar {
	onTop: boolean = true;
	hiding: boolean = false;
	side: Side = Side.Bottom;
	html: HTMLDivElement;
	constructor(options: TaskbarOptions | undefined) {
		if (options) {
			this.onTop = options.onTop !== undefined;
			this.hiding = !!options.hiding;
			if (options.side) {
				this.side = options.side;
			}
		}
		let style = "position: absolute;";
		switch (this.side) {
		case Side.Top:
			style += "left: 0; right: 0, top: 0";
			break;
		case Side.Left:
			style += "left: 0; top: 0; bottom: 0;";
			break;
		case Side.Right:
			style += "right: 0; top: 0; bottom: 0;";
			break;
		case Side.Bottom:
		default:
			style += "left: 0; right: 0; bottom: 0";
		}
		this.html = div({"class": "windowsTaskbar", "style": style}, "Taskbar");
	}
}

class Window {
	html: HTMLDivElement;
	shell: Shell;
	constructor(shell: Shell, options: WindowOptions) {
		this.shell = shell;
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
		if (options.showTitlebar) {
			const titlebar: HTMLElement[] = [],
			      controls: HTMLButtonElement[] = [];
			if (options.title) {
				titlebar.push(span(options.title));
			}
			if (options.showClose) {
				controls.push(button("🗙", {"class": "windowsWindowTitlebarClose", "onclick": () => {
					this.shell.removeWindow(this);
				}}));
			}
			if (options.showMaximise || options.showMaximize) {
				controls.push(button("🗖", {"class": "windowsWindowTitlebarMaximise", "onclick": function(this: HTMLButtonElement) {
					if (self.html.classList.toggle("maximised")) {
						this.innerText = "🗗";
					} else {
						this.innerText = "🗖";
					}
				}}));
			}
			if (options.showMinimise || options.showMinimize) {
				controls.push(button("🗕", {"class": "windowsWindowTitlebarMinimise", "onclick": () => {
					this.html.classList.toggle("minimised");
					if (shell.list.childNodes.length > 1) {
						shell.list.insertBefore(this.html, shell.list.firstChild);
					}
				}}));
			}
			if (controls.length > 0) {
				titlebar.push(...controls);
			}
			parts.push(div({"class": "windowsWindowTitlebar", "onmousedown": shell.windowMove.bind(shell, this)}, titlebar));
		}
		parts.push(div({"class": "windowsWindowContent"}, options.html));
		parts.push(div({"class": "windowsWindowFocusGrabber", "onmousedown": () => {
			shell.list.appendChild(this.html);
		}}));
		this.html = div({"class": "windowsWindow", "--window-width": width, "--window-height": height, "--window-top": "0px", "--window-left": "0px"}, parts);
	}
}

class Desktop {
	html: HTMLDivElement;
	constructor(html: Node) {
		this.html = div({"class": "windowsDesktop", "style": "position: absolute; top: 0; bottom: 0; left: 0; right: 0;"}, html);
	}
}

export class Shell {
	html: HTMLDivElement;
	list: HTMLDivElement;
	taskbar?: Taskbar;
	movingWindow = false;
	constructor(options?: ShellOptions) {
		const children: Node[] = [];
		let width = "100%", height = "100%";
		if (options) {
			if (options.desktop) {
				children.push(new Desktop(options.desktop).html);
			}
			if (options.resolution) {
				width = options.resolution.width.toString() + "px";
				height = options.resolution.height.toString() + "px";
			}
		}
		this.list = div();
		children.push(this.list);
		if (options && options.showTaskbar) {
			this.taskbar = new Taskbar(options.taskbarOptions)
			children.push(this.taskbar.html);
		}
		this.html = div({"class": "windowsShell", "style": `position: relative; width: ${width}; height: ${height};`}, children);
	}
	newWindow(options: WindowOptions) {
		const w = new Window(this, options);
		this.list.appendChild(w.html);
		if (options.showOnTaskbar || options.showMinimise || options.showMinimize) {
			// add to taskbar
		}
	}
	removeWindow(w: Window) {
		this.list.removeChild(w.html);
	}
	windowMove(w: Window, e: MouseEvent) {
		if (this.movingWindow) {
			return;
		}
		this.movingWindow = true;
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
			this.movingWindow = false;
		      };
		this.html.addEventListener("mousemove", mouseMove);
		this.html.addEventListener("mouseup", mouseUp);
	}
}

export type TaskbarOptions = {
	onTop?: boolean;
	hiding?: boolean;
	side?: Side;
	resizeable?: boolean;
	moveable?: boolean;
	size?: number;
};

export type ShellOptions = {
	showTaskbar?: boolean;
	taskbarOptions?: TaskbarOptions,
	desktop?: Node;
	resolution?: Size;
}

export type Size = {
	width: number;
	height: number;
}

export type WindowOptions = {
	html: Node;
	showTitlebar?: boolean;
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
}
