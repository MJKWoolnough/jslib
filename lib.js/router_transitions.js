import {registerTransition} from './router.js';

export const createTransition = (forCurrent, forNext, duration = 500) => (current, next) => {
	if (current instanceof HTMLElement && next instanceof HTMLElement) {
		const {offsetWidth, offsetHeight, offsetLeft, offsetTop} = current,
		      currentAnim = new Animation(new KeyframeEffect(
			current,
			forCurrent.map(k => Object.assign({"position": "absolute", "top": offsetTop + "px", "left": offsetLeft + "px", "width": offsetWidth + "px", "height": offsetHeight + "px"}, k)),
			{duration}
		      ));
		current.before(next);
		for (const anim of next.getAnimations()) {
			anim.cancel();
		}
		currentAnim.addEventListener("finish", () => current.remove(), {"once": true});
		currentAnim.play();
		next.animate(forNext, duration);
	} else {
		current.replaceWith(next);
	}
},
fade = createTransition([
	{"opacity": 1},
	{"opacity": 0}
],
[
	{"opacity": 0},
	{"opacity": 1}
]),
wipeLeft = createTransition([
	{"clipPath": "inset(0 0 0 0)"},
	{"clipPath": "inset(0 100% 0 0)"}
], [
	{"clipPath": "inset(0 0 0 100%)"},
	{"clipPath": "inset(0 0 0 0)"},
]),
wipeRight = createTransition([
	{"clipPath": "inset(0 0 0 0)"},
	{"clipPath": "inset(0 0 0 100%)"}
], [
	{"clipPath": "inset(0 100% 0 0)"},
	{"clipPath": "inset(0 0 0 0)"},
]),
zoom = createTransition([
	{"transform": "scale(1)"},
	{"transform": "scale(0)"},
	{"transform": "scale(0)"}
], [
	{"transform": "scale(0)"},
	{"transform": "scale(0)"},
	{"transform": "scale(1)"}
]);

registerTransition("fade", fade);
registerTransition("wipe-left", wipeLeft);
registerTransition("wipe-right", wipeRight);
registerTransition("zoom", zoom);
