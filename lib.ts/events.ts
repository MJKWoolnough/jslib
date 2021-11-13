type KeyFn = (e: KeyboardEvent) => void;

type MouseFn = (e: MouseEvent) => void;

let nextKeyID = 0,
    nextMouseID = 0;

const held = new Set<string>(),
      downs = new Map<string, Map<number, [KeyFn, boolean]>>(),
      ups = new Map<string, Map<number, [KeyFn, boolean]>>(),
      ke = (event: "down" | "up", key: string) => new KeyboardEvent(`key${event}`, {
	key,
	"ctrlKey": held.has("Control"),
	"shiftKey": held.has("Shift"),
	"altKey": held.has("Alt"),
	"metaKey": held.has("OS")
      }),
      me = (button: 0 | 1 | 2) => new MouseEvent(`mouseup`, {
	button,
	"clientX": mouseX,
	"clientY": mouseY,
	"ctrlKey": held.has("Control"),
	"shiftKey": held.has("Shift"),
	"altKey": held.has("Alt"),
	"metaKey": held.has("OS")
      }),
      mouseMove = new Map<number, MouseFn>(),
      mouseLeave = new Map<number, () => void>(),
      mouseUp = [
	      new Map<number, MouseFn>(),
	      new Map<number, MouseFn>(),
	      new Map<number, MouseFn>()
      ],
      keyEventFn = (down: boolean, e: KeyboardEvent) => {
	const {key, target} = e;
	if (down && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) || held.has(key) === down) {
		return;
	}
	const events = (down ? downs : ups).get(key);
	if (events) {
		for (const [id, [event, once]] of events) {
			event(e);
			if (once) {
				events.delete(id);
			}
		}
	}
	if (down) {
		held.add(key);
	} else {
		held.delete(key);
	}
      };

export let mouseX = 0,
mouseY = 0;

export const keyEvent = (key: string, onkeydown?: KeyFn, onkeyup?: KeyFn, once = false) => {
	const id = nextKeyID++,
	      keydown: [KeyFn, boolean] = [onkeydown!, once],
	      keyup: [KeyFn, boolean] = [onkeyup!, once];
	return [
		() => {
			if (onkeydown) {
				const kh = held.has(key);
				if (kh) {
					onkeydown(ke("down", key));
				}
				if (!kh || !once) {
					let m = downs.get(key);
					if (!m) {
						downs.set(key, m = new Map());
					}
					m.set(id, keydown);
				}
			}
			if (onkeyup) {
				let m = ups.get(key);
				if (!m) {
					ups.set(key, m = new Map());
				}
				m.set(id, keyup);
			}
		},
		(now = true) => {
			const toRun = now && held.has(key) ? ups.get(key)?.get(id)?.[0] : null;
			downs.get(key)?.delete(id);
			ups.get(key)?.delete(id);
			toRun?.(ke("up", key));
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
mouseDragEvent = (button: 0 | 1 | 2, onmousemove?: MouseFn, onmouseup: MouseFn = () => {}) => {
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

window.addEventListener("keydown", (e: KeyboardEvent) => keyEventFn(true, e));

window.addEventListener("keyup", (e: KeyboardEvent) => keyEventFn(false, e));

window.addEventListener("mousemove", (e: MouseEvent) => {
	mouseX = e.clientX;
	mouseY = e.clientY;
	for (const [, event] of mouseMove) {
		event(e);
	}
});

window.addEventListener("mouseup", (e: MouseEvent) => {
	const {button} = e;
	if (button !== 0 && button !== 1 && button !== 2) {
		return;
	}
	for (const [id, event] of mouseUp[button]) {
		event(e);
		mouseMove.delete(id);
	}
	mouseUp[button].clear();
});

window.addEventListener("blur", () => {
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
	for (let button = 0; button < 3; button++) {
		if (mouseUp[button].size) {
			const e = me(button as 0 | 1 | 2);
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
});
