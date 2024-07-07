class MultiSelect extends HTMLElement {
	constructor() {
		super();

		this.#parseContent();

		const mo = new MutationObserver(mutations => this.#handleMutations(mutations));

		mo.observe(this, {
			"attributeFilter": ["value", "disabled"],
			"childList": true,
			"subtree": true
		});
	}

	#handleMutations(_mutations: MutationRecord[]) {
	}

	#parseContent() {};
}
