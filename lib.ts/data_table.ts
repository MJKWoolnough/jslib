import CSS from './css.js';
import {amendNode, bindElement, child} from './dom.js';
import {table, tbody, td, th, thead, tr, ns} from './html.js';
import {NodeArray, stringSort} from './nodes.js';

type Value = string | number | boolean;

type Cell = {
	[child]: HTMLTableCellElement;
	value: Value;
}

type Row = {
	[child]: HTMLTableRowElement,
	cells: NodeArray<Cell>,
	row: number;
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
	#body: NodeArray<Row>;
	#sort = -1;
	#rev = false;

	constructor() {
		super();

		this.#head = new NodeArray(tr());
		this.#body = new NodeArray(tbody());

		amendNode(this.attachShadow({"mode": "closed"}), table([thead(this.#head), this.#body])).adoptedStyleSheets = style;
	}

	setData(data: Value[][], titles?: string[]) {
		this.#head.splice(0, this.#head.length);
		this.#body.splice(0, this.#body.length);

		let maxCells = titles?.length ?? 0;

		const parseNum = (a: string) => parseFloat(a || "-Infinity"),
		      numberSorter = (a: string, b: string) => parseNum(a) - parseNum(b),
		      sorters: ((a: string, b: string) => number)[] = [],
		      nullSort = (a: Row, b: Row) => a.row - b.row;

		for (const row of data) {
			const rowArr = new NodeArray<Cell, HTMLTableRowElement>(tr())

			let i = 0;

			for (const cell of row) {
				if (sorters.length < i) {
					sorters.push(numberSorter);
				}

				if (typeof cell !== "number" || isNaN(parseNum(cell + ""))) {
					sorters[i] = stringSort;
				}

				i++;

				rowArr.push({
					[child]: td(cell + ""),
					value: cell
				});
			}

			this.#body.push({
				[child]: rowArr[child],
				cells: rowArr,
				row: this.#body.length
			});

			maxCells = Math.max(maxCells, rowArr.length);
		}

		for (const row of this.#body) {
			while (row.cells.length < maxCells) {
				row.cells.push({
					[child]: td(),
					value: ""
				})
			}
		}

		for (let i = 0; i < maxCells; i++) {
			const h = th({"onclick": () => {
				if (this.#sort !== i) {
					if (this.#sort !== -1) {
						amendNode(this.#head.at(this.#sort)?.[child], {"class": {"r": false, "s": false}});
					}

					amendNode(h, {"class": ["s"]});

					this.#body.sort((a: Row, b: Row) => sorters[i](a.cells[i].value + "", b.cells[i].value + ""));

					this.#sort = i;
					this.#rev = false;
				} else if (this.#rev) {
					this.#sort = -1;
					this.#rev = false;

					amendNode(h, {"class": {"r": false, "s": false}});
					this.#body.sort(nullSort);
				} else {
					this.#rev = true;

					amendNode(h, {"class": ["r"]});

					this.#body.reverse();
				}
			      }}, titles?.[i] ?? colName(i+1));

			this.#head.push({
				[child]: h
			});
		}
	}
}

customElements.define("data-table", DataTable);

export const datatable = bindElement<DataTable>(ns, "data-table");
