import {clearElement, createHTML} from './dom.js';

export type LayerType = {
	addLayer: (closerFn?: () => void) => HTMLElement;
	removeLayer: (closeFn?: () => void) => void;
	loading: (p: Promise<any>, loadDiv?: Node) => Promise<any>;
}

export default (container: Node, loader?: Node): Readonly<LayerType> => {
	const layers: Node[] = [],
	      closer = (closerFn?: () => void) => {
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
	      keyPress = (e: KeyboardEvent) => {
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
	      defaultLoader: Node = loader ? loader : createHTML("div", {"class": "loading"});
	let loading = false;
	return Object.freeze({
		"addLayer": (closerFn?: () => void) => {
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
			return container.appendChild(createHTML("div", createHTML("span", {"class": "closer", "onclick": closer.bind(null, closerFn ? closerFn : () => {})}, "X")));
		},
		"removeLayer": closer,
		"loading": (p: Promise<any>, loadDiv?: Node) => {
			if (loadDiv === undefined) {
				loadDiv = defaultLoader;
			}
			loading = true;
			container.appendChild(loadDiv);
			return p.finally(closeLoadingLayer);
		}
	}) as LayerType;
}
