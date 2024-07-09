import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {div, input, li, slot, ul} from './html.js';

const style = [new CSS().add({
	":host": {
		"display": "block",
		"background-color": "var(--backgroundColor, #fff)",
		"border": "1px solid var(--borderColor, #000)",

		":focus-within": {
			"border-width": "2px"
		}
	},
	"#selected": {
		"display": "flex",
		"justify-content": "space-evenly",
		"gap": "0.5em",
		"flex-wrap": "wrap"
	},
	"#control": {
		"position": "relative",

		":not(:focus-within) ul": {
			"display": "none"
		},

		" input": {
			"background-color": "var(--backgroundColor, #fff)",
			"border": 0,
			"width": "100%",
			"outline": "none"
		},

		" ul": {
			"list-style": "none",
			"padding": 0,
			"background": "var(--optionBackground, #fff)",
			"border": "1px solid #000",
			"color": "var(--optionColor, #000)",
			"outline": "none",
			"overflow-y": "scroll",
			"position": "absolute",
			"width": "100%",
			"left": "-1px",
			"overscroll-behavior": "contain",

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
				"color": "var(--optionSelectedColor, #fff)"
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
	#input: HTMLInputElement;

	constructor() {
		super();

		const self = this;

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual"}), [
			div({"id": "selected", "onclick": () => this.#input.select()}, this.#selectedSlot = slot()),
			div({"id": "control"}, [
				this.#input = input({"onfocus": () => this.#setOptionsPos(), "oninput": function(this: HTMLInputElement) {
					for (const child of self.#options.children) {
						amendNode(child, {"style": child.textContent?.includes(this.value) ? false : "display: none"});
					}
				}}),
				this.#options = ul({"onclick": (e: MouseEvent) => this.#handleSelect(e.target as HTMLLIElement), "tabindex": -1})
			])
		]).adoptedStyleSheets = style;

		this.#parseContent();

		new MutationObserver(() => this.#parseContent()).observe(this, {
			"attributeFilter": ["value", "disabled", "label", "select"],
			"childList": true,
			"subtree": true
		});
	}

	#setOptionsPos() {
		const {y: offsetY} = (this.#input.parentElement as HTMLDivElement).getBoundingClientRect(),
		      {y, height} = this.#input.getBoundingClientRect(),
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
		this.#setOption(target);

		this.#finaliseSet();
	}

	#setOption(target: HTMLLIElement, toggle = true) {
		const option = this.#liToOption.get(target);

		if (!option || option.hasAttribute("disabled")) {
			return
		}

		if (this.#selected.has(option)) {
			if (toggle && this.#selected.delete(option)) {
				amendNode(target, notSelected);
			}
		} else {
			amendNode(target, selected);
			this.#selected.add(option);
		}
	}

	#finaliseSet() {
		this.#selectedSlot.assign(...this.#selected);
		this.#setOptionsPos();
		this.dispatchEvent(new Event("change"));
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

				if (elem.hasAttribute("selected")) {
					this.#handleSelect(item);
				}
			}
		}

		clearNode(this.#options, newElems);
	}

	get value() {
		return JSON.stringify(Array.from(this.#selected.values(), e => {
			const o = this.#optionToLI.get(e)!

			return o.getAttribute("value") ?? o.innerText;
		}));
	}

	set value(data: string | string[]) {
		if (data instanceof Array) {
			this.#set(data)
		} else {
			const arr = JSON.parse(data);

			if (arr instanceof Array) {
				this.#set(arr)
			}
		}
	}

	#set(data: string[]) {
		const values = new Set(data);

		for (const [li, option] of this.#liToOption.entries()) {
			const value = option.getAttribute("label") ?? option.innerText;

			if (values.has(option.getAttribute("label") ?? option.innerText)) {
				values.delete(value);
				this.#setOption(li, false);
			}
		}

		this.#finaliseSet();
	}
}

export default bindCustomElement("multi-select", MultiSelect);
