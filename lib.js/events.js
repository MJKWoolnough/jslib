let nextKeyID = 0,
    nextMouseID = 0;

const maxMouseButton = 16,
      mods = {
	"altKey": false,
	"ctrlKey": false,
	"metaKey": false,
	"shiftKey": false
      },
      held = new Set(),
      downs = new Map(),
      ups = new Map(),
      e = o => Object.assign(o, mods),
      ke = (event, key) => new KeyboardEvent(`key${event}`, e({key})),
      me = button => new MouseEvent(`mouseup`, e({
	button,
	"clientX": mouseX,
	"clientY": mouseY,
	"view": window
      })),
      mouseMove = new Map(),
      mouseLeave = new Map(),
      mouseUp = Array.from({"length": maxMouseButton}, _ => new Map()),
      keyEventFn = (down, e) => {
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
      getMap = (m, k) => {
	let a = m.get(k);
	if (!a) {
		m.set(k, a = new Map());
	}
	return a;
      };

export let mouseX = 0,
mouseY = 0;

export const keyEvent = (key, onkeydown, onkeyup, once = false) => {
	const id = nextKeyID++,
	      keydown = [onkeydown, once],
	      keyup = [onkeyup, once],
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

for (const [evt, fn] of [
	["keydown", e => keyEventFn(true, e)],
	["keyup", e => keyEventFn(false, e)],
	["mousemove", e => {
		mouseX = e.clientX;
		mouseY = e.clientY;
		for (const [, event] of mouseMove) {
			event(e);
		}
	}],
	["mouseup", e => {
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
	}]]) {
	window.addEventListener(evt, fn);
}
