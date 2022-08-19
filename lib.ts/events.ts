type KeyFn = (e: KeyboardEvent) => void;

type MouseFn = (e: MouseEvent) => void;

type MouseButton = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

let nextMouseID = 0;

const maxMouseButton = 16,
      mods = {
	"altKey": false,
	"ctrlKey": false,
	"metaKey": false,
	"shiftKey": false
      },
      held = new Set<string>(),
      downs = new Map<string, Set<[KeyFn, boolean]>>(),
      ups = new Map<string, Set<[KeyFn, boolean]>>(),
      e = <T = MouseEventInit | KeyboardEventInit>(o: T): EventModifierInit => Object.assign(o, mods),
      ke = (event: "down" | "up", key: string) => new KeyboardEvent(`key${event}`, e({key})),
      me = (button: MouseButton) => new MouseEvent(`mouseup`, e({
	button,
	"clientX": mouseX,
	"clientY": mouseY,
	"view": window
      })),
      mouseMove = new Map<number, MouseFn>(),
      mouseLeave = new Map<number, () => void>(),
      mouseUp = Array.from({"length": maxMouseButton}, _ => new Map<number, MouseFn>()),
      keyEventFn = (down: boolean, ev: KeyboardEvent) => {
	mods.altKey = ev.altKey;
	mods.ctrlKey = ev.ctrlKey;
	mods.metaKey = ev.metaKey;
	mods.shiftKey = ev.shiftKey;
	const {key, target} = ev,
	      kc = combinationString(e({key}));
	if (!down) {
		const tfs = kc.charAt(0);
		for (const k of held) {
			if (!k.startsWith(tfs) || k.slice(1) === key) {
				processEvents(ev, ups.get(k));
				held.delete(k);
			}
		}
	} else if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && !held.has(kc)) {
		processEvents(ev, downs.get(kc));
		held.add(kc);
	}
      },
      processEvents = (e: KeyboardEvent, events?: Set<[KeyFn, boolean]>) => {
	if (events) {
		for (const event of events) {
			event[0](e);
			if (event[1]) {
				events.delete(event);
			}
		}
	}
      },
      combinationString = (k: KeyboardEventInit) => (+!k.altKey + 2 * +!k.ctrlKey + 4 * +!k.metaKey + 8 * +!k.shiftKey).toString(16) + (k.key ?? ""),
      parseCombination = (keyComb: string) => {
	const parts = keyComb.split("+").map(p => p.trim()),
	      k = {
		"altKey": false,
		"ctrlKey": false,
		"metaKey": false,
		"shiftKey": false,
		"key": parts[parts.length-1]
	      };
	for (const mod of parts) {
		switch (mod.toLowerCase()) {
		case "alt":
			k.altKey = true;
			break;
		case "control":
		case "ctrl":
			k.ctrlKey = true;
			break;
		case "command":
		case "meta":
		case "super":
		case "windows":
			k.metaKey = true;
			break;
		case "shift":
			k.shiftKey = true;
		}
	}
	return combinationString(k);
      },
      getSet = <K, T>(m: Map<K, Set<T>>, k: K) => {
	let a = m.get(k);
	if (!a) {
		m.set(k, a = new Set<T>());
	}
	return a;
      };

export let mouseX = 0,
mouseY = 0;

export const keyEvent = (key: string | string[], onkeydown?: KeyFn, onkeyup?: KeyFn, once = false) => {
	const keydown: [KeyFn, boolean] = [onkeydown!, once],
	      keyup: [KeyFn, boolean] = [onkeyup!, once],
	      keys = (typeof key === "string" ? [key] : key).filter(k => !!k).map(parseCombination);
	return [
		() => {
			for (const kc of keys) {
				if (onkeydown) {
					const kh = held.has(kc),
					      key = kc.slice(1);
					if (kh && kc === combinationString(e({key}))) {
						onkeydown(ke("down", key));
					}
					if (!kh || !once) {
						getSet(downs, kc).add(keydown);
					}
				}
				if (onkeyup) {
					getSet(ups, kc).add(keyup);
				}
			}
		},
		(now = true) => {
			for (const kc of keys) {
				const toRun = now && held.has(kc) && ups.get(kc)?.has(keyup) ? keyup[0] : null;
				downs.get(kc)?.delete(keydown);
				ups.get(kc)?.delete(keyup);
				toRun?.(ke("up", kc));
			}
		}
	] as const;
},
mouseMoveEvent = (onmousemove: MouseFn, onend?: () => void) => {
	const id = nextMouseID++;
	return [
		() => {
			mouseMove.set(id, onmousemove);
			if (onend) {
				mouseLeave.set(id, onend);
			}
		},
		(run = true) => {
			const toRun = run ? mouseLeave.get(id) : null;
			mouseMove.delete(id);
			mouseLeave.delete(id);
			toRun?.();
		}
	] as const;
},
mouseDragEvent = (button: MouseButton, onmousemove?: MouseFn, onmouseup: MouseFn = () => {}) => {
	const id = nextMouseID++;
	return [
		() => {
			if (onmousemove) {
				mouseMove.set(id, onmousemove);
			}
			mouseUp[button].set(id, onmouseup);
		},
		(run = true) => {
			const toRun = run ? mouseUp[button].get(id) : null;
			mouseMove.delete(id);
			mouseUp[button].delete(id);
			toRun?.(me(button));
		}
	] as const;
},
hasKeyEvent = (key: string) => {
	const kc = parseCombination(key);
	for (const evs of [downs, ups]) {
		if (evs.get(kc)?.size) {
			return true;
		}
	}
	return false;
};

for (const [evt, fn] of [
	["keydown", (e: KeyboardEvent) => keyEventFn(true, e)],
	["keyup", (e: KeyboardEvent) => keyEventFn(false, e)],
	["mousemove", (e: MouseEvent) => {
		mouseX = e.clientX;
		mouseY = e.clientY;
		for (const [, event] of mouseMove) {
			event(e);
		}
	}],
	["mouseup", (e: MouseEvent) => {
		const {button} = e;
		if (button < 0 || button >= maxMouseButton || !Number.isInteger(button)) {
			return;
		}
		for (const [id, event] of mouseUp[button]) {
			event(e);
			mouseMove.delete(id);
		}
		mouseUp[button].clear();
	}],
	["blur", () => {
		for (const key of held) {
			processEvents(ke("up", key), ups.get(key));
			held.delete(key);
		}
		for (let button = 0; button < maxMouseButton; button++) {
			if (mouseUp[button].size) {
				const e = me(button as MouseButton);
				for (const [, event] of mouseUp[button]) {
					event(e);
				}
				mouseUp[button].clear();
			}
		}
		mouseMove.clear();
		for (const [id, fn] of mouseLeave) {
			mouseMove.delete(id);
			fn();
		}
		mouseLeave.clear();
	}]] as [string, EventListener][]) {
	window.addEventListener(evt, fn);
}
