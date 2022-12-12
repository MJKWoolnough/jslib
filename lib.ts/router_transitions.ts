import {registerTransition} from './router.js';

registerTransition("fade", (current: ChildNode, next: ChildNode) => {
	if (current instanceof HTMLElement && next instanceof HTMLElement) {
		const {offsetWidth, offsetHeight, offsetLeft, offsetTop} = current,
		      currentAnim = new Animation(new KeyframeEffect(
			current,
			[
				{"position": "absolute", "top": offsetTop + "px", "left": offsetLeft + "px", "width": offsetWidth + "px", "height": offsetHeight + "px", "opacity": 1},
				{"position": "absolute", "top": offsetTop + "px", "left": offsetLeft + "px", "width": offsetWidth + "px", "height": offsetHeight + "px", "opacity": 0}
			],
			{"duration": 500}
		      )),
		      nextAnim = new Animation(new KeyframeEffect(
			next,
			[
				{"opacity": 0},
				{"opacity": 1},
			],
			{"duration": 500}
		      ));
		currentAnim.addEventListener("finish", () => current.remove(), {"once": true});
		current.before(next);
		currentAnim.play();
		nextAnim.play();
	} else {
		current.replaceWith(next);
	}
});

registerTransition("wipe-left", (current: ChildNode, next: ChildNode) => {
	if (current instanceof HTMLElement && next instanceof HTMLElement) {
		const {offsetWidth, offsetHeight, offsetLeft, offsetTop} = current,
		      currentAnim = new Animation(new KeyframeEffect(
			current,
			[
				{"position": "absolute", "top": offsetTop + "px", "left": offsetLeft + "px", "width": offsetWidth + "px", "height": offsetHeight + "px", "clipPath": "inset(0 0 0 0)"},
				{"position": "absolute", "top": offsetTop + "px", "left": offsetLeft + "px", "width": offsetWidth + "px", "height": offsetHeight + "px", "clipPath": "inset(0 100% 0 0)"}
			],
			{"duration": 500}
		      )),
		      nextAnim = new Animation(new KeyframeEffect(
			next,
			[
				{"clipPath": "inset(0 0 0 100%)"},
				{"clipPath": "inset(0 0 0 0)"},
			],
			{"duration": 500}
		      ));
		currentAnim.addEventListener("finish", () => current.remove(), {"once": true});
		current.before(next);
		currentAnim.play();
		nextAnim.play();
	} else {
		current.replaceWith(next);
	}
});
