import CSS from './css.js';
import {amendNode, bindElement, child} from './dom.js';
import {table, tbody, td, th, thead, tr, ns} from './html.js';
import {NodeArray} from './nodes.js';

type Value = string | number | boolean;

type Cell = {
	[child]: HTMLTableCellElement;
	value: Value;
}

type Header = {
	[child]: HTMLTableCellElement;
}

const arrow = (up: 0 | 1) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'%3E%3Cpath d='M1,${19 - 18 * up} h38 l-19,${(2 * up - 1) * 18} z' fill='%23f00' stroke='%23000' stroke-linejoin='round' /%3E%3C/svg%3E%0A")`,
      style = [
	new CSS().add({
		"table": {
			"border-collapse": "collapse",

			" th": {
				"padding": "0.5em 1.5em",
				"background-color": "#ddd",
				"cursor": "pointer",
				"user-select": "none",

				":hover": {
					"text-decoration": "underline"
				},

				".s": {
					"background-repeat": "no-repeat",
					"background-position": "right 0px bottom 0.5em",
					"background-size": "1em 1em",
					"background-image": arrow(1)
				},
				".r": {
					"background-image": arrow(0)
				}
			},

			" th, td": {
				"border": "1px solid #000"
			}
		}
	})
      ],
      colName = (n: number): string => {
	if (n < 26) {
		return String.fromCharCode(64 + (n || 26));
	}

	const q = n / 26 | 0,
	      r = n % 26;

	return (r ? colName(q) : (q !== 1 ? colName(q - 1) : "")) + colName(r);
      };

export class DataTable extends HTMLElement {
	#head: NodeArray<Header>;
	#body: NodeArray<NodeArray<Cell>>;
	constructor() {
		super();

		this.#head = new NodeArray(tr());
		this.#body = new NodeArray(tbody());

		amendNode(this.attachShadow({"mode": "closed"}), table([thead(this.#head), this.#body])).adoptedStyleSheets = style;
	}

	setData(data: Value[][]) {
		this.#head.splice(0, this.#head.length);
		this.#body.splice(0, this.#body.length);

		let maxCells = 0;

		for (const row of data) {
			const rowArr = new NodeArray<Cell>(tr())

			for (const cell of row) {
				rowArr.push({
					[child]: td(cell + ""),
					value: cell
				});
			}

			this.#body.push(rowArr);

			maxCells = Math.max(maxCells, rowArr.length);
		}

		for (let i = 0; i < maxCells; i++) {
			this.#head.push({
				[child]: th(colName(i+1))
			});
		}
	}
}

customElements.define("data-table", DataTable);

export const datatable = bindElement<DataTable>(ns, "data-table");
