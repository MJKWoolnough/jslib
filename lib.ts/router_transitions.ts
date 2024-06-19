import {registerTransition} from './router.js';

/**
 * This library defines some simple transitional effects for the {@link mod:router} library.
 *
 * This module directly imports the {@link module:router}  module.
 *
 * @module router_transitions
 * @requires module:router
 */
/** */

export const
/**
 * This function creates simple transition function (as used with the {@link router:registerTransition | registerTranstition} function and the Router {@link router:Router/setTransition | setTransition} method of the router module.
 *
 * @param {Keyframe[]} forCurrent CSS Keyframes for the current Node.
 * @param {Keyframe[]} [forNext]  CSS Keyframes for the next Node. If `forNext` is not specified, then it will be determined by reversing the `forCurrent` array.
 * @param {number} [duration]     Total duration of the animation effect.
 */
createTransition = (forCurrent: Keyframe[], forNext = forCurrent.slice().reverse(), duration = 500) => (current: ChildNode, next: ChildNode) => {
	if (current instanceof HTMLElement && next instanceof HTMLElement) {
		const {offsetWidth, offsetHeight, offsetLeft, offsetTop} = current,
		      currentAnim = new Animation(new KeyframeEffect(
			current,
			forCurrent.map(k => Object.assign({"position": "absolute", "top": offsetTop + "px", "left": offsetLeft + "px", "width": offsetWidth + "px", "height": offsetHeight + "px"}, k)),
			{duration}
		      ));

		current.before(next);

		for (const anim of next.getAnimations().concat(current.getAnimations())) {
			anim.cancel();
		}

		currentAnim.addEventListener("finish", () => current.remove(), {"once": true});
		currentAnim.play();
		next.animate(forNext, duration);
	} else {
		current.replaceWith(next);
	}
},
/**
 * A simple fade transition.
 *
 * Can be used with the `x-router` tag by setting the `router-transition` attribute to `fade`.
 */
fade = createTransition([
	{"opacity": 1},
	{"opacity": 0}
]),
/**
 * A transition that reveals the new element beneath the first while wiping left.
 *
 * Can be used with the `x-router` tag by setting the `router-transition` attribute to `wipe-left`.
 */
wipeLeft = createTransition([
	{"clipPath": "inset(0 0 0 0)"},
	{"clipPath": "inset(0 100% 0 0)"}
], [
	{"clipPath": "inset(0 0 0 100%)"},
	{"clipPath": "inset(0 0 0 0)"}
]),
/**
 * A transition that reveals the new element beneath the first while wiping right.
 *
 * Can be used with the `x-router` tag by setting the `router-transition` attribute to `wipe-right`.
 */
wipeRight = createTransition([
	{"clipPath": "inset(0 0 0 0)"},
	{"clipPath": "inset(0 0 0 100%)"}
], [
	{"clipPath": "inset(0 100% 0 0)"},
	{"clipPath": "inset(0 0 0 0)"}
]),
/**
 * A transition that scales out the first element before zooming in on the new element.
 *
 * Can be used with the `x-router` tag by setting the `router-transition` attribute to `zoom`.
 */
zoom = createTransition([
	{"transform": "scale(1)"},
	{"transform": "scale(0)"},
	{"transform": "scale(0)"}
]);

registerTransition("fade", fade);
registerTransition("wipe-left", wipeLeft);
registerTransition("wipe-right", wipeRight);
registerTransition("zoom", zoom);
