import CSS from './css.js';
import {amendNode, bindCustomElement, clearNode} from './dom.js';
import {div, input, li, slot, ul} from './html.js';

/**
 * The multiselect module adds custom elementthat implement a Select-like input element allowing multiple options to be selected and removed.
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
		"flex-wrap": "wrap",

		">div": {
			"border": "var(--selectedBorder)",
			"background-color": "var(--selectedBackground)",
			"padding": "var(--selectedPadding, 0)",
			"border-radius": "var(--selectedBorderRadius, 0)",

			":hover": {
				"border": "var(--selectedHoverBorder, var(--selectedBorder))",
				"background-color": "var(--selectedHoverBackground, var(--selectedBackground))",
			}
		}
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
			"background-color": "transparent",
			"box-sizing": "border-box",
			"border": 0,
			"width": "100%",
			"outline": "none",
			"padding-right": "1em"
		},

		":after": {
			"content": `" "`,
			"position": "absolute",
			"right": "0.1em",
			"bottom": "0.5em",
			"width": 0,
			"height": 0,
			"border-left": "5px solid transparent",
			"border-right": "5px solid transparent",
			"border-top": "5px solid var(--arrowColor, #000)"
		},

		":focus-within:after": {
			"border-top": "none",
			"border-bottom": "5px solid var(--arrowColor, #000)",
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
			"overscroll-behavior": "none",
			"z-index": 1000,

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
 * The MultiSelect class is a CustomElement that can contain many {@link MultiOption | MultiOption} elements.
 *
 * This element registers with the name `multi-select`.
 *
 * This element handles the following attributes:
 *
 * |  Attribute  |  Type   |  Description  |
 * |-------------|---------|---------------|
 * | toggle      | Boolean | When set, selected options will be hidden in the options list until they are deselected. |
 * | placeholder | String  | When set, sets the placeholder text on the input element. |
 * | value       | Array   | An array containing the values of the selected options. Can be set to programmatically select options. |
 *
 * In addition, the following CSS vars control various aspects of styling for the element.
 *
 * |  Variable                    |  Default       |  Description  |
 * |------------------------------|----------------|---------------|
 * | --arrowColor                 | #000           | Sets the colour of the 'dropdown' arrow. |
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
 * | --selectedBackground         | None           | Sets the colour of the selected options wrapper element. |
 * | --selectedBorder             | None           | Sets the border of the selected options wrapper element. |
 * | --selectedBorderRadius       | 0              | Sets the border radius of the selected options wrapper element. |
 * | --selectedHoverBackground    | None           | Sets the colour of the selected options wrapper element when it is hovered over. |
 * | --selectedHoverBorder        | None           | Sets the border of the selected options wrapper element when it is hovered over. |
 * | --selectedPadding            | 0              | Sets the padding of the selected options wrapper element. |
 */
export class MultiSelect extends HTMLElement {
	#options;
	#input;
	#selectedDiv;
	#selected = new Map();
	#liToOption = new Map();
	#optionToLI = new Map();

	constructor() {
		super();

		const self = this;

		amendNode(this.attachShadow({"mode": "closed", "slotAssignment": "manual", "delegatesFocus": true}), [
			this.#selectedDiv = div({"id": "selected"}),
			div({"id": "control"}, [
				this.#input = input({"autofocus": true, "onfocus": () => this.#setOptionsPos(), "oninput": function() {
					for (const child of self.#options.children) {
						amendNode(child, {"style": child.textContent?.includes(this.value) ? false : "display: none"});
					}
				}}),
				this.#options = ul({"onclick": e => this.#handleSelect(e.target), "tabindex": -1})
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
		const {y: offsetY} = this.#input.parentElement.getBoundingClientRect(),
		      {y, height} = this.#input.getBoundingClientRect(),
		      wh = window.innerHeight,
		      bottomGap = wh - y - height;

		amendNode(this.#options, {"style": bottomGap > y ? `top: ${y - offsetY}px; max-height: min(${bottomGap}px, var(--optionsMaxHeight, ${wh}px))` : `bottom: ${y - offsetY}px; max-height: min(${y}px, var(--optionsMaxHeight, ${wh}px)`});
	}

	attributeChangedCallback(name, _oldValue, newValue) {
		switch (name) {
		case "toggle":
			amendNode(this.#options, newValue === null ? noToggle : toggle);

			break;
		case "value":
			const arr = JSON.parse(newValue ?? "[]");

			if (arr instanceof Array) {
				this.value = arr;
			}

			break;
		case "placeholder":
			amendNode(this.#input, {"placeholder": newValue});
		}
	}

	static get observedAttributes() {
		return ["toggle", "placeholder", "value"];
	}

	#handleSelect(target) {
		this.#setOption(target);
		this.#finaliseSet();
	}

	#setOption(target, toggle = true) {
		const option = this.#liToOption.get(target);

		if (!option || option.hasAttribute("disabled")) {
			return
		}

		if (this.#selected.has(option)) {
			const d = this.#selected.get(option);

			if (toggle && d) {
				d.remove();
				this.#selected.delete(option);
				amendNode(target, notSelected);
			}
		} else {
			amendNode(target, selected);

			const s = slot(),
			      d = div([
				s,
				div({"tabindex": -1, "class": "deselect", "onclick": e => {
					d.remove();
					this.#setOption(target);
					e.preventDefault();
					this.#finaliseSet();
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
		const newElems = [],
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
		const val = [];

		for (const e of this.#selected.keys()) {
			const o = this.#optionToLI.get(e);

			val.push(o.getAttribute("value") ?? o.innerText);
		}

		return val;
	}

	set value(data) {
		this.#set(data);
	}

	#set(data) {
		const values = new Set(data);

		for (const [li, option] of this.#liToOption.entries()) {
			if (values.has(option.getAttribute("label") ?? option.innerText)) {
				this.#setOption(li, false);
			} else if (this.#selected.has(option)) {
				li.click();
			}
		}

		this.#finaliseSet();
	}
}

/**
 * The MultiOption class is a Custom Element that is used to specify options on the MultiSelect.
 *
 * This element registers with the name `multi-option`.
 *
 * This element is used much like the {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option | Option} element, except it can contain arbitrary HTML that is shows once the option is selected; specifically, it handles the following attributes:
 *
 * |  Attribute  |  Type   |  Description  |
 * |-------------|---------|---------------|
 * | value       | String  | When selected, this value will be appended to the MultiSelect.value attribute and be removed when deselected. |
 * | label       | String  | The text to show in the options list for this option. |
 */
export class MultiOption extends HTMLElement {}

export const
/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link MultiSelect}.
 */
multiselect = bindCustomElement("multi-select", MultiSelect),
/**
 * A {@link dom:DOMBind | DOMBind} that creates a {@link MultiOption}.
 */
multioption = bindCustomElement("multi-option", MultiOption);
