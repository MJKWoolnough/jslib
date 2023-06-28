import {amendNode, bindElement, clearNode} from './dom.js';
import {a, li, ns, ul} from './html.js';

const link = (page, href, contents) => {
	if (href !== null) {
		return li({"part": "page"}, a({"href": href + page, "data-page": page}, contents ?? (page + 1) + ""));
	}

	return li({"part": "page", "data-page": page}, contents ?? (page + 1) + "");
},
processPaginationSection = (ret, currPage, from, to, href) => {
	if (ret.length !== 0) {
		ret.push(li({"part": "separator"}));
	}

	for (let p = from; p <= to; p++) {
		ret.push(currPage === p ? li({"part": "page current"}, (p+1)+"") : link(p, href));
	}
      };

export class Pagination extends HTMLElement {
	#end = 3;
	#surround = 3;
	#total = 1;
	#page = 0;
	#hrefBase = null;
	#base;

	constructor() {
		super();

		amendNode(this.attachShadow({"mode": "open"}), this.#base = ul({"part": "base"}));
	}

	attributeChangedCallback(name, _, newValue) {
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

		const pageLinks = [],
		      total = this.#total - 1,
		      currPage = this.#page < this.#total ? this.#page : total
		
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
			amendNode(currPage !== 0 ? link(currPage - 1, this.#hrefBase, "Previous") : li("Previous"), {"part": "page prev"}),
			pageLinks,
			amendNode(currPage !== total ? link(currPage + 1, this.#hrefBase, "Next") : li("Next"), {"part": "page next"})
		]);
	}

	getPageNumberFromEvent(e) {
		return Pagination.getPageNumberFromEvent(e);
	}

	static getPageNumberFromEvent(e) {
		return parseInt(e.composedPath()?.[0].dataset?.["page"] ?? "") ?? -1;
	}
}

customElements.define("page-numbers", Pagination);

export default bindElement(ns, "page-numbers")
