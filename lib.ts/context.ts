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
	container: Node;
	resolve: (a: any) => any;
	delay: number;
	timeout: number;
}

type Coords = [[number, number], [number, number]];

type List = (Item | Menu)[];

const IsItem = (item: Item | Menu): item is Item => (item as Item).action !== undefined,
      setTO = (ctx: Ctx, fn: () => any) => {
	clearTO(ctx);
	ctx.timeout = window.setTimeout(fn, ctx.delay);
      },
      clearTO = (ctx: Ctx) => {
	if (ctx.timeout !== -1) {
		window.clearTimeout(ctx.timeout);
		ctx.timeout = -1;
	}
      },
      getCoords = (ctx: Ctx, li: HTMLLIElement) => {
	return [[0, 0], [0, 0]] as Coords
      },
      placeList = (ctx: Ctx, coords: Coords, list: HTMLUListElement) => {
	clearTO(ctx);
	ctx.container.appendChild(list);
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
			open = childMenu;
			placeList(ctx, getCoords(ctx, this), childMenu)
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
place = (container: Node, coords: [number, number], list: List, delay: number = 0) => new Promise(resolve => {
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
