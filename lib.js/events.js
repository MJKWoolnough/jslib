/**
 * The event module is used for easy creation of global events.
 *
 * @module events
 */
/** */

import {setAndReturn} from './misc.js';

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
      mouseUp = Array.from({"length": maxMouseButton}, () => new Map()),
      keyEventFn = (down, ev) => {
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
	} else if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target instanceof HTMLButtonElement) && !held.has(kc)) {
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
      combinationString = k => (+!k.altKey + 2 * +!k.ctrlKey + 4 * +!k.metaKey + 8 * +!k.shiftKey).toString(16) + (k.key ?? ""),
      parseCombination = keyComb => {
	const parts = keyComb.split("+").map(p => p.trim()),
	      k = {
		"altKey": false,
		"ctrlKey": false,
		"metaKey": false,
		"shiftKey": false,
		"key": parts.at(-1)
	      };
	for (const mod of parts) {
		switch (mod.toLowerCase()) {
		case "alt":
		case "option":
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
      getSet = (m, k) =>  m.get(k) || setAndReturn(m, k, new Set());

export let
/**
 * The current X coordinate of the mouse.
 */
mouseX = 0,
/**
 * The current Y coordinate of the mouse.
 */
mouseY = 0;

export const
/**
 * This function takes a key combination or array of key combinations, an optional {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent | KeyboardEvent} function to act as the keydown event handler, an optional {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent | KeyboardEvent} function to act as the keyup handler, and an optional boolean (default false) to determine if the event only runs one time per activation.
 *
 * The key combinations are strings which can contain key names as determined by the {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key | KeyboardEvent.key} value, and can be prefixed by any number of the following: `Alt+`, `Option+`, `Control+`, `Ctrl+`, `Command+`, `Meta+`, `Super+`, `Windows+`, and `Shift+`.
 *
 * The function returns an array of three functions, the first of which activates the event, the second of which deactivates the event and will run any keyup event handler unless false is passed into the function.
 *
 * The last function returned allows the registered key(s) to be changed to the newKey string/array passed. The `now` param will be passed to the stop function when cancelling the previously assigned keys.
 *
 * NB: If the window loses focus, the module will generate a keyup event. This can be detected be checking the {@link https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted| Event.isTrusted} field.
 *
 * @param {string | string[]} key A key combination string, or an array of key combination strings.
 * @param {(e: KeyboardEvent) => void} [onkeydown]     Function to be called when one of the key combinations is pressed.
 * @param {(e: KeyboardEvent) => void} [onkeyup]       Function to be called when one of the key combinations is released.
 * @param {boolean} [once=false]  When set to true, will only activate one time.
 *
 * @return {[() => void, (now = true) => void, (newKey: string | string[], now = true) => void]} Array of functions as described above.
 */
keyEvent = (key, onkeydown, onkeyup, once = false) => {
	const keydown = [onkeydown, once],
	      keyup = [onkeyup, once],
	      keys = (typeof key === "string" ? [key] : key).filter(k => !!k).map(parseCombination),
	      start = () => {
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
			started = true;
	      },
	      stop = (now = true) => {
		for (const kc of keys) {
			const toRun = now && held.has(kc) && ups.get(kc)?.has(keyup) ? keyup[0] : null;
			downs.get(kc)?.delete(keydown);
			ups.get(kc)?.delete(keyup);
			toRun?.(ke("up", kc));
		}
		started = false;
	      };
	let started = false;
	return [
		start,
		stop,
		(newKey, now = true) => {
			const s = started;
			if (s) {
				stop(now);
			}
			keys.splice(0, keys.length, ...(typeof newKey === "string" ? [newKey] : newKey).filter(k => !!k).map(parseCombination));
			if (s) {
				start();
			}
		}
	];
},
/**
 * This function takes a {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent | MouseEvent} function and an optional function which will be run when the event deactivates.
 *
 * The function returns an array of two functions, the first of which activates the event, the second of which deactivates the event and will run any mouseup event handler unless false is passed into the function.
 *
 * NB: If the window loses focus, the module will run the onend function.
 *
 * @param {(e: MouseEvent) => void} onmousemove Function to be called when the mouse is moved.
 * @param {() => void} [onend]  Function to be called when the event is stopped.
 *
 * @return {[() => void, (run = true) => void]} Array of Functions as described above.
 */
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
/**
 * This function takes a mouse button (0..15), an optional {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent | MouseEvent} function to act as the mousemove event handler, and an optional function to be run on mouseup.
 *
 * The function returns an array of two functions, the first of which activates the event, the second of which deactivates the event and will run any mouseup event handler unless false is passed into the function.
 *
 * NB: If the window loses focus, the module will generate a mouseup event. This can be detected be checking the {@link https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted| Event.isTrusted} field.
 *
 * @param {number} button  Mouse button to detect being released.
 * @param {(e: MouseEvent) => void} onmousemove Function to be called when the mouse is moved.
 * @param {(e: MouseEvent) => void} onmouseup   Function to be called when the mouse button is released.
 *
 * @return {[() => void, (run = true) => void]} Array of functions, as described above.
 */
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
/**
 * This function returns true if any function is currently active for the passed key.
 *
 * @param {string} key The key (combination) string to be checked.
 *
 * @return {boolean} True if there is a currently active handler for the `key` string.
 */
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
