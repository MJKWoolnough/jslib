import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {input, li, ul} from './html.js';

export class MultiSelect extends HTMLElement {
	#options: HTMLUListElement;
	#liToOption = new Map<HTMLLIElement, HTMLOptionElement>();
	#optionToLI = new Map<HTMLOptionElement, HTMLLIElement>();

	constructor() {
		super();

		const self = this;

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			this.#options = ul(),
			input({"oninput": function(this: HTMLInputElement) {
				for (const child of self.#options.children) {
					amendNode(child, {"style": child.textContent?.includes(this.value) ? false : "display: none"});
				}
			}})
		]);

		this.#parseContent();

		const mo = new MutationObserver(mutations => this.#handleMutations(mutations));

		mo.observe(this, {
			"attributeFilter": ["value", "disabled", "label"],
			"childList": true,
			"subtree": true
		});
	}

	#handleMutations(_mutations: MutationRecord[]) {
		this.#parseContent();
	}

	#parseContent() {
		const newElems: HTMLLIElement[] = [],
		      disabled = {"class": {"disabled": false}},
		      oldOptions = this.#optionToLI;

		this.#optionToLI = new Map();
		this.#liToOption.clear();

		for (const elem of this.children) {
			if (elem instanceof HTMLOptionElement) {
				disabled.class.disabled = elem.hasAttribute("disabled");

				const text = elem.getAttribute("label") ?? elem.innerText,
				      existing = oldOptions.get(elem),
				      item = existing?.innerText === text ? amendNode(existing, disabled) : li(disabled, text);

				newElems.push(item);
				this.#optionToLI.set(elem, item);
				this.#liToOption.set(item, elem);
			}
		}

		clearNode(this.#options, newElems);
	};
}

export default bindCustomElement("multi-select", MultiSelect);
