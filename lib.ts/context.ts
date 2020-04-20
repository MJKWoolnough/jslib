import {autoFocus, createHTML} from './dom.js';
import {li, span, style, ul} from './html.js';

declare const pageLoad: Promise<void>;
pageLoad.then(() => document.head.appendChild(style({"type": "text/css"}, `
.contextMenu {
	position: absolute;
	background-color: #ddd;
	color: #000;
	list-style: none;
	padding-left: 0;
	margin: 0;
	user-select: none;
	outline: none;
}

.contextMenu li:hover, .contextSelected {
	background-color: #aaa;
}

.contextSubMenu:after {
	content: "»";
}
`)));

type Item = {
	name: string;
	action: () => any;
}

type Menu = {
	name: string;
	list: List;
}

type Ctx = {
	container: Element;
	resolve: (a: any) => any;
	delay: number;
	timeout: number;
	focus?: HTMLUListElement;
}

type Coords = [[number, number], [number, number]];

type List = (Item | Menu)[];

const mousedownEvent = new CustomEvent("mousedown"),
      closeEvent = new CustomEvent("contextremove"),
      IsItem = (item: Item | Menu): item is Item => (item as Item).action !== undefined,
      setTO = (ctx: Ctx, fn: () => any) => {
	clearTO(ctx);
	ctx.timeout = window.setTimeout(() => {
		ctx.timeout = -1;
		fn()
	}, ctx.delay);
      },
      clearTO = (ctx: Ctx) => {
	if (ctx.timeout !== -1) {
		window.clearTimeout(ctx.timeout);
		ctx.timeout = -1;
	}
      },
      placeList = (ctx: Ctx, coords: Coords, list: HTMLUListElement) => {
	clearTO(ctx);
	list.style.setProperty("top", "0");
	list.style.setProperty("left", "0");
	ctx.container.appendChild(list);
	if (coords[0][0] + list.clientWidth <= ctx.container.clientWidth) {
		list.style.setProperty("left", coords[0][0] + "px");
	} else {
		list.style.setProperty("left", (coords[1][0] - list.clientWidth) + "px");
	}
	if (coords[0][1] + list.clientHeight <= ctx.container.clientHeight) {
		list.style.setProperty("top", coords[0][1] + "px");
	} else {
		list.style.setProperty("top", (coords[1][1] - list.clientHeight) + "px");
	}
	ctx.focus = list;
	autoFocus(list);
      },
      list2HTML = (ctx: Ctx, list: List, last?: HTMLUListElement): HTMLUListElement => {
	let open: HTMLUListElement | null = null,
	    selected = -1;
	const closeFn = () => {
		if (open) {
			ctx.container.removeChild(open);
			open = null;
		}
	      },
	      l = ul();
	createHTML(l, {"class": "contextMenu", "oncontextremove": closeFn, "tabindex": "-1", "onkeyup": (e: KeyboardEvent) => {
		switch (e.key) {
		case "ArrowDown":
			if (selected >= 0) {
				(l.childNodes[selected] as HTMLLIElement).classList.remove("contextSelected");
			}
			selected++;
			if (selected >= l.childNodes.length) {
				selected = 0;
			}
			(l.childNodes[selected] as HTMLLIElement).classList.add("contextSelected");
			break;
		case "ArrowUp":
			if (selected >= 0) {
				(l.childNodes[selected] as HTMLLIElement).classList.remove("contextSelected");
			}
			selected--;
			if (selected < 0) {
				selected = l.childNodes.length - 1;
			}
			(l.childNodes[selected] as HTMLLIElement).classList.add("contextSelected");
			break;
		case "ArrowRight":
			if (selected >= 0 && (l.childNodes[selected] as HTMLLIElement).classList.contains("contextSubMenu")) {
				(l.childNodes[selected] as HTMLLIElement).dispatchEvent(mousedownEvent);
			}
			break;
		case "Enter":
			if (selected >= 0) {
				(l.childNodes[selected] as HTMLLIElement).dispatchEvent(mousedownEvent);
			}
			break;
		case "ArrowLeft":
			if (last) {
				ctx.focus = last;
				last.focus();
			}
			break;
		case "Escape":
			if (last) {
				ctx.focus = last;
				last.focus();
			} else {
				l.blur();
			}
			break;
		}
	      }, "onblur": () => {
		if (ctx.focus === l) {
			window.setTimeout(() => ctx.resolve(undefined), 0);
		}
	      }, "onfocus": closeFn}, list.map(e => {
		if (IsItem(e)) {
			return li({"onmousedown": () => ctx.resolve(e.action()), "onmouseover": () => {
				setTO(ctx, closeFn);
				ctx.focus = l;
				l.focus();
			}}, e.name);
		}
		const openFn = function(this: HTMLLIElement) {
			if (open) {
				ctx.container.removeChild(open);
			}
			const parentLeft = parseInt((this.parentNode as HTMLUListElement).style.getPropertyValue("left").slice(0, -2)),
			      parentTop = parseInt((this.parentNode as HTMLUListElement).style.getPropertyValue("top").slice(0, -2));
			open = childMenu;
			placeList(ctx, [[parentLeft + this.offsetWidth, parentTop + this.offsetTop], [parentLeft, parentTop + this.offsetTop + this.offsetHeight]], childMenu);
		      },
		      childMenu = list2HTML(ctx, e.list, l);
		return li({
			"class": "contextSubMenu",
			"onmousedown": openFn,
			"onmouseover": function(this: HTMLLIElement) {
				setTO(ctx, openFn.bind(this))
			},
			"onmouseout": () => clearTO(ctx),
		}, span(e.name));
	      }));
	return l;
      };

export const item = (name: string, action: () => any) => ({name, action}), menu = (name: string, list: List) => ({name, list}),
place = (container: Element, coords: [number, number], list: List, delay: number = 0) => new Promise(resolve => {
	const ctx: Ctx = {container, resolve: (data: any) => {
		container.removeChild(root);
		resolve(data);
	      }, delay: delay, timeout: -1},
	      root = list2HTML(ctx, list);
	new MutationObserver((mutations: MutationRecord[], o: MutationObserver) => mutations.forEach(m => Array.from(m.removedNodes).forEach(n => {
		if (n instanceof HTMLUListElement && n.classList.contains("contextMenu")) {
			n.dispatchEvent(closeEvent);
		}
	}))).observe(container, {"childList": true, "subtree": true});
	placeList(ctx, [coords, coords], root)
});
