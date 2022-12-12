import {registerTransition} from './router.js';

registerTransition("fade", (current: ChildNode, next: ChildNode) => {
	if (current instanceof HTMLElement && next instanceof HTMLElement) {
		const {offsetWidth, offsetHeight, offsetLeft, offsetTop} = current,
		      s = current.getAttribute("style"),
		      currentAnim = new Animation(new KeyframeEffect(
			current,
			[
				{"opacity": 1},
				{"opacity": 0}
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
		current.style.position = "absolute";
		current.style.left = offsetLeft + "px";
		current.style.top = offsetTop + "px";
		current.style.width = offsetWidth + "px";
		current.style.height = offsetHeight + "px";
		currentAnim.addEventListener("finish", () => {
			current.remove()
			if (s) {
				current.setAttribute("style", s);
			} else {
				current.removeAttribute("style");
			}
		}, {"once": true});
		current.before(next);
		currentAnim.play();
		nextAnim.play();
	} else {
		current.replaceWith(next);
	}
});
