import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {div, input, li, slot, ul} from './html.js';

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
			},

			":not(.toggle) .selected": {
				"display": "none"
			}
		}
	}
      })],
      toggle = {"class": {"toggle": true}},
      noToggle = {"class": {"toggle": false}},
      disabled = {"class": {"disabled": true}},
      enabled = {"class": {"disabled": false}},
      selected = {"class": {"selected": true}},
      notSelected = {"class": {"selected": false}};

export class MultiSelect extends HTMLElement {
	#options: HTMLUListElement;
	#selectedSlot: HTMLSlotElement;
	#selected = new Set<HTMLOptionElement>();
	#liToOption = new Map<HTMLLIElement, HTMLOptionElement>();
	#optionToLI = new Map<HTMLOptionElement, HTMLLIElement>();

	constructor() {
		super();

		const self = this;

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			div({"id": "selected"}, this.#selectedSlot = slot()),
			div({"id": "control"}, [
				input({"oninput": function(this: HTMLInputElement) {
					for (const child of self.#options.children) {
						amendNode(child, {"style": child.textContent?.includes(this.value) ? false : "display: none"});
					}
				}}),
				this.#options = ul({"onclick": (e: MouseEvent) => this.#handleSelect(e), "tabindex": -1})
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

	attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
		switch (name) {
		case "toggle":
			amendNode(this.#options, newValue === null ? noToggle : toggle);
		}
	}

	static get observedAttributes() {
		return ["toggle"]
	}

	#handleSelect(e: MouseEvent) {
		const target = e.target as HTMLLIElement,
		      option = this.#liToOption.get(target);

		if (!option || option.hasAttribute("disabled")) {
			return
		}

		if (this.#selected.delete(option)) {
			amendNode(target, notSelected);
		} else {
			amendNode(target, selected);
			this.#selected.add(option);
		}

		this.#selectedSlot.assign(...this.#selected);
	}

	#handleMutations(_mutations: MutationRecord[]) {
		this.#parseContent();
	}

	#parseContent() {
		const newElems: HTMLLIElement[] = [],
		      oldOptions = this.#optionToLI;

		this.#optionToLI = new Map();
		this.#liToOption.clear();

		for (const elem of this.children) {
			if (elem instanceof HTMLOptionElement) {
				const text = elem.getAttribute("label") ?? elem.innerText,
				      existing = oldOptions.get(elem),
				      state = elem.hasAttribute("disabled") ? disabled : enabled,
				      item = existing?.innerText === text ? amendNode(existing, state) : li(state, text);

				newElems.push(item);
				this.#optionToLI.set(elem, item);
				this.#liToOption.set(item, elem);
			}
		}

		clearNode(this.#options, newElems);
	};
}

export default bindCustomElement("multi-select", MultiSelect);
