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

type dataOrGroup = data | dataGroup;

type dataGroup = dataOrGroup[];

type renderFn = (points: dataOrGroup[], minX: number, maxX: number, minY: number, maxY: number) => Children | [PropsObject, Children];

type renderOnlyChildren = (points: dataOrGroup[], minX: number, maxX: number, minY: number, maxY: number) => Children;

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
		const [defaultFill, defaultSize] = parsePointAttrs(this, "#000", 1),
		      [points, minX, maxX, minY, maxY] = this.#parseChildren(this.children, defaultFill, defaultSize),
		      ret = this.#render(points, minX, maxX, minY, maxY),
		      [params, nodes] = ret instanceof Array ? ret : [{}, ret];

		clearNode(this.#svg, params, nodes);
	}

	#parseChildren(children: HTMLCollection, defaultFill: string, defaultSize: number) {
		const points: dataGroup = [];
		let minX = Infinity,
		    maxX = -Infinity,
		    minY = Infinity,
		    maxY = -Infinity;

		for (const elem of children) {
			const [fill, size] = parsePointAttrs(elem, defaultFill, defaultSize);

			if (elem instanceof ChartPoint) {
				const x = parseFloat(elem.getAttribute("x") ?? ""),
				      y = parseFloat(elem.getAttribute("y") ?? "");

				if (!isNaN(x) && !isNaN(y)) {
					points.push({x, y, fill, size, elem});

					maxX = Math.max(maxX, x+size);
					minX = Math.min(minX, x-size);
					maxY = Math.max(maxY, y+size);
					minY = Math.min(minY, y-size);
				}
			} else if (elem instanceof ChartGroup) {
				const [bpoints, bminX, bmaxX, bminY, bmaxY] = this.#parseChildren(elem.children, fill, size);

				if (bpoints.length) {
					maxX = Math.max(maxX, bmaxX);
					minX = Math.min(minX, bminX);
					maxY = Math.max(maxY, bmaxY);
					minY = Math.min(minY, bminY);

					points.push(bpoints);
				}
			}
		}

		return [points, minX, maxX, minY, maxY] as const;
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
		const render: renderOnlyChildren = (points, minX, maxX, minY, maxY) => points.map(c => c instanceof Array ? render(c, minX, maxX, minY, maxY) : renderPoint(c, maxY)),
		      renderPoint = ({x, y, size, fill, elem}: data, maxY: number) => forwardEvents(circle({"cx": x, "cy": maxY - y, "r": size, fill}), elem);

		super(render);
	}
}

class ChartPoint extends HTMLElement {}

class ChartGroup extends HTMLElement {}

const forwardedEvents = ["mouseover", "mouseout", "mouseenter", "mouseleave", "mousedown", "mouseup", "click", "dblclick", "auxclick", "contextmenu", "pointerdown", "pointerup"],
      forwardEvents = (from: Element, to: ChartPoint) => amendNode(from, forwardedEvents.reduce((evs, evt) => (evs["on" + evt] = (e: Event) => to.dispatchEvent(new MouseEvent(evt, e)), evs), {} as Record<string, Function>)),
      parsePointAttrs = (elem: Element, defaultFill: string, defaultSize: number) => [elem.getAttribute("fill") ?? defaultFill, Math.max(parseFloat(elem.getAttribute("fill") ?? "0"), 0) || defaultSize] as const;

export const scatter = bindCustomElement("scatter-chart", ScatterChart),
point = bindCustomElement("chart-point", ChartPoint),
group = bindCustomElement("chart-group", ChartGroup);
