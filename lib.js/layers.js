import {clearElement, createHTML} from './html.js';

export default (container, loader) => {
	const layers = [],
	      closer = closerFn => {
		clearElement(container);
		const elm = layers.pop();
		if (elm !== undefined) {
			container.appendChild(elm);
		} else {
			window.removeEventListener("keypress", keyPress);
		}
		if (closerFn instanceof Function) {
			closerFn();
		}
	      },
	      keyPress = e => {
		if (loading) {
			return false;
		}
		if (e.keyCode === 27) {
			closer();
		}
	      },
	      closeLoadingLayer = () => {
		loading = false;
		if (container.lastChild) {
			container.removeChild(container.lastChild);
		}
	      },
	      defaultLoader = loader ? loader : createHTML("div", {"class": "loading"});
	let loading = false;
	return Object.freeze({
		"addLayer": closerFn => {
			if (layers.length === 0) {
				window.addEventListener("keypress", keyPress);
			}
			if (container.hasChildNodes()) {
				const df = document.createDocumentFragment();
				while (container.firstChild !== null) {
					df.appendChild(container.firstChild);
				}
				layers.push(df);
			}
			return container.appendChild(createHTML("div", createHTML("span", {"class": "closer", "onclick": closer.bind(null, closerFn)}, "X")));
		},
		"removeLayer": closer,
		"loading": (p, loadDiv) => {
			if (loadDiv === undefined) {
				loadDiv = defaultLoader;
			}
			loading = true;
			container.appendChild(loadDiv);
			return p.finally(closeLoadingLayer);
		}
	});
}
