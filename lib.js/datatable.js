import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {button, div, input, label, li, slot, table, tbody, th, thead, tr, ul} from './html.js';
import {autoFocus, checkInt, pushAndReturn, stringSort} from './misc.js';

/**
 * The datatable module adds a custom element for handling tabular data that can be filtered, sorted, and paged.
 *
 * This module relies directly on the {@link module:css | CSS}, {@link module:dom | DOM}, {@link module:html | HTML}, {@link module:misc | Misc}, and {@link module:nodes | Nodes} modules.
 *
 * @module datatable
 * @requires module:css
 * @requires module:dom
 * @requires module:html
 * @requires module:misc
 */
/** */

const style = [new CSS().add(":host>div", {
	"position": "relative",

	">ul": {
		"position": "absolute",
		"list-style": "none",
		"padding": "0.5em",
		"border": "2px solid #000",
		"background-color": "#f8f8f8",
		"margin": 0,

		" button.t": {
			"color": "transparent"
		},

		" li:first-child:last-child input[type=radio]": {
			"display": "none"
		}
	}
      })],
      colName = n => {
	if (n < 26) {
		return String.fromCharCode(64 + (n || 26));
	}

	const q = n / 26 | 0,
	      r = n % 26;

	return (r ? colName(q) : (q !== 1 ? colName(q - 1) : "")) + colName(r);
      },
      unsetSort = {"data-sort": false},
      setSort = {"data-sort": "asc"},
      setReverse = {"data-sort": "desc"},
      setSortPart = {"part": ["asc"]},
      setRevPart = {"part": {"asc": false, "desc": true}},
      unsetSortPart = {"part": {"asc": false, "desc": false}},
      parseNum = a => parseFloat(a || "-Infinity"),
      numberSorter = (a, b) => parseNum(a) - parseNum(b),
      nullSort = () => 0,
      isBlankFilter = s => !s,
      isNotBlankFilter = s => !!s,
      safeFloat = (n, def) => isNaN(n) ? def : n,
      makeToggleButton = (c, title, initial, fn) => button({"part": "toggle", "class": {"t": initial}, title, "onclick": function() {
	fn(!this.classList.toggle("t"));
      }}, c),
      dsHasKey = (ds, key) => ds[key] !== undefined,
      lang = {
	"STARTS_WITH": "Starts With",
	"ENDS_WIDTH": "Ends With",
	"CASE_SENSITIVITY": "Case Sensitivity",
	"REMOVE_BLANK": "Remove Blank",
	"ONLY_BLANK": "Only Blank"
      },
      arrow = (up, fill, stroke) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'%3E%3Cpath d='M1,${19 - 18 * up}h38l-19,${(2 * up - 1) * 18}z' fill='${encodeURIComponent(fill)}' stroke='${encodeURIComponent(stroke)}' stroke-linejoin='round' /%3E%3C/svg%3E%0A")`,
      debounceFilter = (firstRadio, target, key, value) => {
	if (target === debounceTarget) {
		clearTimeout(debounceID);
	}

	debounceTarget = target;

	debounceID = setTimeout(() => {
		target[key] = value;
		firstRadio.click();
		debounceTarget = null;
	}, 500);
      },
      numberInput = (dataset, minMax, firstRadio) => {
	let value,
	    type = dataset["type"],
	    oninput;

	switch (dataset["type"]) {
	default:
		value = dataset[minMax] ?? "";
		type = "number";
		oninput = function() {
			debounceFilter(firstRadio, dataset, minMax, this.value);
		};

		break;
	case "datetime":
		type += "-local";
	case "date":
	case "time":
		const val = parseInt(dataset[minMax]);

		value = isNaN(val) ? "" : new Date(val * 1000).toISOString().split(type === "datetime-local" ? "Z" : "T")[+(type === "time")].replace("Z", "");
		oninput = function() {
			const d = this.valueAsNumber / 1000;

			debounceFilter(firstRadio, dataset, minMax, isNaN(d) ? "" : d + "");
		};
	}

	return input({"part": "filter " + minMax, type, value, oninput});
      },
      maxElems = 32768,
      focus = (focus, input) => focus ? autoFocus(input) : input;

