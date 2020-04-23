import {autoFocus, createHTML, Props} from './dom.js';
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

.contextMenu li:not(.contextDisabled):hover, .contextSelected {
	background-color: #aaa;
}

.contextSubMenu:after {
	content: "»";
}

.contextMenu span {
	text-decoration: underline;
}

.contextDisabled {
	color: #aaa;
}
`)));

type i = {
	name: string;
	class?: string;
	id?: string;
	disabled?: boolean;
}

type Item = i & {
	action: () => any;
}

type Menu = i & {
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

const mousedownEvent = new MouseEvent("mousedown"),
      keydownEvent = new KeyboardEvent("keydown", {"key": "ArrowDown"}),
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
		if (open && open.parentNode) {
			open.parentNode.removeChild(open);
			open = null;
		}
	      },
	      keys = new Map<string, number[]>(),
	      l = ul();
	return createHTML(l, {"class": "contextMenu", "oncontextremove": () => {
		closeFn();
		if (selected >= 0) {
			(l.childNodes[selected] as HTMLLIElement).classList.remove("contextSelected");
			selected = -1;
		}
	}, "tabindex": "-1", "onkeydown": (e: KeyboardEvent) => {
		let mode: -1 | 1 = -1;
		switch (e.key) {
		case "ArrowDown":
			mode = 1;
		case "ArrowUp":
			if (selected >= 0) {
				(l.childNodes[selected] as HTMLLIElement).classList.remove("contextSelected");
			}
			for (let a = 0; a < list.length; a++) {
				selected += mode;
				if (selected < 0) {
					selected = l.childNodes.length - 1;
				} else if (selected >= l.childNodes.length) {
					selected = 0;
				}
				if (!(l.childNodes[selected] as HTMLLIElement).classList.contains("contextDisabled")) {
					(l.childNodes[selected] as HTMLLIElement).classList.add("contextSelected");
					break;
				}
			}
			break;
		case "ArrowRight":
			if (selected < 0 || !(l.childNodes[selected] as HTMLLIElement).classList.contains("contextSubMenu")) {
				break;
			}
		case "Enter":
			if (selected >= 0) {
				(l.childNodes[selected] as HTMLLIElement).dispatchEvent(mousedownEvent);
			}
			break;
		case "ArrowLeft":
			mode = 1;
		case "Escape":
			if (last) {
				ctx.focus = last;
				last.focus();
			} else if (mode === -1) {
				l.blur();
			}
			break;
		default:
			const i = keys.get(e.key.toLowerCase());
			if (!i) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			if (selected >= 0) {
				(l.childNodes[selected] as HTMLLIElement).classList.remove("contextSelected");
			}
			if (i.length === 1) {
				selected = i[0];
				(l.childNodes[selected] as HTMLLIElement).dispatchEvent(mousedownEvent);
			} else {
				if (!i.some(j => {
					if (j > selected) {
						selected = j;
						return true;
					}
					return false;
				})) {
					selected = i[0];
				};
			}
			(l.childNodes[selected] as HTMLLIElement).classList.add("contextSelected");
			return false;
		}
	      }, "onblur": () => {
		if (ctx.focus === l) {
			window.setTimeout(() => ctx.resolve(undefined), 0);
		}
	      }, "onfocus": closeFn}, list.map((e, n) => {
		let name: (string | HTMLSpanElement)[] = [e.name];
		const ampPos = (name[0] as string).indexOf("&"),
		      nextChar = (name[0] as string).charAt(ampPos + 1).toLowerCase();
		if (ampPos >= 0 && nextChar !== " " && nextChar !== "") {
			name = [
				(name[0] as string).slice(0, ampPos),
				span((name[0] as string).charAt(ampPos + 1)),
				(name[0] as string).slice(ampPos+2)
			];
			if (!e.disabled) {
				if (keys.has(nextChar)) {
					keys.get(nextChar)!.push(n);
				} else {
					keys.set(nextChar, [n]);
				}
			}
		}
		let params: Props, classes = [];
		if (e.disabled) {
			params = {};
			classes.push("contextDisabled");
			if (IsItem(e)) {
				classes.push("contextSubMenu");
			}
		} else if (IsItem(e)) {
			params = {
				"onmousedown": () => ctx.resolve(e.action()),
				"onmouseover": () => {
					setTO(ctx, () => {
						closeFn();
						ctx.focus = l;
						l.focus();
					});
					if (selected >= 0) {
						(l.childNodes[selected] as HTMLLIElement).classList.remove("contextSelected");
						selected = -1;
					}
				}
			};
		} else {
			const openFn = function(this: HTMLLIElement, e: MouseEvent) {
				closeFn();
				const parentLeft = parseInt((this.parentNode as HTMLUListElement).style.getPropertyValue("left").slice(0, -2)),
				      parentTop = parseInt((this.parentNode as HTMLUListElement).style.getPropertyValue("top").slice(0, -2));
				open = childMenu;
				placeList(ctx, [[parentLeft + this.offsetWidth, parentTop + this.offsetTop], [parentLeft, parentTop + this.offsetTop + this.offsetHeight]], childMenu);
				if (!e.isTrusted) {
					childMenu.dispatchEvent(keydownEvent);
				}
			      },
			      childMenu = list2HTML(ctx, e.list, l);
			classes.push("contextSubMenu");
			params = {
				"onmousedown": openFn,
				"onmouseover": function(this: HTMLLIElement, e: MouseEvent) {
					setTO(ctx, openFn.bind(this, e))
					if (selected >= 0) {
						(l.childNodes[selected] as HTMLLIElement).classList.remove("contextSelected");
						selected = -1;
					}
				},
				"onmouseout": () => clearTO(ctx),
			};
		}
		if (e.id) {
			params["id"] = e.id;
		}
		if (e.class) {
			classes.push(...e.class.split(" "));
		}
		params["class"] = classes;
		return li(params, name);
	}));
      };

export const item = (name: string, action: () => any) => ({name, action}), menu = (name: string, list: List) => ({name, list});
export default function (container: Element, coords: [number, number], list: List, delay: number = 0) {
	return new Promise(resolve => {
		const ctx: Ctx = {container, resolve: (data: any) => {
			if (root.parentNode) {
				root.parentNode.removeChild(root);
			}
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
};
