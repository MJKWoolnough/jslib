import {amendNode, bindElement, child} from './dom.js';
import {table, tbody, td, tr, ns} from './html.js';
import {NodeArray} from './nodes.js';

type Value = string | number | boolean;

type Cell = {
	[child]: HTMLTableCellElement;
	value: Value;
}

export class DataTable extends HTMLElement {
	#body: NodeArray<NodeArray<Cell>>;
	constructor() {
		super();

		this.#body = new NodeArray(tbody());

		amendNode(this.attachShadow({"mode": "closed"}), table(this.#body));
	}

	setData(data: Value[][]) {
		this.#body.splice(0, this.#body.length);

		for (const row of data) {
			const rowArr = new NodeArray<Cell>(tr())

			for (const cell of row) {
				rowArr.push({
					[child]: td(cell + ""),
					value: cell
				});
			}

			this.#body.push(rowArr);
		}
	}
}

customElements.define("data-table", DataTable);

export const datatable = bindElement<DataTable>(ns, "data-table");
