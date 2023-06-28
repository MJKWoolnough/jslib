import type {Binding} from './bind.js';
import type {Children} from './dom.js';
import {amendNode, bindElement, clearNode} from './dom.js';
import {a, li, ns, ul} from './html.js';

const link = (page: number, href: string | null, contents?: string | Binding) => {
	if (href !== null) {
		return li({"part": "page"}, a({"href": href + page, "data-page": page}, contents ?? (page + 1) + ""));
	}

	return li({"part": "page", "data-page": page}, contents ?? (page + 1) + "");
},
processPaginationSection = (ret: Children[], currPage: number, from: number, to: number, href: string | null) => {
	if (ret.length !== 0) {
		ret.push(li({"part": "separator"}));
	}

	for (let p = from; p <= to; p++) {
		ret.push(currPage === p ? li({"part": "page current"}, (p+1)+"") : link(p, href));
	}
      },
      lang = {
	"NEXT": "Next" as string | Binding,
	"PREV": "Previous" as string | Binding
      };

/**
 * The pagination module defines a simple [pagination](https://en.wikipedia.org/wiki/Pagination) creator.
 *
 * This module directly imports the [dom](#dom), and [html](#html) modules.
 *
 * |  Export  |  Type  |  Description  |
 * |----------|--------|---------------|
 * | (default) | Function | A [DOMBind](#dom_dombind) that creates a Pagination. |
 * | [Pagination](#pagination_pagination) | Class | This class represents the pagination custom element. |
 * | [setLanguage](#pagination_setlanguage) | Function | Used to set language entries used for Pagination. |
 *
 * CSS part attributes have been set on the various elements of Pagination to make styling simple.
 *
 * |  Part     |  Description  |
 * |-----------|---------------|
 * | base      | The base HTMLUListElement. |
 * | current   | The currently selected page. Will also be a 'page'. |
 * | page      | An HTMLLIElement that contains the link and/or text for a page. |
 * | prev      | The 'Prev' element. Will also be a 'page'. |
 * | next      | The 'Next' element. Will also be a 'page'. |
 * | separator | An empty HTMLLIElement that sits between beginning/end pages and the current page. |
 */
export class Pagination extends HTMLElement {
	#end = 3;
	#surround = 3;
	#total = 1;
	#page = 0;
	#hrefBase: string | null = null;
	#base: HTMLUListElement;

	constructor() {
		super();

		amendNode(this.attachShadow({"mode": "open"}), this.#base = ul({"part": "base"}));
	}

	attributeChangedCallback(name: string, _: string | null, newValue: string | null) {
		switch (name) {
		case "href":
			this.#hrefBase = newValue;

			break;
		default:
			const val = parseInt(newValue ?? "");

			if (isNaN(val) || val < 0) {
				return;
			}

			switch (name) {
			case "end":
				this.#end = val;

				break;
			case "surround":
				this.#surround = val;

				break;
			case "total":
				this.#total = val;

				break;
			case "page":
				this.#page = val;

				break;
			}
		}

		this.#build();
	}

	static get observedAttributes() {
		return ["href", "end", "surround", "total", "page"];
	}

	#build() {
		if (this.#total === 0) {
			return;
		}

		const pageLinks: Children[] = [],
		      total = this.#total - 1,
		      currPage = this.#page < this.#total ? this.#page : total;
		
		let start = 0;

		for (let page = 0; page <= this.#total; page++) {
			if (
				!(page < this.#end || page > total - this.#end ||
				((this.#surround > currPage || page >= currPage - this.#surround) && page <= currPage + this.#surround) ||
				this.#end > 0 && ((currPage - this.#surround - 1 === this.#end && page === this.#end) ||
				(currPage + this.#surround + 1 === total - this.#end && page == total - this.#end)
			))) {
				if (page !== start) {
					processPaginationSection(pageLinks, currPage, start, page - 1, this.#hrefBase);
				}
				start = page + 1
			}
		}

		if (start < this.#total) {
			processPaginationSection(pageLinks, currPage, start, total, this.#hrefBase);
		}

		clearNode(this.#base, [
			amendNode(currPage !== 0 ? link(currPage - 1, this.#hrefBase, lang["PREV"]) : li(lang["PREV"]), {"part": "page prev"}),
			pageLinks,
			amendNode(currPage !== total ? link(currPage + 1, this.#hrefBase, lang["NEXT"]) : li(lang["NEXT"]), {"part": "page next"})
		]);
	}

	/**
	 * Matches the static getPageNumberFromEvent.
	 */
	getPageNumberFromEvent(e: Event) {
		return Pagination.getPageNumberFromEvent(e);
	}

	/**
	 * This method, when passed the Event object from a mouse event on the Pagination element, will return the page number associated with the child element that triggered the event.
	 *
	 * @param {Event} The event triggered from a mouse event on Pagination.
	 *
	 * @return {number} The page number of the element associated with the event. Returns -1 if no associated element is found.
	 */
	static getPageNumberFromEvent(e: Event) {
		return parseInt((e.composedPath() as HTMLElement[])?.[0].dataset?.["page"] ?? "") ?? -1;
	}
}

export const
/**
 * The setLanguage function is used to set the language used for the `Next` and `Previous` page elements.
 *
 * @param {{NEXT?: string | Binding; PREV?: string | Binding;}} l The language to be changed.
 */
setLanguage = (l: Partial<typeof lang>) => {Object.assign(lang, l)};

customElements.define("page-numbers", Pagination);

/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link Pagination}.
 */
export default bindElement<Pagination>(ns, "page-numbers")
