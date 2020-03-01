import {button, div, span, style} from './dom.js';
import {SortHTML} from './ordered.js';

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
}`)));

const sorter = (a: Taskbar | Window | Desktop, b: Taskbar | Window | Desktop) => {
	if (a instanceof Desktop) {
		return -1;
	} else if (b instanceof Desktop) {
		return 1;
	} else if (a instanceof Taskbar) {
		return a.onTop ? 1 : -1;
	} else if (b instanceof Taskbar) {
		return b.onTop ? -1 : 1;
	}
	return 0;
};

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
				}}));
			}
			if (controls.length > 0) {
				titlebar.push(...controls);
			}
			parts.push(div({"class": "windowsWindowTitlebar", "onmousedown": shell.windowMove.bind(shell, this)}, titlebar));
		}
		parts.push(div({"class": "windowsWindowContent"}, options.html));
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
	list: SortHTML<Desktop | Taskbar | Window>;
	taskbar?: Taskbar;
	movingWindow = false;
	constructor(options?: ShellOptions) {
		let width: string, height: string;
		if (options && options.resolution) {
			width = options.resolution.width.toString() + "px";
			height = options.resolution.height.toString() + "px";
		} else {
			width = "100%";
			height = "100%";
		}
		this.list = new SortHTML<Desktop | Taskbar | Window>(div({"class": "windowsShell", "style": `position: relative; width: ${width}; height: ${height};`}), sorter);
		if (options) {
			if (options.desktop) {
				this.list.push(new Desktop(options.desktop));
			}
			if (options.showTaskbar) {
				this.taskbar = new Taskbar(options.taskbarOptions)
				this.list.push(this.taskbar);
			}
		}
	}
	get html() {
		return this.list.html;
	}
	newWindow(options: WindowOptions) {
		const w = new Window(this, options);
		this.list.push(w);
		if (options.showOnTaskbar || options.showMinimise || options.showMinimize) {
			// add to taskbar
		}
	}
	removeWindow(w: Window) {
		const pos = this.list.indexOf(w);
		if (pos >= 0) {
			this.list.splice(pos, 1);

		}
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
			this.list.html.removeEventListener("mousemove", mouseMove);
			this.list.html.removeEventListener("mouseup", mouseUp);
			this.movingWindow = false;
		      };
		this.list.html.addEventListener("mousemove", mouseMove);
		this.list.html.addEventListener("mouseup", mouseUp);
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
