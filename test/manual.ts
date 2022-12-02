type ManualTests = {
	[key: string]: ManualTests | [string, string] | [string];
}

((data: Record<string, ManualTests>) => {
	class Counter extends Text {
		#parent?: Counter;
		#count = 0;
		constructor(start: string, parent?: Counter) {
			super(start);
			this.#parent = parent;
		}
		add() {
			this.textContent = (++this.#count) + "";
			this.#parent?.add();
		}
	}
	const processTests = (breadcrumbs: string, t: ManualTests, totalCount: Counter, successCount: Counter, errorCount: Counter) => {
		const df = document.createDocumentFragment(),
		      testList = document.createElement("ul");
		for (const [name, test] of Object.entries(t)) {
			if (test instanceof Array) {
				const li = testList.appendChild(document.createElement("li")),
				      button = li.appendChild(document.createElement("button"));
				li.append(name);
				totalCount.add();
				button.innerText = "Run Test";
				button.addEventListener("click", () => {
					const w = window.open("", "", ""),
					      script = document.createElement("script");
					if (!w) {
						alert("Cannot create window");
						return;
					}
					button.toggleAttribute("disabled", true);
					w.document.title = `${breadcrumbs}: ${name}`;
					let resultFn: (pass: boolean) => void,
					    errorFn: (error: any) => void;
					new Promise<boolean>((sFn, eFn) => {
						resultFn = sFn;
						errorFn = eFn;
					}).catch(error => {
						console.log({"section": breadcrumbs.slice(1, -1).split("/"), name, error});
						alert(`Error in section ${breadcrumbs}, test "${name}": check console for details`);
					}).then(pass => {
						li.setAttribute("class", pass ? "pass" : "fail");
						if (pass) {
							successCount.add();
						} else {
							for (let node = li.parentNode; node; node = node.parentNode) {
								if (node instanceof HTMLDetailsElement) {
									node.toggleAttribute("open", true);
								}
							}
							errorCount.add();
						}
						w.close();
						button.remove();
					});
					Object.assign(w, {"result": resultFn!});
					w.addEventListener("unload", () => button.toggleAttribute("disabled", false));
					w.addEventListener("error", (e: ErrorEvent) => {
						w.close();
						errorFn(e.error);
					});
					script.setAttribute("type", "module");
					script.innerText = test[0];
					w.document.body.innerHTML = test[1] ?? "";
					w.document.head.append(script);
				});
			} else {
				const details = df.appendChild(document.createElement("details")),
				      summary = details.appendChild(document.createElement("summary")),
				      total = new Counter("0", totalCount),
				      successful = new Counter("0", successCount),
				      errors = document.createElement("span");
				summary.append(name, ": ", successful, "/", total, errors);
				details.append(processTests(breadcrumbs + name + "/", test, total, successful, errors.appendChild(new Counter("", errorCount))));
			}
		}
		if (testList.childElementCount > 0) {
			df.append(testList);
		}
		return df;
	      },
	      total = new Counter("0"),
	      successful = new Counter("0"),
	      errors = document.createElement("span"),
	      tests = processTests("/", data, total, successful, errors.appendChild(new Counter("")));
	let opened = false;
	window.addEventListener("load", () => document.body.replaceChildren("Tests: ", successful, "/", total, errors, tests));
	window.addEventListener("keypress", (e: KeyboardEvent) => {
		if (e.key === "o") {
			opened = !opened;
			Array.from(document.getElementsByTagName("details"), e => e.toggleAttribute("open", opened));
		}
	});
})({
});
