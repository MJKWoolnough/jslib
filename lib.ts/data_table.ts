import {amendNode, bindElement, clearNode} from './dom.js';
import {slot, table, tbody, td, tr, ns} from './html.js';

export class DataTable extends HTMLElement {
	constructor() {
		super();

		amendNode(this.attachShadow({"mode": "closed"}), table(slot()));
	}

	setData(data: (string | number | boolean)[][]) {
		clearNode(this, tbody(data.map(row => tr(row.map(cell => td(cell+""))))));
	}
}

customElements.define("data-table", DataTable);

export const datatable = bindElement<DataTable>(ns, "data-table");
