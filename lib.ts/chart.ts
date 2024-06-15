import {bindCustomElement} from './dom.js';

type data = {
	x: number;
	y: number;
}

class ScatterChart extends HTMLElement {
	#points: data[] = [];
	#minX = Infinity;
	#maxX = -Infinity;
	#minY = Infinity;
	#maxY = -Infinity;

	constructor() {
		super();

		this.#parseContent();
	}

	#parseContent() {
		this.#points = [];
		this.#minX = Infinity;
		this.#maxX = -Infinity;
		this.#minY = Infinity;
		this.#maxY = -Infinity;

		for (const elem of this.children) {
			if (elem instanceof ChartPoint) {
				const x = parseFloat(elem.getAttribute("x") ?? ""),
				      y = parseFloat(elem.getAttribute("y") ?? "");

				if (!isNaN(x) && !isNaN(y)) {
					this.#points.push({x, y});

					this.#maxX = Math.max(this.#maxX, x);
					this.#minX = Math.min(this.#minX, x);
					this.#maxY = Math.max(this.#maxY, y);
					this.#minY = Math.min(this.#minY, y);
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
