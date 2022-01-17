import type {Props} from './dom.js';
import {amendNode, autoFocus} from './dom.js';
import {div, li, span, style, ul} from './html.js';

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
.contextClearer {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
}
`)));

type Options = {
	classes?: string;
	id?: string;
	disabled?: boolean;
}

type i = Options & {
	name: string;
}

export type Item = i & {
	action: () => any;
}

export type Menu = i & {
	list: LList;
}

type Ctx = {
	c: Element;
	r: (a: any) => any;
	d: number;
	t: number;
	f?: HTMLUListElement;
}

type Coords = [[number, number], [number, number]];

export type List = (Item | Menu | List)[];
type LList = (Item | Menu)[];

const mousedownEvent = new MouseEvent("mousedown"),
      keydownEvent = new KeyboardEvent("keydown", {"key": "ArrowDown"}),
      closeEvent = new CustomEvent("contextremove"),
      IsItem = (item: Item | Menu): item is Item => (item as Item).action !== undefined,
      setTO = (ctx: Ctx, fn: () => any) => {
	clearTO(ctx);
	ctx.t = window.setTimeout(() => {
		ctx.t = -1;
		fn()
	}, ctx.d);
      },
      clearTO = (ctx: Ctx) => {
	if (ctx.t !== -1) {
		window.clearTimeout(ctx.t);
		ctx.t = -1;
	}
      },
      placeList = (ctx: Ctx, coords: Coords, list: HTMLUListElement) => {
	clearTO(ctx);
	list.style.setProperty("top", "0");
	list.style.setProperty("left", "0");
	ctx.c.appendChild(list);
	let top = coords[0][1] + list.clientHeight <= ctx.c.clientHeight ? coords[0][1] : coords[1][1] - list.clientHeight;
	if (top < 0) {
		top = 0;
	}
	list.style.setProperty("left", (coords[0][0] + list.clientWidth <= ctx.c.clientWidth ? coords[0][0] : coords[1][0] - list.clientWidth) + "px");
	list.style.setProperty("top", top + "px");
	ctx.f = list;
	autoFocus(list);
      },
      list2HTML = (ctx: Ctx, list: LList, last?: HTMLUListElement): HTMLUListElement => {
	let open: HTMLUListElement | null = null,
	    selected = -1;
	const closeFn = () => {
		if (open) {
			open.remove();
			open = null;
		}
	      },
	      keys = new Map<string, number[]>(),
	      l = ul();
	return amendNode(l, {"class": "contextMenu", "oncontextremove": () => {
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
				ctx.f = last;
				last.focus();
			} else if (mode === -1) {
				l.blur();
			}
			break;
		default:
			const i = keys.get(e.key.toLowerCase());
			if (!i) {
				return false;
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
		}
		return false;
	      }, "onblur": () => {
		if (ctx.f === l) {
			window.setTimeout(() => ctx.r(undefined), 0);
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
		let params: Props,
		    classes = [];
		if (e.disabled) {
			params = {};
			classes.push("contextDisabled");
			if (!IsItem(e)) {
				classes.push("contextSubMenu");
			}
		} else if (IsItem(e)) {
			params = {
				"onmousedown": (f: Event) => {
					ctx.r(e.action());
					f.preventDefault();
				},
				"onmouseover": () => {
					setTO(ctx, () => {
						closeFn();
						ctx.f = l;
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
				e.preventDefault();
				const parentLeft = parseInt((this.parentNode as HTMLUListElement).style.getPropertyValue("left").slice(0, -2)),
				      parentTop = parseInt((this.parentNode as HTMLUListElement).style.getPropertyValue("top").slice(0, -2));
				open = childMenu;
				placeList(ctx, [[parentLeft + this.offsetWidth, parentTop + this.offsetTop], [parentLeft, parentTop + this.offsetTop + this.offsetHeight]], childMenu);
				if (!e.isTrusted) {
					childMenu.dispatchEvent(keydownEvent);
				}
			      },
			      childMenu = amendNode(list2HTML(ctx, e.list, l), {"class": "contextMenu " + (e.classes || "")});
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
		if (e.classes) {
			classes.push(...e.classes.split(" "));
		}
		params["class"] = classes;
		return li(params, name);
	}));
      };

export const item = (name: string, action: () => any, options: Options = {}) => Object.assign({name, action}, options), menu = (name: string, list: List, options: Options = {}) => Object.assign({name, list: list.flat(Infinity)}, options);

export default (c: Element, coords: [number, number], list: List, d: number = 0) => {
	return new Promise(resolve => {
		const ctx: Ctx = {c, r: (data: any) => {
			root.remove();
			cc.remove();
			resolve(data);
		      }, d, t: -1},
		      root = list2HTML(ctx, list.flat(Infinity)),
		      cc = c.appendChild(div({"class": "contextClearer", "tabindex": -1, "onfocus": () => cc.remove()}));
		new MutationObserver((mutations: MutationRecord[]) => mutations.forEach(m => Array.from(m.removedNodes).forEach(n => {
			if (n instanceof HTMLUListElement && n.classList.contains("contextMenu")) {
				n.dispatchEvent(closeEvent);
			}
		}))).observe(c, {"childList": true, "subtree": true});
		placeList(ctx, [coords, coords], root)
	});
}
