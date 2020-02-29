import {div} from './dom.js';
import {SortHTML} from './ordered.js';

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
	html: Node;
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
	html: Node;
	shell: Shell;
	constructor(shell: Shell, options: WindowOptions) {
		this.html = options.html;
		this.shell = shell;
	}
}

class Desktop {
	html: Node;
	constructor(html: Node) {
		this.html = div({"class": "windowsDesktop", "style": "position: absolute; top: 0; bottom: 0; left: 0; right: 0;"}, html);
	}
}

export class Shell {
	list: SortHTML<Desktop | Taskbar | Window>;
	taskbar?: Taskbar;
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
}

export type TaskbarOptions = {
	onTop?: boolean;
	hiding?: boolean;
	side?: Side;
};

export type ShellOptions = {
	showTaskbar?: boolean;
	taskbarOptions?: TaskbarOptions,
	desktop?: Node;
	resolution?: {
		width: number;
		height: number;
	};
}

export type WindowOptions = {
	html: Node;
}
