import {bindCustomElement} from './dom.js';

type data = {
	x: number;
	y: number;
}

class ScatterChart extends HTMLElement {
	#points: data[] = [];

	constructor() {
		super();

		this.#parseContent();
	}

	#parseContent() {
		this.#points = [];

		for (const elem of this.children) {
			if (elem instanceof ChartPoint) {
				const x = parseFloat(elem.getAttribute("x") ?? ""),
				      y = parseFloat(elem.getAttribute("y") ?? "");

				if (!isNaN(x) && !isNaN(y)) {
					this.#points.push({x, y});
				}
			}
		}
	}
}

class ChartPoint extends HTMLElement {
	constructor() {
		super();
	}
}

export const scatter = bindCustomElement("scatter-chart", ScatterChart),
point = bindCustomElement("chart-point", ChartPoint);