let debounceTarget = null,
    debounceID = -1;

/**
 * The DataTable custom element can be used to easily create filterable, sortable and pageable tables.
 *
 * The element registers with the name `data-table`
 *
 * This element directly handles the following attributes:
 *
 * |  Attribute  |  Type  |  Description  |
 * |-------------|--------|---------------|
 * | page        | Number | The page of data to show (0 indexed, default: 0). |
 * | perPage     | Number | The number of items to show on a page (default: Infinity). |
 *
 * To add headers to the table, add a `thead` element containing a `tr` element. Inside that `tr` element you can add your `th` or `td` header elements. For example:
 *
 * ```html
 * <data-table>
 * 	<thead>
 * 		<tr>
 * 			<th>Column 1</th>
 * 			<th>Column 2</th>
 * 		</tr>
 * 	</thead>
 * </data-table>
 * ```
 *
 * The follow data-* attributes have special meaning to header cells and determine how sorting and filtering take place:
 *
 * |  Attribute               |  Type     |  Description  |
 * |--------------------------|-----------|---------------|
 * | data-disallow-empty      | Boolean   | When set, disables the ability to filter out empty cells. |
 * | data-disallow-not-empty  | Boolean   | When set, disables the ability to filter out non-empty cells. |
 * | data-empty               | Boolean   | When set, filters out empty cells. |
 * | data-filter              | String    | Filters the cells to those containing the value of the attribute. |
 * | data-filter-disable      | Boolean   | When set, disables user filtering. |
 * | data-is-case-insensitive | Boolean   | When set, the text filter is case insensitive. |
 * | data-is-prefix           | Boolean   | When set, the text filter is a prefix match. When set with data-is-suffix becomes an exact match filter. |
 * | data-is-suffix           | Boolean   | When set, the text filter is a suffix match. When set with data-is-prefix becomes an exact match filter. |
 * | data-max                 | Number    | For columns of numbers, specifies a maximum value to filter by. |
 * | data-min                 | Number    | For columns of numbers, specifies a minimum value to filter by. |
 * | data-not-empty           | Boolean   | When set, filters out non-empty cells. |
 * | data-sort                | asc, desc | When set, sorts by the column in either asc(ending) of desc(ending) order. |
 * | data-sort-disable        | Boolean   | When set, disables user sorting. |
 * | data-type                | string, number, date, time, datetime | When set, will determine how filters and sorting are conducted. |
 *
 * To add the table to the table, add successive `tr` elements which contain the cells for the columns. For example:
 *
 * ```html
 * <data-table>
 * 	<tr>
 * 		<td>Cell 1</td>
 * 		<td>Cell 2</td>
 * 		<td>Cell 3</td>
 * 	</tr>
 * 	<tr>
 * 		<td>Cell 4</td>
 * 		<td>Cell 5</td>
 * 		<td>Cell 6</td>
 * 	</tr>
 * </data-table>
 * ```
 *
 * The data-value attribute can be specified on a cell to supply a value other than its text content.
 *
 * When no header is specified, one is generated with sequentially titled columns. If no header is wanted, add an empty `tr` element in a `thead` element:
 *
 * ```html
 * <data-table>
 * 	<thead>
 * 		<tr></tr>
 * 	</thead>
 * </data-table>
 * ```
 */
export class DataTable extends HTMLElement {
	#head;
	#body;
	#slots = [];
	#sorters = [];
	#hasEmpty = [];
	#headers = new Map();
	#data = new Map();
	#filteredData = [];
	#sortedData = [];
	#page = 0;
	#perPage = Infinity;
	#ownHeaders = false;
	#lastSorted = -1;
	#lastOrder = 0;
	#filter;

