import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {circle, svg} from './svg.js';

type data = {
	x: number;
	y: number;
	fill: string;
	size: number;
}

type renderFn = (svg: SVGSVGElement, points: data[], minX: number, maxX: number, minY: number, maxY: number, fill: string, size: number) => void;

class Chart extends HTMLElement {
	#svg: SVGSVGElement;
	#render: renderFn;

	constructor(render: renderFn) {
		super();

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), this.#svg = svg());

		this.#render = render;

		this.#parseContent();

		new MutationObserver(mutations => this.#handleMutations(mutations)).observe(this, {
			"attributeFilter": ["x", "y"],
			"childList": true,
			"subtree": true
		});
	}

	#handleMutations(_mutations: MutationRecord[]) {
		this.#parseContent();
	}

	#parseContent() {
		const defaultFill = this.getAttribute("fill") ?? "#000",
		      defaultSize = Math.max(parseFloat(this.getAttribute("fill") ?? "1") || 0, 1);

		let points = [],
		    minX = Infinity,
		    maxX = -Infinity,
		    minY = Infinity,
		    maxY = -Infinity;

		for (const elem of this.children) {
			if (elem instanceof ChartPoint) {
				const x = parseFloat(elem.getAttribute("x") ?? ""),
				      y = parseFloat(elem.getAttribute("y") ?? ""),
				      fill = this.getAttribute("fill") ?? defaultFill,
				      size = Math.max(parseFloat(this.getAttribute("fill") ?? "1") || 0, defaultSize);

				if (!isNaN(x) && !isNaN(y)) {
					points.push({x, y, fill, size});

					maxX = Math.max(maxX, x+size);
					minX = Math.min(minX, x-size);
					maxY = Math.max(maxY, y+size);
					minY = Math.min(minY, y-size);
				}
			}
		}

		this.#render(this.#svg, points, minX, maxX, minY, maxY, defaultFill, defaultSize);
	}
}

class AxisChart extends Chart {
	constructor(render: renderFn) {
		super(render);
	}
}

class ScatterChart extends AxisChart {
	constructor() {
		super((svg, points, minX, maxX, minY, maxY, fill, size) => clearNode(svg, {"viewBox": `0 0 ${maxX - minX} ${maxY - minY}`}, points.map(({x, y}) => circle({"cx": x, "cy": y, "r": size, fill}))));
	}
}

class ChartPoint extends HTMLElement {
	constructor() {
		super();
	}
}

export const scatter = bindCustomElement("scatter-chart", ScatterChart),
point = bindCustomElement("chart-point", ChartPoint);
