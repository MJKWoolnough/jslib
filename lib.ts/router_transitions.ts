import {registerTransition} from './router.js';

const createTransition = (forCurrent: Keyframe[], forNext: Keyframe[], duration = 500) => (current: ChildNode, next: ChildNode) => {
	if (current instanceof HTMLElement && next instanceof HTMLElement) {
		const {offsetWidth, offsetHeight, offsetLeft, offsetTop} = current,
		      currentAnim = new Animation(new KeyframeEffect(
			current,
			forCurrent.map(k => Object.assign({"position": "absolute", "top": offsetTop + "px", "left": offsetLeft + "px", "width": offsetWidth + "px", "height": offsetHeight + "px"}, k)),
			{duration}
		      )),
		      nextAnim = new Animation(new KeyframeEffect(
			next,
			forNext,
			{duration}
		      ));
		currentAnim.addEventListener("finish", () => current.remove(), {"once": true});
		current.before(next);
		currentAnim.play();
		nextAnim.play();
	} else {
		current.replaceWith(next);
	}
      };

registerTransition("fade", createTransition([
	{"opacity": 1},
	{"opacity": 0}
],
[
	{"opacity": 0},
	{"opacity": 1}
]));

registerTransition("wipe-left", createTransition([
	{"clipPath": "inset(0 0 0 0)"},
	{"clipPath": "inset(0 100% 0 0)"}
], [
	{"clipPath": "inset(0 0 0 100%)"},
	{"clipPath": "inset(0 0 0 0)"},
]));

registerTransition("wipe-right", createTransition([
	{"clipPath": "inset(0 0 0 0)"},
	{"clipPath": "inset(0 0 0 100%)"}
], [
	{"clipPath": "inset(0 100% 0 0)"},
	{"clipPath": "inset(0 0 0 0)"},
]));
