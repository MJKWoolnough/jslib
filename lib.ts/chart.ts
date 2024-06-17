import type {Children, PropsObject} from './dom.js'
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {circle, g, path, svg} from './svg.js';

type data = {
	x: number;
	y: number;
	fill: string;
	size: number;
	elem: ChartPoint;
}

type renderFn = (points: data[], minX: number, maxX: number, minY: number, maxY: number) => Children | [PropsObject, Children];

type renderOnlyChildren = (points: data[], minX: number, maxX: number, minY: number, maxY: number) => Children;

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
				      fill = elem.getAttribute("fill") ?? defaultFill,
				      size = Math.max(parseFloat(elem.getAttribute("size") ?? "1") || 0, defaultSize);

				if (!isNaN(x) && !isNaN(y)) {
					points.push({x, y, fill, size, elem});

					maxX = Math.max(maxX, x+size);
					minX = Math.min(minX, x-size);
					maxY = Math.max(maxY, y+size);
					minY = Math.min(minY, y-size);
				}
			}
		}

		const ret = this.#render(points, minX, maxX, minY, maxY),
		      [params, children] = ret instanceof Array ? ret : [{}, ret];

		clearNode(this.#svg, params, children);
	}
}

class AxisChart extends Chart {
	constructor(render: renderOnlyChildren) {
		super((points, minX, maxX, minY, maxY) => {
			const rendered = g({"transform": "translate(15 5)"}, render(points, minX, maxX, minY, maxY));

			return [
				{"viewBox": `0 0 ${maxX - minX + 20} ${maxY - minY + 10}`},
				[
					path({"d": `M15,5 v${maxY - minY} h${maxX - minX}`, "stroke": "#000", "fill": "none"}),
					rendered,
				]
			];
		});
	}
}

class ScatterChart extends AxisChart {
	constructor() {
		super((points, _minX, _maxX, _minY, maxY) => points.map(({x, y, size, fill, elem}) => forwardEvents(circle({"cx": x, "cy": maxY - y, "r": size, fill}), elem)));
	}
}

class ChartPoint extends HTMLElement { }

class ChartGroup extends HTMLElement { }

const forwardedEvents = ["mouseover", "mouseout", "mouseenter", "mouseleave", "mousedown", "mouseup", "click", "dblclick", "auxclick", "contextmenu", "pointerdown", "pointerup"],
      forwardEvents = (from: Element, to: ChartPoint) => amendNode(from, forwardedEvents.reduce((evs, evt) => (evs["on" + evt] = (e: Event) => to.dispatchEvent(new MouseEvent(evt, e)), evs), {} as Record<string, Function>));

export const scatter = bindCustomElement("scatter-chart", ScatterChart),
point = bindCustomElement("chart-point", ChartPoint),
group = bindCustomElement("chart-group", ChartGroup);
