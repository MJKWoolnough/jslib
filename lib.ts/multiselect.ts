import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {div, input, li, slot, ul} from './html.js';

const style = [new CSS().add({
	"#control": {
		"position": "relative",

		":not(:focus-within) ul": {
			"display": "none"
		},

		" ul": {
			"list-style": "none",
			"padding": 0,
			"background": "var(--optionBackground, #fff)",
			"color": "var(--optionColor, #000)",
			"outline": "none",
			"overflow-y": "scroll",
			"position": "absolute",

			" li.disabled": {
				"background": "var(--optionDisabledBackground, #fff)",
				"color": "var(--optionDisabledColor, #888)"
			},

			" li:not(.disabled):hover": {
				"background": "var(--optionHoverBackground, #000)",
				"color": "var(--optionHoverColor, #fff)",
				"cursor": "pointer"
			},

			" li.selected": {
				"background": "var(--optionSelectedBackground, #888)",
				"color": "var(--optionSelectedColor, #fff)",
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
				input({"onfocus": function(this: HTMLInputElement) {
					self.#setOptionsPos(this);
				}, "oninput": function(this: HTMLInputElement) {
					for (const child of self.#options.children) {
						amendNode(child, {"style": child.textContent?.includes(this.value) ? false : "display: none"});
					}
				}}),
				this.#options = ul({"onclick": (e: MouseEvent) => this.#handleSelect(e.target as HTMLLIElement), "tabindex": -1})
			])
		]).adoptedStyleSheets = style;

		this.#parseContent();

		new MutationObserver(() => this.#parseContent()).observe(this, {
			"attributeFilter": ["value", "disabled", "label"],
			"childList": true,
			"subtree": true
		});
	}

	#setOptionsPos(input: HTMLInputElement) {
		const {y: offsetY} = (input.parentElement as HTMLDivElement).getBoundingClientRect(),
		      {y, height} = input.getBoundingClientRect(),
		      wh = window.innerHeight,
		      bottomGap = wh - y - height;

		amendNode(this.#options, {"style": bottomGap > y ? `top: ${y - offsetY}px; max-height: ${bottomGap}px` : `bottom: ${y - offsetY}px; max-height: ${y}px`});
	}

	attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
		switch (name) {
		case "toggle":
			amendNode(this.#options, newValue === null ? noToggle : toggle);
		}
	}

	static get observedAttributes() {
		return ["toggle"];
	}

	#handleSelect(target: HTMLLIElement) {
		const option = this.#liToOption.get(target);

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