	constructor() {
		super();

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			this.#filter = div({"onkeydown": this}),
			table({"part": "table"}, [
				this.#head = slot({"onclick": this, "oncontextmenu": this}),
				this.#body = tbody()
			])
		]).adoptedStyleSheets = style;

		this.#parseContent();

		const mo = new MutationObserver(mutations => this.#handleMutations(mutations));

		mo.observe(this, {
			"attributeFilter": ["data-sort", "data-filter", "data-is-prefix", "data-is-suffix", "data-min", "data-max", "data-empty", "data-not-empty", "data-is-case-insensitive", "colspan", "data-value", "data-type"],
			"childList": true,
			"subtree": true
		});
		mo.observe(this.#head, {
			"attributeFilter": ["data-sort", "data-filter", "data-is-prefix", "data-is-suffix", "data-min", "data-max", "data-empty", "data-not-empty", "data-is-case-insensitive"],
			"subtree": true
		});
	}

	#handleMutations(mutations) {
		let doParseChildren = false,
		    doFilter = false,
		    doSort = false;

		for (const mutation of mutations) {
			switch (mutation.type) {
			case "childList":
				doParseChildren = true;

				break;
			case "attributes":
				if (this.#headers.has(mutation.target)) {
					switch (mutation.attributeName) {
					case "colspan":
					case "data-value":
					case "data-type":
						doParseChildren = true;
					default:
						doFilter = true;
					case "data-sort":
						doSort = true;
					}
				}
			}
		}

		if (doParseChildren) {
			this.#parseContent();
		} else if (doFilter) {
			this.#filterData();
		} else if (doSort) {
			this.#sortData();
		}
	}

	handleEvent(e) {
		switch (e.type) {
		case "click":
			return this.#handleClicks(e);
		case "contextmenu":
			return this.#handleContext(e);
		case "keydown":
			if (e.key === "Escape") {
				e.target.blur();
			}
		}
	}

	#handleClicks(e) {
		const target = this.#getHeaderCell(e);

		if (!target || dsHasKey(target.dataset, "sortDisable")) {
			return;
		}

		for (const header of this.#headers.keys()) {
			if (dsHasKey(header.dataset, "sort") && header !== target) {
				amendNode(header, unsetSort);
				if (this.#ownHeaders) {
					amendNode(header, unsetSortPart);
				}
			}
		}

		switch (target.dataset["sort"]) {
		case "asc":
			amendNode(target, setReverse);
			if (this.#ownHeaders) {
				amendNode(target, setRevPart);
			}

			break;
		case "desc":
			amendNode(target, unsetSort);
			if (this.#ownHeaders) {
				amendNode(target, unsetSortPart);
			}

			break;
		default:
			amendNode(target, setSort);
			if (this.#ownHeaders) {
				amendNode(target, setSortPart);
			}
		}
	}

	#handleContext(e) {
		const target = this.#getHeaderCell(e);

		if (!target || dsHasKey(target.dataset, "filterDisable")) {
			return;
		}

		e.preventDefault();

		let {clientX, clientY} = e,
		    p = this;

		while (p) {
			clientX -= p.offsetLeft;
			clientY -= p.offsetTop;
			p = p.offsetParent;
		}

		const {dataset} = target,
		      colNum = this.#headers.get(target),
		      selected = dsHasKey(dataset, "notEmpty") ? 1 : dsHasKey(dataset, "empty") ? 2 : 0,
		      firstRadio = input({"part": "radio", "type": "radio", "checked": !selected, "name": "data-table-filter", "onclick": () => amendNode(target, {"data-not-empty": false, "data-empty": false})}),
		      list = ul({"part": "filter", "style": {"left": clientX + "px", "top": clientY + "px"}, "onfocusout": function(e) {
			if (!e.relatedTarget || !list.contains(e.relatedTarget)) {
				this.remove();
			}
		      }}, [
			li([
				firstRadio,
				this.#sorters[colNum] === numberSorter ? [
					focus(!selected, numberInput(dataset, "min", firstRadio)),
					" ≤ x ≤ ",
					numberInput(dataset, "max", firstRadio)
				] : [
					makeToggleButton("^", lang["STARTS_WITH"], !dsHasKey(dataset, "isPrefix"), v => {
						amendNode(target, {"data-is-prefix": v});
						firstRadio.click();
					}),
					focus(!selected, input({"part": "filter text", "type": "search", "value": dataset["filter"], "oninput": function() {
						debounceFilter(firstRadio, dataset, "filter", this.value);
					}})),
					makeToggleButton("$", lang["ENDS_WIDTH"], !dsHasKey(dataset, "isSuffix"), v => {
						amendNode(target, {"data-is-suffix": v});
						firstRadio.click();
					}),
					makeToggleButton("i", lang["CASE_SENSITIVITY"], !dsHasKey(dataset, "isCaseInsensitive"), v => {
						amendNode(target, {"data-is-case-insensitive": v});
						firstRadio.click();
					})
				]
			]),
			this.#hasEmpty[colNum] ? [
				!dsHasKey(dataset, "disallowNotEmpty") ? li([
					focus(selected === 1, input({"type": "radio", "name": "data-table-filter", "id": "filter-remove-blank", "checked": selected === 1, "onclick": () => amendNode(target, {"data-not-empty": true, "data-empty": false})})),
					label({"for": "filter-remove-blank"}, lang["REMOVE_BLANK"])
				]) : [],
				!dsHasKey(dataset, "disallowEmpty") ? li([
					focus(selected === 2, input({"type": "radio", "name": "data-table-filter", "id": "filter-only-blank", "checked": selected === 2, "onclick": () => amendNode(target, {"data-not-empty": false, "data-empty": true})})),
					label({"for": "filter-only-blank"}, lang["ONLY_BLANK"])
				]) : []
			] : []
		      ]);

		amendNode(this.#filter, list);
	}

	attributeChangedCallback(name, _oldValue, newValue) {
		const value = parseInt(newValue ?? "0");

		switch (name) {
		default:
			return;
		case "page":
			const page = checkInt(value, 0);

			if (page === this.#page) {
				return;
			}

			this.#page = page;

			break;
		case "perPage":
			const perPage = checkInt(value, 1, Infinity, Infinity);

			if (perPage === this.#perPage) {
				return;
			}

			this.#perPage = perPage;
		}

		this.#pageData();
	}

	static get observedAttributes() {
		return ["page", "perPage"];
	}

	#getHeaderCell(e) {
		let target = e.target;

		while (!this.#headers.has(target)) {
			if (target === this || !(target = target.parentElement)) {
				return null;
			}
		}

		return target;
	}

	#parseContent() {
		let head = null,
		    maxCols = 0;

		this.#sorters = [];
		this.#hasEmpty = [];
		this.#headers.clear();
		this.#data.clear();

		for (const elem of this.children) {
			if (elem instanceof HTMLTableRowElement) {
				const data = [];

				for (const child of elem.children) {
					if (child instanceof HTMLTableCellElement) {
						if (this.#sorters.length <= data.length) {
							this.#sorters.push(numberSorter);
						}

						if (this.#hasEmpty.length <= data.length) {
							this.#hasEmpty.push(false);
						}

						const cell = dsHasKey(child.dataset, "value") ? child.dataset["value"] : child.innerText,
						      colspan = checkInt(parseInt(child.getAttribute("colspan")), 1);

						if (isNaN(parseNum(cell))) {
							this.#sorters[data.length] = stringSort;
						}

						if (!cell) {
							this.#hasEmpty[data.length] = true;
						}

						data.push(cell);

						for (let i = 1; i < colspan; i++) {
							if (this.#sorters.length <= data.length) {
								this.#sorters.push(numberSorter);
							}

							data.push("");

							this.#hasEmpty[data.length] = true;
						}
					}
				}

				if (data.length > maxCols) {
					maxCols = data.length;
				}

				this.#data.set(elem, data);
			} else if (elem instanceof HTMLTableSectionElement && !head && elem.nodeName === "THEAD" && elem.lastChild instanceof HTMLTableRowElement) {
				head = elem;
			}
		}

		if (!head) {
			clearNode(this.#head, head = thead(tr(Array.from({"length": maxCols}, (_, n) => th({"part": "header"}, colName(n + 1))))));

			this.#ownHeaders = true;
		} else {
			this.#head.assign(head);

			this.#ownHeaders = false;
		}

		let count = 0;

		for (const header of head.lastChild.children) {
			if (header instanceof HTMLTableCellElement) {
				this.#headers.set(header, count);

				if (header.dataset["type"] === "string") {
					this.#sorters[count] = stringSort;
				}

				count += checkInt(parseInt(header.getAttribute("colspan")), 1);
			}
		}

		this.#filterData();
	}

	#filterData() {
		this.#lastSorted = -1;
		this.#lastOrder = 0;

		const filter = [];

		for (const [{dataset}, col] of this.#headers) {
			const hasEmpty = this.#hasEmpty[col];

			if (hasEmpty && dsHasKey(dataset, "notEmpty")) {
				filter.push([col, isNotBlankFilter]);
			} else if (hasEmpty && dsHasKey(dataset, "empty")) {
				filter.push([col, isBlankFilter]);
			} else if (this.#sorters[col] === stringSort) {
				const isCaseInsensitive = dsHasKey(dataset, "isCaseInsensitive"),
				      filterText = isCaseInsensitive ? (dataset["filter"] ?? "").toLowerCase() : dataset["filter"] ?? "",
				      isPrefix = dsHasKey(dataset, "isPrefix"),
				      isSuffix = dsHasKey(dataset, "isSuffix");

				if (filterText) {
					if (isPrefix) {
						if (isSuffix) {
							filter.push([col, isCaseInsensitive ? text => text.toLowerCase() === filterText : text => text === filterText]);
						} else {
							filter.push([col, isCaseInsensitive ? text => text.toLowerCase().startsWith(filterText) : text => text.startsWith(filterText)]);
						}
					} else if (isSuffix) {
						filter.push([col, isCaseInsensitive ? text => text.toLowerCase().endsWith(filterText) : text => text.endsWith(filterText)]);
					} else {
						filter.push([col, isCaseInsensitive ? text => text.toLowerCase().includes(filterText) : text => text.includes(filterText)]);
					}
				}
			} else {
				const min = safeFloat(parseFloat(dataset["min"] ?? ""), -Infinity),
				      max = safeFloat(parseFloat(dataset["max"] ?? ""), Infinity);

				if (min !== -Infinity || max !== Infinity) {
					filter.push([col, text => {
						const num = parseFloat(text);

						return min <= num && num <= max;
					}]);
				}
			}
		}

		if (filter.length) {
			this.#filteredData = [];

			Loop:
			for (const row of this.#data) {
				for (const [col, filterFn] of filter) {
					if (!filterFn(row[1][col])) {
						continue Loop;
					}
				}

				this.#filteredData.push(row);
			}
		} else {
			this.#filteredData = Array.from(this.#data.entries());
		}

		this.#sortData();
	}

	#sortData() {
		let order = 1,
		    col = -1;

		Loop:
		for (const [header, num] of this.#headers) {
			switch (header.dataset["sort"]) {
			case "desc":
				order = -1;
			case "asc":
				col = num;

				break Loop;
			}
		}

		if (col >= 0) {
			if (this.#lastSorted !== col) {
				const sorter = this.#sorters[col] ?? nullSort;

				this.#sortedData = this.#filteredData.toSorted(order === 1 ? ([, a], [, b]) => sorter(a[col], b[col]) : ([, a], [, b]) => sorter(b[col], a[col]));
			} else if (this.#lastOrder !== order) {
				this.#sortedData.reverse();
			}
		} else {
			this.#sortedData = this.#filteredData;
		}

		this.#lastSorted = col;
		this.#lastOrder = order;

		this.#pageData();
	}

	#pageData() {
		const first = this.#page * this.#perPage || 0,
		      data = Array.from({"length": Math.ceil(Math.min(this.#sortedData.length, this.#perPage) / maxElems)}, () => []);

		let pos = 0,
		    count = 0,
		    index = 0;

		for (const row of this.#sortedData) {
			if (count >= this.#perPage) {
				break;
			}

			if (pos >= first) {
				data[index].push(row[0]);

				if (data.length === maxElems) {
					index++;
				}

				count++;
			} else {
				pos++;
			}
		}

		if (this.#slots.length > data.length) {
			for (const e of this.#slots.splice(data.length, this.#slots.length - data.length)) {
				e.remove();
			}
		}

		index = 0;

		for (const elems of data) {
			const s = this.#slots[index++] ?? this.#body.appendChild(pushAndReturn(this.#slots, slot()));

			s.assign.apply(s, elems);
		}

		this.dispatchEvent(new Event("render"));
	}

	/**
	 * This method returns the total number of rows in the table after filtering.
	 *
	 * @return {number} The number of filtered rows.
	 */
	get totalRows() {
		return this.#filteredData.length;
	}

	/**
	 * This method returns the number of visible rows in the table, that is the number after filtering and paging.
	 *
	 * @return {number} The number of visible rows.
	 */
	get pageRows() {
		return this.#slots.length ? (this.#slots.length - 1) * maxElems + this.#slots.at(-1).assignedElements().length : 0;
	}

	/**
	 * This method returns the data of the filtered and sorted table.
	 *
	 * @return {string[][]} A two-dimensional array of the data.
	 */
	export(title = false) {
		const data =  this.#sortedData.map(e => e[1]);

		if (title) {
			return this.#getHeaders().concat(data);
		}

		return data;
	}

	#getHeaders() {
		const headers = [];

		for (const header of this.#headers.keys()) {
			headers.push(header.dataset["title"] ?? header.innerHTML, ...Array.from({"length": checkInt(parseInt(header.getAttribute("colspan")), 1) - 1}, () => ""));
		}

		return [headers];
	}

	/**
	 * This method returns the data of the visible portion of the table.
	 *
	 * @return {string[][]} A two-dimensional array of the data.
	 */
	exportPage(title = false) {
		return this.#perPage >= this.#sortedData.length ? this.export(title) : (title ? this.#getHeaders() : []).concat(...this.#slots.map(slot => slot.assignedElements().map(e => this.#data.get(e))));
	}
}

export const
/**
 * The setLanguage function sets the language items used by the {@link DataTable | DataTable} class.
 *
 * @param {{ STARTS_WITH?: string | Binding; ENDS_WIDTH?: string | Binding; CASE_SENSITIVITY?: string | Binding; REMOVE_BLANK?: string | Binding; ONLY_BLANK?: string | Binding; }} l The languages entries to be changed.
 */
setLanguage = l => {Object.assign(lang, l)},
/**
 * The function generates an object which can be used with the {@link module:css | CSS} module to style the headers of a DataTable to include an arrow indicating the direction of sorting.
 *
 * @param {string} asc    The colour of the Asc sorting arrow.
 * @param {string} desc   The colour of the Desc sorting arrow (defaults to the colour of the Asc arrow).
 * @param {string} stroke The colour of the stroke of the arrows (defaults to black).
 */
sortArrow = (asc = "#f00", desc = asc, stroke = "#000") => ({
	"data-table": {
		" th,::part(header)": {
			"background-repeat": "no-repeat",
			"background-position": "right 0px",
			"background-size": "1em 1em",
			"padding-right": "1em"
		},

		" th[data-sort=asc],::part(header asc)": {
			"background-image": arrow(0, asc, stroke)
		},

		" th[data-sort=desc],::part(header desc)": {
			"background-image": arrow(1, desc, stroke)
		}
	}
});

/**
 * {@link dom:DOMBind | DOMBind} that creates a {@link DataTable | DataTable}
 */
export default bindCustomElement("data-table", DataTable);
