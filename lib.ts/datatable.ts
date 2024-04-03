import type {Binding} from './bind.js';
import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {button, div, input, label, li, slot, table, tbody, th, thead, tr, ul} from './html.js';
import {checkInt} from './misc.js';
import {stringSort} from './nodes.js';


const style = [
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

				" button.t": {
					"color": "transparent"
				},

				" li:first-child:last-child input[type=radio]": {
					"display": "none"
				}
			}
		},
		"table": {
			"border-collapse": "collapse"
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
      unsetSort = {"data-sort": false},
      setSort = {"data-sort": "asc"},
      setReverse = {"data-sort": "desc"},
      parseNum = (a: string) => parseFloat(a || "-Infinity"),
      numberSorter = (a: string, b: string) => parseNum(a) - parseNum(b),
      nullSort = () => 0,
      isBlankFilter = (s: string) => !s,
      isNotBlankFilter = (s: string) => !!s,
      nullFilter = () => true,
      safeFloat = (n: number, def: number) => isNaN(n) ? def : n,
      observedAttr = Object.freeze(["page", "perPage"]),
      makeToggleButton = (c: string, title: string | Binding, initial: boolean, fn: (v: boolean) => void) => button({"class": {"t": initial}, title, "onclick": function(this: HTMLButtonElement) {
	fn(!this.classList.toggle("t"));
      }}, c),
      lang = {
	"STARTS_WITH": "Starts With" as string | Binding,
	"ENDS_WIDTH": "Ends With" as string | Binding,
	"CASE_SENSITIVITY": "Case Sensitivity" as string | Binding,
	"REMOVE_BLANK": "Remove Blank" as string | Binding,
	"ONLY_BLANK": "Only Blank" as string | Binding
      };

export class DataTable extends HTMLElement {
	#head: HTMLSlotElement;
	#body: HTMLSlotElement;
	#sort: Element | null = null;
	#rev = false;
	#sorters: ((a: string, b: string) => number)[] = [];
	#headers = new Map<HTMLElement, number>();
	#data = new Map<Element, string[]>();
	#filteredData: [Element, string[]][] = [];
	#sortedData: [Element, string[]][] = [];
	#page = 0;
	#perPage = Infinity;

	constructor() {
		super();

		const filter = div(),
		      mo = new MutationObserver((mutations: MutationRecord[]) => {
			let doParseChildren = false,
			    doFilter = false,
			    doSort = false;

			for (const mutation of mutations) {
				switch (mutation.type) {
				case "childList":
					doParseChildren = true;

					break;
				case "attributes":
					if (this.#headers.has(mutation.target as HTMLElement)) {
						switch (mutation.attributeName) {
						case "data-sort":
							doSort = true;

							break;
						default:
							doFilter = true;
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

					const {dataset} = target,
					      firstRadio = input({"type": "radio", "checked": dataset["empty"] === undefined && dataset["notEmpty"] === undefined, "name": "data-table-filter", "onclick": () => {
						amendNode(target, {"data-not-empty": false, "data-empty": false});
					      }}),
					      list = ul({"tabindex": -1, "style": {"left": clientX + "px", "top": clientY + "px"}, "onfocusout": function(this: HTMLUListElement, e: FocusEvent) {
						if (!e.relatedTarget || !list.contains(e.relatedTarget as Node)) {
							this.remove();
						}
					      }}, [
						li([
							firstRadio,
							this.#sorters[this.#headers.get(target)!] === numberSorter ? [
								input({"value": dataset["min"], "oninput": function(this: HTMLInputElement) {
									amendNode(target, {"data-min": this.value});
									firstRadio.click();
								}}),
								" ≤ x ≤ ",
								input({"value": dataset["max"], "oninput": function(this: HTMLInputElement) {
									amendNode(target, {"data-max": this.value});
									firstRadio.click();
								}})
							] : [
								makeToggleButton("^", lang["STARTS_WITH"], dataset["isPrefix"] === undefined, v => {
									amendNode(target, {"data-is-prefix": v});
									firstRadio.click();
								}),
								input({"type": "text", "value": dataset["filter"], "oninput": function(this: HTMLInputElement) {
									amendNode(target, {"data-filter": this.value});
									firstRadio.click();
								}}),
								makeToggleButton("$", lang["ENDS_WIDTH"], dataset["isSuffix"] === undefined, v => {
									amendNode(target, {"data-is-suffix": v});
									firstRadio.click();
								}),
								makeToggleButton("i", lang["CASE_SENSITIVITY"], dataset["isCaseInsensitive"] === undefined, v => {
									amendNode(target, {"data-is-case-insensitive": v});
									firstRadio.click();
								})
							]
						]),
						dataset["disallowNotEmpty"] === undefined ? li([
							input({"type": "radio", "name": "data-table-filter", "id": "filter-remove-blank", "checked": dataset["notEmpty"] !== undefined, "onclick": () => {
								amendNode(target, {"data-not-empty": true, "data-empty": false});
							}}),
							label({"for": "filter-remove-blank"}, lang["REMOVE_BLANK"])
						]) : [],
						dataset["disallowEmpty"] === undefined ? li([
							input({"type": "radio", "name": "data-table-filter", "id": "filter-only-blank", "checked": dataset["empty"] !== undefined, "onclick": () => {
								amendNode(target, {"data-not-empty": false, "data-empty": true});
							}}),
							label({"for": "filter-only-blank"}, lang["ONLY_BLANK"])
						]) : []
					      ]);

					amendNode(filter, list);
					list.focus();
				}}),
				tbody(this.#body = slot())
			])
		      ]).adoptedStyleSheets = style;

		this.#parseContent();

		mo.observe(this, {
			"attributeFilter": ["data-sort", "data-filter", "data-is-prefix", "data-is-suffix", "data-min", "data-max", "data-is-text", "data-empty", "data-not-empty", "data-is-case-insensitive"],
			"childList": true,
			"subtree": true
		});
		mo.observe(this.#head, {
			"attributeFilter": ["data-sort", "data-filter", "data-is-prefix", "data-is-suffix", "data-min", "data-max", "data-empty", "data-not-empty", "data-is-case-insensitive"],
			"subtree": true
		});
	}

	attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
		switch (name) {
		default:
			return;
		case "page":
			const page = checkInt(parseInt(newValue ?? "0"), 0);

			if (page === this.#page) {
				return;
			}

			this.#page = page;

			break;
		case "perPage":
			const perPage = checkInt(parseInt(newValue ?? "0"), 1, Infinity, Infinity);

			if (perPage === this.#perPage) {
				return;
			}

			this.#perPage = perPage;
		}

		this.#pageData();
	}

	static get observedAttributes() {
		return observedAttr;
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

		this.#filterData();
	}

	#filterData() {
		const filter: ((a: string) => boolean)[] = [];

		for (const [{dataset}, col] of this.#headers) {
			if (dataset["notEmpty"] !== undefined) {
				filter.push(isNotBlankFilter);
			} else if (dataset["empty"] !== undefined) {
				filter.push(isBlankFilter);
			} else if (this.#sorters[col] === stringSort || dataset["isText"] !== undefined) {
				const isCaseInsensitive = dataset["isCaseInsensitive"] !== undefined,
				      filterText = isCaseInsensitive ? (dataset["filter"] ?? "").toLowerCase() : dataset["filter"] ?? "",
				      isPrefix = dataset["isPrefix"] !== undefined,
				      isSuffix = dataset["isPrefix"] !== undefined;

				if (filterText) {
					if (isPrefix) {
						if (isSuffix) {
							filter.push(text => (isCaseInsensitive ? text.toLowerCase() : text) === filterText);
						} else {
							filter.push(text => (isCaseInsensitive ? text.toLowerCase() : text).startsWith(filterText));
						}
					} else if (isSuffix) {
						filter.push(text => (isCaseInsensitive ? text.toLowerCase() : text).endsWith(filterText));
					} else {
						filter.push(text => (isCaseInsensitive ? text.toLowerCase() : text).includes(filterText));
					}
				} else {
					filter.push(nullFilter);
				}
			} else {
				const min = safeFloat(parseFloat(dataset["min"] ?? ""), -Infinity),
				      max = safeFloat(parseFloat(dataset["max"] ?? ""), Infinity);

				if (min === -Infinity && max === Infinity) {
					filter.push(nullFilter);
				} else {
					filter.push(text => {
						const num = parseFloat(text);

						return min <= num && num <= max;
					});
				}
			}
		}

		this.#filteredData = [];

		Loop:
		for (const row of this.#data) {
			let col = 0;

			for (const cell of row[1]) {
				if (!(filter[col++] ?? nullFilter)(cell)) {
					continue Loop;
				}
			}

			this.#filteredData.push(row);
		}

		this.#sortData();
	}

	#sortData() {
		let reverse = false,
		    col = -1;

		Loop:
		for (const [header, num] of this.#headers) {
			switch (header.dataset["sort"]) {
			case "desc":
				reverse = true;
			case "asc":
				col = num;

				break Loop;
			}
		}

		const sorter = this.#sorters[col] ?? nullSort;

		this.#sortedData = this.#filteredData.toSorted(([, a], [, b]) => sorter(a[col], b[col]) * (reverse ? -1 : 1));

		this.#pageData();
	}

	#pageData() {
		const first = this.#page * this.#perPage || 0,
		      data: Element[] = [];

		let pos = 0;

		for (const row of this.#sortedData) {
			if (data.length > this.#perPage) {
				break;
			}

			if (pos >= first) {
				data.push(row[0])
			} else {
				pos++;
			}
		}

		this.#body.assign(...data);

		this.dispatchEvent(new Event("render"));
	}

	get totalRows() {
		return this.#filteredData.length;
	}

	get pageRows() {
		return this.#body.assignedElements().length;
	}

	export() {
		return this.#sortedData.map(e => e[1]);
	}

	exportPage() {
		return this.#body.assignedElements().map(e => this.#data.get(e)!);
	}
}

export const setLanguage = (l: Partial<typeof lang>) => {Object.assign(lang, l)};

export default bindCustomElement("data-table", DataTable);
