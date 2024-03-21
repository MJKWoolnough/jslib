import type {PropsObject} from './dom';
import CSS from './css.js';
import {amendNode, bindElement, child} from './dom.js';
import {button, div, input, label, li, ns, table, tbody, td, th, thead, tr, ul} from './html.js';
import {setAndReturn} from './misc.js';
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
	f: boolean;
}

type Header = {
	[child]: HTMLTableCellElement;
	title: string;
}

const arrow = (up: 0 | 1) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'%3E%3Cpath d='M1,${19 - 18 * up}h38l-19,${(2 * up - 1) * 18}z' fill='%23f00' stroke='%23000' stroke-linejoin='round' /%3E%3C/svg%3E%0A")`,
      style = [
	new CSS().add({
		":host>div": {
			"position": "relative",

			">ul": {
				"position": "absolute",
				"list-style": "none",
				"padding": "0.5em",
				"outline": "none",
				"border": "2px solid #000",
				"background-color": "#f8f8f8",
				"margin": 0,

				":not(:focus-within)": {
					"transform": "scale(0)",

					" *": {
						"display": "none"
					}
				},

				"button.f": {
					"color": "transparent"
				}
			}
		},
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
			},

			" tr": {
				".p,.f": {
					"display": "none"
				}
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
      layerObjects = (...objs: PropsObject[]) => objs.reduce((o, p) => Object.assign(o, p), {}),
      thPart = {"part": "th"},
      trPart = {"part": "tr"},
      tdPart = {"part": "td"},
      unsetSort = {"class": {"r": false, "s": false}},
      setSort = {"class": ["s"]},
      setReverse = {"class": ["r"]},
      parseNum = (a: string) => parseFloat(a || "-Infinity"),
      numberSorter = (a: string, b: string) => parseNum(a) - parseNum(b),
      nullSort = (a: Row, b: Row) => a.row - b.row,
      observedAttr = Object.freeze(["page", "perPage"]),
      isBlankFilter = (s: string) => !s,
      isNotBlankFilter = (s: string) => !!s,
      regexpSpecials = "\\/.*+?|()[]{}".split(""),
      makeToggleButton = (c: string, title: string, fn: (v: boolean) => void) => button({"class": "t", title, "onclick": function(this: HTMLButtonElement) {
	fn(!this.classList.toggle("t"));
      }}, c)


export class DataTable extends HTMLElement {
	#head: NodeArray<Header>;
	#body: NodeArray<Row>;
	#filtersElm: Node;
	#filters = new Map<number, Function>();
	#sort = -1;
	#rev = false;
	#page = 0;
	#perPage = Infinity;
	#filterList = new Map<number, HTMLElement>();
	#sorters: ((a: string, b: string) => number)[] = [];

	constructor() {
		super();

		this.#head = new NodeArray(tr());
		this.#body = new NodeArray(tbody());

		amendNode(this.attachShadow({"mode": "closed"}), [
			this.#filtersElm = div(),
			table([thead(this.#head), this.#body])
		]).adoptedStyleSheets = style;
	}

	attributeChangedCallback(name: string, _: string | null, newValue: string | null) {
		const val = parseInt(newValue ?? "0"),
		      safeVal = isNaN(val) || val < 0 ? 0 : val;

		switch (name) {
		default:
			return;
		case observedAttr[0]:
			this.#page = safeVal;

			break;
		case observedAttr[1]:
			this.#perPage = safeVal || Infinity;
		}

		this.#setPage();
	}

	#setPage() {
		const start = this.#page * this.#perPage,
		      end = (this.#page + 1) * this.#perPage;

		let num = 0;

		for (const row of this.#body) {
			amendNode(row[child], {"class": {"p": num < start || num >= end}});

			if (!row.f) {
				num++;
			}
		}
	}

	static get observedAttributes() {
		return observedAttr;
	}

	setData(data: Data, titles?: Headers) {
		this.#head.splice(0, this.#head.length);
		this.#body.splice(0, this.#body.length);

		let maxCells = titles?.length ?? 0;

		for (const row of data) {
			const {cells, ...attrs} = row instanceof Array ? {cells: row} : row,
			      rowArr = new NodeArray<Cell, HTMLTableRowElement>(tr(layerObjects(attrs, trPart)));

			for (const cell of cells) {
				const i = rowArr.length,
				      {value, display = null, ...attrs} = cell instanceof Object ? cell : {value: cell},
				      title = titles?.[i];

				if (this.#sorters.length === i) {
					this.#sorters.push(numberSorter);
				}

				if (title instanceof Object && !title.allowNumber || typeof value !== "number" && isNaN(parseNum(value + ""))) {
					this.#sorters[i] = stringSort;
				}

				rowArr.push({
					[child]: td(layerObjects(attrs, tdPart), display ?? (value + "")),
					value
				});
			}

			this.#body.push({
				[child]: rowArr[child],
				cells: rowArr,
				row: this.#body.length,
				f: false
			});

			maxCells = Math.max(maxCells, rowArr.length);
		}

		for (const row of this.#body) {
			while (row.cells.length < maxCells) {
				row.cells.push({
					[child]: td(tdPart),
					value: ""
				})
			}
		}

		for (let i = 0; i < maxCells; i++) {
			const t = titles?.[i] ?? colName(i+1),
			      {value, allowNumber: _ = null, allowSort = true, ...attrs} = t instanceof Object ? t : {"value": t},
			      h = th(layerObjects(attrs, thPart, allowSort ? {"onclick": () => {
				if (this.#sort !== i) {
					amendNode(this.#head[this.#sort]?.[child], unsetSort);
					amendNode(h, setSort);

					this.#body.sort((a: Row, b: Row) => this.#sorters[i](a.cells[i].value + "", b.cells[i].value + ""));

					this.#sort = i;
					this.#rev = false;
				} else if (this.#rev) {
					this.#sort = -1;
					this.#rev = false;

					amendNode(h, unsetSort);
					this.#body.sort(nullSort);
				} else {
					this.#rev = true;

					amendNode(h, setReverse);

					this.#body.reverse();
				}

				this.#setPage();
			      }} : {}, {"oncontextmenu": (e: MouseEvent) => {
				e.preventDefault();

				let {clientX, clientY} = e,
				    p = this as HTMLElement | null;

				while (p) {
					clientX -= p.offsetLeft;
					clientY -= p.offsetTop;
					p = p.offsetParent as HTMLElement | null;
				}

				amendNode(this.#filterList.get(i) ?? setAndReturn(this.#filterList,i, this.#makeFilter(i)), {"style": `left:${clientX}px;top:${clientY}px`}).focus();
			      }}), value);

			this.#head.push({
				[child]: h,
				"title": value
			});
		}

		this.#setPage();
	}

	#runFilters() {
		let changed = false;

		for (const row of this.#body) {
			const old = row.f;

			row.f = false;

			for (const [col, filter] of this.#filters) {
				if (!filter(row.cells[col].value)) {
					row.f = true;

					break;
				}
			}

			changed ||= old !== row.f;

			amendNode(row[child], {"class": {"f": row.f}});
		}

		this.#setPage();

		if (changed) {
			this.dispatchEvent(new Event("change"));
		}
	}

	#makeFilter = (n: number) => {
		let pre = false,
		    post = false,
		    text = "",
		    caseInsensitive = false,
		    re = new RegExp(""),
		    min = -Infinity,
		    max = Infinity;

		const textFilter = (s: string) => re.test(s),
		      setTextFilter = () => {
			l.checked = true;
			re = new RegExp((pre ? "^" : "") + regexpSpecials.reduce((text, c) => text.replaceAll(c, "\\" + c), text) + (post ? "$" : ""), caseInsensitive ? "i" : "");
			this.#filters.set(n, textFilter);
			this.#runFilters();
		      },
		      numberFilter = (s: string) => {
			const n = parseFloat(s);

			return min <= n && n <= max || min === -Infinity && max === Infinity;
		      },
		      setNumberFilter = () => {
			l.checked = true;
			this.#filters.set(n, numberFilter);
			this.#runFilters();
		      },
		      l = input({"type": "radio", "name": "F_"+n, "checked": "", "onclick": this.#sorters[n] === stringSort ? setTextFilter : setNumberFilter}),
		      f = ul({"tabindex": "-1", "onkeydown": (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				((this.#filtersElm.parentNode as ShadowRoot).activeElement as HTMLElement | null)?.blur();
			}
		      }}, [
			li([
				l,
				this.#sorters[n] === stringSort ? [
					makeToggleButton("^", "Starts With", v => {
						pre = v;
						setTextFilter();
					}),
					input({"type": "text", "oninput": function(this: HTMLInputElement) {
						text = this.value;
						setTextFilter();
					}}),
					makeToggleButton("$", "Ends With", v => {
						post = v;
						setTextFilter();
					}),
					makeToggleButton("i", "Case Sensitivity", v => {
						caseInsensitive = v;
						setTextFilter();
					})
				] : [
					input({"oninput": function(this: HTMLInputElement) {
						min = parseFloat(this.value);
						if (isNaN(min)) {
							min = -Infinity;
						}

						setNumberFilter();
					}}),
					" ≤ x ≤ ",
					input({"oninput": function(this: HTMLInputElement) {
						max = parseFloat(this.value);
						if (isNaN(max)) {
							max = Infinity;
						}

						setNumberFilter();
					}})
				]
			]),
			li([
				input({"type": "radio", "name": "F_"+n, "id": `F_${n}_1`, "onclick": () => {
					this.#filters.set(n, isNotBlankFilter);
					this.#runFilters();
				}}),
				label({"for": `F_${n}_1`}, "Remove Blank")
			]),
			li([
				input({"type": "radio", "name": "F_"+n, "id": `F_${n}_2`, "onclick": () => {
					this.#filters.set(n, isBlankFilter);
					this.#runFilters();
				}}),
				label({"for": `F_${n}_2`}, "Only Blank")
			])
		      ]);

		amendNode(this.#filtersElm, f);

		return f;
	}

	export(includeTitles = false) {
		return this.#export(includeTitles);
	}

	#export(includeTitles = false, start = 0, end = Infinity) {
		const toRet: Value[][] = [];

		if (includeTitles) {
			toRet.push(this.#head.map(h => h.title));
		}

		let num = 0;

		for (const row of this.#body) {
			if (num > end) {
				break;
			}

			if (num >= start) {
				toRet.push(row.cells.map(c => c.value));
			}

			if (!row.f) {
				num++;
			}
		}

		return toRet;
	}

	exportPage(includeTitles = false) {
		return this.#export(includeTitles, this.#page * this.#perPage, (this.#page + 1) * this.#perPage);
	}
}

customElements.define("data-table", DataTable);

export const datatable = bindElement<DataTable>(ns, "data-table");
