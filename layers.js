"use strict";
offer((async function() {
	const {clearElement, createHTML} = await include("html.js"),
	      layers = function(container, loader) {
		const layers = [],
		      closer = function(closerFn) {
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
		      keyPress = function(e) {
			if (loading) {
				return false;
			}
			e = e || window.event;
			if (e.keyCode === 27) {
				closer();
			}
		      },
		      closeLoadingLayer = function() {
			loading = false;
			container.removeChild(container.lastChild);
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
					while (container.hasChildNodes()) {
						df.appendChild(container.firstChild);
					}
					layers.push(df);
				}
				return container.appendChild(createHTML("div", createHTML("span", {"class": "closer", "onclick": closer.bind(null, closerFn)}, "X")));
			},
			"removeLayer": closer,
			"loading": function(p, loadDiv) {
				if (loadDiv === undefined) {
					loadDiv = defaultLoader;
				}
				loading = true;
				container.appendChild(loadDiv);
				return p.finally(closeLoadingLayer);
			}
		});
	      };
	return Object.freeze({layers});
}()));
