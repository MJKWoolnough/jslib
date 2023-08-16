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
	let queue = Promise.resolve();
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
					queue = queue.finally(() => new Promise<void>(s => {
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
						w.addEventListener("beforeunload", () => {
							button.toggleAttribute("disabled", false)
							s();
						});
						w.addEventListener("error", (e: ErrorEvent) => {
							w.close();
							errorFn(e.error);
							s();
						});
						script.setAttribute("type", "module");
						script.innerText = test[0];
						w.addEventListener("load", () => {
							w.document.title = `${breadcrumbs}: ${name}`;
							w.document.body.innerHTML = (test[1] ?? "") + `<br /><button onclick="result(false)">Click here if Success button isn't showing</button>`;
							w.document.head.append(script);
							w.document.head.append(icon.cloneNode());
						});
					}));
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
			Array.from(document.getElementsByTagName("button")).forEach(e => e.click());
		} else if (e.key === "r") {
			document.getElementsByTagName("button")[0]?.click();
		}
	});
})({
	"router.js": {
		"html": {
			"x-router": {
				"simple non-match": [`import './lib/router.js';`, `<x-router><button route-match="" onclick="result(true)">Success</button></x-router>`],
				"simple match": [`import './lib/router.js';`, `<x-router><button route-match="/test" onclick="result(true)">Success</button></x-router>`],
				"match after link": [`import './lib/router.js';`, `<x-router><button route-match="/other-page" onclick="result(true)">Success</button><a route-match="" href="/other-page">Click here to make button</a></x-router>`],
				"match after button (goto)": [`import './lib/router.js';`, `<x-router><button route-match="/other-page" onclick="result(true)">Success</button><button route-match="" onclick="goto('/other-page')">Click Here</button></x-router>`],
				"history check": [`import './lib/router.js';`, `<x-router><div route-match="/other-page">Use the back button.</div><div route-match=""><button onclick="this.setAttribute('onclick', 'result(true)');goto('/other-page');">Click Here</button></div></x-router>`],
				"path param": [`import './lib/router.js';`, `<x-router><button route-match="/page-:page" onclick="result(this.getAttribute('page') === '15')">Click Here</button><a route-match="" href="/page-15">Click Here</a></x-router>`],
				"match query": [`import './lib/router.js';`, `<x-router><button route-match="/?page=other" onclick="result(true)">Success</button><a route-match="" href="?page=other">Click here to make button</a></x-router>`],
				"query param": [`import './lib/router.js';`, `<x-router><button route-match="?page=:page" onclick="this.getAttribute('page') === '15' ? result(true) : goto('?page=15')">Click Here</button></x-router>`],
				"match hash": [`import './lib/router.js';`, `<x-router><button route-match="#match" onclick="result(true)">Success</button><a route-match="" href="#match">Click here to make button</a></x-router>`],
				"prefix match": [`import './lib/router.js';`, `<x-router><button route-match="/other-page/" onclick="result(true)">Success</button><a href="/other-page/name" route-match="">Click Here</a></x-router>`],
				"suffix match": [`import './lib/router.js';`, `<x-router><button route-match="other-page/" onclick="result(true)">Success</button><a href="/something/other-page/name" route-match="">Click Here</a></x-router>`],
				"no-suffix match": [`import './lib/router.js';`, `<x-router><div route-match="other-page/">Failed</div><button route-match="/other-page" onclick="result(true)">Success</button><a href="/other-page" route-match="">Click Here</a></x-router>`],
				"goto params": [`import './lib/router.js';`, `<x-router><button route-match="/other-page" onclick="result(this.getAttribute('test') === '1' && this.getAttribute('data') === 'abc')">Success</button><button route-match="" onclick="goto('/other-page', {'test': 1, 'data': 'abc'})">Click Here</button></x-router>`],
				"goto overwrite params": [`import './lib/router.js';`, `<x-router><button route-match="/other-page/:id/:data" onclick="result(this.getAttribute('test') === '1' && this.getAttribute('data') === 'abc' && this.getAttribute('id') === '123')">Success</button><button route-match="" onclick="goto('/other-page/123/def', {'test': 1, 'data': 'abc'})">Click Here</button></x-router>`]
			},
			"x-route": {
				"title change": [`import './lib/router.js';`, `<x-router><x-route route-title="New Title" route-match="/other-page"><button onclick="result(document.title === 'New Title')">Click Here</button></x-route><a href="/other-page" route-match="">Click Here</a></x-router>`],
				"id change": [`import './lib/router.js';`, `<x-router><x-route route-id="MyID" route-match="/other-page"><button onclick="result(document.documentElement.getAttribute('id') === 'MyID')">Click Here</button></x-route><a href="/other-page" route-match="">Click Here</a></x-router>`],
				"class change": [`import './lib/router.js';`, `<x-router><x-route route-class="MyClass" route-match="/other-page"><button onclick="result(document.documentElement.getAttribute('class') === 'MyClass')">Click Here</button></x-route><a href="/other-page" route-match="">Click Here</a></x-router>`],
				"all change": [`import './lib/router.js';`, `<x-router><x-route route-title="New Title" route-id="MyID" route-class="MyClass" route-match="/other-page"><button onclick="result(document.title === 'New Title' && document.documentElement.getAttribute('id') === 'MyID' && document.documentElement.getAttribute('class') === 'MyClass')">Click Here</button></x-route><a href="/other-page" route-match="">Click Here</a></x-router>`]
			}
		},
		"js": {
			"simple non-match": [`import {router} from './lib/router.js';
document.body.insertBefore(router().add("", () => {
	const button = document.createElement("button");
	button.textContent = "Success";
	button.addEventListener("click", () => result(true));
	return button;
}), document.body.firstChild);`],
			"simple match": [`import {router} from './lib/router.js';
document.body.insertBefore(router().add("/test", () => {
	const button = document.createElement("button");
	button.textContent = "Success";
	button.addEventListener("click", () => result(true));
	return button;
}), document.body.firstChild);`],
			"match after link": [`import {router} from './lib/router.js';
document.body.insertBefore(router().add("/other-page", () => {
	const button = document.createElement("button");
	button.textContent = "Success";
	button.addEventListener("click", () => result(true));
	return button;
}).add("", () => {
	const a = document.createElement("a");
	a.textContent = "Click Here";
	a.setAttribute("href", "/other-page");
	return a;
}), document.body.firstChild);`],
			"match after button (goto)": [`import {goto, router} from './lib/router.js';
document.body.insertBefore(router().add("/other-page", () => {
	const button = document.createElement("button");
	button.textContent = "Success";
	button.addEventListener("click", () => result(true));
	return button;
}).add("", () => {
	const a = document.createElement("button");
	a.textContent = "Click Here";
	a.addEventListener("click", () => goto("/other-page"));
	return a;
}), document.body.firstChild);`],
			"history check": [`import {goto, router} from './lib/router.js';
document.body.insertBefore(router().add("/other-page", () => {
	const div = document.createElement("div");
	div.textContent = "Use the back button";
	return div;
}).add("", () => {
	const button = document.createElement("button");
	let clicked = false;
	button.textContent = "Click Here";
	button.addEventListener("click", () => {
		if (clicked) {
			result(true);
		} else {
			clicked = true;
			button.textContent = "Success";
			goto("/other-page");
		}
	});
	return button;
}), document.body.firstChild);`],
			"path param": [`import {goto, router} from './lib/router.js';
document.body.insertBefore(router().add("/page-:page", ({page}) => {
	result(page === "15");
	return new Text("");
}).add("", () => {
	const a = document.createElement("a");
	a.textContent = "Click Here";
	a.setAttribute("href", "/page-15");
	return a;
}), document.body.firstChild);`],
			"match query": [`import {router} from './lib/router.js';
document.body.insertBefore(router().add("?page=other", () => {
	result(true);
	return new Text("Success");
}).add("", () => {
	const a = document.createElement("a");
	a.textContent = "Click Here";
	a.setAttribute("href", "?page=other");
	return a;
}), document.body.firstChild);`],
			"query param": [`import {goto, router} from './lib/router.js';
document.body.insertBefore(router().add("/?page=:page", ({page}) => {
	if (page === "15") {
		result(true);
	}
	const a = document.createElement("a");
	a.textContent = "Click Here";
	a.setAttribute("href", "?page=15");
	return a;
}), document.body.firstChild);`],
			"match hash": [`import {router} from './lib/router.js';
document.body.insertBefore(router().add("#match", () => {
	result(true);
	return new Text("Success");
}).add("", () => {
	const a = document.createElement("a");
	a.textContent = "Click Here";
	a.setAttribute("href", "#match");
	return a;
}), document.body.firstChild);`],
			"prefix match": [`import {router} from './lib/router.js';
document.body.insertBefore(router().add("/other-page/", () => {
	result(true);
	return new Text("Success");
}).add("", () => {
	const a = document.createElement("a");
	a.textContent = "Click Here";
	a.setAttribute("href", "/other-page/name");
	return a;
}), document.body.firstChild);`],
			"suffix match": [`import {router} from './lib/router.js';
document.body.insertBefore(router().add("other-page/", () => {
	result(true);
	return new Text("Success");
}).add("", () => {
	const a = document.createElement("a");
	a.textContent = "Click Here";
	a.setAttribute("href", "/something/other-page/name");
	return a;
}), document.body.firstChild);`],
			"no-suffix match": [`import {router} from './lib/router.js';
document.body.insertBefore(router().add("other-page/",  () => {
	result(false);
	return new Text("Failed");
}).add("/other-page", () => {
	result(true);
	return new Text("Success");
}).add("", () => {
	const a = document.createElement("a");
	a.textContent = "Click Here";
	a.setAttribute("href", "/other-page");
	return a;
}), document.body.firstChild);`],
			"goto params": [`import {goto, router} from './lib/router.js';
document.body.insertBefore(router().add("/other-page", data => {
	result(data.test === 1 && data.data === "abc");
	return new Text("Success");
}).add("", () => {
	const button = document.createElement("button");
	button.textContent = "Click Here";
	button.addEventListener("click", () => goto("/other-page", {'test': 1, 'data': 'abc'}));
	return button;
}), document.body.firstChild);`],
			"goto overwrite params": [`import {goto, router} from './lib/router.js';
document.body.insertBefore(router().add("/other-page/:id/:data", data => {
	result(data.id === "123" && data.test === 1 && data.data === "abc");
	return new Text("Success");
}).add("", () => {
	const button = document.createElement("button");
	button.textContent = "Click Here";
	button.addEventListener("click", () => goto("/other-page/123/def", {"test": 1, "data": "abc"}));
	return button;
}), document.body.firstChild);`],
		}
	},
	"urlstate.js": {
		"StateBound": {
			"hasDefault": [`import URLState from './lib/urlstate.js';
import {button} from './lib/html.js';

const sb = URLState("some-name", "default");

document.body.prepend(button({"data-value": sb, "onclick": function() {
	result(this.dataset.value === "default");
}}, "Click Here"));
`],
			"value updates with URL": [`import URLState, {goto} from './lib/urlstate.js';
import {button} from './lib/html.js';

const sb = URLState("some-name", "default");

document.body.prepend(button({"data-value": sb, "onclick": function() {
	if (this.dataset.value === "default") {
		goto('?some-name="123"');
		this.innerText = "Click Here Again";
	} else {
		result(window.location.search === "?some-name=%22123%22" && this.dataset.value === "123");
	}
}}, "Click Here"));
`],
			"value updates with setter": [`import URLState, {goto} from './lib/urlstate.js';
import {button} from './lib/html.js';

const sb = URLState("some-name", "default");

document.body.prepend(button({"data-value": sb, "onclick": function() {
	if (this.dataset.value === "default") {
		sb.value = "123";
		this.innerText = "Click Here Again";
	} else {
		result(window.location.search === "?some-name=%22123%22" && this.dataset.value === "123");
	}
}}, "Click Here"));
`],
			"url and value updates when link clicked": [`import URLState, {goto} from './lib/urlstate.js';

URLState("some-name", "default").onChange(v => result(v === "123"));
`, `<a href='?some-name="123"'>Click Here</a>`]
		},
		"type checker": {
			"correct value": [`import URLState, {goto, setParam} from './lib/urlstate.js';
import {button} from './lib/html.js';

const sb = URLState("some-name", "default", v => typeof v === "string");

sb.value = "other";

let wasOther = false;

document.body.prepend(button({"onclick": function() {
	if (sb.value === "other") {
		wasOther = true;

		goto("?some-name=%22123%22");
	} else if (sb.value === "123") {
		result(wasOther);
	} else {
		result(false);
	}
}}, "Click Here"));
`],
			"incorrect value": [`import URLState, {goto, setParam} from './lib/urlstate.js';
import {button} from './lib/html.js';

const sb = URLState("some-name", "default", v => typeof v === "string");

sb.value = "other";

let wasOther = false;

document.body.prepend(button({"onclick": function() {
	if (sb.value === "other") {
		wasOther = true;

		goto("?some-name=123");
	} else if (sb.value === "default") {
		result(wasOther);
	} else {
		result(false);
	}
}}, "Click Here"));
`]
		}
	}
});
