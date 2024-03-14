import {bindElement} from './dom.js';
import {ns} from './html.js';

export class DataTable extends HTMLTableElement {
	constructor() {
		super();
	}
}

customElements.define("data-table", DataTable, {"extends": "table"});

export const datatable = bindElement<DataTable>(ns, "data-table");
