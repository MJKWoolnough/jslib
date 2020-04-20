import {li, span, style, ul} from './html.js';

declare const pageLoad: Promise<void>;
pageLoad.then(() => document.head.appendChild(style({"type": "text/css"}, `
.contextMenu {
	position: absolute;
	background-color: #ddd;
	color: #000;
	list-style: none;
	padding-left: 0;
	user-select: none;
}

.contextMenu li:hover {
	background-color: #aaa;
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
}

type Coords = [[number, number], [number, number]];

type List = (Item | Menu)[];

const IsItem = (item: Item | Menu): item is Item => (item as Item).action !== undefined,
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
      },
      list2HTML = (ctx: Ctx, list: List): HTMLUListElement => {
	let open: HTMLUListElement | null = null;
	const l = ul({"class": "contextMenu", "oncontextremove": () => {
		if (open) {
			ctx.container.removeChild(open);
		}
	      }}, list.map(e => {
		if (IsItem(e)) {
			return li({"onclick": () => ctx.resolve(e.action())}, e.name);
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
		      childMenu = list2HTML(ctx, e.list);
		return li({
			"class": "contextSubMenu",
			"onclick": openFn,
			"onmouseover": () => setTO(ctx, openFn),
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
	      root = list2HTML(ctx, list),
	      closeEvent = new CustomEvent("contextremove");
	new MutationObserver((mutations: MutationRecord[], o: MutationObserver) => mutations.forEach(m => Array.from(m.removedNodes).forEach(n => {
		if (n instanceof HTMLUListElement && n.classList.contains("contextMenu")) {
			n.dispatchEvent(closeEvent);
		}
		if (n === root) {
			o.disconnect();
			resolve(undefined);
		}
	}))).observe(container, {"childList": true, "subtree": true});
	placeList(ctx, [coords, coords], root)
});
