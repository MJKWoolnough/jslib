import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {div, input, li, slot, ul} from './html.js';

/**
 * The multiselect module adds a custom element that implements a Select-like input element allowing multiple options to be selected and removed.
 *
 * This module directly imports the {@link module:css}, {@link module:dom}, and {@link module:html} modules.
 *
 * @module multiselect
 * @requires module:css
 * @requires module:dom
 * @requires module:html
 */
/** */

const style = [new CSS().add({
	":host": {
		"display": "block",
		"background-color": "var(--backgroundColor, #fff)",
		"border": "var(--border, 1px solid #000)",

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
	"slot": {
		"display": "inline-block"
	},
	".deselect": {
		"display": "inline-block",
		"background-color": "var(--removeBackgroundColor, #fff)",
		"border": "0.15em solid var(--removeBorderColor, #f00)",
		"border-radius": "50%",
		"position": "relative",
		"padding": "0.1em",
		"margin-left": "0.2em",
		"width": "0.4em",
		"height": "0.4em",
		"cursor": "pointer",

		":hover": {
			"background-color": "var(--removeHoverBackgroundColor, #fff)",
			"border-color": "var(--removeHoverBorderColor, #000)",

			":before,:after": {
				"background-color": "var(--removeHoverXColor, #000)"
			}
		},

		":before,:after": {
			"content": `" "`,
			"display": "block",
			"position": "absolute",
			"background-color": "var(--removeXColor, #f00)",
			"transform": "rotate(45deg)"
		},

		":before": {
			"width": "0.1em",
			"left": "0.25em",
			"top": "0.05em",
			"bottom": "0.05em"
		},

		":after": {
			"height": "0.1em",
			"top": "0.25em",
			"left": "0.05em",
			"right": "0.05em"
		}
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
			"background": "var(--optionsBackground, #fff)",
			"border": "var(--optionsBorder, 1px solid #000)",
			"color": "var(--optionsColor, #000)",
			"outline": "none",
			"overflow-y": "scroll",
			"position": "absolute",
			"width": "100%",
			"left": "-1px",
			"max-height": "var(--optionsMaxHeight, 100%)",
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

/**
 * The MultiSelect class is a CustomElement that can contain many {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option | Option} elements.
 *
 * This element registers with the name `multi-select`.
 *
 * This element handles the following attributes:
 *
 * |  Attribute  |  Type   |  Description  |
 * |-------------|---------|---------------|
 * | toggle      | boolean | When set, selected options will be hidden in the options list until they are deselected. |
 * | value       | Array   | An array containing the values of the selected options. Can be set to programatically select options. |
 *
 * In addition, the following CSS vars control various aspects of styling for the element.
 *
 * |  Variable                    |  Default       |  Description  |
 * |------------------------------|----------------|---------------|
 * | --backgroundColor            | #fff           | Sets the background colours of the main element. |
 * | --optionDisabledBackground   | #fff           | Sets the background colour of disabled options. |
 * | --optionDisabledColor        | #888           | Sets the font colour of disabled options. |
 * | --optionHoverBackground      | #000           | Sets the background colour of non-disabled elements when hovered over. |
 * | --optionHoverColor           | #fff           | Sets the font colour of non-disabled elements when hovered over. |
 * | --optionSelectedBackground   | #888           | Sets the background colour of selected elements. |
 * | --optionSelectedColor        | #fff           | Sets the font colour of selected elements. |
 * | --optionsBackground          | #fff           | Sets the background colour of the options list. |
 * | --optionsBorder              | 1px solid #000 | Sets the border of the options list.
 * | --optionsColor               | #000           | Sets the font colour of the options list. | 
 * | --optionsMaxHeight           | 100%           | Sets the maximum height of the options list. |
 * | --removeBackgroundColor      | #fff           | Sets the background colour of the remove icon. |
 * | --removeBorderColor          | #f00           | Sets the border colour of the remove icon. |
 * | --removeHoverBackgroundColor | #fff           | Sets the background colour of the remove icon when hovered over. |
 * | --removeHoverBorderColor     | #000           | Sets the border colour of the remove icon when hovered over. |
 * | --removeHoverXColor          | #000           | Sets the colour of the X in the remove icon when hovered over. |
 * | --removeXColor               | #f00           | Sets the colour of the X in the remove icon. |
 */
export class MultiSelect extends HTMLElement {
	#options: HTMLUListElement;
	#input: HTMLInputElement;
	#selectedDiv: HTMLDivElement;
	#selected = new Map<HTMLOptionElement, HTMLDivElement>();
	#liToOption = new Map<HTMLLIElement, HTMLOptionElement>();
	#optionToLI = new Map<HTMLOptionElement, HTMLLIElement>();

	constructor() {
		super();

		const self = this;

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual", "delegatesFocus": true}), [
			this.#selectedDiv = div({"id": "selected"}),
			div({"id": "control"}, [
				this.#input = input({"autofocus": true, "onfocus": () => this.#setOptionsPos(), "oninput": function(this: HTMLInputElement) {
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

			break;
		case "value":
			this.value = newValue ?? [];
		}
	}

	static get observedAttributes() {
		return ["toggle", "value"];
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

			const s = slot(),
			      d = div([
				s,
				div({"tabindex": -1, "class": "deselect", "onclick": (e: Event) => {
					d.remove();
					this.#setOption(target);
					e.preventDefault();
				}})
			      ]);

			amendNode(this.#selectedDiv, d);
			this.#selected.set(option, d);
			s.assign(option);
		}
	}

	#finaliseSet() {
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

		for (const selected of this.#selected.keys()) {
			if (!this.#optionToLI.has(selected)) {
				this.#selected.delete(selected);
			}
		}

		clearNode(this.#options, newElems);
	}

	get value() {
		const val: string[] = [];

		for (const e of this.#selected.keys()) {
			const o = this.#optionToLI.get(e)!;

			val.push(o.getAttribute("value") ?? o.innerText);
		}

		return val;
	}

	set value(data: string | string[]) {
		if (data instanceof Array) {
			this.#set(data);
		} else {
			const arr = JSON.parse(data);

			if (arr instanceof Array) {
				this.#set(arr);
			}
		}
	}

	#set(data: string[]) {
		const values = new Set(data);

		for (const [li, option] of this.#liToOption.entries()) {
			if (values.has(option.getAttribute("label") ?? option.innerText)) {
				this.#setOption(li, false);
			}
		}

		this.#finaliseSet();
	}
}

/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link MultiSelect}.
 */
export default bindCustomElement("multi-select", MultiSelect);
