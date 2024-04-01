import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {button, div, input, label, li, slot, table, tbody, th, thead, tr, ul} from './html.js';
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
			"border-collapse": "collapse",
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
      makeToggleButton = (c: string, title: string, initial: boolean, fn: (v: boolean) => void) => button({"class": {"t": initial}, title, "onclick": function(this: HTMLButtonElement) {
	fn(!this.classList.toggle("t"));
      }}, c);

export class DataTable extends HTMLElement {
	#head: HTMLSlotElement;
	#body: HTMLSlotElement;
	#sort: Element | null = null;
	#rev = false;
	#sorters: ((a: string, b: string) => number)[] = [];
	#headers = new Map<HTMLElement, number>();
	#data = new Map<Element, string[]>();

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

					const firstRadio = input({"type": "radio", "checked": target.dataset["empty"] === undefined && target.dataset["notEmpty"] === undefined, "name": "data-table-filter", "onclick": () => {
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
								input({"value": target.dataset["min"], "oninput": function(this: HTMLInputElement) {
									amendNode(target, {"data-min": this.value});
									firstRadio.click();
								}}),
								" ≤ x ≤ ",
								input({"value": target.dataset["max"], "oninput": function(this: HTMLInputElement) {
									amendNode(target, {"data-max": this.value});
									firstRadio.click();
								}})
							] : [
								makeToggleButton("^", "Starts With", target.dataset["isPrefix"] === undefined, v => {
									amendNode(target, {"data-is-prefix": v});
									firstRadio.click();
								}),
								input({"type": "text", "value": target.dataset["filter"], "oninput": function(this: HTMLInputElement) {
									amendNode(target, {"data-filter": this.value});
									firstRadio.click();
								}}),
								makeToggleButton("$", "Ends With", target.dataset["isSuffix"] === undefined, v => {
									amendNode(target, {"data-is-suffix": v});
									firstRadio.click();
								}),
								makeToggleButton("i", "Case Sensitivity", target.dataset["isCaseInsensitive"] === undefined, v => {
									amendNode(target, {"data-is-case-insensitive": v});
									firstRadio.click();
								})
							]
						]),
						target.dataset["disallowNotEmpty"] === undefined ? li([
							input({"type": "radio", "name": "data-table-filter", "id": "filter-remove-blank", "checked": target.dataset["notEmpty"] !== undefined, "onclick": () => {
								amendNode(target, {"data-not-empty": true, "data-empty": false});
							}}),
							label({"for": "filter-remove-blank"}, "Remove Blank")
						]) : [],
						target.dataset["disallowEmpty"] ? li([
							input({"type": "radio", "name": "data-table-filter", "id": "filter-only-blank", "checked": target.dataset["empty"] !== undefined, "onclick": () => {
								amendNode(target, {"data-not-empty": false, "data-empty": true});
							}}),
							label({"for": "filter-only-blank"}, "Only Blank")
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
			"attributeFilter": ["data-sort", "data-filter", "data-is-prefix", "data-is-suffix", "data-min", "data-max", "data-is-text", "data-empty", "data-not-empty",  "data-disallow-empty", "data-disallow-not-empty", "data-is-case-insensitive"],
			"childList": true,
			"subtree": true
		});
		mo.observe(this.#head, {
			"attributeFilter": ["data-sort", "data-filter", "data-is-prefix", "data-is-suffix", "data-min", "data-max", "data-empty", "data-not-empty", "data-is-case-insensitive"],
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

}

export const datatable = bindCustomElement("data-table", DataTable);
