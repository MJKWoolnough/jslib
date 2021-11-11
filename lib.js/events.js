let nextKeyID = 0,
    nextMouseID = 0;

const held = new Set,
      downs = new Map(),
      ups = new Map(),
      ke = (event, key) => new KeyboardEvent(`key${event}`, {
	key,
	"ctrlKey": held.has("Control"),
	"shiftKey": held.has("Shift"),
	"altKey": held.has("Alt"),
	"metaKey": held.has("OS")
      }),
      me = button => new MouseEvent(`mouseup`, {
	button,
	"ctrlKey": held.has("Control"),
	"shiftKey": held.has("Shift"),
	"altKey": held.has("Alt"),
	"metaKey": held.has("OS")
      }),
      mouseMove = new Map(),
      mouseLeave = new Map(),
      mouseUp = [
	      new Map(),
	      new Map(),
	      new Map()
      ],
      keyEventFn = (down, e) => {
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

export const keyEvent = (key, onkeydown, onkeyup, once = false) => {
	const id = nextKeyID++,
	      keydown = [onkeydown, once],
	      keyup = [onkeyup, once];
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
	];
},
mouseMoveEvent = (onmousemove, onend) => {
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
	];
},
mouseDragEvent = (button, onmousemove, onmouseup = () => {}) => {
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
	];
},
hasKeyEvent = key => !!(downs.get(key)?.size || ups.get(key)?.size);

window.addEventListener("keydown", e => keyEventFn(true, e));

window.addEventListener("keyup", e => keyEventFn(false, e));

window.addEventListener("mousemove", e => {
	for (const [, event] of mouseMove) {
		event(e);
	}
});

window.addEventListener("mouseup", e => {
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
			const e = me(button);
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
