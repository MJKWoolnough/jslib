let nextMouseID = 0;

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
      keyEventFn = (down, ev) => {
	mods.altKey = ev.altKey
	mods.ctrlKey = ev.ctrlKey;
	mods.metaKey = ev.metaKey;
	mods.shiftKey = ev.shiftKey;
	const {key, target} = ev,
	      kc = combinationString(e({key}));
	if (!down) {
		const tfs = kc.slice(0, 4);
		for (const k of held) {
			if (!k.startsWith(tfs) || k.slice(4) === key) {
				processEvents(ev, ups.get(k));
				held.delete(k);
			}
		}
	} else if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && !held.has(kc)) {
		processEvents(ev, downs.get(kc));
		held.add(kc);
	}
      },
      processEvents = (e, events) => {
	if (events) {
		for (const event of events) {
			event[0](e);
			if (event[1]) {
				events.delete(event);
			}
		}
	}
      },
      tf = ["T", "F"],
      combinationString = k => tf[+!k.altKey] + tf[+!k.ctrlKey] + tf[+!k.metaKey] + tf[+!k.shiftKey] + (k.key ?? ""),
      parseCombination = keyComb => {
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
      getSet = (m, k) => {
	let a = m.get(k);
	if (!a) {
		m.set(k, a = new Set());
	}
	return a;
      };

export let mouseX = 0,
mouseY = 0;

export const keyEvent = (key, onkeydown, onkeyup, once = false) => {
	const keydown = [onkeydown, once],
	      keyup = [onkeyup, once],
	      keys = (typeof key === "string" ? [key] : key).filter(k => !!k).map(parseCombination);
	return [
		() => {
			for (const kc of keys) {
				if (onkeydown) {
					const kh = held.has(kc),
					      key = kc.slice(4);
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
hasKeyEvent = key => {
	const kc = parseCombination(key);
	for (const evs of [downs, ups]) {
		if (evs.get(kc)?.size) {
			return true;
		}
	}
	return false;
};

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
			processEvents(ke("up", key), ups.get(key));
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
