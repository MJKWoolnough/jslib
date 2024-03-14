import {bindElement, clearNode} from './dom.js';
import {tbody, td, tr, ns} from './html.js';

export class DataTable extends HTMLTableElement {
	constructor() {
		super();
	}

	setData(data: (string | number | boolean)[][]) {
		clearNode(this, tbody(data.map(row => tr(row.map(cell => td(cell+""))))));
	}
}

customElements.define("data-table", DataTable, {"extends": "table"});

export const datatable = bindElement<DataTable>(ns, "data-table");
