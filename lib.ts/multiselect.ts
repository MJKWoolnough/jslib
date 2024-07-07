import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {div, input, li, ul} from './html.js';

const style = [new CSS().add({
	"#control": {
		":not(:focus-within) ul": {
			"display": "none"
		},

		" ul": {
			"list-style": "none",
			"padding": 0,
			"background": "var(--optionBackground, #fff)",
			"color": "var(--optionColor, #000)",
			"outline": "none",

			" li.disabled": {
				"background": "var(--optionDisabledBackground, #fff)",
				"color": "var(--optionDisabledColor, #888)",
			},

			" li:not(.disabled):hover": {
				"background": "var(--optionHoverBackground, #000)",
				"color": "var(--optionHoverColor, #fff)",
				"cursor": "pointer",
			}
		}
	}
      })];

export class MultiSelect extends HTMLElement {
	#options: HTMLUListElement;
	#liToOption = new Map<HTMLLIElement, HTMLOptionElement>();
	#optionToLI = new Map<HTMLOptionElement, HTMLLIElement>();

	constructor() {
		super();

		const self = this;

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			div({"id": "control"}, [
				input({"oninput": function(this: HTMLInputElement) {
					for (const child of self.#options.children) {
						amendNode(child, {"style": child.textContent?.includes(this.value) ? false : "display: none"});
					}
				}}),
				this.#options = ul({"tabindex": -1})
			])
		]).adoptedStyleSheets = style;

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
