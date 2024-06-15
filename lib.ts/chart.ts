import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {circle, svg} from './svg.js';

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
	#svg: SVGSVGElement;
	#fill = "";
	#size = 1;

	constructor() {
		super();

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), this.#svg = svg());

		this.#parseContent();

		new MutationObserver(mutations => this.#handleMutations(mutations)).observe(this, {
			"attributeFilter": ["x", "y"],
			"childList": true,
			"subtree": true,
		});
	}

	#handleMutations(_mutations: MutationRecord[]) {
		this.#parseContent();
	}

	#parseContent() {
		this.#points = [];
		this.#minX = Infinity;
		this.#maxX = -Infinity;
		this.#minY = Infinity;
		this.#maxY = -Infinity;
		this.#fill = this.getAttribute("fill") ?? "#000";
		this.#size = Math.max(parseFloat(this.getAttribute("fill") ?? "1") || 0, 1);

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

		this.#render();
	}

	#render() {
		clearNode(this.#svg, {"viewBox": `0 0 ${this.#maxX - this.#minX} ${this.#maxY - this.#minY}`}, this.#points.map(({x, y}) => circle({"cx": x, "cy": y, "r": this.#size, "fill": this.#fill})));
	}
}

class ChartPoint extends HTMLElement {
	constructor() {
		super();
	}
}

export const scatter = bindCustomElement("scatter-chart", ScatterChart),
point = bindCustomElement("chart-point", ChartPoint);
