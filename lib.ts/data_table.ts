import type {PropsObject} from './dom';
import CSS from './css.js';
import {amendNode, bindElement, child} from './dom.js';
import {ns, table, tbody, td, th, thead, tr} from './html.js';
import {NodeArray, stringSort} from './nodes.js';

type Value = string | number | boolean;

type CellData = Value | {
	value: Value;
	display?: string;
} & PropsObject;

type RowData = CellData[] | {
	cells: CellData[];
} & PropsObject;

type Data = RowData[];

type HeaderData = string | {
	value: string;
	allowNumber?: boolean;
	allowSort?: boolean;
} & PropsObject;

type Headers = HeaderData[];

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
	title: string;
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
					"background-image": arrow(0)
				},
				".r": {
					"background-image": arrow(1)
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
      },
      layerObjects = (...objs: PropsObject[]) => objs.reduce((o, p) => Object.assign(o, p), {});

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

	setData(data: Data, titles?: Headers) {
		this.#head.splice(0, this.#head.length);
		this.#body.splice(0, this.#body.length);

		let maxCells = titles?.length ?? 0;

		const parseNum = (a: string) => parseFloat(a || "-Infinity"),
		      numberSorter = (a: string, b: string) => parseNum(a) - parseNum(b),
		      sorters: ((a: string, b: string) => number)[] = [],
		      nullSort = (a: Row, b: Row) => a.row - b.row;

		for (const row of data) {
			const {cells, ...attrs} = row instanceof Array ? {cells: row} : row,
			      rowArr = new NodeArray<Cell, HTMLTableRowElement>(tr(layerObjects(attrs, {"part": "tr"})));

			for (const cell of cells) {
				const i = rowArr.length,
				      {value, display = null, ...attrs} = cell instanceof Object ? cell : {value: cell},
				      title = titles?.[i];

				if (sorters.length === i) {
					sorters.push(numberSorter);
				}

				if (title instanceof Object && !title.allowNumber || typeof value !== "number" && isNaN(parseNum(value + ""))) {
					sorters[i] = stringSort;
				}

				rowArr.push({
					[child]: td(layerObjects(attrs, {"part": "td"}), display ?? (value + "")),
					value
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
					[child]: td({"part": "td"}),
					value: ""
				})
			}
		}

		for (let i = 0; i < maxCells; i++) {
			const t = titles?.[i] ?? colName(i+1),
			      {value, allowNumber: _ = null, allowSort = null, ...attrs} = t instanceof Object ? t : {"value": t},
			      h = th(layerObjects(attrs, {"part": "th"}, allowSort ? {"onclick": () => {
				if (this.#sort !== i) {
					amendNode(this.#head[this.#sort]?.[child], {"class": {"r": false, "s": false}});
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
			      }} : attrs), value);

			this.#head.push({
				[child]: h,
				"title": value
			});
		}
	}

	export(includeTitles = false) {
		const toRet: Value[][] = [];

		if (includeTitles) {
			toRet.push(this.#head.map(h => h.title));
		}

		for (const row of this.#body) {
			toRet.push(row.cells.map(c => c.value));
		}

		return toRet;
	}
}

customElements.define("data-table", DataTable);

export const datatable = bindElement<DataTable>(ns, "data-table");
