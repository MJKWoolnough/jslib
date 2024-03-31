import type {PropsObject} from './dom.js';
import CSS from './css.js';
import {amendNode, bindCustomElement, child, clearNode} from './dom.js';
import {button, div, input, label, li, slot, table, tbody, td, th, thead, tr, ul} from './html.js';
import {checkInt} from './misc.js';
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
	hid?: string;
	allowNumber?: boolean;
	allowSort?: boolean;
	allowFilter?: boolean;
	allowEmptyFilter?: boolean;
	allowNonEmptyFilter?: boolean;
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
	col: number;
}

type HeaderFilter = {
	[child]: HTMLUListElement;
	primary: HTMLInputElement;
	nonEmpty?: HTMLInputElement;
	empty?: HTMLInputElement;
}

type TextHeaderFilter = HeaderFilter & {
	text: (text: string) => void;
	isPrefix: HTMLButtonElement;
	isSuffix: HTMLButtonElement;
	isCaseInsensitive: HTMLButtonElement;
}

type NumberHeaderFilter = HeaderFilter & {
	minMax: (min: number, max: number) => void;
}

type Filter = TextFilter | NumberFilter | boolean;

type TextFilter = {
	text: string;
	isPrefix: boolean;
	isSuffix: boolean;
	isCaseInsensitive: boolean;
}

