import {bindCustomElement} from './dom.js';

class ScatterChart extends HTMLElement {
	constructor() {
		super();
	}
}

export const scatter = bindCustomElement("scatter-chart", ScatterChart);
