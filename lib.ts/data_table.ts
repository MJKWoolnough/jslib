import CSS from './css.js';
import {amendNode, bindElement, child} from './dom.js';
import {table, tbody, td, tr, ns} from './html.js';
import {NodeArray} from './nodes.js';

type Value = string | number | boolean;

type Cell = {
	[child]: HTMLTableCellElement;
	value: Value;
}

const style = [
	new CSS().add({
		"table": {
			"border-collapse": "collapse",

			" th, td": {
				"border": "1px solid #000"
			}
		}
	})
      ];

export class DataTable extends HTMLElement {
	#body: NodeArray<NodeArray<Cell>>;
	constructor() {
		super();

		this.#body = new NodeArray(tbody());

		amendNode(this.attachShadow({"mode": "closed"}), table(this.#body)).adoptedStyleSheets = style;
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
