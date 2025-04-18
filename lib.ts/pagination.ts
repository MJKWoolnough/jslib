import type {Binding} from './bind.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {a, li, ul} from './html.js';

/**
 * The pagination module defines a simple {@link https://en.wikipedia.org/wiki/Pagination | pagination} creator.
 *
 * @module pagination
 * @requires module:dom
 * @requires module:html
 */
/** */

type Href = string | ((page: number) => string);

const link = (page: number, href: Href | null, contents?: string | Binding) => {
	if (href !== null) {
		return li({"part": "active page"}, a({"href": href instanceof Function ? href(page) : href + page, "data-page": page}, contents ?? (page + 1) + ""));
	}

	return li({"part": "active page", "data-page": page}, contents ?? (page + 1) + "");
      },
      lang = {
	"NEXT": "Next" as string | Binding,
	"PREV": "Previous" as string | Binding
      },
      observedAttrs = Object.freeze(["href", "end", "surround", "total", "page"]);

/**
 * This class represents the pagination custom element.
 *
 * CSS part attributes have been set on the various elements of Pagination to make styling simple.
 *
 * |  Part     |  Description  |
 * |-----------|---------------|
 * | active    | A 'page' element that can be clicked to change the page number. |
 * | base      | The base HTMLUListElement. |
 * | current   | The currently selected page. Will also be a 'page'. |
 * | page      | An HTMLLIElement that contains the link and/or text for a page. |
 * | prev      | The 'Prev' element. Will also be a 'page'. |
 * | next      | The 'Next' element. Will also be a 'page'. |
 * | separator | An empty HTMLLIElement that sits between beginning/end pages and the current page. |
 *
 * Pagination accepts the following attributes:
 *
 * |  Attribute  |  Description  |
 * |-------------|---------------|
 * | end         | This number will determine how many page elements are created at the ends of the list. (default: 3) |
 * | href        | This string will be prefixed to the page number in any created links. If attribute not set, will not create links. A function of the type (page: number) => string can be used to create more complex links; this should be set using amendNode/clearNode. |
 * | page        | This number will determine the current page number. 0 indexed. (default: 0) |
 * | surround    | This number will determine how many pages surround the current page in the list. (default: 3) |
 * | total       | This number will determine how many pages there are in total. (default: 1) |
 */
export class Pagination extends HTMLElement {
	#end = 3;
	#surround = 3;
	#total = 1;
	#page = 1;
	#hrefBase: Href | null = null;
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
			}
		}

		this.#build();
	}

	static get observedAttributes() {
		return observedAttrs;
	}

	setAttributeNS(ns: null | string, key: string, value: string) {
		if (value as any instanceof Function && key === "href") {
			this.#hrefBase = value as Href;

			this.#build();

			return null;
		}

		return super.setAttributeNS(ns, key, value);
	}

	#build() {
		if (this.#total === 0) {
			return;
		}

		const total = this.#total - 1,
		      currPage = this.#page < this.#total ? this.#page - 1 : total;
		
		clearNode(this.#base, [
			currPage !== 0 ? amendNode(link(currPage - 1, this.#hrefBase, lang["PREV"]), {"part": "active page prev"}) : li({"part": "page prev"}, lang["PREV"]),
			Array.from({"length": this.#total}, (_, page) => {
				if (
					page < this.#end || page > total - this.#end ||
					((this.#surround > currPage || page >= currPage - this.#surround) && page <= currPage + this.#surround) ||
					this.#end > 0 && ((currPage - this.#surround - 1 === this.#end && page === this.#end) ||
					(currPage + this.#surround + 1 === total - this.#end && page == total - this.#end)
				)) {
					return currPage === page ? li({"part": "page current"}, (page+1)+"") : link(page, this.#hrefBase);
				} else if (page === currPage - this.#surround - 1 || page === currPage + this.#surround + 1){
					return li({"part": "separator"});
				}

				return null;
			}).filter(e => e != null),
			currPage !== total ? amendNode(link(currPage + 1, this.#hrefBase, lang["NEXT"]), {"part": "active page next"}) : li({"part": "page next"}, lang["NEXT"])
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
	 * @param {Event} e The event triggered from a mouse event on Pagination.
	 *
	 * @return {number} The page number of the element associated with the event. Returns -1 if no associated element is found.
	 */
	static getPageNumberFromEvent(e: Event): number {
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

/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link Pagination}.
 */
export default bindCustomElement("page-numbers", Pagination);
