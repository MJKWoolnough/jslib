import {autoFocus, createHTML} from './dom.js';
import {li, span, style, ul} from './html.js';

pageLoad.then(() => document.head.appendChild(style({"type": "text/css"}, `.contextMenu{position:absolute;background-color:#ddd;color:#000;list-style:none;padding-left:0;margin:0;user-select:none;outline:0}.contextMenu li:hover,.contextSelected{background-color:#aaa}.contextSubMenu:after{content:"»"}.contextMenu span{text-decoration:underline}.contextDisabled{color:#aaa}`)));

const mousedownEvent = new MouseEvent("mousedown"),
      keydownEvent = new KeyboardEvent("keydown", {"key": "ArrowDown"}),
      closeEvent = new CustomEvent("contextremove"),
      IsItem = item => item.action !== undefined,
      setTO = (ctx, fn) => {
	clearTO(ctx);
	ctx.timeout = window.setTimeout(() => {
		ctx.timeout = -1;
		fn()
	}, ctx.delay);
      },
      clearTO = ctx => {
	if (ctx.timeout !== -1) {
		window.clearTimeout(ctx.timeout);
		ctx.timeout = -1;
	}
      },
      placeList = (ctx, coords, list) => {
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
      list2HTML = (ctx, list, last) => {
	let open = null,
	    selected = -1;
	const closeFn = () => {
		if (open && open.parentNode) {
			open.parentNode.removeChild(open);
			open = null;
		}
	      },
	      keys = new Map(),
	      l = ul();
	return createHTML(l, {"class": "contextMenu", "oncontextremove": () => {
		if (selected >= 0) {
			l.childNodes[selected].classList.remove("contextSelected");
			selected = -1;
		}
		closeFn();
	}, "tabindex": "-1", "onkeydown": e => {
		let mode = -1;
		switch (e.key) {
		case "ArrowDown":
			mode = 1;
		case "ArrowUp":
			if (selected >= 0) {
				l.childNodes[selected].classList.remove("contextSelected");
			}
			for (let a = 0; a < list.length; a++) {
				selected += mode;
				if (selected < 0) {
					selected = l.childNodes.length - 1;
				} else if (selected >= l.childNodes.length) {
					selected = 0;
				}
				if (!l.childNodes[selected].classList.contains("contextDisabled")) {
					l.childNodes[selected].classList.add("contextSelected");
					break;
				}
			}
			break;
		case "ArrowRight":
			if (selected < 0 || !l.childNodes[selected].classList.contains("contextSubMenu")) {
				break;
			}
		case "Enter":
			if (selected >= 0) {
				l.childNodes[selected].dispatchEvent(mousedownEvent);
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
				l.childNodes[selected].classList.remove("contextSelected");
			}
			if (i.length === 1) {
				selected = i[0];
				l.childNodes[selected].dispatchEvent(mousedownEvent);
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
			l.childNodes[selected].classList.add("contextSelected");
			return false;
		}
	      }, "onblur": () => {
		if (ctx.focus === l) {
			window.setTimeout(() => ctx.resolve(undefined), 0);
		}
	      }, "onfocus": closeFn}, list.map((e, n) => {
		let name = [e.name];
		const ampPos = name[0].indexOf("&"),
		      nextChar = name[0].charAt(ampPos + 1).toLowerCase();
		if (ampPos >= 0 && nextChar !== " " && nextChar !== "") {
			name = [
				name[0].slice(0, ampPos),
				span(name[0].charAt(ampPos + 1)),
				name[0].slice(ampPos+2)
			];
			if (!e.disabled) {
				if (keys.has(nextChar)) {
					keys.get(nextChar).push(n);
				} else {
					keys.set(nextChar, [n]);
				}
			}
		}
		let params, classes = [];
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
						l.childNodes[selected].classList.remove("contextSelected");
						selected = -1;
					}
				}
			};
		} else {
			const openFn = function(e) {
				closeFn();
				const parentLeft = parseInt(this.parentNode.style.getPropertyValue("left").slice(0, -2)),
				      parentTop = parseInt(this.parentNode.style.getPropertyValue("top").slice(0, -2));
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
				"onmouseover": function(e) {
					setTO(ctx, openFn.bind(this, e))
					if (selected >= 0) {
						l.childNodes[selected].classList.remove("contextSelected");
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

export const item = (name, action) => ({name, action}), menu = (name, list) => ({name, list});
export default function(container, coords, list, delay = 0) {
	return new Promise(resolve => {
		const ctx = {container, resolve: data => {
			if (root.parentNode) {
				root.parentNode.removeChild(root);
			}
			resolve(data);
		      }, delay: delay, timeout: -1},
		      root = list2HTML(ctx, list);
		new MutationObserver((mutations, o) => mutations.forEach(m => Array.from(m.removedNodes).forEach(n => {
			if (n instanceof HTMLUListElement && n.classList.contains("contextMenu")) {
				n.dispatchEvent(closeEvent);
			}
		}))).observe(container, {"childList": true, "subtree": true});
		placeList(ctx, [coords, coords], root)
	})
};