type NumberFilter = {
	min: number;
	max: number;
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

				" button.t": {
					"color": "transparent"
				},

				" li:first-child:last-child input[type=radio]": {
					"display": "none"
				}
			}
		},
		"table": {
			"border-collapse": "collapse",

			" th": {
				"padding": "0.5em 1.5em",
				"background-color": "#ddd",

				":not(.noSort)": {
					"cursor": "pointer",
					"user-select": "none",

					":hover": {
						"text-decoration": "underline"
					}
				},

				"[data-sort=\"asc\"],[data-sort=\"desc\"]": {
					"background-repeat": "no-repeat",
					"background-position": "right 0px bottom 0.5em",
					"background-size": "1em 1em",
					"background-image": arrow(0)
				},
				"[data-sort=\"desc\"]": {
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
      unsetSort = {"data-sort": false},
      setSort = {"data-sort": "asc"},
      setReverse = {"data-sort": "desc"},
      unsetReverse = {"class": {"r": false}},
      parseNum = (a: string) => parseFloat(a || "-Infinity"),
      numberSorter = (a: string, b: string) => parseNum(a) - parseNum(b),
      nullSort = () => 0,
      observedAttr = Object.freeze(["page", "perPage"]),
      isBlankFilter = (s: string) => !s,
      isNotBlankFilter = (s: string) => !!s,
      regexpSpecials = "\\/.*+?|()[]{}".split(""),
      makeToggleButton = (c: string, title: string, fn: (v: boolean) => void) => button({"class": "t", title, "onclick": function(this: HTMLButtonElement) {
	fn(!this.classList.toggle("t"));
      }}, c),
      setButton = (filterButton: HTMLButtonElement, set: boolean) => {
	if (filterButton.classList.contains("t") === set) {
		filterButton.click();
	}
      };

export class DataTable extends HTMLElement {
	#head: HTMLSlotElement;
	#body: HTMLSlotElement;
	#filters = new Map<number, Function>();
	#sort: Element | null = null;
	#rev = false;
	#page = 0;
	#perPage = Infinity;
	#filterList = new Map<number, TextHeaderFilter | NumberHeaderFilter>();
	#sorters: ((a: string, b: string) => number)[] = [];
	#headers = new Map<HTMLElement, number>();
	#data = new Map<Element, string[]>();
	#debounce = false;

	constructor() {
		super();

		const filter = div(),
		      mo = new MutationObserver((mutations: MutationRecord[]) => {
			let doneChildren = false,
			    doneSort = false;

			for (const mutation of mutations) {
				switch (mutation.type) {
				case "childList":
					if (!doneChildren) {
						this.#parseContent();

						doneChildren = true;
					}

					break;
				case "attributes":
					if (!doneSort) {
						this.#parseSort();

						doneSort = true;
					}
				}
			}
		      });

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			filter,
			table([
				this.#head = slot({"onclick": (e: MouseEvent) => {
					const target = this.#getHeaderCell(e);

					if (!target) {
						return;
					}

					if (target.dataset["sortDisable"] !== undefined) {
						return;
					}

					if (this.#sort === target) {
						if (this.#rev) {
							amendNode(target, unsetSort);

							this.#rev = false;
							this.#sort = null;
						} else {
							amendNode(target, setReverse);
							this.#rev = true;
						}
					} else {
						amendNode(this.#sort, unsetSort);
						amendNode(target, setSort);

						this.#sort = target;
					}
				}, "oncontextmenu": (e: MouseEvent) => {
					const target = this.#getHeaderCell(e);

					if (!target) {
						return;
					}

					e.preventDefault();

					let {clientX, clientY} = e,
					    p: HTMLElement | null = this;

					while (p) {
						clientX -= p.offsetLeft;
						clientY -= p.offsetTop;
						p = p.offsetParent as HTMLElement | null;
					}

					const firstRadio = input({"type": "radio", "checked": true, "name": "data-table-filter"}),
					      list = ul({"tabindex": -1, "style": {"left": clientX + "px", "top": clientY + "px"}, "ofocusout": function(this: HTMLUListElement, e: FocusEvent) {
						if (!e.relatedTarget || !list.contains(e.relatedTarget as Node)) {
							this.remove();
						}
					      }}, [
						li([
							firstRadio,
							this.#sorters[this.#headers.get(target)!] === numberSorter ? [
								input({"oninput": () => {
								}}),
								" ≤ x ≤ ",
								input({"oninput": () => {
								}})
							] : [
								makeToggleButton("^", "Starts With", v => {
								}),
								input({"type": "text", "oninput": function(this: HTMLInputElement) {
								}}),
								 makeToggleButton("$", "Ends With", v => {
								}),
								makeToggleButton("i", "Case Sensitivity", v => {
								})
							]
						]),
						li([
							input({"type": "radio", "name": "data-table-filter", "id": "filter-remove-blank",  "onclick": () => {
							}}),
							label({"for": "filter-remove-blank"}, "Remove Blank")
						]),
						li([
							input({"type": "radio", "name": "data-table-filter", "id": "filter-only-blank", "onclick": () => {
							}}),
							label({"for": "filter-only-blank"}, "Only Blank")
						])
					      ]);

					amendNode(filter, list);
					list.focus();
				}}),
				tbody(this.#body = slot())
			])
		      ]).adoptedStyleSheets = style;

		this.#parseContent();

		mo.observe(this, {
			"attributeFilter": ["data-sort", "data-filter", "data-is-prefix", "data-is-suffix", "data-min", "data-max", "data-is-text", "data-empty", "data-not-empty",  "data-disallow-empty", "data-disallow-not-empty"],
			"childList": true,
			"subtree": true
		});
		mo.observe(this.#head, {
			"attributeFilter": ["data-sort", "data-filter", "data-is-prefix", "data-is-suffix", "data-min", "data-max", "data-empty", "data-not-empty"],
			"subtree": true
		});
	}

	#getHeaderCell(e: MouseEvent) {
		let target = e.target as HTMLElement;

		while (!this.#headers.has(target)) {
			if (target === this) {
				return null;
			}

			target = target.parentElement!;
		}

		return target;
	}

	#parseContent() {
		let head: HTMLTableSectionElement | null = null,
		    maxCols = 0;

		const rows: HTMLTableRowElement[] = [];

		this.#sorters = [];
		this.#headers.clear();
		this.#data.clear();
		this.#sort = null;
		this.#rev = false;

		for (const elem of this.children) {
			if (elem instanceof HTMLTableSectionElement && elem.nodeName === "THEAD" && elem.firstChild instanceof HTMLTableRowElement) {
				if (!head) {
					head = elem;
				}
			} else if (elem instanceof HTMLTableRowElement) {
				rows.push(elem);

				const data: string[] = [];

				for (const child of elem.children) {
					if (child instanceof HTMLTableCellElement) {
						if (this.#sorters.length <= data.length) {
							this.#sorters.push(numberSorter);
						}

						const cell = child.textContent ?? "";

						if (isNaN(parseNum(cell))) {
							this.#sorters[data.length] = stringSort;
						}

						data.push(cell);
					}
				}

				if (data.length > maxCols) {
					maxCols = data.length;
				}

				this.#data.set(elem, data);
			}
		}

		if (!head) {
			clearNode(this.#head, head = thead(tr(Array.from({"length": maxCols}, (_, n) => th(colName(n + 1))))));
		} else {
			this.#head.assign(head);
		}

		for (const header of (head.firstChild as HTMLTableRowElement).children) {
			if (header instanceof HTMLTableCellElement) {
				this.#headers.set(header, this.#headers.size);
			}
		}

		this.#body.assign(...rows);
	}

	#parseSort() {
		let reverse = false;
		for (const [header, num] of this.#headers) {
			switch (header.dataset["sort"]) {
			case "desc":
				reverse = true;
			case "asc":
				this.#sortRows(num, reverse);

				return;
			}
		}

		this.#sortRows(-1);
	}

	#sortRows(col: number, reverse = false) {
		const sorter = this.#sorters[col] ?? nullSort;

		this.#body.assign(...Array.from(this.#data).sort(([, a], [, b]) => sorter(a[col], b[col]) * (reverse ? -1 : 1)).map(row => row[0]));
	}

	get totalRows() {
		let count = 0;

		for (const row of this.#body) {
			if (!row.f) {
				count++;
			}
		}

		return count;
	}

	attributeChangedCallback(name: string, _: string, newValue: string) {
		const val = parseInt(newValue);

		switch (name) {
		default:
			return;
		case observedAttr[0]:
			this.#page = checkInt(val, 0);

			break;
		case observedAttr[1]:
			this.#perPage = checkInt(val, 1, Infinity, Infinity);
		}

		this.#setPage();
	}

	#setPage() {
		const start = this.#page * this.#perPage,
		      end = (this.#page + 1) * this.#perPage;

		let num = 0;

		for (const row of this.#body) {
			amendNode(row, {"class": {"p": num < start || num >= end}});

			if (!row.f) {
				num++;
			}
		}
	}

	static get observedAttributes() {
		return observedAttr;
	}

	/*
	setData(data: Data, titles?: Headers) {
		this.#head.splice(0, this.#head.length);
		this.#body.splice(0, this.#body.length);
		this.#filterList.clear();
		this.#filters.clear();
		this.#filtersElm.replaceChildren();
		this.#sorters = [];
		this.#headers.clear();

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

				if (title instanceof Object && title.allowNumber === false || typeof value !== "number" && isNaN(parseNum(value + ""))) {
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
				f: true
			});

			maxCells = Math.max(maxCells, rowArr.length);
		}

		for (const row of this.#body) {
			while (row.cells.length < maxCells) {
				row.cells.push({
					[child]: td(tdPart),
					value: ""
				});
			}
		}

		for (let i = 0; i < maxCells; i++) {
			const t = titles?.[i] ?? colName(i+1),
			      {value, hid = null, allowNumber: _ = null, allowSort = true, allowFilter = true, allowEmptyFilter = true, allowNonEmptyFilter = true, ...attrs} = t instanceof Object ? t : {"value": t},
			      h = amendNode(th(layerObjects(attrs, thPart, allowSort ? {"onclick": () => {
				if (this.#sort !== i) {
					amendNode(this.#head[this.#sort], unsetSort);
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
			      }} : {}, allowFilter ? {"oncontextmenu": (e: MouseEvent) => {
				e.preventDefault();

				let {clientX, clientY} = e,
				    p = this as HTMLElement | null;

				while (p) {
					clientX -= p.offsetLeft;
					clientY -= p.offsetTop;
					p = p.offsetParent as HTMLElement | null;
				}

				amendNode(this.#filterList.get(i)![child], {"style": `left:${clientX}px;top:${clientY}px`}).focus();
			      }} : {}), value), {"class": {"noSort": !allowSort}}),
			      header = {
				[child]: h,
				"title": value,
				"col": this.#head.length
			      };

			if (allowFilter) {
				this.#filterList.set(i, this.#makeFilter(i, allowEmptyFilter, allowNonEmptyFilter));
			}

			if (hid) {
				this.#headers.set(hid, header);
			}

			this.#head.push(header);
		}

		this.#runFilters();
	}

	sort(hid?: string, reverse = false) {
		if (hid) {
			const header = this.#headers.get(hid);

			if (header) {
				const i = header.col;

				if (this.#sort === header.col) {
					if (this.#rev !== reverse) {
						amendNode(header, reverse ? setReverse : unsetReverse);

						this.#body.reverse();

						this.#rev = reverse;
					} else {
						return;
					}
				} else {
					amendNode(this.#head[this.#sort], unsetSort);
					amendNode(header, setSort);

					this.#body.sort((a: Row, b: Row) => this.#sorters[i](a.cells[i].value + "", b.cells[i].value + ""));

					this.#sort = i;

					if (this.#rev = reverse) {
						amendNode(header, setReverse);
						this.#body.reverse();
					}
				}
			}
		} else if (this.#sort !== -1) {
			amendNode(this.#head[this.#sort], unsetSort);

			this.#sort = -1;
			this.#rev = false;

			this.#body.sort(nullSort);
		} else {
			return;
		}

		this.#setPage();
	}

	#runFilters() {
		if (this.#debounce) {
			return;
		}

		this.#debounce = true;

		queueMicrotask(() => {
			this.#debounce = false;

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

				amendNode(row, {"class": {"f": row.f}});
			}

			this.#setPage();

			if (changed) {
				this.dispatchEvent(new Event("change"));
			}
		});
	}

	#makeFilter = (n: number, allowEmptyFilter: boolean, allowNonEmptyFilter: boolean) => {
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
		      filter = {} as TextHeaderFilter | NumberHeaderFilter;

		filter[child] = ul({"part": "filter", "tabindex": "-1", "onkeydown": (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				((this.#filtersElm.parentNode as ShadowRoot).activeElement as HTMLElement | null)?.blur();
			}
		      }}, [
			li([
				filter.primary = l,
				this.#sorters[n] === stringSort ? [
					(filter as TextHeaderFilter).isPrefix = makeToggleButton("^", "Starts With", v => {
						pre = v;
						setTextFilter();
					}),
					(() => {
						const i = input({"type": "text", "oninput": () => {
							text = i.value;
							setTextFilter();
						}});

						(filter as TextHeaderFilter).text = (t: string) => {
							i.value = text = t;
							setTextFilter();
						};

						return i;
					})(),
					(filter as TextHeaderFilter).isSuffix = makeToggleButton("$", "Ends With", v => {
						post = v;
						setTextFilter();
					}),
					(filter as TextHeaderFilter).isCaseInsensitive = makeToggleButton("i", "Case Sensitivity", v => {
						caseInsensitive = v;
						setTextFilter();
					})
				] : (() => {
					const minE = input({"oninput": () => {
						min = parseFloat(minE.value);
						if (isNaN(min)) {
							min = -Infinity;
						}

						setNumberFilter();
					      }}),
					      maxE = input({"oninput": () => {
						max = parseFloat(maxE.value);
						if (isNaN(max)) {
							max = Infinity;
						}

						setNumberFilter();
					      }});

					(filter as NumberHeaderFilter).minMax = (minN: number, maxN: number) => {
						minE.value = (min = minN) + "";
						maxE.value = (max = maxN) + "";

						setNumberFilter();
					};

					return [minE, " ≤ x ≤ ", maxE];
				})()
			]),
			allowNonEmptyFilter ? li([
				filter.nonEmpty = input({"type": "radio", "name": "F_"+n, "id": `F_${n}_1`, "onclick": () => {
					this.#filters.set(n, isNotBlankFilter);
					this.#runFilters();
				}}),
				label({"for": `F_${n}_1`}, "Remove Blank")
			]) : [],
			allowEmptyFilter ? li([
				filter.empty = input({"type": "radio", "name": "F_"+n, "id": `F_${n}_2`, "onclick": () => {
					this.#filters.set(n, isBlankFilter);
					this.#runFilters();
				}}),
				label({"for": `F_${n}_2`}, "Only Blank")
			]) : []
		      ]);

		amendNode(this.#filtersElm, filter);

		return filter;
	}

	filter(hid: string, filter: Filter) {
		const header = this.#headers.get(hid);

		if (header) {
			const filterElem = this.#filterList.get(header.col)!;

			switch (filter) {
			case true:
				filterElem.nonEmpty?.click();

				break;
			case false:
				filterElem.empty?.click();

				break;
			default:
				if ("min" in filter && "minMax" in filterElem) {
					filterElem.minMax(filter.min, filter.max);
				} else if ("text" in filter && "text" in filterElem) {
					setButton(filterElem.isPrefix, filter.isPrefix);
					setButton(filterElem.isSuffix, filter.isSuffix);
					setButton(filterElem.isCaseInsensitive, filter.isCaseInsensitive);

					filterElem.text(filter.text);
				}
			}
		}
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
	*/
}

export const datatable = bindCustomElement("data-table", DataTable);
