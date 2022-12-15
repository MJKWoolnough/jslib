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
	const icon = document.head.getElementsByTagName("link")[0],
	      processTests = (breadcrumbs: string, t: ManualTests, totalCount: Counter, successCount: Counter, errorCount: Counter) => {
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
					const w = window.open("/test", "", ""),
					      script = document.createElement("script");
					if (!w) {
						alert("Cannot create window");
						return;
					}
					button.toggleAttribute("disabled", true);
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
					w.addEventListener("load", () => {
						w.document.title = `${breadcrumbs}: ${name}`;
						w.document.body.innerHTML = test[1] ?? "";
						w.document.head.append(script);
						w.document.head.append(icon.cloneNode());
					});
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
	window.addEventListener("load", () => document.body.append("Tests: ", successful, "/", total, errors, tests));
	window.addEventListener("keypress", (e: KeyboardEvent) => {
		if (e.key === "o") {
			opened = !opened;
			Array.from(document.getElementsByTagName("details"), e => e.toggleAttribute("open", opened));
		} else if (e.key === "R") {
			Array.from(document.getElementsByTagName("button"), e => e.click());
		} else if (e.key === "r") {
			document.getElementsByTagName("button")[0]?.click();
		}
	});
})({
	"router": {
		"html": {
			"x-router": {
				"simple non-match": [`import './lib/router.js';`, `<x-router><button route-match="" onclick="result(true)">Success</button></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"simple match": [`import './lib/router.js';`, `<x-router><button route-match="/test" onclick="result(true)">Success</button></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"match after link": [`import './lib/router.js';`, `<x-router><button route-match="/other-page" onclick="result(true)">Success</button><a route-match="" href="/other-page">Click here to make button</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"match after button (goto)": [`import './lib/router.js';`, `<x-router><button route-match="/other-page" onclick="result(true)">Success</button><button route-match="" onclick="goto('/other-page')">Click Here</button></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"history check": [`import './lib/router.js';`, `<x-router><div route-match="/other-page">Use the back button.</div><div route-match=""><button onclick="this.setAttribute('onclick', 'result(true)');goto('/other-page');">Click Here</button></div></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"path param": [`import './lib/router.js';`, `<x-router><button route-match="/page-:page" onclick="result(this.getAttribute('page') === '15')">Click Here</button><a route-match="" href="/page-15">Click Here</a></x-router><br /><button onclick="result(false)">Fail</button>`],
				"match query": [`import './lib/router.js';`, `<x-router><button route-match="/?page=other" onclick="result(true)">Success</button><a route-match="" href="?page=other">Click here to make button</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"query param": [`import './lib/router.js';`, `<x-router><button route-match="?page=:page" onclick="this.getAttribute('page') === '15' ? result(true) : goto('?page=15')">Click Here</button></x-router><br /><button onclick="result(false)">Fail</button>`],
				"match hash": [`import './lib/router.js';`, `<x-router><button route-match="#match" onclick="result(true)">Success</button><a route-match="" href="#match">Click here to make button</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"prefix match": [`import './lib/router.js';`, `<x-router><button route-match="/other-page/" onclick="result(true)">Success</button><a href="/other-page/name" route-match="">Click Here</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"suffix match": [`import './lib/router.js';`, `<x-router><button route-match="other-page/" onclick="result(true)">Success</button><a href="/something/other-page/name" route-match="">Click Here</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"no-suffix match": [`import './lib/router.js';`, `<x-router><div route-match="other-page/">Failed</div><button route-match="/other-page" onclick="result(true)">Success</button><a href="/other-page" route-match="">Click Here</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"goto params": [`import './lib/router.js';`, `<x-router><button route-match="/other-page" onclick="result(this.getAttribute('test') === '1' && this.getAttribute('data') === 'abc')">Success</button><button route-match="" onclick="goto('/other-page', {'test': 1, 'data': 'abc'})">Click Here</button></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"goto overwrite params": [`import './lib/router.js';`, `<x-router><button route-match="/other-page/:id/:data" onclick="result(this.getAttribute('test') === '1' && this.getAttribute('data') === 'abc' && this.getAttribute('id') === '123')">Success</button><button route-match="" onclick="goto('/other-page/123/def', {'test': 1, 'data': 'abc'})">Click Here</button></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`]
			},
			"x-route": {
				"title change": [`import './lib/router.js';`, `<x-router><x-route title="New Title" route-match="/other-page"><button onclick="result(document.title === 'New Title')">Click Here</button></x-route><a href="/other-page" route-match="">Click Here</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"id change": [`import './lib/router.js';`, `<x-router><x-route id="MyID" route-match="/other-page"><button onclick="result(document.documentElement.getAttribute('id') === 'MyID')">Click Here</button></x-route><a href="/other-page" route-match="">Click Here</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"class change": [`import './lib/router.js';`, `<x-router><x-route class="MyClass" route-match="/other-page"><button onclick="result(document.documentElement.getAttribute('class') === 'MyClass')">Click Here</button></x-route><a href="/other-page" route-match="">Click Here</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
				"all change": [`import './lib/router.js';`, `<x-router><x-route title="New Title" id="MyID" class="MyClass" route-match="/other-page"><button onclick="result(document.title === 'New Title' && document.documentElement.getAttribute('id') === 'MyID' && document.documentElement.getAttribute('class') === 'MyClass')">Click Here</button></x-route><a href="/other-page" route-match="">Click Here</a></x-router><br /><button onclick="result(false)">Click here if Success button isn't showing</button>`]
			}
		},
		"js": {
			"simple non-match": [`import {router} from './lib/router.js';
document.body.insertBefore(router().add("", () => {
	const button = document.createElement("button");
	button.textContent = "Success";
	button.addEventListener("click", () => result(true));
	return button;
}), document.body.firstChild);`, `<br /><button onclick="result(false)">Click here if Success button isn't showing</button>`],
		}
	}
});
