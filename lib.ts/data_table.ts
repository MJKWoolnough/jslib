export class DataTable extends HTMLTableElement {
	constructor() {
		super();
	}
}

customElements.define("data-table", DataTable, {"extends": "table"});
