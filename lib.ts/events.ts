type KeyFn = (e: KeyboardEvent) => void;

type MouseFn = (e: MouseEvent) => void;

type MouseButton = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15

let nextKeyID = 0,
    nextMouseID = 0;

const maxMouseButton = 16,
      mods = {
	"altKey": false,
	"ctrlKey": false,
	"metaKey": false,
	"shiftKey": false
      },
      held = new Set<string>(),
      downs = new Map<string, Map<number, [KeyFn, boolean]>>(),
      ups = new Map<string, Map<number, [KeyFn, boolean]>>(),
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
      keyEventFn = (down: boolean, e: KeyboardEvent) => {
	mods.altKey = e.altKey
	mods.ctrlKey = e.ctrlKey;
	mods.metaKey = e.metaKey;
	mods.shiftKey = e.shiftKey;
	const {key, target} = e;
	if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || held.has(key) === down)) {
		const events = (down ? downs : ups).get(key);
		if (events) {
			for (const [id, [event, once]] of events) {
				event(e);
				if (once) {
					events.delete(id);
				}
			}
		}
		held[down ? "add" : "delete"](key);
	}
      },
      getMap = <K, L, T>(m: Map<K, Map<L, T>>, k: K) => {
	let a = m.get(k);
	if (!a) {
		m.set(k, a = new Map<L, T>());
	}
	return a;
      };

export let mouseX = 0,
mouseY = 0;

export const keyEvent = (key: string | string[], onkeydown?: KeyFn, onkeyup?: KeyFn, once = false) => {
	const id = nextKeyID++,
	      keydown: [KeyFn, boolean] = [onkeydown!, once],
	      keyup: [KeyFn, boolean] = [onkeyup!, once],
	      keys = (typeof key === "string" ? [key] : key).filter(k => !!k);
	return [
		() => {
			for (const key of keys) {
				if (onkeydown) {
					const kh = held.has(key);
					if (kh) {
						onkeydown(ke("down", key));
					}
					if (!kh || !once) {
						getMap(downs, key).set(id, keydown);
					}
				}
				if (onkeyup) {
					getMap(ups, key).set(id, keyup);
				}
			}
		},
		(now = true) => {
			for (const key of keys) {
				const toRun = now && held.has(key) ? ups.get(key)?.get(id)?.[0] : null;
				downs.get(key)?.delete(id);
				ups.get(key)?.delete(id);
				toRun?.(ke("up", key));
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
hasKeyEvent = (key: string) => !!(downs.get(key)?.size || ups.get(key)?.size);

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
			const events = ups.get(key);
			if (events && events.size) {
				const e = ke("up", key);
				for (const [id, [event, once]] of events) {
					event(e);
					if (once) {
						events.delete(id);
					}
				}
			}
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
