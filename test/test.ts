type Tests = {
	[key: string]: Tests | (() => Promise<boolean>);
}

((data: Record<string, Tests>) => {
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
	const processTests = (breadcrumbs: string, t: Tests, totalCount: Counter, successCount: Counter, errorCount: Counter) => {
		const df = document.createDocumentFragment(),
		      testList = document.createElement("ul");
		for (const [name, test] of Object.entries(t)) {
			if (test instanceof Function) {
				const li = testList.appendChild(document.createElement("li"));
				li.textContent = name;
				li.setAttribute("title", test.toString());
				totalCount.add();
				test().catch(error => {
					console.error({"section": breadcrumbs.slice(1, -1).split("/"), name, error});
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
		}
	});
})({
	"load.js": {
		"pageLoad": async () => {
			const {default: pageLoad} = await import("./lib/load.js");
			return Promise.race([
				pageLoad,
				new Promise(sFn => setTimeout(() => sFn(false), 10000))
			]).then(v => v !== false);
		}
	},
	"inter.js": {
		"Pipe": {
			"Send/Receive": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      p = new Pipe<boolean>();
				let res: boolean = false;
				p.receive(v => res = v);
				p.send(true);
				return res;
			},
			"Send/Multi-receive": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      p = new Pipe<number>();
				let num = 0;
				p.receive(v => num += v);
				p.receive(v => num += v);
				p.receive(v => num += v);
				p.send(2);
				return num === 6;
			},
			"Send/Multi-receive same fn": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      p = new Pipe<number>(),
				      fn = (v: number) => num += v;
				let num = 0;
				p.receive(fn);
				p.receive(fn);
				p.receive(fn);
				p.send(2);
				return num === 6;
			},
			"Remove": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      p = new Pipe<number>(),
				      fn = (v: number) => num += v;
				let num = 0;
				p.receive(fn);
				p.receive(v => num += v);
				p.receive(v => num += v);
				p.remove(fn);
				p.send(2);
				return num === 4;
			},
			"Remove same fn": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      p = new Pipe<number>(),
				      fn = (v: number) => num += v;
				let num = 0;
				p.receive(fn);
				p.receive(fn);
				p.receive(fn);
				p.remove(fn);
				p.send(2);
				return num === 4;
			},
			"Bind": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      [send, receive, remove] = new Pipe<number>().bind(),
				      fn = (v: number) => res += v;
				let res = 0;
				receive(fn);
				send(2);
				remove(fn);
				send(1);
				return res === 2;
			},
			"Bind (1)": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      b = new Pipe().bind(1);
				return b[0] instanceof Function && b[1] === undefined && b[2] === undefined;
			},
			"Bind (2)": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      b = new Pipe().bind(2);
				return b[0] === undefined && b[1] instanceof Function && b[2] === undefined;
			},
			"Bind (3)": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      b = new Pipe().bind(3);
				return b[0] instanceof Function && b[1] instanceof Function && b[2] === undefined;
			},
			"Bind (4)": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      b = new Pipe().bind(4);
				return b[0] === undefined && b[1] === undefined && b[2] instanceof Function;
			},
			"Bind (5)": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      b = new Pipe().bind(5);
				return b[0] instanceof Function && b[1] === undefined && b[2] instanceof Function;
			},
			"Bind (6)": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      b = new Pipe().bind(6);
				return b[0] === undefined && b[1] instanceof Function && b[2] instanceof Function;
			},
			"Bind (7)": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      b = new Pipe().bind(7);
				return b[0] instanceof Function && b[1] instanceof Function && b[2] instanceof Function;
			}
		},
		"Requester": {
			"Respond/Request value": async () => {
				const {Requester} = await import("./lib/inter.js"),
				      r = new Requester<boolean>();
				r.responder(true);
				return r.request();
			},
			"Respond/Request fn": async () => {
				const {Requester} = await import("./lib/inter.js"),
				      r = new Requester<boolean>();
				r.responder(() => true);
				return r.request();
			},
			"No Responder": async () => {
				const {Requester} = await import("./lib/inter.js"),
				      r = new Requester<boolean>();
				try {
					r.request();
				} catch(e) {
					return true;
				}
				return false;
			}
		},
		"Subscription": {
			"when": async () => {
				let res = false,
				    sFn = (_: boolean) => {};
				const {Subscription} = await import("./lib/inter.js");
				new Subscription<boolean>(s => sFn = s).when(b => res = b).catch(() => res = false);
				sFn(true);
				return res;
			},
			"when-chain": async () => {
				let res = false,
				    sFn = (_: boolean) => {};
				const {Subscription} = await import("./lib/inter.js"),
				      s = new Subscription<boolean>(s => sFn = s);
				s.when(b => b).when(b => res = b).catch(() => res = false);;
				sFn(true);
				return res;
			},
			"multi-then": async () => {
				let res = 0,
				    sFn = (_: number) => {};
				const {Subscription} = await import("./lib/inter.js"),
				      s = new Subscription<number>(s => sFn = s);
				s.when(b => res += b).catch(() => res = 0);
				s.when(b => res += b).catch(() => res = 0);;
				s.when(b => res += b).catch(() => res = 0);;
				sFn(1);
				return res === 3;
			},
			"multi-then-chain": async () => {
				let res = 0,
				    sFn = (_: number) => {};
				const {Subscription} = await import("./lib/inter.js"),
				      s = new Subscription<number>(s => sFn = s);
				s.when(b => b + 1).when(b => res += b);
				s.when(b => b + 2).when(b => res += b);
				s.when(b => b + 3).when(b => res += b);
				sFn(1);
				return res === 9;
			},
			"catch": async () => {
				let res = 0,
				    eFn = (_: any) => {};
				const {Subscription} = await import("./lib/inter.js");
				new Subscription<boolean>((_, e) => eFn = e).catch(e => res += e);
				eFn(1);
				return res === 1;
			},
			"error catch": async () => {
				let res = 0,
				    sFn = (_: boolean) => {};
				const {Subscription} = await import("./lib/inter.js");
				new Subscription<boolean>(s => sFn = s).when(() => {throw 1}).catch(e => res += e);
				sFn(false);
				return res === 1;
			},
			"finally": async () => {
				let res = 0,
				    sFn = (_: boolean) => {};
				const {Subscription} = await import("./lib/inter.js");
				new Subscription<boolean>(s => sFn = s).finally(() => res++);
				new Subscription<boolean>(() => {}).finally(() => res++);
				sFn(false);
				return res === 1;
			},
			"finally-chain": async () => {
				let res = 0,
				    sFn = (_: boolean) => {};
				const {Subscription} = await import("./lib/inter.js");
				new Subscription<boolean>(s => sFn = s).when(() => {}).finally(() => res++);
				new Subscription<boolean>(() => {}).when(() => {}).finally(() => res++);
				sFn(false);
				return res === 1;
			},
			"error finally": async () => {
				let res = 0,
				    sFn = (_: boolean) => {};
				const {Subscription} = await import("./lib/inter.js");
				new Subscription<boolean>(s => sFn = s).when(() => {throw 1}).finally(() => res++).catch(() => res *= 5);
				new Subscription<boolean>(() => {}).when(() => {throw 1}).finally(() => res += 3);
				sFn(false);
				return res === 5;
			},
			"cancel": async () => {
				let res = 0;
				const {Subscription} = await import("./lib/inter.js");
				new Subscription((_sFn, _eFn, cFn) => cFn(() => res++)).cancel();
				new Subscription((_sFn, _eFn, cFn) => cFn(() => res++));
				return res === 1;
			},
			"chain-cancel": async () => {
				let res = 0;
				const {Subscription} = await import("./lib/inter.js");
				new Subscription((_sFn, _eFn, cFn) => cFn(() => res++)).when(() => {}).cancel();
				new Subscription((_sFn, _eFn, cFn) => cFn(() => res++)).when(() => {});
				return res === 1;
			},
			"splitCancel": async () => {
				let res = 0,
				    success = (_n: number) => {},
				    error = (_n: number) => {};
				const {Subscription} = await import("./lib/inter.js"),
				      sc = new Subscription<number>((sFn, eFn, cFn) => {
					      success = sFn;
					      error = eFn;
					      cFn(() => res = -999);
				      }).splitCancel(),
				      first = sc().when(n => res += n * 2, n => res += n * 3),
				      second = sc().when(n => res += n * 5, n => res += n * 7);
				success(1);
				error(2);
				first.cancel();
				success(3);
				error(4);
				second.cancel();
				success(5);
				error(6);
				return res === 70;
			},
			"splitCancel with forward": async () => {
				let res = 0,
				    success = (_n: number) => {},
				    error = (_n: number) => {};
				const {Subscription} = await import("./lib/inter.js"),
				      sc = new Subscription<number>((sFn, eFn, cFn) => {
					      success = sFn;
					      error = eFn;
					      cFn(() => res *= 10);
				      }).splitCancel(true),
				      first = sc().when(n => res += n * 2, n => res += n * 3),
				      second = sc().when(n => res += n * 5, n => res += n * 7);
				success(1);
				error(2);
				first.cancel();
				success(3);
				error(4);
				second.cancel();
				success(5);
				error(6);
				return res === 700;
			},
			"merge": async () => {
				let firstSuccess: (n: number) => void,
				    firstError: (e: any) => void,
				    secondSuccess: (s: string) => void,
				    secondError: (e: any) => void,
				    res = 0;
				const {Subscription} = await import("./lib/inter.js"),
				      s = Subscription.merge<number | string>(
					new Subscription<number>((sFn, eFn, cFn) => {
						firstSuccess = sFn;
						firstError = eFn;
						cFn(() => res *= 3);
					}),
					new Subscription<string>((sFn, eFn, cFn) => {
						secondSuccess = sFn;
						secondError = eFn;
						cFn(() => res *= 5);
					})
				      ).when(n => res += typeof n === "string" ? n.length : n, e => res *= e);
				firstSuccess!(1);
				firstError!(2);
				secondSuccess!("123");
				secondError!(3);
				s.cancel();
				return res === 225;
			},
			"bind (1)": async () => {
				const {Subscription} = await import("./lib/inter.js"),
				      [s, sFn, eFn, cFn] = Subscription.bind(1);
				return s instanceof Subscription && sFn instanceof Function && eFn === undefined && cFn === undefined;
			},
			"bind (2)": async () => {
				const {Subscription} = await import("./lib/inter.js"),
				      [s, sFn, eFn, cFn] = Subscription.bind(2);
				return s instanceof Subscription && sFn === undefined && eFn instanceof Function && cFn === undefined;
			},
			"bind (3)": async () => {
				const {Subscription} = await import("./lib/inter.js"),
				      [s, sFn, eFn, cFn] = Subscription.bind(3);
				return s instanceof Subscription && sFn instanceof Function && eFn instanceof Function && cFn === undefined;
			},
			"bind (4)": async () => {
				const {Subscription} = await import("./lib/inter.js"),
				      [s, sFn, eFn, cFn] = Subscription.bind(4);
				return s instanceof Subscription && sFn === undefined && eFn === undefined && cFn instanceof Function;
			},
			"bind (5)": async () => {
				const {Subscription} = await import("./lib/inter.js"),
				      [s, sFn, eFn, cFn] = Subscription.bind(5);
				return s instanceof Subscription && sFn instanceof Function && eFn === undefined && cFn instanceof Function;
			},
			"bind (6)": async () => {
				const {Subscription} = await import("./lib/inter.js"),
				      [s, sFn, eFn, cFn] = Subscription.bind(6);
				return s instanceof Subscription && sFn === undefined && eFn instanceof Function && cFn instanceof Function;
			},
			"bind (7)": async () => {
				const {Subscription} = await import("./lib/inter.js"),
				      [s, sFn, eFn, cFn] = Subscription.bind(7);
				return s instanceof Subscription && sFn instanceof Function && eFn instanceof Function && cFn instanceof Function;
			},
			"bind": async () => {
				const {Subscription} = await import("./lib/inter.js"),
				      [s, sFn, eFn, cFn] = Subscription.bind<number>();
				let res = 0;
				cFn(() => res++);
				s.when(num => res *= num, num => res %= num).cancel();
				sFn(2);
				sFn(3);
				eFn(4);
				s.cancel();
				sFn(5);
				return res === 15;
			}
		},
		"WaitGroup": {
			"add-done": async () => {
				let res = 0;
				const {WaitGroup} = await import("./lib/inter.js"),
				      wg = new WaitGroup();
				wg.onComplete(() => res = 1);
				res++;
				wg.add();
				res++;
				wg.done();
				return res === 1;
			},
			"multi-add-done": async () => {
				let res = 0;
				const {WaitGroup} = await import("./lib/inter.js"),
				      wg = new WaitGroup();
				wg.onComplete(() => res = 1);
				res++;
				wg.add();
				res++;
				wg.add();
				res++;
				wg.done();
				res++;
				wg.done();
				return res === 1;
			},
			"error-done": async () => {
				let res = false;
				const {WaitGroup} = await import("./lib/inter.js"),
				      wg = new WaitGroup();
				wg.onComplete(() => res = true);
				wg.add();
				wg.error();
				return res;
			},
			"multi-error-done": async () => {
				let res = 0;
				const {WaitGroup} = await import("./lib/inter.js"),
				      wg = new WaitGroup();
				res++;
				wg.onComplete(() => res = 1);
				res++;
				wg.add();
				res++;
				wg.add();
				res++;
				wg.error();
				res++;
				wg.error();
				return res === 1;
			},
			"onUpdate": async () => {
				let res = 0;
				const {WaitGroup} = await import("./lib/inter.js"),
				      wg = new WaitGroup();
				wg.onUpdate(wi => res += wi.waits * 2 + wi.done * 3 + wi.errors * 5);
				wg.add();
				wg.add();
				wg.error();
				wg.done();
				return res === 27;
			},
			"onUpdate/onComplete": async () => {
				let res = 0;
				const {WaitGroup} = await import("./lib/inter.js"),
				      wg = new WaitGroup();
				wg.onComplete(() => res *= 2);
				wg.onUpdate(wi => res += wi.waits * 2 + wi.done * 3 + wi.errors * 5);
				wg.add();
				wg.add();
				wg.error();
				wg.done();
				return res === 54;
			}
		}
	},
	"dom.js": {
		"amendNode": {
			"type test (div)": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div");
				return amendNode(div) === div && div instanceof HTMLDivElement;
			},
			"type test (span)": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      span = document.createElement("span");
				return amendNode(span) === span && span instanceof HTMLSpanElement;
			},
			"no property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div")).getAttribute("property") === null;
			},
			"string property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), {"property": "value"}).getAttribute("property") === "value";
			},
			"number property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), {"property": 1}).getAttribute("property") === "1";
			},
			"boolean property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), {"property": true}).getAttribute("property") === "";
			},
			"unset boolean property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"property": true}), {"property": false}).getAttribute("property") === null;
			},
			"ToString property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), {"property": {}}).getAttribute("property") === "[object Object]";
			},
			"remove string property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"property": "value"}), {"property": undefined}).getAttribute("property") === null;
			},
			"remove number property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"property": 1}), {"property": undefined}).getAttribute("property") === null;
			},
			"remove boolean property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"property": true}), {"property": undefined}).getAttribute("property") === null;
			},
			"remove ToString property": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"property": {}}), {"property": undefined}).getAttribute("property") === null;
			},
			"class set string": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), {"class": "class1 class2"}).getAttribute("class") === "class1 class2";
			},
			"class set array": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), {"class": ["class1", "class2"]}).getAttribute("class") === "class1 class2";
			},
			"class set multi-array": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"class": ["class1", "class2"]}), {"class": ["class3"]}).getAttribute("class") === "class1 class2 class3";
			},
			"class set array -> string": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"class": ["class1", "class2"]}), {"class": "class3"}).getAttribute("class") === "class3";
			},
			"class set DOMTokenList": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      div = amendNode(document.createElement("div"), {"class": ["class1", "class2"]});
				return amendNode(document.createElement("div"), {"class": div.classList}).getAttribute("class") === "class1 class2";
			},
			"class set/unset classes": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"class": ["class1", "class2"]}), {"class": ["!class2", "class3"]}).getAttribute("class") === "class1 class3";
			},
			"class toggle classes": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"class": ["class1", "class2"]}), {"class": ["~class2", "~class3"]}).getAttribute("class") === "class1 class3";
			},
			"class toggle with object": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(amendNode(document.createElement("div"), {"class": ["class1", "class2", "class3"]}), {"class": {"class2": false, "class3": null, "class4": true, "class5": null}}).getAttribute("class") === "class1 class4 class5";
			},
			"style set string": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), {"style": "font-size: 2em; color: rgb(255, 0, 0);"}).getAttribute("style") === "font-size: 2em; color: rgb(255, 0, 0);";
			},
			"style set object": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), {"style": {"font-size": "2em", "color": "rgb(255, 0, 0)"}}).getAttribute("style") === "font-size: 2em; color: rgb(255, 0, 0);";
			},
			"style set CSSStyleDeclaration": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      div = amendNode(document.createElement("div"), {"style": {"font-size": "2em", "color": "rgb(255, 0, 0)"}});
				return amendNode(document.createElement("div"), {"style": div.style}).getAttribute("style") === "font-size: 2em; color: rgb(255, 0, 0);";
			},
			"event string set": async () => {
				type W = typeof window & {
					ares: number;
				};
				const {amendNode} = await import("./lib/dom.js");
				(window as W).ares = 0;
				amendNode(document.createElement("div"), {"onclick": "window.ares++"}).click();
				return (window as W).ares === 1;
			},
			"event string unset": async () => {
				type W = typeof window & {
					bres: number;
				};
				const {amendNode} = await import("./lib/dom.js");
				(window as W).bres = 0;
				amendNode(amendNode(document.createElement("div"), {"onclick": "window.bres++"}), {"onclick": undefined}).click();
				return (window as W).bres === 0;
			},
			"event arrow fn set": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      div = amendNode(document.createElement("div"), {"onclick": () => res++});
				div.click();
				div.click();
				return res === 2;
			},
			"event fn set": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      div = amendNode(document.createElement("div"), {"onclick": function(this: HTMLDivElement) {res += +(this === div)}});
				div.click();
				div.click();
				return res === 2;
			},
			"event EventListenerObject set": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      he = {"handleEvent": function(this: object) {res += +(this === he)}},
				      div = amendNode(document.createElement("div"), {"onclick": he});
				div.click();
				div.click();
				return res === 2;
			},
			"event array arrow fn once set": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      div = amendNode(document.createElement("div"), {"onclick": [() => res++, {"once": true}, false]});
				div.click();
				div.click();
				return res === 1;
			},
			"event array fn once set": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      div = amendNode(document.createElement("div"), {"onclick": [function(this: HTMLDivElement) {res += +(this === div)}, {"once": true}, false]});
				div.click();
				div.click();
				return res === 1;
			},
			"event EventListenerObject once set": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      he = {"handleEvent": function(this: object) {res += +(this === he)}},
				      div = amendNode(document.createElement("div"), {"onclick": [he, {"once": true}, false]});
				div.click();
				div.click();
				return res === 1;
			},
			"event array arrow fn remove": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      fn = () => res++,
				      div = amendNode(amendNode(document.createElement("div"), {"onclick": [fn, {}, false]}), {"onclick": [fn, {}, true]});
				div.click();
				div.click();
				return res === 0;
			},
			"event array fn remove": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      fn = function(this: HTMLDivElement) {res += +(this === div)},
				      div = amendNode(amendNode(document.createElement("div"), {"onclick": [fn, {}, false]}), {"onclick": [fn, {}, true]});
				div.click();
				div.click();
				return res === 0;
			},
			"event EventListenerObject remove": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      he = {"handleEvent": function(this: object) {res += +(this === he)}},
				      div = amendNode(amendNode(document.createElement("div"), {"onclick": [he, {}, false]}), {"onclick": [he, {}, true]});
				div.click();
				div.click();
				return res === 0;
			},
			"event signal": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      ac = new AbortController(),
				      div = amendNode(document.createElement("div"), {"onclick": [() => res++, {"signal": ac.signal}, false]});
				div.click();
				div.click();
				ac.abort();
				div.click();
				return res === 2;
			},
			"string child": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), "Test String").innerText === "Test String";
			},
			"array string children": async () => {
				const {amendNode} = await import("./lib/dom.js");
				return amendNode(document.createElement("div"), ["Test", " String"]).innerText === "Test String";
			},
			"append node child": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      span = document.createElement("span"),
				      div = amendNode(document.createElement("div"), span);
				return div.firstChild === span && div.lastChild === span;
			},
			"append node array": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      span1 = document.createElement("span"),
				      span2 = document.createElement("span"),
				      div = amendNode(document.createElement("div"), [span1, span2]);
				return div.firstChild === span1 && div.lastChild === span2;
			},
			"append string + node": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      span = document.createElement("span"),
				      div = amendNode(document.createElement("div"), ["Text", span]);
				return div.firstChild instanceof Text && div.firstChild.textContent === "Text" && div.lastChild === span;
			},
			"append multi-array": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      span1 = document.createElement("span"),
				      span2 = document.createElement("span"),
				      span3 = document.createElement("span"),
				      div = amendNode(document.createElement("div"), [span1, [span2, span3]]);
				return div.firstChild === span1 && div.children[1] === span2 && div.lastChild === span3;
			},
			"append NodeList": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      span1 = document.createElement("span"),
				      span2 = document.createElement("span"),
				      span3 = document.createElement("span"),
				      div1 = amendNode(document.createElement("div"), [span1, [span2, span3]]),
				      div2 = amendNode(document.createElement("div"), div1.childNodes);
				return div2.firstChild === span1 && div2.children[1] === span2 && div2.lastChild === span3;
			},
			"append HTMLCollection": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      span1 = document.createElement("span"),
				      span2 = document.createElement("span"),
				      span3 = document.createElement("span"),
				      div1 = amendNode(document.createElement("div"), [span1, [span2, span3]]),
				      div2 = amendNode(document.createElement("div"), div1.children);
				return div2.firstChild === span1 && div2.children[1] === span2 && div2.lastChild === span3;
			},
			"property set + append": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      span = document.createElement("span"),
				      div = amendNode(document.createElement("div"), {"property": "value"}, span);
				return div.getAttribute("property") === "value" && div.firstChild === span;
			},
			"set property NamedNodeMap": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      span = amendNode(document.createElement("span"), {"property": "value", "property2": 2}),
				      div = amendNode(document.createElement("div"), span.attributes);
				return div.getAttribute("property") === "value" && span.getAttribute("property") === "value" && div.getAttribute("property2") === "2" && span.getAttribute("property2") === "2";
			},
			"non-node event setting": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js");
				amendNode(window, {"onevent": () => res++});
				window.dispatchEvent(new CustomEvent("event"));
				window.dispatchEvent(new CustomEvent("event"));
				return res === 2;
			},
			"non-node event setting with once": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js");
				amendNode(window, {"onevent": [() => res++, {"once": true}, false]});
				window.dispatchEvent(new CustomEvent("event"));
				window.dispatchEvent(new CustomEvent("event"));
				return res === 1;
			},
			"non-node event setting with signal": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      ac = new AbortController();
				amendNode(window, {"onevent": [() => res++, {"signal": ac.signal}, false]});
				window.dispatchEvent(new CustomEvent("event"));
				ac.abort();
				window.dispatchEvent(new CustomEvent("event"));
				return res === 1;
			},
			"non-node event setting with remove": async () => {
				let res = 0;
				const {amendNode} = await import("./lib/dom.js"),
				      fn = () => res++;
				amendNode(window, {"onevent": fn});
				window.dispatchEvent(new CustomEvent("event"));
				amendNode(window, {"onevent": [fn, {}, true]});
				window.dispatchEvent(new CustomEvent("event"));
				return res === 1;
			},
			"null": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      d = amendNode(document.createElement("div"), {"attr": "abc"});
				amendNode(d, {"attr": null, "another": null});
				return d.getAttribute("attr") === "abc" && d.getAttribute("another") === null;
			},
			"toggle": async () => {
				const {amendNode, toggle} = await import("./lib/dom.js"),
				      d = amendNode(document.createElement("div"), {"attr": toggle}),
				      a = d.hasAttribute("attr"),
				      b = amendNode(d, {"attr": toggle}).hasAttribute("attr"),
				      c = amendNode(d, {"attr": toggle}).hasAttribute("attr");

				return a && !b && c;
			},
			"toggle fn": async () => {
				const {amendNode, toggle} = await import("./lib/dom.js"),
				      states: boolean[] = [],
				      toggleFn = (v: boolean) => states.push(v),
				      d = document.createElement("div");;

				amendNode(d, {"attr": toggle(toggleFn)});
				amendNode(d, {"attr": toggle(toggleFn)});
				amendNode(d, {"attr": toggle(toggleFn)});

				return states[0] && !states[1] && states[2];
			}
		},
		"event": {
			"capture": async () => {
				const {event, eventCapture} = await import("./lib/dom.js"),
				      fn = () => {},
				      e = event(fn, eventCapture);
				return e[0] === fn && e[1].capture === true && e[1].once === false && e[1].passive === false && e[1].signal === undefined && e[2] === false;
			},
			"capture remove": async () => {
				const {event, eventCapture, eventRemove} = await import("./lib/dom.js"),
				      fn = () => {},
				      e = event(fn, eventCapture | eventRemove);
				return e[0] === fn && e[1].capture === true && e[1].once === false && e[1].passive === false && e[1].signal === undefined && e[2] === true;
			},
			"once": async () => {
				const {event, eventOnce} = await import("./lib/dom.js"),
				      fn = {"handleEvent": () => {}},
				      e = event(fn, eventOnce);
				return e[0] === fn && e[1].capture === false && e[1].once === true && e[1].passive === false && e[1].signal === undefined && e[2] === false;
			},
			"once remove": async () => {
				const {event, eventOnce, eventRemove} = await import("./lib/dom.js"),
				      fn = {"handleEvent": () => {}},
				      e = event(fn, eventOnce | eventRemove);
				return e[0] === fn && e[1].capture === false && e[1].once === true && e[1].passive === false && e[1].signal === undefined && e[2] === true;
			},
			"passive": async () => {
				const {event, eventPassive} = await import("./lib/dom.js"),
				      fn = function () {},
				      e = event(fn, eventPassive);
				return e[0] === fn && e[1].capture === false && e[1].once === false && e[1].passive === true && e[1].signal === undefined && e[2] === false;
			},
			"passive remove": async () => {
				const {event, eventPassive, eventRemove} = await import("./lib/dom.js"),
				      fn = function () {},
				      e = event(fn, eventPassive | eventRemove);
				return e[0] === fn && e[1].capture === false && e[1].once === false && e[1].passive === true && e[1].signal === undefined && e[2] === true;
			},
			"all": async () => {
				const {event, eventCapture, eventOnce, eventPassive} = await import("./lib/dom.js"),
				      fn = {"handleEvent": function () {}},
				      e = event(fn, eventCapture | eventOnce | eventPassive);
				return e[0] === fn && e[1].capture === true && e[1].once === true && e[1].passive === true && e[1].signal === undefined && e[2] === false;
			},
			"all remove": async () => {
				const {event, eventCapture, eventOnce, eventPassive, eventRemove} = await import("./lib/dom.js"),
				      fn = {"handleEvent": function () {}},
				      e = event(fn, eventCapture | eventOnce | eventPassive | eventRemove);
				return e[0] === fn && e[1].capture === true && e[1].once === true && e[1].passive === true && e[1].signal === undefined && e[2] === true;
			},
			"signal": async () => {
				const {event} = await import("./lib/dom.js"),
				      fn = () => {},
				      ac = new AbortController(),
				      e = event(fn, 0, ac.signal);
				return e[0] === fn && e[1].capture === false && e[1].once === false && e[1].passive === false && e[1].signal === ac.signal && e[2] === false;
			}
		},
		"createDocumentFragment": {
			"createDocumentFragment": async () => {
				const {createDocumentFragment} = await import("./lib/dom.js");
				return createDocumentFragment() instanceof DocumentFragment;
			},
			"string append": async () => {
				const {createDocumentFragment} = await import("./lib/dom.js");
				return createDocumentFragment("Text").textContent === "Text";
			},
			"node append": async () => {
				const {createDocumentFragment} = await import("./lib/dom.js"),
				      div = document.createElement("div");
				return createDocumentFragment(div).firstChild === div;
			},
			"array append": async () => {
				const {createDocumentFragment} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      df = createDocumentFragment(["Text", div]);
				return df.firstChild instanceof Text && df.firstChild.textContent === "Text" && df.lastChild === div;
			}
		},
		"clearNode": {
			"empty": async () => {
				const {clearNode} = await import("./lib/dom.js"),
				      n = document.createElement("div");
				n.append(document.createElement("div"), document.createElement("div"));
				clearNode(n);
				return n.childNodes.length === 0;
			},
			"empty with string": async () => {
				const {clearNode} = await import("./lib/dom.js"),
				      n = document.createElement("div");
				n.append(document.createElement("div"), document.createElement("div"));
				clearNode(n, "TEXT");
				return n.textContent === "TEXT";
			},
			"empty with params + string": async () => {
				const {clearNode} = await import("./lib/dom.js"),
				      n = document.createElement("div");
				n.append(document.createElement("div"), document.createElement("div"));
				clearNode(n, {"property": "value"}, "TEXT");
				return n.getAttribute("property") === "value" && n.textContent === "TEXT";
			},
			"empty with node": async () => {
				const {clearNode} = await import("./lib/dom.js"),
				      n = document.createElement("div"),
				      s = document.createElement("span");
				n.append(document.createElement("div"), document.createElement("div"));
				clearNode(n, s);
				return n.firstChild === s;
			},
			"empty with params + node": async () => {
				const {clearNode} = await import("./lib/dom.js"),
				      n = document.createElement("div"),
				      s = document.createElement("span");
				n.append(document.createElement("div"), document.createElement("div"));
				clearNode(n, {"property": "value"}, s);
				return n.getAttribute("property") === "value" && n.firstChild === s;
			}
		},
		"bindElement": {
			"div": async () => {
				const {bindElement} = await import("./lib/dom.js"),
				      div = bindElement("http://www.w3.org/1999/xhtml", "div");

				return div() instanceof HTMLDivElement;
			},
			"raw": async () => {
				const {bindElement} = await import("./lib/dom.js"),
				      div = bindElement("http://www.w3.org/1999/xhtml", "div"),
				      span = bindElement("http://www.w3.org/1999/xhtml", "span");

				return div(span).firstChild instanceof HTMLSpanElement;
			}
		}
	},
	"bind.js": {
		"bind": {
			"bind text": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      text = bind("HELLO"),
				      elm = amendNode(document.createElement("div"), text),
				      start = elm.textContent;
				text.value = "GOODBYE";
				return start === "HELLO" && elm.textContent === "GOODBYE";
			},
			"bind text (multiple)": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      text = bind("HELLO"),
				      elm = amendNode(document.createElement("div"), text),
				      elm2 = amendNode(document.createElement("div"), ["Other ", text, " Text"]),
				      start = elm.textContent,
				      start2 = elm2.textContent;
				text.value = "GOODBYE";
				return start === "HELLO" && start2 == "Other HELLO Text" && elm.textContent === "GOODBYE" && elm2.textContent === "Other GOODBYE Text";
			},
			"bind attr": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      attr = bind("FIRST"),
				      elm = amendNode(document.createElement("div"), {"TEST": attr}),
				      start = elm.getAttributeNS(null, "TEST");
				attr.value = "SECOND";
				return start === "FIRST" && elm.getAttributeNS(null, "TEST") === "SECOND";
			},
			"bind attr (multiple)": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      attr = bind("FIRST"),
				      elm = amendNode(document.createElement("div"), {"TEST": attr, "TEST2": attr}),
				      elm2 = amendNode(document.createElement("div"), {"TEST3": attr}),
				      start = elm.getAttributeNS(null, "TEST"),
				      start2 = elm.getAttributeNS(null, "TEST2"),
				      start3 = elm2.getAttributeNS(null, "TEST3");
				attr.value = "SECOND";
				return start === "FIRST" && start2 === "FIRST" && start3 === "FIRST" && elm.getAttributeNS(null, "TEST") === "SECOND" && elm.getAttributeNS(null, "TEST2") === "SECOND" && elm2.getAttributeNS(null, "TEST3") === "SECOND";
			},
			"bind text using fn": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      text = bind("HELLO"),
				      startVal = text(),
				      elm = amendNode(document.createElement("div"), text),
				      start = elm.textContent;

				text("GOODBYE");

				return start === "HELLO" && start === startVal && elm.textContent === "GOODBYE" && elm.textContent === text();
			}
		},
		"template": {
			"single bind": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      a = bind(" "),
				      text = bind`HELLO${a}WORLD`,
				      elm = amendNode(document.createElement("div"), text),
				      start = elm.textContent;
				a.value = ",";
				return new Promise(sFn => setTimeout(sFn)).then(() => start === "HELLO WORLD" && elm.textContent === "HELLO,WORLD");
			},
			"single bind (attr)": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      a = bind(" "),
				      text = bind`HELLO${a}WORLD`,
				      elm = amendNode(document.createElement("div"), {text}),
				      start = elm.getAttribute("text");
				a.value = ",";
				return new Promise(sFn => setTimeout(sFn)).then(() => start === "HELLO WORLD" && elm.getAttribute("text") === "HELLO,WORLD");
			},
			"double bind": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      a = bind("One"),
				      b = bind("Two"),
				      text = bind`1: ${a}\n2: ${b}`,
				      elm = amendNode(document.createElement("div"), text),
				      start = elm.textContent;
				a.value = "Uno";
				b.value = "Dos";
				return new Promise(sFn => setTimeout(sFn)).then(() => start === `1: One\n2: Two` && elm.textContent === `1: Uno\n2: Dos`);
			},
			"double bind (attr)": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      a = bind("One"),
				      b = bind("Two"),
				      text = bind`1: ${a}\n2: ${b}`,
				      elm = amendNode(document.createElement("div"), {text}),
				      start = elm.getAttribute("text");
				a.value = "Uno";
				b.value = "Dos";
				return new Promise(sFn => setTimeout(sFn)).then(() => start === `1: One\n2: Two` && elm.getAttribute("text") === `1: Uno\n2: Dos`);
			},
			"single bind using fn": async () => {
				const {amendNode} = await import("./lib/dom.js"),
				      {default: bind} = await import("./lib/bind.js"),
				      a = bind(" "),
				      text = bind`HELLO${a}WORLD`,
				      startVal = text(),
				      elm = amendNode(document.createElement("div"), text),
				      start = elm.textContent;

				a(",");
				// @ts-ignore: Deliberately mis-using fn
				text("NO CHANGE");

				return new Promise(sFn => setTimeout(sFn)).then(() => start === "HELLO WORLD" && start === startVal && elm.textContent === "HELLO,WORLD" && elm.textContent === text());
			}
		},
		"function": async () => {
			const {amendNode} = await import("./lib/dom.js"),
			      {default: bind} = await import("./lib/bind.js"),
			      onclick = bind(() => a++),
			      elm = amendNode(document.createElement("div"), {onclick});
			let a = 0;
			elm.click();
			onclick.value = () => a += 3;
			elm.click();
			return a === 4;
		}
	},
	"html.js": {
		"elements": {
			"a": async () => {
				const {a} = await import("./lib/html.js");
				return a() instanceof HTMLAnchorElement;
			},
			"a with child": async () => {
				const {a} = await import("./lib/html.js"),
				      child = a();
				return a(child).firstChild === child;
			},
			"a with props": async () => {
				const {a} = await import("./lib/html.js");
				return a({"property": "value"}).getAttribute("property") === "value";
			},
			"a with props + child": async () => {
				const {a} = await import("./lib/html.js"),
				      child = a(),
				      e = a({"property": "value"}, child);
				return e.getAttribute("property") === "value" && e.firstChild === child;
			},
			"div": async () => {
				const {div} = await import("./lib/html.js");
				return div() instanceof HTMLDivElement;
			},
			"img": async () => {
				const {img} = await import("./lib/html.js");
				return img() instanceof HTMLImageElement;
			},
			"span": async () => {
				const {span} = await import("./lib/html.js");
				return span() instanceof HTMLSpanElement;
			}
		}
	},
	"svg.js": {
		"elements": {
			"a": async () => {
				const {a} = await import("./lib/svg.js");
				return a() instanceof SVGAElement;
			},
			"a with child": async () => {
				const {a} = await import("./lib/svg.js"),
				      child = a();
				return a(child).firstChild === child;
			},
			"a with props": async () => {
				const {a} = await import("./lib/svg.js");
				return a({"property": "value"}).getAttribute("property") === "value";
			},
			"a with props + child": async () => {
				const {a} = await import("./lib/svg.js"),
				      child = a(),
				      e = a({"property": "value"}, child);
				return e.getAttribute("property") === "value" && e.firstChild === child;
			},
			"g": async () => {
				const {g} = await import("./lib/svg.js");
				return g() instanceof SVGGElement;
			},
			"path": async () => {
				const {path} = await import("./lib/svg.js");
				return path() instanceof SVGPathElement;
			},
			"rect": async () => {
				const {rect} = await import("./lib/svg.js");
				return rect() instanceof SVGRectElement;
			}
		},
		"svgData": {
			"svg to string": async () => {
				const {ns, svgData} = await import("./lib/svg.js"),
				      svg = document.createElementNS(ns, "svg"),
				      rect = svg.appendChild(document.createElement("g")).appendChild(document.createElement("rect"));
				svg.setAttribute("viewBox", "0 0 100 100");
				rect.setAttribute("width", "100");
				rect.setAttribute("height", "50");
				return svgData(svg) === "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cg%3E%3Crect%20width%3D%22100%22%20height%3D%2250%22%3E%3C%2Frect%3E%3C%2Fg%3E%3C%2Fsvg%3E";
			},
			"symbol to string": async () => {
				const {ns, svgData} = await import("./lib/svg.js"),
				      svg = document.createElementNS(ns, "symbol"),
				      rect = svg.appendChild(document.createElement("g")).appendChild(document.createElement("rect"));
				svg.setAttribute("viewBox", "0 0 100 100");
				rect.setAttribute("width", "100");
				rect.setAttribute("height", "50");
				return svgData(svg) === "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cg%3E%3Crect%20width%3D%22100%22%20height%3D%2250%22%3E%3C%2Frect%3E%3C%2Fg%3E%3C%2Fsvg%3E";
			}
		}
	},
	"math.js": window.MathMLElement ? {
		"elements": {
			"math": async () => {
				const {math} = await import("./lib/math.js");
				return math() instanceof MathMLElement;
			},
			"math with child": async () => {
				const {math, ms} = await import("./lib/math.js"),
				      child = ms();
				return math(child).firstChild === child;
			},
			"math with props": async () => {
				const {math} = await import("./lib/math.js");
				return math({"property": "value"}).getAttribute("property") === "value";
			},
			"math with props + child": async () => {
				const {math, ms} = await import("./lib/math.js"),
				      child = ms(),
				      e = math({"property": "value"}, child);
				return e.getAttribute("property") === "value" && e.firstChild === child;
			}
		}
	} : {
		"Not Supported": async () => {
			console.error("MathML not supported, test skipped.");
			return true;
		}
	},
	"conn.js": {
		"HTTPRequest": {
			"GET": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/static").then(data => data === "123");
			},
			"blank GET echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo").then(data => data === "");
			},
			"blank GET data echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo", {"data": "BAD"}).then(data => data === "");
			},
			"blank POST echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo", {"method": "POST"}).then(data => data === "");
			},
			"simple echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo", {"method": "POST", "data": "123"}).then(data => data === "123");
			},
			"JSON number echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest<number>("/echo", {"method": "POST", "data": "123", "response": "json"}).then(data => data === 123);
			},
			"JSON number array echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest<[number, number]>("/echo", {"method": "POST", "data": "[123, 456]", "response": "json"}).then(data => data instanceof Array && data.length === 2 && data[0] === 123 && data[1] === 456);
			},
			"JSON number array echo with checker": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest<[number, number]>("/echo", {"method": "POST", "data": "[123, 456]", "response": "json", "checker": (data: unknown): data is [number, number] => data instanceof Array && data.length === 2 && data[0] === 123 && data[1] === 456}).then(() => true);
			},
			"JSON number array echo with failing checker": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest<[number, number]>("/echo", {"method": "POST", "data": "[123, 456]", "response": "json", "checker": (data: unknown): data is [number, number] => data instanceof Map}).then(() => false).catch(() => true);
			},
			"XML echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo", {"method": "POST", "data": "<xml><elm property=\"value\" /></xml>", "response": "xml"}).then(doc => doc instanceof XMLDocument && doc.children[0] && doc.children[0].localName === "xml" && doc.children[0].children[0] && doc.children[0].children[0].localName === "elm" && doc.children[0].children[0].getAttribute("property") === "value");
			},
			"Text simple echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo", {"method": "POST", "data": "123", "response": "text"}).then(data => data === "123");
			},
			"Blob echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo", {"method": "POST", "data": "123", "response": "blob"}).then(blob => blob.text().then(text => text === "123"));
			},
			"ArrayBuffer echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo", {"method": "POST", "data": "123", "response": "arraybuffer"}).then(ab => ab.byteLength === 3 && new Uint8Array(ab).toString() === "49,50,51");
			},
			"Content-Type override": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo", {"method": "POST", "data": "<xml><elm property=\"value\" /></xml>", "type": "application/xml", "response": "xh"}).then(xh => xh.getResponseHeader("Content-Type") === "application/xml");
			},
			"Document echo": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/echo", {"method": "POST", "data": "<xml><elm property=\"value\" /></xml>", "response": "document", "type": "text/xml"}).then(doc => doc instanceof Document && doc.children[0] && doc.children[0].localName === "xml" && doc.children[0].children[0] && doc.children[0].children[0].localName === "elm" && doc.children[0].children[0].getAttribute("property") === "value");
			},
			"GET request": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/request").then(data => data === `{"method":"GET"}`+"\n");
			},
			"POST request": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/request", {"method": "post"}).then(data => data === `{"method":"POST"}`+"\n");
			},
			"Username/Password": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/request", {"user": "username", "password": "password"}).then(data => data === `{"method":"GET","auth":"Basic ${btoa("username:password")}"}`+"\n");
			},
			"GET string data": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/request?a=123&b=456").then(data => data === `{"method":"GET","form":{"a":["123"],"b":["456"]}}`+"\n");
			},
			"POST string data": async () => {
				const {HTTPRequest} = await import("./lib/conn.js");
				return HTTPRequest("/request", {"method": "post", "data": "123"}).then(data => data === `{"method":"POST","contentType":"text/plain;charset=UTF-8","contentLength":3,"postData":"123"}`+"\n");
			},
			"POST form data": async () => {
				const {HTTPRequest} = await import("./lib/conn.js"),
				      fd = new FormData();
				fd.set("name", "value");
				fd.set("username", "password");
				return HTTPRequest("/request", {"method": "post", "type": "application/x-www-form-urlencoded", "data": new URLSearchParams(fd as any).toString()}).then(data => data === `{"method":"POST","contentType":"application/x-www-form-urlencoded","contentLength":28,"form":{"name":["value"],"username":["password"]},"postForm":{"name":["value"],"username":["password"]}}`+"\n");
			},
			"aborter": async () => {
				const {HTTPRequest} = await import("./lib/conn.js"),
				      ac = new AbortController(),
				      ret = HTTPRequest("/static", {"signal": ac.signal}).then(() => false, () => true);
				ac.abort();
				return ret;
			}
		},
		"WS": {
			"simple echo": async () => {
				const {WS} = await import("./lib/conn.js");
				return WS("/socket").then(ws => {
					let fn = (_b: boolean) => {};
					ws.when(({data}) => fn(data === "123"), () => fn(false));
					ws.send("123");
					return new Promise<boolean>(sFn => fn = sFn);
				});
			},
			"double echo": async () => {
				const {WS} = await import("./lib/conn.js");
				return WS("/socket").then(ws => {
					let fn = (_b: boolean) => {},
					    r = 0,
					    s = 0;
					ws.when(({data}) => {
						r++;
						if (data === "123") {
							s++;
						} else if (data === "456") {
							s *= 2;
						}
						if (r === 2) {
							fn(s === 2)
						}
					}, () => fn(false));
					ws.send("123");
					ws.send("456");
					return new Promise<boolean>(sFn => fn = sFn);
				});
			},
			"error test": async () => {
				const {WS} = await import("./lib/conn.js");
				return WS("/socket-close").then(ws => {
					let fn = (_b: boolean) => {};
					ws.when(() => fn(false), () => fn(true));
					ws.send("123");
					return new Promise<boolean>(sFn => fn = sFn);
				});
			}
		}
	},
	"rpc.js": {
		"static test": async () => {
			const {WS} = await import("./lib/conn.js"),
			      {RPC} = await import("./lib/rpc.js");
			return WS("/rpc").then(ws => new RPC(ws).request("static").then(d => d === "123"));
		},
		"echo test": async () => {
			const {WS} = await import("./lib/conn.js"),
			      {RPC} = await import("./lib/rpc.js");
			return WS("/rpc").then(ws => new RPC(ws).request("echo", "456").then(d => d === "456"));
		},
		"broadcast test": async () => {
			const {WS} = await import("./lib/conn.js"),
			      {RPC} = await import("./lib/rpc.js");
			return WS("/rpc").then(ws => {
				const rpc = new RPC(ws);
				let fn = (_b: boolean) => {},
				    res = 0;
				rpc.await(-1).then(data => res += +(data === "123"));
				rpc.request("broadcast", "123").then(d => {
					if (d) {
						res *= 2;
					}
					fn(res === 2);
				});
				return new Promise<boolean>(sFn => fn = sFn);
			});
		},
		"broadcast test, double recieve": async () => {
			const {WS} = await import("./lib/conn.js"),
			      {RPC} = await import("./lib/rpc.js");
			return WS("/rpc").then(ws => {
				const rpc = new RPC(ws);
				let fn = (_b: boolean) => {},
				    res = 0;
				rpc.await(-1).then(data => res += +(data === "123"));
				rpc.await(-1).then(data => res += +(data === "123"));
				rpc.request("broadcast", "123").then(d => {
					if (d) {
						res *= 2;
					}
					fn(res === 4);
				});
				return new Promise<boolean>(sFn => fn = sFn);
			});
		},
		"broadcast test, subscribed": async () => {
			const {WS} = await import("./lib/conn.js"),
			      {RPC} = await import("./lib/rpc.js");
			return WS("/rpc").then(ws => {
				const rpc = new RPC(ws);
				let fn = (_b: boolean) => {},
				    res = 0;
				rpc.subscribe(-1).when(data => res += +(data === "123"));
				rpc.request("broadcast", "123").then(d => {
					if (d) {
						res *= 2;
					}
					rpc.request("broadcast", "123").then(d => {
						if (d) {
							res *= 2;
						}
						fn(res === 6);
					});
				});
				return new Promise<boolean>(sFn => fn = sFn);
			});
		},
		"endpoint error": async () => {
			const {WS} = await import("./lib/conn.js"),
			      {RPC} = await import("./lib/rpc.js");
			return WS("/rpc").then(ws => new RPC(ws).request("unknown").then(() => false).catch(() => true));
		},
		"close test": async () => {
			const {WS} = await import("./lib/conn.js"),
			      {RPC} = await import("./lib/rpc.js");
			return WS("/rpc").then(ws => new RPC(ws).request("close").then(() => false).catch(() => true));
		},
		"close all test": async () => {
			const {WS} = await import("./lib/conn.js"),
			      {RPC} = await import("./lib/rpc.js");
			return WS("/rpc").then(ws => {
				const rpc = new RPC(ws);
				let res = 0;
				rpc.await(-1).catch(() => res++);
				rpc.await(-2).catch(() => res++);
				return rpc.request("close").then(() => false).catch(() => new Promise<boolean>(sFn => window.setTimeout(() => sFn(res === 2), 0)));
			});
		},
		"queue": async () => {
			const {WS} = await import("./lib/conn.js"),
			      {RPC} = await import("./lib/rpc.js"),
			      rpc = new RPC();

			setTimeout(() => WS("/rpc").then(ws => rpc.reconnect(ws)), 10);

			return rpc.request("echo", "456").then(d => d === "456");
		}
	},
	"bbcode.js": {
		"text": async () => {
			const bbcode = (await import("./lib/bbcode.js")).default;
			let ret = false;
			bbcode({[(await import("./lib/bbcode.js")).text]: (_n: Node, t: string) => ret = t === " "}, " ");
			return ret;
		},
		"long text": async () => {
			const bbcode = (await import("./lib/bbcode.js")).default;
			let ret = false;
			bbcode({[(await import("./lib/bbcode.js")).text]: (_n: Node, t: string) => ret = t === "ABC 123"}, "ABC 123");
			return ret;
		},
		"simple token check": async () => {
			const {default: bbcode, isOpenTag} = await import("./lib/bbcode.js");
			let ret = false;
			bbcode({
				"a": (_n: Node, t: any) => {
					const tk = t.next(true).value;
					if (isOpenTag(tk)) {
						ret = tk.tagName === "a";
					}
				},
				[(await import("./lib/bbcode.js")).text]: (_n: Node, _t: string) => {}
			}, "[a]");
			return ret;
		},
		"simple token with attr check": async () => {
			const {default: bbcode, isOpenTag} = await import("./lib/bbcode.js");
			let ret = false;
			bbcode({
				"a": (_n: Node, t: any) => {
					const tk = t.next(true).value;
					if (isOpenTag(tk)) {
						ret = tk.tagName === "a" && tk.attr === "b";
					}
				},
				[(await import("./lib/bbcode.js")).text]: (_n: Node, _t: string) => {}
			}, "[a=b]");
			return ret;
		},
		"simple token with close check": async () => {
			const {default: bbcode, isCloseTag, isOpenTag} = await import("./lib/bbcode.js");
			let ret = false;
			bbcode({
				"a": (_n: Node, t: any) => {
					let tk = t.next(true).value;
					if (isOpenTag(tk) && tk.tagName === "a") {
						tk = t.next().value;
						if (isCloseTag(tk)) {
							ret = tk.tagName === "d";
						}
					}
				},
				[(await import("./lib/bbcode.js")).text]: (_n: Node, _t: string) => {}
			}, "[a][/d]");
			return ret;
		},
		"simple token with attr and close check": async () => {
			const {default: bbcode, isCloseTag, isOpenTag} = await import("./lib/bbcode.js");
			let ret = false;
			bbcode({
				"a": (_n: Node, t: any) => {
					let tk = t.next(true).value;
					if (isOpenTag(tk) && tk.tagName === "a" && tk.attr === "bc") {
						tk = t.next().value;
						if (isCloseTag(tk)) {
							ret = tk.tagName === "d";
						}
					}
				},
				[(await import("./lib/bbcode.js")).text]: (_n: Node, _t: string) => {}
			}, "[a=bc][/d]");
			return ret;
		},
		"multi-token check": async () => {
			const {default: bbcode, isCloseTag, isOpenTag, isString} = await import("./lib/bbcode.js");
			let ret = false;
			bbcode({
				"a": (_n: Node, t: any) => {
					const checks = [
						[isOpenTag, (tk: any) => tk.tagName === "a" && tk.attr === "bc"],
						[isOpenTag, (tk: any) => tk.tagName === "d"],
						[isOpenTag, (tk: any) => tk.tagName === "e" && tk.attr === "12\n3"],
						[isString, (data: any) => data === "TEXT"],
						[isCloseTag, (tk: any) => tk.tagName === "e"],
						[isString, (data: any) => data === "MORE\nTEXT"],
						[isCloseTag, (tk: any) => tk.tagName === "d"],
						[isCloseTag, (tk: any) => tk.tagName === "a"]
					] as [Function, Function][];
					ret = true;
					for (let tk = t.next(true).value; tk; tk = t.next().value) {
						const [typeCheck, valueCheck] = checks.shift()!;
						ret &&= typeCheck(tk) && valueCheck(tk);
					}
				},
				[(await import("./lib/bbcode.js")).text]: (_n: Node, _t: string) => {}
			}, "[a=bc][d][e=12\n3]TEXT[/e]MORE\nTEXT[/d][/a]");
			return ret;
		},
		"process check": async () => {
			const {default: bbcode, process} = await import("./lib/bbcode.js"),
			      base = {
				[(await import("./lib/bbcode.js")).text]: (_n: Node, _t: string) => {}
			      };
			let ret = 0;
			bbcode(Object.assign({"a": (n: Node, t: any) => process(n, t, Object.assign({"b": () => ret++}, base), "a")}, base), "[b][a][b][b][/a][b]");
			return ret === 2;
		},
		"quoted attr": async () => {
			const {default: bbcode, isOpenTag} = await import("./lib/bbcode.js");
			let ret = false;
			bbcode({
				"a": (_n: Node, t: any) => {
					const checks = [
						[isOpenTag, (tk: any) => tk.tagName === "a" && tk.attr === "bc"],
						[isOpenTag, (tk: any) => tk.tagName === "b" && tk.attr === ""],
						[isOpenTag, (tk: any) => tk.tagName === "c" && tk.attr === "\""],
						[isOpenTag, (tk: any) => tk.tagName === "d" && tk.attr === "]"]
					] as [Function, Function][];
					ret = true;
					for (let tk = t.next(true).value; tk; tk = t.next().value) {
						const [typeCheck, valueCheck] = checks.shift()!;
						ret &&= typeCheck(tk) && valueCheck(tk);
					}
				},
				[(await import("./lib/bbcode.js")).text]: (_n: Node, _t: string) => {}
			}, `[a="bc"][b=""][c="\\""][d="]"]`);
			return ret;
		},
		"isolation": async () => {
			const {default: bbcode, isCloseTag, isOpenTag} = await import("./lib/bbcode.js");
			let ret = false;
			bbcode({
				"a": (_n: Node, t: any) => {
					let tk = t.next(1).value;
					if (!isOpenTag(tk) || tk.tagName !== "a") {
						return;
					}
					t.next();
					tk = t.next(1).value;
					if (!isOpenTag(tk) || tk.tagName !== "b") {
						return;
					}
					t.next();
					tk = t.next(1).value;
					if (!isOpenTag(tk) || tk.tagName !== "b") {
						return;
					}
					t.next();
					tk = t.next(1).value;
					if (!isOpenTag(tk) || tk.tagName !== "c") {
						return;
					}
					tk = t.next().value;
					if (!isOpenTag(tk) || tk.tagName !== "d") {
						return;
					}
					tk = t.next().value;
					if (!isOpenTag(tk) || tk.tagName !== "e") {
						return;
					}
					for (let i = 0; i < 10; i++) {
						if (t.next().value) {
							return;
						}
					}
					tk = t.next(1).value;
					if (!isCloseTag(tk) || tk.tagName !== "c") {
						return;
					}
					tk = t.next().value;
					if (!isOpenTag(tk) || tk.tagName !== "f") {
						return;
					}
					for (let i = 0; i < 10; i++) {
						if (t.next().value) {
							return;
						}
					}
					tk = t.next(1).value;
					if (!isCloseTag(tk) || tk.tagName !== "b") {
						return;
					}
					tk = t.next().value;
					if (!isOpenTag(tk) || tk.tagName !== "g") {
						return;
					}
					tk = t.next().value;
					if (!isOpenTag(tk) || tk.tagName !== "h") {
						return;
					}
					for (let i = 0; i < 10; i++) {
						if (t.next().value) {
							return;
						}
					}
					tk = t.next(1).value;
					if (!isCloseTag(tk) || tk.tagName !== "b") {
						return;
					}
					for (let i = 0; i < 10; i++) {
						if (t.next().value) {
							return;
						}
					}
					tk = t.next(1).value;
					if (!isCloseTag(tk) || tk.tagName !== "a") {
						return;
					}
					tk = t.next().value;
					if (!isOpenTag(tk) || tk.tagName !== "i") {
						return;
					}
					for (let i = 0; i < 10; i++) {
						if (t.next().value) {
							return;
						}
					}
					ret = true;
				},
				[(await import("./lib/bbcode.js")).text]: (_n: Node, _t: string) => {}
			}, `[a][b][b][c][d][e][/c][f][/b][g][h][/b][/a][i]`);
			return ret;
		},
		"good tag after bad tag": async () => {
			const {default: bbcode, isOpenTag, isString} = await import("./lib/bbcode.js");

			let ret = false;

			bbcode({
				"a": (_n: Node, t: any) => {
					const checks = [
						[isOpenTag, (tk: any) => tk.tagName === "a" && tk.attr === null],
						[isString, (data: any) => data === "Some text [b=\"Bad"],
						[isOpenTag, (tk: any) => tk.tagName === "b" && tk.attr === "Good"]
					] as [Function, Function][];

					ret = true;

					for (let tk = t.next(true).value; tk; tk = t.next().value) {
						const [typeCheck, valueCheck] = checks.shift()!;

						ret &&= typeCheck(tk) && valueCheck(tk);
					}
				},
				[(await import("./lib/bbcode.js")).text]: (_n: Node, _t: string) => {}
			}, `[a]Some text [b="Bad[b=Good]`);

			return ret;
		}
	},
	"bbcode_tags.js": {
		"simple tags": {
			"b": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[b]TEXT[/b]").firstElementChild!.outerHTML === `<span style="font-weight: bold">TEXT</span>`;
			},
			"i": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[i]TEXT[/i]").firstElementChild!.outerHTML === `<span style="font-style: italic">TEXT</span>`;
			},
			"u": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[u]TEXT[/u]").firstElementChild!.outerHTML === `<span style="text-decoration: underline">TEXT</span>`;
			},
			"s": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[s]TEXT[/s]").firstElementChild!.outerHTML === `<span style="text-decoration: line-through">TEXT</span>`;
			},
			"left": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[left]TEXT[/left]").firstElementChild!.outerHTML === `<div style="text-align: left">TEXT</div>`;
			},
			"centre": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[centre]TEXT[/centre]").firstElementChild!.outerHTML === `<div style="text-align: center">TEXT</div>`;
			},
			"center": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[center]TEXT[/center]").firstElementChild!.outerHTML === `<div style="text-align: center">TEXT</div>`;
			},
			"right": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[right]TEXT[/right]").firstElementChild!.outerHTML === `<div style="text-align: right">TEXT</div>`;
			},
			"justify": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[justify]TEXT[/justify]").firstElementChild!.outerHTML === `<div style="text-align: justify">TEXT</div>`;
			},
			"full": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[full]TEXT[/full]").firstElementChild!.outerHTML === `<div style="text-align: justify">TEXT</div>`;
			},
			"h1": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[h1]TEXT[/h1]").firstElementChild!.outerHTML === `<h1>TEXT</h1>`;
			},
			"h2": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[h2]TEXT[/h2]").firstElementChild!.outerHTML === `<h2>TEXT</h2>`;
			},
			"h3": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[h3]TEXT[/h3]").firstElementChild!.outerHTML === `<h3>TEXT</h3>`;
			},
			"h4": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[h4]TEXT[/h4]").firstElementChild!.outerHTML === `<h4>TEXT</h4>`;
			},
			"h5": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[h5]TEXT[/h5]").firstElementChild!.outerHTML === `<h5>TEXT</h5>`;
			},
			"h6": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[h6]TEXT[/h6]").firstElementChild!.outerHTML === `<h6>TEXT</h6>`;
			},
			"highlight": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[highlight]TEXT[/highlight]").firstElementChild!.outerHTML === `<mark>TEXT</mark>`;
			}
		},
		"text": {
			"simple text": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[b]TEXT").firstElementChild!.innerHTML === `TEXT`;
			},
			"new line": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[b]\n").firstElementChild!.innerHTML === `<br>`;
			},
			"new lines": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[b]\n\n").firstElementChild!.innerHTML === `<br><br>`;
			},
			"text with lines": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[b]a\nb\nc").firstElementChild!.innerHTML === `a<br>b<br>c`;
			},
			"text with non-tag": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[b]a\n[c]b\nc[/c]").firstElementChild!.innerHTML === `a<br>[c]b<br>c[/c]`;
			}
		},
		"basic tags": {
			"hr": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all} = await import("./lib/bbcode_tags.js");
				return bbcode(all, "[b][hr][/b]").firstElementChild!.innerHTML === `<hr>`;
			},
			"colour": {
				"colour with no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][colour]TEXT[/colour]").firstElementChild!.innerHTML === `[colour]TEXT[/colour]`;
				},
				"colour with short hex": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][colour=#f00]TEXT[/colour]").firstElementChild!.innerHTML === `<span style="color: rgb(255, 0, 0);">TEXT</span>`;
				},
				"colour with long hex": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][colour=#00f]TEXT[/colour]").firstElementChild!.innerHTML === `<span style="color: rgb(0, 0, 255);">TEXT</span>`;
				},
				"colour with colour name": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][colour=green]TEXT[/colour]").firstElementChild!.innerHTML === `<span style="color: green;">TEXT</span>`;
				},
				"colour with rgb": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][colour=rgb(1, 2, 3)]TEXT[/colour]").firstElementChild!.innerHTML === `<span style="color: rgb(1, 2, 3);">TEXT</span>`;
				},
				"colour with rgba": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][colour=rgba(1, 2, 3, 0.4)]TEXT[/colour]").firstElementChild!.innerHTML === `<span style="color: rgba(1, 2, 3, 0.4);">TEXT</span>`;
				},
				"colour with nonsense (XSS)": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][colour=green;123\">]TEXT[/colour]").firstElementChild!.innerHTML === `<span>TEXT</span>`;
				},
				"color with no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][color]TEXT[/color]").firstElementChild!.innerHTML === `[color]TEXT[/color]`;
				},
				"color with short hex": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][color=#f00]TEXT[/color]").firstElementChild!.innerHTML === `<span style="color: rgb(255, 0, 0);">TEXT</span>`;
				},
				"color with long hex": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][color=#00f]TEXT[/color]").firstElementChild!.innerHTML === `<span style="color: rgb(0, 0, 255);">TEXT</span>`;
				},
				"color with colour name": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][color=green]TEXT[/color]").firstElementChild!.innerHTML === `<span style="color: green;">TEXT</span>`;
				},
				"color with rgb": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][color=rgb(1, 2, 3)]TEXT[/color]").firstElementChild!.innerHTML === `<span style="color: rgb(1, 2, 3);">TEXT</span>`;
				},
				"color with rgba": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][color=rgba(1, 2, 3, 0.4)]TEXT[/color]").firstElementChild!.innerHTML === `<span style="color: rgba(1, 2, 3, 0.4);">TEXT</span>`;
				},
				"color with nonsense (XSS)": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][color=green;123\">]TEXT[/color]").firstElementChild!.innerHTML === `<span>TEXT</span>`;
				}
			},
			"size": {
				"size with no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][size]TEXT[/size]").firstElementChild!.innerHTML === `[size]TEXT[/size]`;
				},
				"size with minimum attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][size=1]TEXT[/size]").firstElementChild!.innerHTML === `<span style="font-size: 0.1em;">TEXT</span>`;
				},
				"size with maximum attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][size=100]TEXT[/size]").firstElementChild!.innerHTML === `<span style="font-size: 10em;">TEXT</span>`;
				},
				"size with below minimum attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][size=0]TEXT[/size]").firstElementChild!.innerHTML === `[size=0]TEXT[/size]`;
				},
				"size with above maximum attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][size=101]TEXT[/size]").firstElementChild!.innerHTML === `[size=101]TEXT[/size]`;
				},
				"size with non-integer attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][size=1.1]TEXT[/size]").firstElementChild!.innerHTML === `<span style="font-size: 0.1em;">TEXT</span>`;
				},
				"size with non-number attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][size=size]TEXT[/size]").firstElementChild!.innerHTML === `[size=size]TEXT[/size]`;
				}
			},
			"font": {
				"font with no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][font]TEXT[/font]").firstElementChild!.innerHTML === `[font]TEXT[/font]`;
				},
				"font with font attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][font=arial]TEXT[/font]").firstElementChild!.innerHTML === `<span style="font-family: arial;">TEXT</span>`;
				},
				"font with multiple fonts attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][font=arial, times]TEXT[/font]").firstElementChild!.innerHTML === `<span style="font-family: arial, times;">TEXT</span>`;
				},
				"font with nonsense attr (XSS)": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][font=arial;\"><XSS>]TEXT[/font]").firstElementChild!.innerHTML === `<span>TEXT</span>`;
				}
			},
			"url": {
				"url no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url]TEXT[/url]").firstElementChild!.innerHTML === `<a href="${window.location.origin}/TEXT">TEXT</a>`;
				},
				"url no attr, same protocol": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url]//example.com/test/[/url]").firstElementChild!.innerHTML === `<a href="${window.location.protocol}//example.com/test/">//example.com/test/</a>`;
				},
				"url no attr, full URL": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url]https://example.com/test2/[/url]").firstElementChild!.innerHTML === `<a href="https://example.com/test2/">https://example.com/test2/</a>`;
				},
				"url path attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url=test]TEXT[/url]").firstElementChild!.innerHTML === `<a href="${window.location.origin}/test">TEXT</a>`;
				},
				"url same protocol attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url=//example.com/test/]TEXT[/url]").firstElementChild!.innerHTML === `<a href="${window.location.protocol}//example.com/test/">TEXT</a>`;
				},
				"url full url attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url=https://example.com/test2/]TEXT[/url]").firstElementChild!.innerHTML === `<a href="https://example.com/test2/">TEXT</a>`;
				},
				"url invalid text": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url]//#[/url]").firstElementChild!.innerHTML === `[url]//#[/url]`;
				},
				"url invalid attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url=//#]TEXT[/url]").firstElementChild!.innerHTML === `[url=//#]TEXT[/url]`;
				},
				"url empty attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url=][/url]").firstElementChild!.innerHTML === `[url=][/url]`;
				},
				"url no url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url][/url]").firstElementChild!.innerHTML === `[url][/url]`;
				},
				"url no end tag with attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url=http://example.com/]EXAMPLE").firstElementChild!.innerHTML === `<a href="http://example.com/">EXAMPLE</a>`;
				},
				"url no end tag with no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url]http://example.com").firstElementChild!.innerHTML === `[url]http://example.com`;
				},
				"url with inner tags and attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url=http://example.com][b]BOLD[/b] Text[/url]").firstElementChild!.innerHTML === `<a href="http://example.com/"><span style="font-weight: bold">BOLD</span> Text</a>`;
				},
				"url with inner tags and no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][url][b]BOLD[/b] Text[/url]").firstElementChild!.innerHTML === `<a href="${window.location.origin}/[b]BOLD[/b]%20Text">[b]BOLD[/b] Text</a>`;
				}
			},
			"audio": {
				"audio with path url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][audio]AUDIO[/audio]").firstElementChild!.innerHTML === `<audio src="${window.location.origin}/AUDIO" controls=""></audio>`;
				},
				"audio with same protocol url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][audio]//example.com/AUDIO[/audio]").firstElementChild!.innerHTML === `<audio src="${window.location.protocol}//example.com/AUDIO" controls=""></audio>`;
				},
				"audio with full url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][audio]https://example.com/AUDIO[/audio]").firstElementChild!.innerHTML === `<audio src="https://example.com/AUDIO" controls=""></audio>`;
				},
				"audio with invalid url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][audio]//#[/audio]").firstElementChild!.innerHTML === `[audio]//#[/audio]`;
				},
				"audio with no url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][audio][/audio]").firstElementChild!.innerHTML === `[audio][/audio]`;
				},
				"audio with no end tag": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][audio]https://example.com/AUDIO").firstElementChild!.innerHTML === `[audio]https://example.com/AUDIO`;
				}
			},
			"img": {
				"img with no url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img][/img]").firstElementChild!.innerHTML === `[img][/img]`;
				},
				"img with relative url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE">`;
				},
				"img with same protocol url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img]//example.com/IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.protocol}//example.com/IMAGE">`;
				},
				"img with full url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img]https://example.com/IMAGE[/img]").firstElementChild!.innerHTML === `<img src="https://example.com/IMAGE">`;
				},
				"img with no end tag": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img]https://example.com/IMAGE").firstElementChild!.innerHTML === `[img]https://example.com/IMAGE`;
				},
				"img with invalid url": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img]//#[/url]").firstElementChild!.innerHTML === `[img]//#[/url]`;
				},
				"img with width": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=10]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" width="10">`;
				},
				"img with height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=x10]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" height="10">`;
				},
				"img with width and height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=20x10]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" width="20" height="10">`;
				},
				"img with percentage width": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=10%]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" width="10%">`;
				},
				"img with percentage height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=x10%]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" height="10%">`;
				},
				"img with percentage width and percentage height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=20%x10%]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" width="20%" height="10%">`;
				},
				"img with width and percentage height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=20x10%]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" width="20" height="10%">`;
				},
				"img with percentage width and height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=20%x10]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" width="20%" height="10">`;
				},
				"img with invalid width": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=ax]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE">`;
				},
				"img with invalid height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=xa]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE">`;
				},
				"img with invalid width and invalid height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=axb]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE">`;
				},
				"img with invalid width and valid height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=ax10]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" height="10">`;
				},
				"img with valid width and invalid height": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][img=10xa]IMAGE[/img]").firstElementChild!.innerHTML === `<img src="${window.location.origin}/IMAGE" width="10">`;
				}
			},
			"code": {
				"code with no inner text": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][code][/code]").firstElementChild!.innerHTML === `<pre></pre>`;
				},
				"code with just text": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][code]TEXT[/code]").firstElementChild!.innerHTML === `<pre>TEXT</pre>`;
				},
				"code with text and tags": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][code]TEXT[i]MORE[u]TEXT[/u][/i][/code]").firstElementChild!.innerHTML === `<pre>TEXT[i]MORE[u]TEXT[/u][/i]</pre>`;
				},
				"code with no end tag": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][code]TEXT[i]MORE[u]TEXT[/u][/i]").firstElementChild!.innerHTML === `<pre>TEXT[i]MORE[u]TEXT[/u][/i]</pre>`;
				}
			}
		},
		"complex tags": {
			"quote": {
				"quote empty, no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][quote][/quote]").firstElementChild!.innerHTML === `<fieldset><blockquote></blockquote></fieldset>`;
				},
				"quote just text no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][quote]TEXT[/quote]").firstElementChild!.innerHTML === `<fieldset><blockquote>TEXT</blockquote></fieldset>`;
				},
				"quote with tags no attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][quote]TEXT[code]MORE TEXT[/code][/quote]").firstElementChild!.innerHTML === `<fieldset><blockquote>TEXT<pre>MORE TEXT</pre></blockquote></fieldset>`;
				},
				"quote just text with attr": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][quote=NAME]TEXT[/quote]").firstElementChild!.innerHTML === `<fieldset><legend>NAME</legend><blockquote>TEXT</blockquote></fieldset>`;
				},
				"quote with unfinished tag, testing quote enclosure": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][quote=NAME][i]TEXT[/quote][u]MORE TEXT[/u]").firstElementChild!.innerHTML === `<fieldset><legend>NAME</legend><blockquote><span style="font-style: italic">TEXT</span></blockquote></fieldset><span style="text-decoration: underline">MORE TEXT</span>`;
				},
				"quote with unfinished tags, testing multiple quote enclosure": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][quote]START[quote=NAME][i]TEXT[/quote][u]MORE TEXT[/quote][s]LAST TEXT[/s]").firstElementChild!.innerHTML === `<fieldset><blockquote>START<fieldset><legend>NAME</legend><blockquote><span style="font-style: italic">TEXT</span></blockquote></fieldset><span style="text-decoration: underline">MORE TEXT</span></blockquote></fieldset><span style="text-decoration: line-through">LAST TEXT</span>`;
				}
			},
			"list": {
				"list with no contents": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list][/list]").firstElementChild!.innerHTML === `<ul></ul>`;
				},
				"list with text contents": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list]TEXT[/list]").firstElementChild!.innerHTML === `<ul></ul>`;
				},
				"list with 'a' type": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list=a][/list]").firstElementChild!.innerHTML === `<ol type="a"></ol>`;
				},
				"list with 'A' type": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list=A][/list]").firstElementChild!.innerHTML === `<ol type="A"></ol>`;
				},
				"list with 'i' type": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list=i][/list]").firstElementChild!.innerHTML === `<ol type="i"></ol>`;
				},
				"list with 'I' type": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list=I][/list]").firstElementChild!.innerHTML === `<ol type="I"></ol>`;
				},
				"list with '1' type": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list=1][/list]").firstElementChild!.innerHTML === `<ol type="1"></ol>`;
				},
				"list with invalid type": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list=b][/list]").firstElementChild!.innerHTML === `<ul></ul>`;
				},
				"list with single item": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list][*][/*][/list]").firstElementChild!.innerHTML === `<ul><li></li></ul>`;
				},
				"list with multiple items": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list][*][/*][*][/*][*][/*][/list]").firstElementChild!.innerHTML === `<ul><li></li><li></li><li></li></ul>`;
				},
				"list with multiple items and data": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list][*]TEXT[/*][*][b]BOLD TEXT[/b][/*][*][u]MORE [i]TEXT[/i][/u][/*][/list]").firstElementChild!.innerHTML === `<ul><li>TEXT</li><li><span style="font-weight: bold">BOLD TEXT</span></li><li><span style="text-decoration: underline">MORE <span style="font-style: italic">TEXT</span></span></li></ul>`;
				},
				"list with missing end tag": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list]").firstElementChild!.innerHTML === `<ul></ul>`;
				},
				"list with items and missing end tag": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list][*][/*][*][/*][*][/*]").firstElementChild!.innerHTML === `<ul><li></li><li></li><li></li></ul>`;
				},
				"list with missing item end tags": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list][*][*][*]").firstElementChild!.innerHTML === `<ul><li></li><li></li><li></li></ul>`;
				},
				"list with missing item end tags with data": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][list][*]TEXT[*][b]BOLD TEXT[/b][*][u]MORE [i]TEXT[/i][/u][/list]").firstElementChild!.innerHTML === `<ul><li>TEXT</li><li><span style="font-weight: bold">BOLD TEXT</span></li><li><span style="text-decoration: underline">MORE <span style="font-style: italic">TEXT</span></span></li></ul>`;
				}
			},
			"table": {
				"table tag empty": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][/table]").firstElementChild!.innerHTML === ``;
				},
				"table with empty row": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][tr][/tr][/table]").firstElementChild!.innerHTML === `<table><tbody><tr></tr></tbody></table>`;
				},
				"table with empty cell": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][tr][td][/td][/tr][/table]").firstElementChild!.innerHTML === `<table><tbody><tr><td></td></tr></tbody></table>`;
				},
				"table with missing end row tag": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][tr][td][/td][/table]").firstElementChild!.innerHTML === `<table><tbody><tr><td></td></tr></tbody></table>`;
				},
				"table with missing end cell tag": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][tr][td][/tr][/table]").firstElementChild!.innerHTML === ``;
				},
				"table with missing end cell and row tag": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][tr][td][/table]").firstElementChild!.innerHTML === ``;
				},
				"table with multiple cells": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][tr][td]A[/td][td]B[/td][/tr][/table]").firstElementChild!.innerHTML === `<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>`;
				},
				"table with multiple rows and cells": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][tr][td][h1]A[/h1][/td][td]B[/td][/tr][tr][td]C[/td][td]D[/td][/table]").firstElementChild!.innerHTML === `<table><tbody><tr><td><h1>A</h1></td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>`;
				},
				"table with multiple rows, cells, and header cells": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][tr][th]1st[/th][td][h1]A[/h1][/td][td]B[/td][/tr][tr][th]2nd[/th][td]C[/td][td]D[/td][/table]").firstElementChild!.innerHTML === `<table><tbody><tr><th>1st</th><td><h1>A</h1></td><td>B</td></tr><tr><th>2nd</th><td>C</td><td>D</td></tr></tbody></table>`;
				},
				"table with header": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][thead][tr][th]A[/th][/tr][tr][td]B[/td][/tr][/thead][/table]").firstElementChild!.innerHTML === `<table><thead><tr><th>A</th></tr><tr><td>B</td></tr></thead></table>`;
				},
				"table with footer": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][tfoot][tr][th]A[/th][/tr][tr][td]B[/td][/tr][/tfoot][/table]").firstElementChild!.innerHTML === `<table><tfoot><tr><th>A</th></tr><tr><td>B</td></tr></tfoot></table>`;
				},
				"table with everything": async () => {
					const {default: bbcode} = await import("./lib/bbcode.js"),
					      {all} = await import("./lib/bbcode_tags.js");
					return bbcode(all, "[b][table][thead][tr][th]A[/th][th]B[/th][/tr][/thead][tbody][tr][td]1[/td][td]2[/td][/tr][/tbody][tfoot][tr][td]I[/td][td]II[/td][/tr][/tfoot][/table]").firstElementChild!.innerHTML === `<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody><tfoot><tr><td>I</td><td>II</td></tr></tfoot></table>`;
				}
			}
		},
		"none": {
			"none": async () => {
				const {default: bbcode} = await import("./lib/bbcode.js"),
				      {all, none} = await import("./lib/bbcode_tags.js");
				return bbcode(Object.assign({none}, all), "[b][none]Stuff[hr]More Stuff[/none]").firstElementChild!.innerHTML === `Stuff<hr>More Stuff`;
			}
		}
	},
	"settings.js": {
		"BoolSetting": {
			"get": async () => {
				const {BoolSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_BoolSetting_1";
				let v = new BoolSetting(name).value === false;
				window.localStorage.setItem(name, "");
				v &&= new BoolSetting(name).value === true;
				window.localStorage.removeItem(name);
				v &&= new BoolSetting(name).value === false;
				return v;
			},
			"set": async () => {
				const {BoolSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_BoolSetting_2",
				      bs = new BoolSetting(name);
				let b = bs.value === false && window.localStorage.getItem(name) === null;
				bs.set(false);
				b &&= bs.value === false && window.localStorage.getItem(name) === null;
				bs.set(true);
				b &&= bs.value === true && window.localStorage.getItem(name) === "";
				bs.set(false);
				b &&= bs.value === false && window.localStorage.getItem(name) === null;
				return b;
			},
			"remove": async () => {
				const {BoolSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_BoolSetting_3";
				new BoolSetting(name).set(true).remove();
				return window.localStorage.getItem(name) === null;
			},
			"name": async () => {
				const {BoolSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_BoolSetting_4";
				return new BoolSetting(name).name === name;
			},
			"wait": async () => {
				let num = 0,
				    v = 0;
				const {BoolSetting} = await import("./lib/settings.js"),
				      bs = new BoolSetting("SETTINGS_BoolSetting_5").wait(b => {
					      const needed = num === 2 || num === 5;
					      num++;
					      v += +(b === needed);
				      });
				bs.set(false);
				bs.set(false);
				bs.set(true);
				bs.set(true);
				bs.set(false);
				bs.set(true);
				return v === 3;
			},
			"multi-wait": async () => {
				let numv = 0,
				    numw = 0,
				    v = 0,
				    w = 0;
				const {BoolSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_BoolSetting_6",
				      bs = new BoolSetting(name).wait(b => {
					      const needed = numv === 2 || numv === 5;
					      numv++;
					      v += +(b === needed);
				      }).wait(b => {
					      const needed = numw === 2 || numw === 5;
					      numw++;
					      w += +(b === needed);
				      });
				bs.set(false);
				bs.set(false);
				bs.set(true);
				bs.set(true);
				bs.set(false);
				bs.set(true);
				return v === 3 && w === 3;
			}
		},
		"IntSetting": {
			"get": async () => {
				const {IntSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_IntSetting_1";
				let v = new IntSetting(name).value === 0;
				window.localStorage.setItem(name, "1");
				v &&= new IntSetting(name).value === 1;
				window.localStorage.setItem(name, "2");
				v &&= new IntSetting(name).value === 2;
				window.localStorage.setItem(name, "-3");
				v &&= new IntSetting(name).value === -3;
				window.localStorage.setItem(name, "a");
				v &&= new IntSetting(name).value === 0;
				v &&= new IntSetting(name, 1).value === 1;
				window.localStorage.removeItem(name);
				v &&= new IntSetting(name).value === 0;
				return v;
			},
			"set": async () => {
				const {IntSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_IntSetting_2",
				      is = new IntSetting(name);
				let b = is.value === 0 && window.localStorage.getItem(name) === null;
				is.set(1);
				b &&= is.value === 1 && window.localStorage.getItem(name) === "1";
				is.set(-2);
				b &&= is.value === -2 && window.localStorage.getItem(name) === "-2";
				is.set(0);
				b &&= is.value === 0 && window.localStorage.getItem(name) === "0";
				is.set(0.5);
				b &&= is.value === 0 && window.localStorage.getItem(name) === "0";
				window.localStorage.removeItem(name);
				return b;
			},
			"remove": async () => {
				const {IntSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_IntSetting_3";
				new IntSetting(name).set(1).remove();
				return window.localStorage.getItem(name) === null;
			},
			"name": async () => {
				const {IntSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_IntSetting_4";
				return new IntSetting(name).name === name;
			},
			"wait": async () => {
				let num = 0,
				    v = 0;
				const {IntSetting} = await import("./lib/settings.js"),
				      is = new IntSetting("SETTINGS_IntSetting_5").wait(i => {
					const r = num++;
					if (r&1) {
						v += +(i === r);
					} else {
						v += +(i === -r);
					}
				      });
				is.set(1);
				is.set(-2);
				is.set(3);
				is.remove();
				return v === 4;
			},
			"multi-wait": async () => {
				let numv = 0,
				    numw = 0,
				    v = 0,
				    w = 0;
				const {IntSetting} = await import("./lib/settings.js"),
				      is = new IntSetting("SETTINGS_IntSetting_6").wait(i => {
					const r = numv++;
					if (r&1) {
						v += +(i === r);
					} else {
						v += +(i === -r);
					}
				      }).wait(i => {
					const r = numw++;
					if (r&1) {
						w += +(i === r);
					} else {
						w += +(i === -r);
					}
				      });
				is.set(1);
				is.set(-2);
				is.set(3);
				is.remove();
				return v === 4 && w === 4;
			},
			"min/max": async () => {
				const {IntSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_IntSetting_7";
				window.localStorage.setItem(name, "1");
				let v = new IntSetting(name, -1, -10, 5).value === 1;
				v &&= new IntSetting(name, 3, 2, 10).value === 3;
				v &&= new IntSetting(name, -1, -2, 0).value === -1;
				v &&= new IntSetting(name, 0, -1, 1).set(2).value === 1;
				v &&= new IntSetting(name, 0, -1, 1).set(0.5).value === 1;
				window.localStorage.removeItem(name);
				return v;
			}
		},
		"NumberSetting": {
			"get": async () => {
				const {NumberSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_NumberSetting_1";
				let v = new NumberSetting(name).value === 0;
				window.localStorage.setItem(name, "1");
				v &&= new NumberSetting(name).value === 1;
				window.localStorage.setItem(name, "2.5");
				v &&= new NumberSetting(name).value === 2.5;
				window.localStorage.setItem(name, "-3.1");
				v &&= new NumberSetting(name).value === -3.1;
				window.localStorage.setItem(name, "a");
				v &&= new NumberSetting(name).value === 0;
				v &&= new NumberSetting(name, 1).value === 1;
				window.localStorage.removeItem(name);
				v &&= new NumberSetting(name).value === 0;
				return v;
			},
			"set": async () => {
				const {NumberSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_NumberSetting_2",
				      ns = new NumberSetting(name);
				let b = ns.value === 0 && window.localStorage.getItem(name) === null;
				ns.set(1);
				b &&= ns.value === 1 && window.localStorage.getItem(name) === "1";
				ns.set(-2);
				b &&= ns.value === -2 && window.localStorage.getItem(name) === "-2";
				ns.set(0);
				b &&= ns.value === 0 && window.localStorage.getItem(name) === "0";
				ns.set(0.5);
				b &&= ns.value === 0.5 && window.localStorage.getItem(name) === "0.5";
				window.localStorage.removeItem(name);
				return b;
			},
			"remove": async () => {
				const {NumberSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_NumberSetting_3";
				new NumberSetting(name).set(1).remove();
				return window.localStorage.getItem(name) === null;
			},
			"name": async () => {
				const {NumberSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_NumberSetting_4";
				return new NumberSetting(name).name === name;
			},
			"wait": async () => {
				let num = 0,
				    v = 0;
				const {NumberSetting} = await import("./lib/settings.js"),
				      ns = new NumberSetting("SETTINGS_IntSetting_5", -0.5).wait(i => {
					const r = num++;
					if (r&1) {
						v += +(i === r + 0.5);
					} else {
						v += +(i === -r - 0.5);
					}
				      });
				ns.set(1.5);
				ns.set(-2.5);
				ns.set(3.5);
				ns.remove();
				return v === 4;
			},
			"multi-wait": async () => {
				let numv = 0,
				    numw = 0,
				    v = 0,
				    w = 0;
				const {NumberSetting} = await import("./lib/settings.js"),
				      ns = new NumberSetting("SETTINGS_NumberSetting_6", -0.5).wait(i => {
					const r = numv++;
					if (r&1) {
						v += +(i === r + 0.5);
					} else {
						v += +(i === -r - 0.5);
					}
				      }).wait(i => {
					const r = numw++;
					if (r&1) {
						w += +(i === r + 0.5);
					} else {
						w += +(i === -r - 0.5);
					}
				      });
				ns.set(1.5);
				ns.set(-2.5);
				ns.set(3.5);
				ns.remove();
				return v === 4 && w === 4;
			},
			"min/max": async () => {
				const {NumberSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_NumberSetting_7";
				window.localStorage.setItem(name, "1.5");
				let v = new NumberSetting(name, -1, -10, 5).value === 1.5;
				v &&= new NumberSetting(name, 3.5, 2, 10).value === 3.5;
				v &&= new NumberSetting(name, -1, -2, 0).value === -1;
				v &&= new NumberSetting(name, 0, -1, 2).set(2.5).value === 1.5;
				v &&= new NumberSetting(name, 0, -1, 1).set(0.5).value === 0.5;
				window.localStorage.removeItem(name);
				return v;
			}
		},
		"StringSetting": {
			"get": async () => {
				const {StringSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_StringSetting_1";
				let v = new StringSetting(name).value === "";
				window.localStorage.setItem(name, "A");
				v &&= new StringSetting(name).value === "A";
				window.localStorage.removeItem(name);
				v &&= new StringSetting(name).value === "";
				return v;
			},
			"set": async () => {
				const {StringSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_StringSetting_2",
				      ss = new StringSetting(name);
				let b = ss.value === "" && window.localStorage.getItem(name) === null;
				ss.set("");
				b &&= ss.value === "" && window.localStorage.getItem(name) === null;
				ss.set("A");
				b &&= ss.value === "A" && window.localStorage.getItem(name) === "A";
				ss.set("B");
				b &&= ss.value === "B" && window.localStorage.getItem(name) === "B";
				ss.set("");
				b &&= ss.value === "" && window.localStorage.getItem(name) === "";
				window.localStorage.removeItem(name);
				return b;
			},
			"remove": async () => {
				const {StringSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_StringSetting_3";
				new StringSetting(name).set("A").remove();
				return window.localStorage.getItem(name) === null;
			},
			"name": async () => {
				const {StringSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_StringSetting_4";
				return new StringSetting(name).name === name;
			},
			"wait": async () => {
				let num = 0,
				    v = 0;
				const {StringSetting} = await import("./lib/settings.js"),
				      ss = new StringSetting("SETTINGS_StringSetting_5").wait(s => {
					      v += +(s === (num ? String.fromCharCode(num + 64) : ""));
					      num++;
				      });
				ss.set("A");
				ss.set("B");
				ss.set("C");
				ss.set("D");
				ss.set("E");
				ss.set("F");
				ss.remove();
				return v === 7;
			},
			"multi-wait": async () => {
				let numv = 0,
				    numw = 0,
				    v = 0,
				    w = 0;
				const {StringSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_StringSetting_6",
				      ss = new StringSetting(name).wait(s => {
					      v += +(s === (numv ? String.fromCharCode(numv + 64) : ""));
					      numv++;
				      }).wait(s => {
					      w += +(s === (numw ? String.fromCharCode(numw + 64) : ""));
					      numw++;
				      });
				ss.set("A");
				ss.set("B");
				ss.set("C");
				ss.set("D");
				ss.set("E");
				ss.set("F");
				ss.remove();
				return v === 7 && w === 7;
			}
		},
		"JSONSetting": {
			"get": async () => {
				const {JSONSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_JSONSetting_1",
				      def = {"A": 1},
				      check = (o: any): o is typeof def => o instanceof Object && typeof o.A === "number";
				let v = new JSONSetting(name, def, check).value.A === 1;
				window.localStorage.setItem(name, "{\"A\":2}");
				v &&= new JSONSetting(name, def, check).value.A === 2;
				window.localStorage.setItem(name, "{\"B\":2}");
				v &&= new JSONSetting(name, def, check).value.A === 1;
				window.localStorage.setItem(name, "{\"A\":3}");
				v &&= new JSONSetting(name, def, check).value.A === 3;
				window.localStorage.removeItem(name);
				v &&= new JSONSetting(name, def, check).value.A === 1;
				return v;
			},
			"set": async () => {
				type O = {
					A: number;
				}
				const {JSONSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_JSONSetting_2",
				      ss = new JSONSetting(name, {"A": 1} as O, (o: any): o is O => o instanceof Object && typeof o.A === "number");
				let b = ss.value.A === 1 && window.localStorage.getItem(name) === null;
				ss.set({"A": 1});
				b &&= ss.value.A === 1 && window.localStorage.getItem(name) === "{\"A\":1}";
				ss.set({"A": 2});
				b &&= ss.value.A === 2 && window.localStorage.getItem(name) === "{\"A\":2}";
				window.localStorage.removeItem(name);
				return b;
			},
			"remove": async () => {
				type O = {
					A: number;
				}
				const {JSONSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_JSONSetting_3";
				new JSONSetting(name, {"A": 1} as O, (o: any): o is O => o instanceof Object && typeof o.A === "number").set({"A": 2}).remove();;
				return window.localStorage.getItem(name) === null;
			},
			"name": async () => {
				type O = {
					A: number;
				}
				const {JSONSetting} = await import("./lib/settings.js"),
				      name = "SETTINGS_JSONSetting_4";
				return new JSONSetting(name, {"A": 1} as O, (o: any): o is O => o instanceof Object && typeof o.A === "number").name === name;
			},
			"wait": async () => {
				type O = {
					A: number;
				}
				let num = 0,
				    v = 0;
				const {JSONSetting} = await import("./lib/settings.js"),
				      js = new JSONSetting("SETTINGS_JSONSetting_5", {"A": 1}, (o: any): o is O => o instanceof Object && typeof o.A === "number").wait(o => v += +(o.A === ++num));
				js.set({"A": 2});
				js.set({"A": 3});
				js.set({"A": 4});
				js.set({"A": 5});
				js.remove();
				return v === 5;
			},
			"multi-wait": async () => {
				type O = {
					A: number;
				}
				let numv = 0,
				    numw = 0,
				    v = 0,
				    w = 0;
				const {JSONSetting} = await import("./lib/settings.js"),
				      js = new JSONSetting("SETTINGS_JSONSetting_5", {"A": 1}, (o: any): o is O => o instanceof Object && typeof o.A === "number").wait(o => v += +(o.A === ++numv)).wait(o => w += +(o.A === ++numw));
				js.set({"A": 2});
				js.set({"A": 3});
				js.set({"A": 4});
				js.set({"A": 5});
				js.remove();
				return v === 5 && w === 5;
			}
		}
	},
	"drag.js": {
		"DragTransfer": {
			"register": async () => {
				const {DragTransfer} = await import("./lib/drag.js"),
				      dt = new DragTransfer<number>(""),
				      t = {"transfer": () => 1};
				return dt.register(t) === "0" && dt.register(t) === "1" && dt.register(t) === "2";
			},
			"register fn": async () => {
				const {DragTransfer} = await import("./lib/drag.js"),
				      dt = new DragTransfer<number>(""),
				      t = () => 1;
				return dt.register(t) === "0" && dt.register(t) === "1" && dt.register(t) === "2";
			},
			"get": async () => {
				const {DragTransfer} = await import("./lib/drag.js"),
				      dt = new DragTransfer<number>(""),
				      k1 = dt.register({"transfer": () => 1}),
				      k2 = dt.register({"transfer": () => 2}),
				      preventDefault = () => {};
				return dt.get({"dataTransfer": {"getData": () => k1}, preventDefault} as any as DragEvent) === 1 && dt.get({"dataTransfer": {"getData": () => k2}, preventDefault} as any as DragEvent) === 2 && dt.get({"dataTransfer": {"getData": () => ""}, preventDefault} as any as DragEvent) === undefined;
			},
			"get fns": async () => {
				const {DragTransfer} = await import("./lib/drag.js"),
				      dt = new DragTransfer<number>(""),
				      k1 = dt.register(() => 1),
				      k2 = dt.register(() => 2),
				      preventDefault = () => {};
				return dt.get({"dataTransfer": {"getData": () => k1}, preventDefault} as any as DragEvent) === 1 && dt.get({"dataTransfer": {"getData": () => k2}, preventDefault} as any as DragEvent) === 2 && dt.get({"dataTransfer": {"getData": () => ""}, preventDefault} as any as DragEvent) === undefined;
			},
			"set": async () => {
				const {DragTransfer} = await import("./lib/drag.js"),
				      dt = new DragTransfer<number>(""),
				      e = {"dataTransfer": {"setData": () => ret++, "setDragImage": () => ret *= 3}} as any as DragEvent;
				let ret = 0;
				dt.set(e, "");
				dt.set(e, "", document.createElement("div"));
				return ret === 6;
			},
			"deregister": async () => {
				const {DragTransfer} = await import("./lib/drag.js"),
				      dt = new DragTransfer<number>(""),
				      k = dt.register({"transfer": () => 1}),
				      e = {"dataTransfer": {"getData": () => k}, "preventDefault": () => {}} as any as DragEvent,
				      v = +(dt.get(e) === 1) + +(dt.get(e) === 1);
				dt.deregister(k);
				return v === 2 && dt.get(e) === undefined;
			},
			"is": async () => {
				const {DragTransfer} = await import("./lib/drag.js"),
				      dt1 = new DragTransfer("A"),
				      dt2 = new DragTransfer("B"),
				      e = {"dataTransfer": {"types": ["A"]}} as any as DragEvent;
				return dt1.is(e) && !dt2.is(e);
			}
		},
		"DragFiles": {
			"asForm": async () => {
				const {DragFiles} = await import("./lib/drag.js"),
				      file1 = new File(["A"], "a.txt"),
				      file2 = new File(["B"], "b.tst"),
				      f = new DragFiles("text/plain").asForm({"dataTransfer": {"files": [file1, file2]}, "preventDefault": () => {}} as any as DragEvent, "field"),
				      fd = f.getAll("field");
				return fd[0] === file1 && fd[1] === file2;
			},
			"is": async () => {
				const {DragFiles} = await import("./lib/drag.js"),
				      f = new DragFiles("text/plain", "some/mime");
				return f.is({"dataTransfer": {"types": ["Files"], "items": [{"kind": "file", "type": "text/plain"}]}} as any as DragEvent) &&
				       f.is({"dataTransfer": {"types": ["Files"], "items": [{"kind": "file", "type": "some/mime"}]}} as any as DragEvent) &&
				       f.is({"dataTransfer": {"types": ["Files"], "items": [{"kind": "file", "type": "text/plain"}, {"kind": "file", "type": "some/mime"}]}} as any as DragEvent) &&
				       !f.is({"dataTransfer": {"types": ["Tiles"], "items": []}} as any as DragEvent) &&
				       !f.is({"dataTransfer": {"types": ["Tiles"], "items": [{"kind": "file", "type": "text/plain"}]}} as any as DragEvent) &&
				       !f.is({"dataTransfer": {"types": ["Files"], "items": [{"kind": "file", "type": "text/plain"}, {"kind": "file", "type": "not/some/mime"}]}} as any as DragEvent) &&
				       !f.is({"dataTransfer": {"types": ["Files"], "items": [{"kind": "tile", "type": "text/plain"}]}} as any as DragEvent);
			}
		},
		"setDragEffect": {
			"setDragEffect": async () => {
				const {DragFiles, DragTransfer, setDragEffect} = await import("./lib/drag.js"),
				      fn = setDragEffect({"link": [new DragFiles("text/plain"), new DragTransfer("A")], "copy": [new DragTransfer("B")]});
				let icon = "",
				    v = 0;
				v += +(fn({"preventDefault": () => {}, "dataTransfer": {set dropEffect(e: string) {icon = e}, "types": ["Files"], "items": [{"kind": "file", "type": "text/plain"}]}} as any as DragEvent) && icon === "link");
				icon = "";
				v += +(!fn({"preventDefault": () => {}, "dataTransfer": {set dropEffect(e: string) {icon = e}, "types": ["Tiles"], "items": [{"kind": "file", "type": "text/plain"}]}} as any as DragEvent) && icon === "");
				v += +(fn({"preventDefault": () => {}, "dataTransfer": {set dropEffect(e: string) {icon = e}, "types": ["A"], "items": []}} as any as DragEvent) && icon === "link");
				icon = "";
				v += +(fn({"preventDefault": () => {}, "dataTransfer": {set dropEffect(e: string) {icon = e}, "types": ["B"], "items": []}} as any as DragEvent) && icon === "copy");
				icon = "";
				v += +(!fn({"preventDefault": () => {}, "dataTransfer": {set dropEffect(e: string) {icon = e}, "types": ["C"], "items": []}} as any as DragEvent) && icon === "");
				return v === 5;
			}
		}
	},
	"events.js": {
		"mouseX/mouseY": {
			"mouse coords": async () => {
				const m = await import("./lib/events.js");
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 100, "clientY": 100}));
				let {mouseX, mouseY} = m;
				if (mouseX !== 100 || mouseY !== 100) {
					return false;
				}
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 9000, "clientY": 3000}));
				({mouseX, mouseY} = m);
				if (mouseX !== 9000 || mouseY !== 3000) {
					return false;
				}
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 0, "clientY": 0}));
				({mouseX, mouseY} = m);
				return mouseX === 0 && mouseY === 0;
			}
		},
		"keyEvent": {
			"single key keyEvent": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom1",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop();
				return res === 3;
			},
			"single key keyEvent (after stop)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom2",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				return res === 3;
			},
			"single key keyEvent (no stop)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom3",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop(false);
				return res === 1;
			},
			"single key keyEvent (double down)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom4",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop();
				return res === 3;
			},
			"single key keyEvent (double stop)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom5",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop();
				stop();
				return res === 3;
			},
			"single key keyEvent (with up)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom6",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				stop();
				return res === 3;
			},
			"single key keyEvent (multiple times)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom7",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop();
				return res === 12;
			},
			"single key keyEvent (multiple times with once)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom8",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3, true);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop();
				return res === 3;
			},
			"single key keyEvent (restarted)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom9",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3, true);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop();
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop();
				return res === 12;
			},
			"multi key keyEvent": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom10",
				      key2 = "Custom11",
				      [start, stop] = keyEvent([key, key2], () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				stop();
				return res === 3;
			},
			"multi key keyEvent (other key)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom12",
				      key2 = "Custom13",
				      [start, stop] = keyEvent([key, key2], () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {"key": key2}));
				stop();
				return res === 3;
			},
			"multi key keyEvent (both keys)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom14",
				      key2 = "Custom15",
				      [start, stop] = keyEvent([key, key2], () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {"key": key2}));
				stop();
				return res === 18;
			},
			"single key keyEvent (with blur)": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom16",
				      [start, stop] = keyEvent(key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				window.dispatchEvent(new FocusEvent("blur"));
				stop(false);
				return res === 3;
			},
			"change key": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom28",
				      newKey = "Custom29",
				      [start, stop, change] = keyEvent(key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {"key": newKey}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				change(newKey);
				window.dispatchEvent(new KeyboardEvent("keydown", {"key": newKey}));
				stop();
				return res === 12;
			}
		},
		"key combinations": {
			"Ctrl+ single key keyEvent": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom20",
				      [start, stop] = keyEvent("Ctrl+"+key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, ctrlKey: false}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, ctrlKey: true}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, ctrlKey: false}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				return res === 3;
			},
			"Shift+": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom21",
				      [start, stop] = keyEvent("Shift+"+key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, shiftKey: true}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, shiftKey: false}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, shiftKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				stop(false);
				return res === 12;
			},
			"Alt+": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom22",
				      [start, stop] = keyEvent("Alt+"+key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: true}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: false}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: false}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				return res === 3;
			},
			"Meta+": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom23",
				      [start, stop] = keyEvent("Meta+"+key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, metaKey: true}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, metaKey: true}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, metaKey: false}));
				stop();
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				return res === 12;
			},
			"All mods": async () => {
				let res = 0;
				const {keyEvent} = await import("./lib/events.js"),
				      key = "Custom24",
				      [start, stop] = keyEvent("Alt+Control+Shift+Super+"+key, () => res++, () => res *= 3);
				start();
				window.dispatchEvent(new KeyboardEvent("keydown", {key, metaKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key, shiftKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key, ctrlKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: true, ctrlKey: true, metaKey: true, shiftKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: true, metaKey: true, shiftKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: true, ctrlKey: true, metaKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: true, ctrlKey: true, metaKey: true, shiftKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: true, ctrlKey: true, metaKey: true, shiftKey: true}));
				window.dispatchEvent(new KeyboardEvent("keyup", {key}));
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: true, ctrlKey: true, metaKey: true, shiftKey: true}));
				stop(false);
				window.dispatchEvent(new KeyboardEvent("keydown", {key, altKey: true, ctrlKey: true, metaKey: true, shiftKey: true}));
				return res === 40;
			}
		},
		"mouseMoveEvent": {
			"move": async () => {
				let res = 0;
				const {mouseMoveEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseMoveEvent((e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, () => res++);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 10, "clientY": 4}));
				stop();
				return res === 60;
			},
			"move (no stop run)": async () => {
				let res = 0;
				const {mouseMoveEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseMoveEvent((e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, () => res++);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 10, "clientY": 4}));
				stop(false);
				return res === 59;
			},
			"move (multi-start)": async () => {
				let res = 0;
				const {mouseMoveEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseMoveEvent((e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, () => res++);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				stop();
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				stop(false);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 10, "clientY": 4}));
				stop();
				return res === 61;
			},
			"move (with blur)": async () => {
				let res = 0;
				const {mouseMoveEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseMoveEvent((e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, () => res++);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 10, "clientY": 4}));
				window.dispatchEvent(new FocusEvent("blur"));
				stop(false);
				return res === 60;
			}
		},
		"mouseDragEvent": {
			"drag 0": async () => {
				let res = 0;
				const {mouseDragEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseDragEvent(0, (e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, (e: MouseEvent) => res += 5 * e.clientX + 7 * e.clientY);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				stop();
				return res === 73;
			},
			"drag 1": async () => {
				let res = 0;
				const {mouseDragEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseDragEvent(1, (e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, (e: MouseEvent) => res += 5 * e.clientX + 7 * e.clientY);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				stop();
				return res === 73;
			},
			"drag 2": async () => {
				let res = 0;
				const {mouseDragEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseDragEvent(2, (e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, (e: MouseEvent) => res += 5 * e.clientX + 7 * e.clientY);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				stop();
				return res === 73;
			},
			"drag 0 (without stop)": async () => {
				let res = 0;
				const {mouseDragEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseDragEvent(0, (e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, (e: MouseEvent) => res += 5 * e.clientX + 7 * e.clientY);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				stop(false);
				return res === 27;
			},
			"drag 0 (with mouseup)": async () => {
				let res = 0;
				const {mouseDragEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseDragEvent(0, (e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, (e: MouseEvent) => res += 5 * e.clientX + 7 * e.clientY);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				window.dispatchEvent(new MouseEvent("mouseup", {"button": 1, "clientX": 15, "clientY": 5}));
				window.dispatchEvent(new MouseEvent("mouseup", {"button": 2, "clientX": 20, "clientY": 6}));
				window.dispatchEvent(new MouseEvent("mouseup", {"button": 0, "clientX": 10, "clientY": 4}));
				stop(false);
				return res === 105;
			},
			"drag 0 (with multiple mouseup)": async () => {
				let res = 0;
				const {mouseDragEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseDragEvent(0, (e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, (e: MouseEvent) => res += 5 * e.clientX + 7 * e.clientY);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				window.dispatchEvent(new MouseEvent("mouseup", {"button": 0, "clientX": 10, "clientY": 4}));
				window.dispatchEvent(new MouseEvent("mouseup", {"button": 1, "clientX": 15, "clientY": 5}));
				window.dispatchEvent(new MouseEvent("mouseup", {"button": 2, "clientX": 20, "clientY": 6}));
				window.dispatchEvent(new MouseEvent("mouseup", {"button": 0, "clientX": 25, "clientY": 7}));
				stop(false);
				return res === 105;
			},
			"drag 0 (with multiple start)": async () => {
				let res = 0;
				const {mouseDragEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseDragEvent(0, (e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, (e: MouseEvent) => res += 5 * e.clientX + 7 * e.clientY);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				stop(false);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				stop();
				return res === 73;
			},
			"drag 0 (with post stop event)": async () => {
				let res = 0;
				const {mouseDragEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseDragEvent(0, (e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, (e: MouseEvent) => res += 5 * e.clientX + 7 * e.clientY);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				stop();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 10, "clientY": 4}));
				return res === 73;
			},
			"drag 0 (with blur)": async () => {
				let res = 0;
				const {mouseDragEvent} = await import("./lib/events.js"),
				      [start, stop] = mouseDragEvent(0, (e: MouseEvent) => res += 2 * e.clientX + 3 * e.clientY, (e: MouseEvent) => res += 5 * e.clientX + 7 * e.clientY);
				start();
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 1, "clientY": 2}));
				window.dispatchEvent(new MouseEvent("mousemove", {"clientX": 5, "clientY": 3}));
				window.dispatchEvent(new FocusEvent("blur"));
				stop(false);
				return res === 73;
			}
		},
		"hasKeyEvent": {
			"hasKeyEvent": async () => {
				let res = 0;
				const {hasKeyEvent, keyEvent} = await import("./lib/events.js"),
				      key1 = "Custom17",
				      [start1, stop1] = keyEvent(key1, () => {}),
				      key2 = "Custom18",
				      [start2, stop2] = keyEvent(key2, undefined, () => {}),
				      key3 = "Custom19",
				      [start3, stop3] = keyEvent(key2, () => {}, () => {});
				start1();
				start2();
				start3();
				res += +(hasKeyEvent(key1));
				res += +(hasKeyEvent(key2));
				res += +(hasKeyEvent(key3));
				stop1();
				res += +(!hasKeyEvent(key1));
				stop2();
				res += +(!hasKeyEvent(key2));
				stop3();
				res += +(!hasKeyEvent(key3));
				return res === 4;
			},
			"hasKeyEvent + mods": async () => {
				let res = 0;
				const {hasKeyEvent, keyEvent} = await import("./lib/events.js"),
				      key1 = "Custom25",
				      [start1, stop1] = keyEvent(key1, () => {}),
				      key2 = "Custom26",
				      [start2, stop2] = keyEvent(key2, undefined, () => {}),
				      key3 = "Custom27",
				      [start3, stop3] = keyEvent("Ctrl+"+key2, () => {}, () => {});
				start1();
				start2();
				start3();
				res += +(hasKeyEvent(key1));
				res += +(hasKeyEvent(key2));
				res += +(hasKeyEvent(key3));
				stop1();
				res += +(!hasKeyEvent(key1));
				stop2();
				res += +(!hasKeyEvent(key2));
				stop3();
				res += +(!hasKeyEvent(key3));
				res *= 2;
				start3();
				res += +(hasKeyEvent("Ctrl+"+key2));
				stop3();
				return res === 11;
			}
		}
	},
	"fraction.js": {
		"comparison": {
			"0 == 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.cmp(Fraction.zero) === 0;
			},
			"1 == 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.cmp(Fraction.one) === 0;
			},
			"0 < 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.cmp(Fraction.one) === -1;
			},
			"1 > 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.cmp(Fraction.zero) === 1;
			},
			"2 == 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n).cmp(new Fraction(2n)) === 0;
			},
			"1 < 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.cmp(new Fraction(2n)) === -1;
			},
			"2 > 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n).cmp(Fraction.one) === 1;
			},
			"-1 < 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).cmp(Fraction.one) === -1;
			},
			"1 > -1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.cmp(new Fraction(-1n)) === 1;
			},
			"1 == 2/2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.cmp(new Fraction(2n, 2n)) === 0;
			},
			"2 == 6/3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n).cmp(new Fraction(6n, 3n)) === 0;
			},
			"-3 == -12/4": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-3n).cmp(new Fraction(-12n, 4n)) === 0;
			},
			"3 == -12/-4": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(3n).cmp(new Fraction(-12n, -4n)) === 0;
			},
			"1 ~= NaN": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return isNaN(Fraction.one.cmp(Fraction.NaN));
			},
			"NaN ~= 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return isNaN(Fraction.NaN.cmp(Fraction.one));
			}
		},
		"isNaN": {
			"NaN": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.NaN.isNaN();
			},
			"0 / 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(0n, 0n).isNaN();
			},
			"1 / 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 0n).isNaN();
			},
			"2 / 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n, 0n).isNaN();
			},
			"-1 / 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n, 0n).isNaN();
			}
		},
		"sign": {
			"0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.sign() === 0;
			},
			"1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.sign() === 1;
			},
			"2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n).sign() === 1;
			},
			"3/2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(3n, 2n).sign() === 1;
			},
			"-1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).sign() === -1;
			},
			"-2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-2n).sign() === -1;
			},
			"-3/2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-3n, 2n).sign() === -1;
			},
			"3/-2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(3n, -2n).sign() === -1;
			},
			"-3/-2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-3n, -2n).sign() === 1;
			}
		},
		"Symbol.toPrimitive": {
			"number": {
				"0": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +Fraction.zero === 0;
				},
				"1": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +Fraction.one === 1;
				},
				"NaN": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return isNaN(+Fraction.NaN);
				},
				"-1": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +new Fraction(-1n) === -1;
				},
				"1/2": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +new Fraction(1n, 2n) === 0.5;
				},
				"2/4": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +new Fraction(2n, 4n) === 0.5;
				},
				"1/10": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +new Fraction(1n, 10n) === 0.1;
				},
				"30/3": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +new Fraction(30n, 3n) === 10;
				},
				"-1/2": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +new Fraction(-1n, 2n) === -0.5;
				},
				"2/-4": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +new Fraction(2n, -4n) === -0.5;
				},
				"-1/10": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +new Fraction(-1n, 10n) === -0.1;
				},
				"30/-3": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return +new Fraction(30n, -3n) === -10;
				}
			},
			"string": {
				"0": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return Fraction.zero + "" === "0";
				},
				"1": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return Fraction.one + "" === "1";
				},
				"NaN": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return Fraction.NaN + "" === "NaN";
				},
				"-1": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return new Fraction(-1n) + "" === "-1";
				},
				"1/2": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return new Fraction(1n, 2n) + "" === "1 / 2";
				},
				"2/4": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return new Fraction(2n, 4n) + "" === "2 / 4";
				},
				"1/10": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return new Fraction(1n, 10n) + "" === "1 / 10";
				},
				"30/3": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return new Fraction(30n, 3n) + "" === "30 / 3";
				},
				"-1/2": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return new Fraction(-1n, 2n) + "" === "-1 / 2";
				},
				"2/-4": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return new Fraction(2n, -4n) + "" === "-2 / 4";
				},
				"-1/10": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return new Fraction(-1n, 10n) + "" === "-1 / 10";
				},
				"30/-3": async () => {
					const {default: Fraction} = await import("./lib/fraction.js");
					return new Fraction(30n, -3n) + "" === "-30 / 3";
				}
			}
		},
		"add": {
			"0 + 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.add(Fraction.zero).cmp(Fraction.zero) === 0;
			},
			"0 + 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.add(Fraction.one).cmp(Fraction.one) === 0;
			},
			"1 + 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.add(Fraction.zero).cmp(Fraction.one) === 0;
			},
			"1 + 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.add(Fraction.one).cmp(new Fraction(2n)) === 0;
			},
			"1 + 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.add(new Fraction(2n)).cmp(new Fraction(3n)) === 0;
			},
			"-1 + 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).add(new Fraction(2n)).cmp(Fraction.one) === 0;
			},
			"-1 + -2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).add(new Fraction(-2n)).cmp(new Fraction(-3n)) === 0;
			},
			"1/2 + 1/2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).add(new Fraction(1n, 2n)).cmp(Fraction.one) === 0;
			},
			"1/2 + 1/3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).add(new Fraction(1n, 3n)).cmp(new Fraction(5n, 6n)) === 0;
			},
			"1/2 + 1/-3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).add(new Fraction(1n, -3n)).cmp(new Fraction(1n, 6n)) === 0;
			},
			"2/3 + 2/5": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n, 3n).add(new Fraction(2n, 5n)).cmp(new Fraction(16n, 15n)) === 0;
			}
		},
		"sub": {
			"0 - 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.sub(Fraction.zero).cmp(Fraction.zero) === 0;
			},
			"0 - 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.sub(Fraction.one).cmp(new Fraction(-1n)) === 0;
			},
			"1 - 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.sub(Fraction.zero).cmp(Fraction.one) === 0;
			},
			"1 - 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.sub(Fraction.one).cmp(Fraction.zero) === 0;
			},
			"1 - 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.sub(new Fraction(2n)).cmp(new Fraction(-1n)) === 0;
			},
			"-1 - 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).sub(new Fraction(2n)).cmp(new Fraction(-3n)) === 0;
			},
			"-1 - -2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).sub(new Fraction(-2n)).cmp(Fraction.one) === 0;
			},
			"1/2 - 1/2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).sub(new Fraction(1n, 2n)).cmp(Fraction.zero) === 0;
			},
			"1/2 - 1/3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).sub(new Fraction(1n, 3n)).cmp(new Fraction(1n, 6n)) === 0;
			},
			"1/2 - 1/-3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).sub(new Fraction(1n, -3n)).cmp(new Fraction(5n, 6n)) === 0;
			},
			"2/3 - 2/5": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n, 3n).sub(new Fraction(2n, 5n)).cmp(new Fraction(4n, 15n)) === 0;
			}
		},
		"mul": {
			"0 * 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.mul(Fraction.zero).cmp(Fraction.zero) === 0;
			},
			"0 * 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.mul(Fraction.one).cmp(Fraction.zero) === 0;
			},
			"1 * 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.mul(Fraction.zero).cmp(Fraction.zero) === 0;
			},
			"1 * 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.mul(Fraction.one).cmp(Fraction.one) === 0;
			},
			"1 * 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.mul(new Fraction(2n)).cmp(new Fraction(2n)) === 0;
			},
			"-1 * 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).mul(new Fraction(2n)).cmp(new Fraction(-2n)) === 0;
			},
			"-1 * -2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).mul(new Fraction(-2n)).cmp(new Fraction(2n)) === 0;
			},
			"1/2 * 1/2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).mul(new Fraction(1n, 2n)).cmp(new Fraction(1n, 4n)) === 0;
			},
			"1/2 * 1/3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).mul(new Fraction(1n, 3n)).cmp(new Fraction(1n, 6n)) === 0;
			},
			"1/2 * 1/-3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).mul(new Fraction(1n, -3n)).cmp(new Fraction(1n, -6n)) === 0;
			},
			"2/3 * 2/5": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n, 3n).mul(new Fraction(2n, 5n)).cmp(new Fraction(4n, 15n)) === 0;
			}
		},
		"div": {
			"0 / 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.div(Fraction.zero).isNaN();
			},
			"0 / 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.zero.div(Fraction.one).cmp(Fraction.zero) === 0;
			},
			"1 / 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.div(Fraction.zero).isNaN();
			},
			"1 / 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.div(Fraction.one).cmp(Fraction.one) === 0;
			},
			"1 / 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.one.div(new Fraction(2n)).cmp(new Fraction(1n, 2n)) === 0;
			},
			"-1 / 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).div(new Fraction(2n)).cmp(new Fraction(-1n, 2n)) === 0;
			},
			"-1 / -2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-1n).div(new Fraction(-2n)).cmp(new Fraction(1n, 2n)) === 0;
			},
			"1/2 / 1/2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).div(new Fraction(1n, 2n)).cmp(Fraction.one) === 0;
			},
			"1/2 / 1/3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).div(new Fraction(1n, 3n)).cmp(new Fraction(3n, 2n)) === 0;
			},
			"1/2 / 1/-3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(1n, 2n).div(new Fraction(1n, -3n)).cmp(new Fraction(-3n, 2n)) === 0;
			},
			"2/3 / 2/5": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n, 3n).div(new Fraction(2n, 5n)).cmp(new Fraction(10n, 6n)) === 0;
			}
		},
		"min": {
			"0, 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(Fraction.zero, Fraction.zero).cmp(Fraction.zero) === 0;
			},
			"0, 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(Fraction.zero, Fraction.one).cmp(Fraction.zero) === 0;
			},
			"1, 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(Fraction.one, Fraction.zero).cmp(Fraction.zero) === 0;
			},
			"1, 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(Fraction.one, Fraction.one).cmp(Fraction.one) === 0;
			},
			"1, 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(Fraction.one, new Fraction(2n)).cmp(Fraction.one) === 0;
			},
			"-1, 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(new Fraction(-1n), Fraction.zero).cmp(new Fraction(-1n)) === 0;
			},
			"-1, 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(new Fraction(-1n), Fraction.one).cmp(new Fraction(-1n)) === 0;
			},
			"-1, 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(new Fraction(-1n), new Fraction(2n)).cmp(new Fraction(-1n)) === 0;
			},
			"-1, 2, 3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(new Fraction(-1n), new Fraction(2n), new Fraction(3n)).cmp(new Fraction(-1n)) === 0;
			},
			"-1, 2, 3, -2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(new Fraction(-1n), new Fraction(2n), new Fraction(3n), new Fraction(-2n)).cmp(new Fraction(-2n)) === 0;
			},
			"-1, NaN, 3 -2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.min(new Fraction(-1n), Fraction.NaN, new Fraction(3n), new Fraction(-2n))  === Fraction.NaN;
			}
		},
		"max": {
			"0, 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(Fraction.zero, Fraction.zero).cmp(Fraction.zero) === 0;
			},
			"0, 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(Fraction.zero, Fraction.one).cmp(Fraction.one) === 0;
			},
			"1, 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(Fraction.one, Fraction.zero).cmp(Fraction.one) === 0;
			},
			"1, 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(Fraction.one, Fraction.one).cmp(Fraction.one) === 0;
			},
			"1, 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(Fraction.one, new Fraction(2n)).cmp(new Fraction(2n)) === 0;
			},
			"-1, 0": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(new Fraction(-1n), Fraction.zero).cmp(Fraction.zero) === 0;
			},
			"-1, 1": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(new Fraction(-1n), Fraction.one).cmp(Fraction.one) === 0;
			},
			"-1, 2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(new Fraction(-1n), new Fraction(2n)).cmp(new Fraction(2n)) === 0;
			},
			"-1, 2, 3": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(new Fraction(-1n), new Fraction(2n), new Fraction(3n)).cmp(new Fraction(3n)) === 0;
			},
			"-1, 2, 3, -2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(new Fraction(-1n), new Fraction(2n), new Fraction(3n), new Fraction(-2n)).cmp(new Fraction(3n)) === 0;
			},
			"-1, NaN, 3 -2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return Fraction.max(new Fraction(-1n), Fraction.NaN, new Fraction(3n), new Fraction(-2n))  === Fraction.NaN;
			}
		},
		"simplify": {
			"2/8": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(2n, 8n).simplify() + "" === "1 / 4";
			},
			"-2/8": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-2n, 8n).simplify() + "" === "-1 / 4";
			},
			"8/2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(8n, 2n).simplify() + "" === "4";
			},
			"-8/2": async () => {
				const {default: Fraction} = await import("./lib/fraction.js");
				return new Fraction(-8n, 2n).simplify() + "" === "-4";
			}
		}
	},
	"css.js": {
		"compound selectors": {
			"a": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("a", {"opacity": 0}) + "" === "a { opacity: 0; }";
			},
			"a:hover": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("a:hover", {"opacity": 0}) + "" === "a:hover { opacity: 0; }";
			},
			"div.className": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("div.className", {"opacity": 0}) + "" === "div.className { opacity: 0; }";
			},
			"#IDHERE": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("#IDHERE", {"opacity":0}) + "" === "#IDHERE { opacity: 0; }";
			},
			"ul::before": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("ul::before", {"opacity": 0}) + "" === "ul::before { opacity: 0; }";
			},
			"input[disabled]": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("input[disabled]", {"opacity": 0}) + "" === "input[disabled] { opacity: 0; }";
			},
			"no properties": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("a", {}) + "" === "";
			},
			"multiple properties": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("a", {"gap": 0, "opacity": 1, "order": 2}) + "" === "a { gap: 0px; opacity: 1; order: 2; }";
			},
			"multiple defs": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add({
					"a": {"gap": 0, "opacity": 1, "order": 2},
					"div": {"opacity": 0}
				}) + "" === "a { gap: 0px; opacity: 1; order: 2; }div { opacity: 0; }";
			}
		},
		"complex selectors": {
			"div a": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("div a", {"opacity": 0}) + "" === "div a { opacity: 0; }";
			},
			"div a:not(:hover)": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("div a:not(:hover)", {"opacity": 0}) + "" === "div a:not(:hover) { opacity: 0; }";
			},
			"div + span > a:hover::before": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("div + span > a:hover::before", {"opacity": 0}) + "" === "div + span > a:hover::before { opacity: 0; }";
			}
		},
		"multiple selectors": {
			"div, a": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("div, a", {"opacity": 0}) + "" === "div, a { opacity: 0; }";
			},
			"span, ul > li, label + input": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("span, ul > li, label + input", {"opacity": 0}) + "" === "span, ul > li, label + input { opacity: 0; }";
			}
		},
		"combined selectors": {
			"div span, a span": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("div, a", {" span": {"opacity": 0}}) + "" === "div span, a span { opacity: 0; }";
			},
			"div + span, a + span": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("div, a", {" + span": {"opacity": 0}}) + "" === "div + span, a + span { opacity: 0; }";
			},
			"div, a, div > span, a > span": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("div, a", {"opacity": 0, " > span": {"order": 1}}) + "" === "div, a { opacity: 0; }div > span, a > span { order: 1; }";
			}
		},
		"ids": {
			"basic ids": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      css = new CSS();
				return css.id() === "_0" && css.id() === "_1" && css.id() === "_2";
			},
			"prefixed ids": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      css = new CSS("ID_");
				return css.id() === "ID_0" && css.id() === "ID_1" && css.id() === "ID_2";
			},
			"different start": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      css = new CSS("", 10);
				return css.id() === "_10" && css.id() === "_11" && css.id() === "_12";
			},
			"multiple ids": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      ids = new CSS().ids(3);
				return ids[0] === "_0" && ids[1] === "_1" && ids[2] === "_2";
			}
		},
		"at": {
			"@supports": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      css = new CSS();
				return css.at("@supports (display: flex)", {"a": {"opacity": 0}}) + "" === "@supports (display: flex) {\n  a { opacity: 0; }\n}";

			},
			"@media": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      css = new CSS();
				return css.at("@media screen and (min-width: 900px)", {
					"article": {
						"padding": "1rem 3rem"
					}
				}) + "" === "@media screen and (min-width: 900px) {\n  article { padding: 1rem 3rem; }\n}";
			},
			"@namespace": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      css = new CSS();
				return css.at(`@namespace svg url(http://www.w3.org/2000/svg)`) + "" === `@namespace svg url("http://www.w3.org/2000/svg");`;
			},
			"@keyframes": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      css = new CSS();
				return (css.at("@keyframes identifier", {
					"0%": {
						"top": 0
					},
					"100%": {
						"left": 0
					}
				}) + "").replaceAll("  ", "").replaceAll(" \n", "\n") /* Hack to get FF and Chrome output to match */ === "@keyframes identifier {\n0% { top: 0px; }\n100% { left: 0px; }\n}";
			}
		},
		"mixins": {
			"shallow single": async () => {
				const {mixin} = await import("./lib/css.js"),
				      o = mixin({}, {"a": "b"});
				return o["a"] === "b";
			},
			"shallow multiple": async () => {
				const {mixin} = await import("./lib/css.js"),
				      o = mixin({"existing1": "some value", "existing2": "be gone"}, {"a": "b", "existing2": "stay"});
				return o["existing1"] === "some value" && o["existing2"] === "stay" && o["a"] === "b";
			},
			"deep single": async () => {
				const {mixin} = await import("./lib/css.js"),
				      o = mixin({}, {"a": {"b": "c"}});
				return o["a"] instanceof Object && (o["a"] as Record<string, string>)["b"] === "c";
			},
			"deep merge": async () => {
				const {mixin} = await import("./lib/css.js"),
				      o = mixin({"existing": {"a": "b", "c": "d"}}, {"existing": {"c": "e", "f": "g"}});
				return o["existing"] instanceof Object && (o["existing"] as Record<string, string>)["c"] === "e" && (o["existing"] as Record<string, string>)["f"] === "g";
			}
		}
	},
	"elements.js": {
		"options": {
			"HTMLElement": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      tag = e(e => {
					res += +(e instanceof HTMLElement);
					return [];
				      }),
				      t = tag();
				res += +(tag instanceof Function);
				res += +(t instanceof HTMLElement);
				return res === 3;
			},
			"DocumentFragment": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      tag = e({"pseudo": true}, e => {
					res += +(e instanceof DocumentFragment);
					return [];
				      }),
				      t = tag();
				res += +(tag instanceof Function);
				res += +(t instanceof DocumentFragment);
				return res === 3;
			},
			"observeChildren": async () => {
				const {default: e} = await import("./lib/elements.js");
				let res = 0;
				e({"observeChildren": true}, e => {
					res += +!!e.observeChildren;
					return [];
				})();
				e({"observeChildren": false}, e => {
					res += +!(e as any).observeChildren;
					return [];
				})();
				return res === 2;
			},
			"observeChildren (pseudo)": async () => {
				const {default: e} = await import("./lib/elements.js");
				let res = 0;
				e({"observeChildren": true, "pseudo": true}, e => {
					res += +!!e.observeChildren;
					return [];
				})();
				e({"observeChildren": false, "pseudo": true}, e => {
					res += +!(e as any).observeChildren;
					return [];
				})();
				return res === 2;
			},
			"attrs": async () => {
				const {default: e} = await import("./lib/elements.js");
				let res = 0;
				e({"attrs": true}, e => {
					res += +!!e.attr;
					return [];
				})();
				e({"attrs": false}, e => {
					res += +!(e as any).attr;
					return [];
				})();
				return res === 2;
			},
			"attrs (pseudo)": async () => {
				const {default: e} = await import("./lib/elements.js");
				let res = 0;
				e({"attrs": true, "pseudo": true}, e => {
					res += +!!e.attr;
					return [];
				})();
				e({"attrs": false, "pseudo": true}, e => {
					res += +!(e as any).attr;
					return [];
				})();
				return res === 2;
			},
			"custom name": async () => {
				const {default: e} = await import("./lib/elements.js");
				return e({"name": "custom-name"}, () => []).name === "custom-name";
			},
			"classOnly": async () => {
				const {default: e} = await import("./lib/elements.js");
				return new (e({"classOnly": true}, () => [])) instanceof HTMLElement;
			},
			"classOnly (pseudo)": async () => {
				const {default: e} = await import("./lib/elements.js");
				return new (e({"classOnly": true, "pseudo": true}, () => [])) instanceof DocumentFragment;
			},
			"extend": async () => {
				const {default: e} = await import("./lib/elements.js"),
				      t = e({"extend": v => class extends v{a = 1}}, () => [])();
				return t.a === 1;
			},
			"extend (pseudo)": async () => {
				const {default: e} = await import("./lib/elements.js"),
				      t = e({"extend": v => class extends v{a = 1}, "pseudo": true}, () => [])();
				return t.a === 1;
			},
			"args": async () => {
				const {default: e} = await import("./lib/elements.js"),
				      t = e({"args": ["a", "b"]}, (e, a, b) => {
					if (a === 1) {
						res += 1;
					}
					if (b === 2) {
						res += 2;
					}
					if (e instanceof HTMLElement) {
						res *= 3;
					}
					return [];
				      });
				let res = 0;
				t({"a": 1, "b": 2});
				return res === 9;
			},
			"args (classOnly)": async () => {
				const {default: e} = await import("./lib/elements.js"),
				      t = e({"classOnly": true, "args": ["a", "b"]}, (e, a, b) => {
					if (a === 1) {
						res += 1;
					}
					if (b === 2) {
						res += 2;
					}
					if (e instanceof HTMLElement) {
						res *= 3;
					}
					return [];
				      });
				let res = 0;
				new t(1, 2);
				return res === 9;
			}
		},
		"observeChildren": {
			"add": async () => {
				let res = false,
				    done = () => {};
				const p = new Promise<void>(r => done = r),
				      {default: e} = await import("./lib/elements.js"),
				      tag = e(e => {
					e.observeChildren((added, removed) => {
						res = added.length === 1 && added[0] instanceof HTMLBRElement && removed.length === 0;
						done();
					});
					return [];
				      });
				tag().appendChild(document.createElement("br"));
				return p.then(() => res);
			},
			"add multiple": async () => {
				let res = false,
				    done = () => {};
				const p = new Promise<void>(r => done = r),
				      {default: e} = await import("./lib/elements.js"),
				      tag = e(e => {
					e.observeChildren((added, removed) => {
						res = added.length === 3 && added[0] instanceof HTMLBRElement && added[1] instanceof HTMLDivElement && added[2] instanceof HTMLSpanElement && removed.length === 0;
						done();
					});
					return [];
				      });
				tag().append(document.createElement("br"), document.createElement("div"), document.createElement("span"));
				return p.then(() => res);
			},
			"remove": async () => {
				let res = false,
				    done = () => {};
				const p = new Promise<void>(r => done = r),
				      {default: e} = await import("./lib/elements.js"),
				      tag = e(e => {
					e.observeChildren((added, removed) => {
						if (added.length === 0) {
							res = removed.length === 1 && removed[0] instanceof HTMLBRElement;
							done();
						}
					});
					return [];
				      }),
				      t = tag();
				t.appendChild(document.createElement("br"));
				t.replaceChildren();
				return p.then(() => res);
			},
			"remove multiple": async () => {
				let res = false,
				    done = () => {};
				const p = new Promise<void>(r => done = r),
				      {default: e} = await import("./lib/elements.js"),
				      tag = e(e => {
					e.observeChildren((added, removed) => {
						if (added.length === 0) {
							res = added.length === 0 && removed.length === 3 && removed[0] instanceof HTMLBRElement && removed[1] instanceof HTMLDivElement && removed[2] instanceof HTMLSpanElement;
							done();
						}
					});
					return [];
				      }),
				      t = tag();
				t.append(document.createElement("br"), document.createElement("div"), document.createElement("span"));
				t.replaceChildren();
				return p.then(() => res);
			}
		},
		"observeChildren (pseudo)": {
			"add": async () => {
				let res = false,
				    done = () => {};
				const p = new Promise<void>(r => done = r),
				      {default: e} = await import("./lib/elements.js"),
				      tag = e({"pseudo": true}, e => {
					e.observeChildren((added, removed) => {
						res = added.length === 1 && added[0] instanceof HTMLBRElement && removed.length === 0;
						done();
					});
					return [];
				      });
				tag().appendChild(document.createElement("br"));
				return p.then(() => res);
			},
			"add multiple": async () => {
				let res = false,
				    done = () => {};
				const p = new Promise<void>(r => done = r),
				      {default: e} = await import("./lib/elements.js"),
				      tag = e({"pseudo": true}, e => {
					e.observeChildren((added, removed) => {
						res = added.length === 3 && added[0] instanceof HTMLBRElement && added[1] instanceof HTMLDivElement && added[2] instanceof HTMLSpanElement && removed.length === 0;
						done();
					});
					return [];
				      });
				tag().append(document.createElement("br"), document.createElement("div"), document.createElement("span"));
				return p.then(() => res);
			},
			"remove": async () => {
				let res = false,
				    done = () => {};
				const p = new Promise<void>(r => done = r),
				      {default: e} = await import("./lib/elements.js"),
				      tag = e({"pseudo": true}, e => {
					e.observeChildren((added, removed) => {
						if (added.length === 0) {
							res = removed.length === 1 && removed[0] instanceof HTMLBRElement;
							done();
						}
					});
					return [];
				      }),
				      t = tag();
				t.appendChild(document.createElement("br"));
				t.replaceChildren();
				return p.then(() => res);
			},
			"remove multiple": async () => {
				let res = false,
				    done = () => {};
				const p = new Promise<void>(r => done = r),
				      {default: e} = await import("./lib/elements.js"),
				      tag = e({"pseudo": true}, e => {
					e.observeChildren((added, removed) => {
						if (added.length === 0) {
							res = added.length === 0 && removed.length === 3 && removed[0] instanceof HTMLBRElement && removed[1] instanceof HTMLDivElement && removed[2] instanceof HTMLSpanElement;
							done();
						}
					});
					return [];
				      }),
				      t = tag();
				t.append(document.createElement("br"), document.createElement("div"), document.createElement("span"));
				t.replaceChildren();
				return p.then(() => res);
			},
			"add during": async () => {
				let res = 0,
				    check = false,
				    done = () => {};
				const p = new Promise<void>(r => done = r),
				      {default: e} = await import("./lib/elements.js"),
				      tag = e({"pseudo": true}, e => {
					e.appendChild(document.createElement("br"));
					e.observeChildren((added, removed) => {
						res += +(added.length === 1 && added[0] instanceof HTMLBRElement && removed.length === 0);
						if (check) {
							done();
						}
					});
					return document.createElement("br");
				      });
				check = true;
				tag().appendChild(document.createElement("br"));
				return p.then(() => res === 1);
			}
		},
		"attachRemove": {
			"attachRemove": async () => {
				const {default: e} = await import("./lib/elements.js"),
				      div = document.createElement("div"),
				      t = e(() => [])();
				let res = 0;
				document.body.append(div);
				t.addEventListener("attached", () => res++);
				t.addEventListener("removed", () => res *= 3);
				div.append(t);
				t.remove();
				div.remove();
				return res === 3;
			},
			"attachRemove: false": async () => {
				const {default: e} = await import("./lib/elements.js"),
				      div = document.createElement("div"),
				      t = e({"attachRemoveEvent": false}, () => [])();
				let res = 0;
				document.body.append(div);
				t.addEventListener("attached", () => res++);
				t.addEventListener("removed", () => res *= 3);
				div.append(t);
				t.remove();
				div.remove();
				return res === 0;
			}
		},
		"attrs": {
			"set and update": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      t = e(e => amendNode(div, {"someAttr": e.attr("thatAttr")}))();
				res += +(div.getAttributeNS(null, "someAttr") === "");
				t.setAttribute("thatAttr", "abc");
				res += +(div.getAttributeNS(null, "someAttr") === "abc");
				return res === 2;
			},
			"set fn and update": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      t = e(e => amendNode(div, {"someAttr": e.attr("thatAttr").transform((a: number) => a + 1)}))();
				res += +(div.getAttributeNS(null, "someAttr") === "1");
				amendNode(t, {"thatAttr": 5});
				res += +(div.getAttributeNS(null, "someAttr") === "6");
				return res === 2;
			},
			"set multiple fn and update": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      t = e(e => amendNode(div, {"someAttr": e.attr(["thatAttr", "otherAttr"]).transform(v => ((+(v.get("thatAttr") ?? 0) || 0) + 1) * ((+(v.get("otherAttr") ?? 0) || 0) + 1))}))();
				res += +(div.getAttributeNS(null, "someAttr") === "1");
				amendNode(t, {"thatAttr": 3});
				res += +(div.getAttributeNS(null, "someAttr") === "4");
				amendNode(t, {"otherAttr": 4});
				res += +(div.getAttributeNS(null, "someAttr") === "20");
				return res === 3;
			},
			"process fn": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      t = e(e => {
					e.attr("thatAttr").onChange((a: number) => res += +a || 0);
					return [];
				      })();
				amendNode(t, {"thatAttr": 5});
				amendNode(t, {"thatAttr": 2});
				return res === 7;
			},
			"event": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      t = e(e => {
					amendNode(div, {"onclick": e.attr("onclick")});
					return div;
				      })();
				amendNode(t, {"onclick": () => res++});
				div.click();
				div.click();
				return res === 2;
			},
			"event with modification": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      t = e(e => {
					amendNode(div, {"onclick": e.attr("onclick").transform((fn: Function) => () => fn(2))});
					return div;
				      })();
				amendNode(t, {"onclick": (n: number) => res += n});
				div.click();
				div.click();
				return res === 4;
			}
		},
		"attrs (pseudo)": {
			"set and update": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      tag = e({"pseudo": true}, e => amendNode(div, {"someAttr": e.attr("thatAttr")}))();
				res += +(div.getAttributeNS(null, "someAttr") === "");
				amendNode(tag, {"thatAttr": "abc"});
				res += +(div.getAttributeNS(null, "someAttr") === "abc");
				return res === 2;
			},
			"set fn and update": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      t = e({"pseudo": true}, e => amendNode(div, {"someAttr": e.attr("thatAttr").transform((a: number) => a + 1)}))();
				res += +(div.getAttributeNS(null, "someAttr") === "1");
				amendNode(t, {"thatAttr": 5});
				res += +(div.getAttributeNS(null, "someAttr") === "6");
				return res === 2;
			},
			"process fn": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      t = e({"pseudo": true}, e => {
					e.attr("thatAttr").onChange((a: number) => res += +a || 0);
					return [];
				      })();
				amendNode(t, {"thatAttr": 5});
				amendNode(t, {"thatAttr": 2});
				return res === 7;
			},
			"event": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      t = e({"pseudo": true}, e => {
					amendNode(div, {"onclick": e.attr("onclick")});
					return div;
				      })();
				amendNode(t, {"onclick": () => res++});
				div.click();
				div.click();
				amendNode(t, {"onclick": () => res += 2});
				div.click();
				return res === 4;
			},
			"event with modification": async () => {
				let res = 0;
				const {default: e} = await import("./lib/elements.js"),
				      {amendNode} = await import("./lib/dom.js"),
				      div = document.createElement("div"),
				      t = e({"pseudo": true}, e => {
					amendNode(div, {"onclick": e.attr("onclick").transform((fn: Function) => () => fn(2))});
					return div;
				      })();
				amendNode(t, {"onclick": (n: number) => res += n});
				div.click();
				div.click();
				amendNode(t, {"onclick": (n: number) => res += 3 * n});
				div.click();
				return res === 10;
			}
		}
	},
	"nodes.js": {
		"NodeArray": {
			"construct": {
				"empty": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      n = new NodeArray(div);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n[node] === div;
				},
				"some nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(div, noSort, [{[node]: document.createElement("span"), num: 1}, {[node]: document.createElement("br"), num: 2}]);
					return n.length === 2 && n[0].num === 1 && n[1].num === 2 && div.firstChild instanceof HTMLSpanElement && div.lastChild instanceof HTMLBRElement;
				},
				"some nodes without sort": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(div, [{[node]: document.createElement("span"), num: 1}, {[node]: document.createElement("br"), num: 2}]);

					return n.length === 2 && n[0].num === 1 && n[1].num === 2 && div.firstChild instanceof HTMLSpanElement && div.lastChild instanceof HTMLBRElement;
				},
				"sorted nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(div, (a: MyNode, b: MyNode) => a.num - b.num, [{[node]: document.createElement("br"), num: 2}, {[node]: document.createElement("span"), num: 1}]);
					return n.length === 2 && n[0].num === 1 && n[1].num === 2 && div.firstChild instanceof HTMLSpanElement && div.lastChild instanceof HTMLBRElement;
				}
			},
			"at": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					return n.at(0) === undefined && n.at(-1) === undefined;
				},
				"two nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}, {[node]: document.createElement("br"), num: 2}]);
					return n.at(0)?.num === 1 && n.at(-1)?.num === 2;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.at(0)?.num === 0 && n.at(1)?.num === 1 && n.at(4)?.num === 4 && n.at(4) === n.at(-1) && n.at(3) === n.at(-2);
				},
				"many nodes big negative": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.at(-6) === undefined;
				},
				"many nodes big positive": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.at(5) === undefined;
				}
			},
			"concat": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					return n.concat([]).length === 0;
				},
				"a node": async () => {
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      aNode = {[node]: document.createElement("div")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray(document.createElement("div"), noSort, [aNode]),
					      nn = n.concat();
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return nn.length === 1 && nn[0] === aNode;
				},
				"a node + another": async () => {
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      aNode = {[node]: document.createElement("div")},
					      another = {[node]: document.createElement("span")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray(document.createElement("div"), noSort, [aNode]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      nn = n.concat(another);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return nn.length == 2 && nn[0] === aNode && nn[1] === another;
				},
				"two nodes + another": async () => {
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      aNode = {[node]: document.createElement("div")},
					      bNode = {[node]: document.createElement("a")},
					      another = {[node]: document.createElement("span")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray(document.createElement("div"), noSort, [aNode, bNode]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      nn = n.concat(another);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return nn.length == 3 && nn[0] === aNode && nn[1] === bNode && nn[2] == another;
				},
				"two nodes + two others": async () => {
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      aNode = {[node]: document.createElement("div")},
					      bNode = {[node]: document.createElement("a")},
					      another = {[node]: document.createElement("span")},
					      anotherOne = {[node]: document.createElement("br")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray(document.createElement("div"), noSort, [aNode, bNode]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      nn = n.concat(another, anotherOne);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return nn.length == 4 && nn[0] === aNode && nn[1] === bNode && nn[2] == another && nn[3] == anotherOne;
				},
				"two nodes + array": async () => {
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      aNode = {[node]: document.createElement("div")},
					      bNode = {[node]: document.createElement("a")},
					      another = {[node]: document.createElement("span")},
					      anotherOne = {[node]: document.createElement("br")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray(document.createElement("div"), noSort, [aNode, bNode]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      nn = n.concat([another, anotherOne]);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return nn.length == 4 && nn[0] === aNode && nn[1] === bNode && nn[2] == another && nn[3] == anotherOne;
				}
			},
			"copyWithin": {
				"should throw error": async () => {
					const {NodeArray} = await import("./lib/nodes.js");
					try {
						new NodeArray(document.createElement("div")).copyWithin(0);
					} catch {
						return true;
					}
					return false;
				}
			},
			"entries": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div")),
					      g = n.entries();
					return g.next().value === undefined;
				},
				"two nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}, {[node]: document.createElement("br"), num: 2}]),
					      g = n.entries(),
					      a = g.next().value,
					      b = g.next().value;
					return a?.[0] === 0 && a?.[1].num === 1 && b?.[0] === 1 && b?.[1].num === 2 && g.next().value === undefined;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					let good = 0;
					for (const [num, e] of n.entries()) {
						if (num === good && e.num === num) {
							good++;
						}
					}
					return good === 5;
				}
			},
			"every": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					let good = true;
					return n.every(() => good = false) && good;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}]);
					return n.every(() => true);
				},
				"a node false": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}]);
					return !n.every(() => false);
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num}))),
					      aThis = {};
					let pos = 0;
					return n.every(function(this: any, t, p, a){ return t.num === pos && p === pos++ && a === n && this === aThis}, aThis);
				}
			},
			"fill": {
				"should throw error": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js");
					try {
						// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
						new NodeArray(document.createElement("div")).fill({[node]: document.createElement("span")});
					} catch {
						return true;
					}
					return false;
				}
			},
			"filter": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					let good = true;
					return n.filter(() => good = false) && good;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]),
					      filtered = n.filter(() => true);
					return filtered.length === 1 && filtered[0] === item;
				},
				"a node false": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]),
					      filtered = n.filter(() => false);
					return filtered.length === 0;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num}))),
					      aThis = {},
					      filtered = n.filter(function(this: any, e) { return e.num % 2 === 0 && this === aThis; }, aThis);
					return filtered.length === 3 && filtered[0].num === 0 && filtered[1].num === 2 && filtered[2].num === 4;
				}
			},
			"filterRemove": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					let good = true;
					return n.filterRemove(() => good = false) && good;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]),
					      filtered = n.filterRemove(() => true);
					return filtered.length === 1 && filtered[0] === item && n.length === 0;
				},
				"a node false": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]),
					      filtered = n.filterRemove(() => false);
					return filtered.length === 0 && n.length === 1;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num}))),
					      aThis = {},
					      filtered = n.filterRemove(function(this: any, e) { return e.num % 2 === 0 && this === aThis; }, aThis);
					return filtered.length === 3 && filtered[0].num === 0 && filtered[1].num === 2 && filtered[2].num === 4 && n[0].num === 1 && n[1].num === 3;
				}
			},
			"find": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					let good = false;
					return n.find(() => good = true) === undefined && !good;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.find(() => true) === item;
				},
				"a node false": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.find(() => false) === undefined;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num}))),
					      aThis = {};
					return n.find(function(this: any, e) { return e.num === 3 && this === aThis; }, aThis)?.num === 3;
				}
			},
			"findIndex": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					let good = false;
					return n.findIndex(() => good = true) === -1 && !good;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.findIndex(() => true) === 0;
				},
				"a node false": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.findIndex(() => false) === -1;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num}))),
					      aThis = {};
					return n.findIndex(function(this: any, e) { return e.num === 3 && this === aThis; }, aThis) === 3;
				}
			},
			"findLast": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					let good = false;
					return n.findLast(() => good = true) === undefined && !good;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.findLast(() => true) === item;
				},
				"a node false": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.findLast(() => false) === undefined;
				},
				"many nodes true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.findLast(() => true)?.num === 4;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num}))),
					      aThis = {};
					return n.findLast(function(this: any, e) { return e.num === 3 && this === aThis; }, aThis)?.num === 3;
				}
			},
			"forEach": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					let good = true;
					n.forEach(() => good = false);
					return good;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					let good = false;
					n.forEach(e => good = e === item);
					return good;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num}))),
					      aThis = {};
					let good = true;
					n.forEach(function(this: any, e, n){good &&= e.num === n && this === aThis} , aThis);
					return good
				}
			},
			"from": {
				"no nodes": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      n = NodeArray.from(div);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.length === 0 && n[node] === div;
				},
				"a nodes": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      child = div.appendChild(document.createElement("span")),
					      n = NodeArray.from(div);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.length === 1 && n[node] === div && n.at(0) === child;
				},
				"many nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      children = Array.from({length: 5}, () => div.appendChild(document.createElement("span"))),
					      n = NodeArray.from(div);

					return n.length === 5 && n.at(0) === children[0] && n.at(4) === children[4];
				},
				"many nodes with fn": async () => {
					let pos = 0;
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      children = Array.from({length: 5}, () => div.appendChild(document.createElement("span"))),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = NodeArray.from(div, e => ({[node]: e, "num": pos++}));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.length === 5 && n.at(0)?.[node] === children[0] && n.at(0)?.num === 0 && n.at(4)?.[node] === children[4] && n.at(4)?.num === 4;
				}
			},
			"includes": {
				"no nodes": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return !n.includes({[node]: document.createElement("div")});
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.includes(item);
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.includes(n.at(0)!) && n.includes(n.at(4)!);
				},
				"many nodes with offset": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return !n.includes(n.at(0)!, 1) && n.includes(n.at(4)!, 4);
				}
			},
			"indexOf": {
				"no nodes": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.indexOf({[node]: document.createElement("div")}) === -1;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.indexOf(item) === 0;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.indexOf(n.at(0)!) === 0 && n.indexOf(n.at(4)!) === 4;
				},
				"many nodes with offset": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.indexOf(n.at(0)!, 1) === -1 && n.indexOf(n.at(4)!, 4) === 4;
				}
			},
			"keys": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					return Array.from(n.keys()).join(",") === "";
				},
				"a node": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}]);
					return Array.from(n.keys()).join(",") === "0";
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return Array.from(n.keys()).join(",") === "0,1,2,3,4";
				}
			},
			"lastIndexOf": {
				"no nodes": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.lastIndexOf({[node]: document.createElement("div")}) === -1;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.lastIndexOf(item) === 0;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.lastIndexOf(n.at(0)!) === 0 && n.lastIndexOf(n.at(4)!) === 4;
				},
				"many nodes with offset": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.lastIndexOf(n.at(0)!, 1) === 0 && n.lastIndexOf(n.at(4)!, 3) === -1;
				}
			},
			"map": {
				"no nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"));
					return n.map(e => e.num).join(",") === "";
				},
				"a node": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}]);
					return n.map(e => e.num).join(",") === "1";
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.map(e => e.num).join(",") === "0,1,2,3,4";
				}
			},
			"pop": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					return n.pop() === undefined;
				},
				"a node": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(div, noSort, [{[node]: document.createElement("span"), num: 1}]);
					return n.pop()?.num === 1 && n.pop() === undefined && n.length === 0 && div.children.length === 0;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(div, noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.pop()?.num === 4 && n.pop()?.num === 3 && n.length === 3 && div.children.length === 3;
				}
			},
			"push": {
				"empty push": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span")},
					      n = new NodeArray(document.createElement("div"));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.length === 0 && n.push(item) === 1 && n.length === 1 && n.at(0) === item && n[node].children?.[0] === item[node];
				},
				"non-empty push": async () => {
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.length === 5 && n.push(item) === 6 && n.length === 6 && n.at(5) === item && n[node].children[5] === item[node];
				},
				"sorted push": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), (a, b) => b.num - a.num);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					for (let i = 0; i < 5; i++) {
						n.push({[node]: document.createElement("span"), num: i});
					}
					return n.length === 5 && n.at(0)?.num === 4 && n.at(4)?.num === 0;
				}
			},
			"reduce": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.reduce((v, c, i) => v + c.num + i, 0) === 0;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.reduce((v, c, i) => v + c.num + i, 0) === 1;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.reduce((v, c, i) => v * i + c.num, 0) === 64;
				}
			},
			"reduceRight": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.reduceRight((v, c, i) => v + c.num + i, 0) === 0;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.reduceRight((v, c, i) => v + c.num + i, 0) === 1;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.reduceRight((v, c, i) => v * i + c.num, 0) === 0 && n.reduceRight((v, c, i) => v * (i + 1) + c.num, 0) === 119;
				}
			},
			"reverse": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					return n.reverse().length === 0;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.reverse().at(0) === item;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items);
					n.reverse();
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.at(0) === items[4] && n.at(4) === items[0] && n[node].children[0] === items[4][node] && n[node].children[4] === items[0][node]; 
				},
				"many nodes sorted + push": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					      item = {[node]: document.createElement("span"), "num": 99},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), (a, b) => a.num - b.num, items);
					n.reverse();
					n.push(item);
					return n.at(0) === item; 
				}
			},
			"shift": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					return n.shift() === undefined;
				},
				"a node": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(div, noSort, [{[node]: document.createElement("span"), num: 1}]);
					return n.shift()?.num === 1 && n.shift() === undefined && n.length === 0 && div.children.length === 0;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(div, noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.shift()?.num === 0 && n.shift()?.num === 1 && n.length === 3 && div.children.length === 3;
				}
			},
			"slice": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					return n.length === 0 && n.slice().length === 0;
				},
				"a node": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), "num": 99},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]),
					      s = n.slice();
					return n.length === 1 && s.length === 1 && s[0] === item;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      s = n.slice();
					return n.length === 5 && s.length === 5 && s[0] === items[0] && s[4] === items[4];
				},
				"many nodes (+ve start)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      s = n.slice(1);
					return n.length === 5 && s.length === 4 && s[0] === items[1] && s[3] === items[4];
				},
				"many nodes (-ve start)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      s = n.slice(-2);
					return n.length === 5 && s.length === 2 && s[0] === items[3] && s[1] === items[4];
				},
				"many nodes (big +ve start)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      s = n.slice(10);
					return n.length === 5 && s.length === 0;
				},
				"many nodes (big -ve start)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      s = n.slice(-10);
					return n.length === 5 && s.length === 5 && s[0] === items[0] && s[4] === items[4];
				},
				"many nodes (+ve end)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      s = n.slice(0, 2);
					return n.length === 5 && s.length === 2 && s[0] === items[0] && s[1] === items[1];
				},
				"many nodes (-ve end)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      s = n.slice(0, -2);
					return n.length === 5 && s.length === 3 && s[0] === items[0] && s[2] === items[2];
				},
				"many nodes (big +ve end)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      s = n.slice(0, 10);
					return n.length === 5 && s.length === 5 && s[0] === items[0] && s[4] === items[4];
				},
				"many nodes (big -ve end)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      s = n.slice(0, -10);
					return n.length === 5 && s.length === 0;
				}
			},
			"some": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					let good = true;
					return !n.some(() => good = false) && good;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}]);
					let good = false;
					return n.some(() => good = true) && good;
				},
				"a node false": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}]);
					let good = true;
					return !n.some(() => good = false) && !good;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n.some(t => t.num === 3);
				}
			},
			"sort": {
				"no nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"));
					n.sort((a, b) => b.num - a.num);
					return n.length === 0;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(div, noSort, items);
					n.sort((a, b) => b.num - a.num);
					return n.at(0) === items[4] && n.at(1) === items[3] && n.at(2) === items[2] && n.at(3) === items[1] && n.at(4) === items[0] && div.children[0] === items[4][node] && div.children[4] === items[0][node];
				},
				"many nodes (re-sort)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(div, (a, b) => a.num - b.num, items);
					items[0].num = 6;
					n.sort();
					return n.at(0) === items[1] && div.firstChild === items[1][node] && n.at(4) === items[0] && div.lastChild === items[0][node];
				}
			},
			"splice": {
				"no nodes, remove": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"));
					return n.length === 0 && n.splice(0, 1).length === 0 && n.length === 0;
				},
				"no nodes, add": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"));
					return n.splice(0, 0, {[node]: document.createElement("span"), num: 1}).length === 0 && n.length === 1;
				},
				"no nodes, remove+add": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"));
					return n.splice(0, 1, {[node]: document.createElement("span"), num: 1}).length === 0 && n.length === 1;
				},
				"one node, remove": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), "num": 99},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]);
					return n.splice(0, 1)[0] === item && n.length === 0;
				},
				"one node, add one after": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 2}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]);
					return n.splice(1, 0, items[1]).length === 0 && n.length === 2 && n.at(0) === items[0] && n.at(1) === items[1];
				},
				"one node, add one before": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 2}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]);
					return n.splice(0, 0, items[1]).length === 0 && n.length === 2 && n.at(0) === items[1] && n.at(1) === items[0];
				},
				"one node, replace": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 2}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]);
					return n.splice(0, 1, items[1])[0] === items[0] && n.length === 1 && n.at(0) === items[1];
				},
				"one node, add two after": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 3}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]);
					return n.splice(1, 0, items[1], items[2]).length === 0 && n.length === 3 && n.at(0) === items[0] && n.at(1) === items[1] && n.at(2) === items[2];
				},
				"one node, add two before": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 3}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]);
					return n.splice(0, 0, items[1], items[2]).length === 0 && n.length === 3 && n.at(0) === items[1] && n.at(1) === items[2] && n.at(2) === items[0];
				},
				"many nodes, remove many": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items),
					      removed = n.splice(1, 2);
					return removed.length === 2 && removed[0] === items[1] && removed[1] === items[2] && n.length === 3 && n.at(0) === items[0] && n.at(2) === items[4];
				}
			},
			"toReverse": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div")).toReversed();
					return n.length === 0;
				},
				"a node true": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]).toReversed();
					return n.at(0) === item;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items).toReversed();
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.at(0) === items[4] && n.at(4) === items[0];
				},
				"many nodes sorted + push": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					      item = {[node]: document.createElement("span"), "num": 99},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), (a, b) => a.num - b.num, items).toReversed();
					n.push(item);
					return n.at(0) == items[4] && n.at(4) === items[0] && n.at(5) === item;
				}
			},
			"toSorted": {
				"no nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div")).toSorted((a, b) => b.num - a.num);

					return n.length === 0;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items).toSorted((a, b) => b.num - a.num);

					return n.at(0) === items[4] && n.at(1) === items[3] && n.at(2) === items[2] && n.at(3) === items[1] && n.at(4) === items[0];;
				}
			},
			"toSplice": {
				"no nodes, remove": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div")).toSpliced(0, 1);
					return n.length === 0;
				},
				"no nodes, add": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div")).toSpliced(0, 0, {[node]: document.createElement("span"), num: 1});

					return n.length === 1;
				},
				"no nodes, remove+add": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div")).toSpliced(0, 1, {[node]: document.createElement("span"), num: 1});
					return n.length === 1;
				},
				"one node, remove": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span"), "num": 99},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [item]).toSpliced(0, 1);
					return n.length === 0;
				},
				"one node, add one after": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 2}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]).toSpliced(1, 0, items[1]);
					return n.length === 2 && n.at(0) === items[0] && n.at(1) === items[1];
				},
				"one node, add one before": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 2}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]).toSpliced(0, 0, items[1]);
					return n.length === 2 && n.at(0) === items[1] && n.at(1) === items[0];
				},
				"one node, replace": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 2}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]).toSpliced(0, 1, items[1]);
					return n.length === 1 && n.at(0) === items[1];
				},
				"one node, add two after": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 3}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]).toSpliced(1, 0, items[1], items[2]);
					return n.length === 3 && n.at(0) === items[0] && n.at(1) === items[1] && n.at(2) === items[2];
				},
				"one node, add two before": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 3}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [items[0]]).toSpliced(0, 0, items[1], items[2]);
					return n.length === 3 && n.at(0) === items[1] && n.at(1) === items[2] && n.at(2) === items[0];
				},
				"many nodes, remove many": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, items).toSpliced(1, 2);
					return n.length === 3 && n.at(0) === items[0] && n.at(2) === items[4];
				}
			},
			"unshift": {
				"empty unshift": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span")},
					      n = new NodeArray(document.createElement("div"));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.length === 0 && n.unshift(item) === 1 && n.length === 1 && n.at(0) === item && n[node].children?.[0] === item[node];
				},
				"non-empty unshift": async () => {
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.length === 5 && n.unshift(item) === 6 && n.length === 6 && n.at(0) === item && n[node].children[0] === item[node];
				},
				"sorted unshift": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), (a, b) => a.num - b.num);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					for (let i = 0; i < 5; i++) {
						n.unshift({[node]: document.createElement("span"), num: i});
					}
					return n.length === 5 && n.at(0)?.num === 0 && n.at(4)?.num === 4;
				}
			},
			"values": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div")),
					      g = n.values();
					return g.next().value === undefined;
				},
				"two nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}, {[node]: document.createElement("br"), num: 2}]),
					      g = n.values(),
					      a = g.next().value,
					      b = g.next().value;
					return a?.num === 1 && b?.num === 2 && g.next().value === undefined;
				},
				"many nodes (iterator)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					let good = 0;
					for (const e of n) {
						if (e.num === good) {
							good++;
						}
					}
					return good === 5;
				}
			},
			"with": {
				"no nodes": async () => {
					const {NodeArray, node} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					try {
						// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
						n.with(0, {[node]: document.createElement("div")});

						return false;
					} catch(e) {
						return true;
					}
				},
				"two nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}, {[node]: document.createElement("br"), num: 2}]),
					      wa = n.with(0, {num: 3, [node]: document.createElement("span")}),
					      wb = n.with(1, {num: 4, [node]: document.createElement("span")}),
					      wc = n.with(-1, {num: 5, [node]: document.createElement("span")});

					try {
					      n.with(-2, {num: 6, [node]: document.createElement("span")});
					} catch (e) {
						if (!(e instanceof RangeError)) {
							return false;
						}
					}

					try {
					      n.with(2, {num: 6, [node]: document.createElement("span")});
					} catch (e) {
						if (!(e instanceof RangeError)) {
							return false;
						}
					}

					return wa[0].num === 3 && wa[1].num === 2 && wb[0].num === 1 && wb[1].num === 4 && wc[0].num === 1 && wc[1].num === 5;
				}
			},
			"index": {
				"no nodes": async () => {
					const {NodeArray} = await import("./lib/nodes.js"),
					      n = new NodeArray(document.createElement("div"));
					return n[0] === undefined;
				},
				"two nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, [{[node]: document.createElement("span"), num: 1}, {[node]: document.createElement("br"), num: 2}]);
					return n[0]?.num === 1 && n[1]?.num === 2;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n[0]?.num === 0 && n[1]?.num === 1 && n[4]?.num === 4;
				},
				"many nodes big positive": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray<MyNode>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => ({[node]: document.createElement("span"), num})));
					return n[5] === undefined;
				}
			},
			"as child node": async () => {
				const {NodeArray} = await import("./lib/nodes.js"),
				      {div} = await import("./lib/html.js"),
				      c = div(),
				      n = div(new NodeArray(c));

				return n.firstChild === c;
			},
			"with element item": async () => {
				const {NodeArray} = await import("./lib/nodes.js"),
				      {div} = await import("./lib/html.js"),
				      c = div(),
				      n = new NodeArray(div());

				n.push(c);

				return n.pop() === c;
			}
		},
		"NodeMap": {
			"construct": {
				"empty": async () => {
					const {NodeMap, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      n = new NodeMap(div);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n[node] === div;
				},
				"some nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string, MyNode>(div, noSort, [["A", {[node]: document.createElement("span"), num: 1}], ["B", {[node]: document.createElement("br"), num: 2}]]);
					return n.size === 2 && n.get("A")?.num === 1 && n.get("B")?.num === 2 && div.firstChild instanceof HTMLSpanElement && div.lastChild instanceof HTMLBRElement;
				},
				"some nodes without sort": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeMap, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string, MyNode>(div, [["A", {[node]: document.createElement("span"), num: 1}], ["B", {[node]: document.createElement("br"), num: 2}]]);
					return n.size === 2 && n.get("A")?.num === 1 && n.get("B")?.num === 2 && div.firstChild instanceof HTMLSpanElement && div.lastChild instanceof HTMLBRElement;
				},
				"sorted nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeMap, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<MyNode>(div, (a: MyNode, b: MyNode) => a.num - b.num, [["A", {[node]: document.createElement("br"), num: 2}], ["B", {[node]: document.createElement("span"), num: 1}]]);
					return n.size === 2 && div.firstChild instanceof HTMLSpanElement && div.lastChild instanceof HTMLBRElement;
				}
			},
			"clear": {
				"empty": async () => {
					const {NodeMap} = await import("./lib/nodes.js"),
					      n = new NodeMap(document.createElement("div"));
					n.clear();
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.size === 0;
				},
				"one node": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap(document.createElement("div"), noSort, [["a", {[node]: document.createElement("span")}]]),
					      s = n.size,
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      l = n[node].children.length;
					n.clear();
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return s === 1 && l === 1 && n.size === 0 && n[node].children.length === 0;
				},
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap(document.createElement("div"), noSort, items),
					      s = n.size,
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      l = n[node].children.length;
					n.clear();
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return s === 5 && l === 5 && n.size === 0 && n[node].children.length === 0;
				}
			},
			"delete": {
				"one node": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap(document.createElement("div"), noSort, [["a", {[node]: document.createElement("span")}]]);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					n.delete("a");
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.size === 0 && n[node].children.length === 0;
				},
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap(div, noSort, items);
					n.delete("B");
					n.delete("D");
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.size === 3 && div.children.length === 3 && div.firstChild === items[0][1][node] && div.lastChild === items[4][1][node] && div.children[1] === items[2][1][node];
				}
			},
			"entries": {
				"no nodes": async () => {
					const {NodeMap} = await import("./lib/nodes.js"),
					      n = new NodeMap(document.createElement("div")),
					      g = n.entries();
					return g.next().value === undefined;
				},
				"two nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 2}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap(document.createElement("div"), noSort, items),
					      g = n.entries(),
					      a = g.next().value,
					      b = g.next().value;
					return a?.[0] === "A" && a?.[1] === items[0][1] && b?.[0] === "B" && b?.[1] === items[1][1] && g.next().value === undefined;
				}
			},
			"forEach": {
				"no nodes": async () => {
					const {NodeMap} = await import("./lib/nodes.js"),
					      n = new NodeMap(document.createElement("div"));
					let good = true;
					n.forEach(() => good = false);
					return good;
				},
				"a node true": async () => {
					const {NodeArray, node, noSort} = await import("./lib/nodes.js"),
					      item = {[node]: document.createElement("span")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeArray(document.createElement("div"), noSort, [item]);
					let good = false;
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					n.forEach(e => good = e === item);
					return good;
				},
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, items),
					      aThis = {};
					let good = true;
					n.forEach(function(this: any, v: any, k: string, o: any) {
						const i = items.shift();
						good &&= k === i?.[0] && v === i?.[1] && this === aThis && o === n;
					}, aThis);
					return good
				}
			},
			"get": {
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, items);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.get("A") === items[0][1] && n.get("E") === items[4][1] && n.get("F") === undefined;
				}
			},
			"has": {
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, items);
					return n.has("A") && n.has("E") && !n.has("F");
				}
			},
			"insertAfter": {
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span")},
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, items);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.insertAfter("F", item, "C") && n.size === 6 && div.children[3] === item[node];
				},
				"bad key": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span")},
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, items);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return !n.insertAfter("F", item, "G") && n.size === 5;
				},
				"existing key": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span")},
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, items);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.insertAfter("E", item, "C") && n.size === 5 && div.children[3] === item[node];
				}
			},
			"insertBefore": {
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span")},
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, items);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.insertBefore("F", item, "C") && n.size === 6 && div.children[2] === item[node];
				},
				"bad key": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span")},
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, items);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return !n.insertBefore("F", item, "G") && n.size === 5;
				},
				"existing key": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span")},
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, items);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.insertBefore("E", item, "C") && n.size === 5 && div.children[2] === item[node];
				}
			},
			"keyAt": {
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]));
					return ([[0, "A"], [1, "B"], [2, "C"], [3, "D"], [4, "E"], [5, undefined]] as [number, string | undefined][]).every(([pos, key]) => n.keyAt(pos) === key);
				}
			},
			"keys": {
				"no nodes": async () => {
					const {NodeMap} = await import("./lib/nodes.js"),
					      n = new NodeMap(document.createElement("div"));
					return Array.from(n.keys()).join(",") === "";
				},
				"a node": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, [["A", {[node]: document.createElement("span")}]]);
					return Array.from(n.keys()).join(",") === "A";
				},
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]));
					return Array.from(n.keys()).join(",") === "A,B,C,D,E";
				},
				"many nodes (reversed)": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => [String.fromCharCode(69 - num), {[node]: document.createElement("span")}]));
					return Array.from(n.keys()).join(",") === "E,D,C,B,A";
				}
			},
			"position": {
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]));
					return ([["A", 0], ["B", 1], ["C", 2], ["D", 3], ["E", 4], ["F", -1]] as [string, number][]).every(([key, pos]) => n.position(key) === pos);
				}
			},
			"reSet": {
				"a node": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, [["A", item]]);
					n.reSet("A", "B");
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return div.firstChild === div.lastChild && div.firstChild === item[node] && n.size === 1 && !n.has("A") //&& n.get("B") === item;
				},
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, items);
					n.reSet("C", "F");
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.size === 5 && div.children[2] === items[2][1][node] && !n.has("C") && n.get("F") === items[2][1];
				}
			},
			"reverse": {
				"no nodes": async () => {
					const {NodeMap} = await import("./lib/nodes.js"),
					      n = new NodeMap(document.createElement("div"));
					return n.reverse().size === 0;
				},
				"a node": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span"), num: 1},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<MyNode>(div, noSort, [["A", item]]);
					return div.firstChild === item[node];
				},
				"many nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, items);
					n.reverse();
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return div.firstChild === items[4][1][node] && div.lastChild === items[0][1][node]; 
				},
				"many nodes sorted + set": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),

					      div = document.createElement("div"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]),
					      item = {[node]: document.createElement("span"), "num": 99},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(div, noSort, items);
					n.reverse();
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					n.set("F", item);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return div.firstChild === items[4][1][node] && div.lastChild === item[node]; 
				}
			},
			"set": {
				"empty set": async () => {
					const {NodeMap, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span")},
					      n = new NodeMap(div);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					n.set("A", item);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.size === 1 && n.get("A") === item && div.firstChild === item[node];
				},
				"non-empty set": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      item = {[node]: document.createElement("span")},
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap(div, noSort, Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span")}]));
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					n.set("F", item);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.size === 6 && n.get("F") === item && div.children[5] === item[node];
				},
				"sorted set": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeMap, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span"), num}]) as [string, MyNode][],
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string, MyNode>(div, (a, b) => b.num - a.num);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					for (const [key, item] of items) {
						n.set(key, item);
					}
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.size === 5 && div.firstChild === items[4][1][node] && div.lastChild === items[0][1][node];
				}
			},
			"sort": {
				"no nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeMap} = await import("./lib/nodes.js"),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string, MyNode>(document.createElement("div"));
					n.sort((a, b) => b.num - a.num);
					return n.size === 0;
				},
				"many nodes": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span"), num}]) as [string, MyNode][],
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string, MyNode>(div, noSort, items);
					n.sort((a, b) => b.num - a.num);
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return div.children[0] === items[4][1][node] && div.children[1] === items[3][1][node] && div.children[2] === items[2][1][node] && div.children[3] === items[1][1][node] && div.children[4] === items[0][1][node];
				},
				"many nodes (re-sort)": async () => {
					type MyNode = {
						num: number;
					}
					const {NodeMap, node} = await import("./lib/nodes.js"),
					      div = document.createElement("div"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span"), num}]) as [string, MyNode][],
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string, MyNode>(div, (a, b) => a.num - b.num, items);
					items[0][1].num = 6;
					n.sort();
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					return n.position("B") === 0 && div.firstChild === items[1][1][node] && n.position("A") === 4 && div.lastChild === items[0][1][node];
				}
			},
			"values": {
				"no nodes": async () => {
					const {NodeMap} = await import("./lib/nodes.js"),
					      n = new NodeMap(document.createElement("div")),
					      g = n.values();
					return g.next().value === undefined;
				},
				"two nodes": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 2}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span"), num}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, items),
					      g = n.values(),
					      a = g.next().value,
					      b = g.next().value;
					return a === items[0][1] && b === items[1][1] && g.next().value === undefined;
				},
				"many nodes (iterator)": async () => {
					const {NodeMap, node, noSort} = await import("./lib/nodes.js"),
					      items = Array.from({length: 5}, (_, num) => [String.fromCharCode(65 + num), {[node]: document.createElement("span"), num}]),
					// @ts-ignore: Type Error (at least partially) caused by: https://github.com/microsoft/TypeScript/issues/35562
					      n = new NodeMap<string>(document.createElement("div"), noSort, items);
					let good = 0;
					for (const item of n.values()) {
					// @ts-ignore: Type Error
						if (item === items.shift()?.[1]) {
							good++;
						}
					}
					return good === 5;
				}
			},
			"as child node": async () => {
				const {NodeMap} = await import("./lib/nodes.js"),
				      {div} = await import("./lib/html.js"),
				      c = div(),
				      n = div(new NodeMap(c));

				return n.firstChild === c;
			},
			"with element item": async () => {
				const {NodeMap} = await import("./lib/nodes.js"),
				      {div} = await import("./lib/html.js"),
				      c = div(),
				      n = new NodeMap(div());

				n.set("", c);

				return n.get("") === c;
			}
		}
	},
	"misc.js": {
		"isInt": {
			"basic": {
				"0": async () => {
					const {isInt} = await import("./lib/misc.js");
					return isInt(0);
				},
				"'0'": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt("0");
				},
				"1": async () => {
					const {isInt} = await import("./lib/misc.js");
					return isInt(1);
				},
				"-1": async () => {
					const {isInt} = await import("./lib/misc.js");
					return isInt(-1);
				},
				"'a'": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt('a');
				},
				"0.5": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt(0.5);
				},
				"true": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt(true);
				},
				"false": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt(false);
				},
				"NaN": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt(NaN);
				},
				"+Infinity": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt(+Infinity);
				},
				"-Infinity": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt(-Infinity);
				}
			},
			"limits": {
				"-2 <= x <= 5, x = -3": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt(-3, -2, 5);
				},
				"-2 <= x <= 5, x = -2": async () => {
					const {isInt} = await import("./lib/misc.js");
					return isInt(-2, -2, 5);
				},
				"-2 <= x <= 5, x = -1": async () => {
					const {isInt} = await import("./lib/misc.js");
					return isInt(-1, -2, 5);
				},
				"-2 <= x <= 5, x = 0": async () => {
					const {isInt} = await import("./lib/misc.js");
					return isInt(0, -2, 5);
				},
				"-2 <= x <= 5, x = 4": async () => {
					const {isInt} = await import("./lib/misc.js");
					return isInt(4, -2, 5);
				},
				"-2 <= x <= 5, x = 5": async () => {
					const {isInt} = await import("./lib/misc.js");
					return isInt(5, -2, 5);
				},
				"-2 <= x <= 5, x = 6": async () => {
					const {isInt} = await import("./lib/misc.js");
					return !isInt(6, -2, 5);
				}
			}
		},
		"checkInt": {
			"'a'": async () => {
				const {checkInt} = await import("./lib/misc.js");
				return checkInt("a") === 0;
			},
			"0.5": async () => {
				const {checkInt} = await import("./lib/misc.js");
				return checkInt(0.5) === 0;
			},
			"-2 <= x <= 5, x = -3": async () => {
				const {checkInt} = await import("./lib/misc.js");
				return checkInt(-3, -2, 5) === 0;
			},
			"-2 <= x <= 5, x = 1": async () => {
				const {checkInt} = await import("./lib/misc.js");
				return checkInt(1, -2, 5) === 1;
			},
			"-2 <= x <= 5, x = 6": async () => {
				const {checkInt} = await import("./lib/misc.js");
				return checkInt(6, -2, 5) === 0;
			},
			"-2 <= x <= 5, x = -3, def = 2": async () => {
				const {checkInt} = await import("./lib/misc.js");
				return checkInt(-3, -2, 5, 2) === 2;
			},
			"-2 <= x <= 5, x = 1, def = 2": async () => {
				const {checkInt} = await import("./lib/misc.js");
				return checkInt(1, -2, 5, 2) === 1;
			},
			"-2 <= x <= 5, x = 6, def = 2": async () => {
				const {checkInt} = await import("./lib/misc.js");
				return checkInt(6, -2, 5, 2) === 2;
			}
		},
		"mod": {
			"0 % 2 === 0": async () => {
				const {mod} = await import("./lib/misc.js");
				return mod(0, 2) === 0;
			},
			"1 % 2 === 1": async () => {
				const {mod} = await import("./lib/misc.js");
				return mod(1, 2) === 1;
			},
			"2 % 2 === 0": async () => {
				const {mod} = await import("./lib/misc.js");
				return mod(2, 2) === 0;
			},
			"-1 % 2 === 1": async () => {
				const {mod} = await import("./lib/misc.js");
				return mod(-1, 2) === 1;
			},
			"-2 % 2 === 0": async () => {
				const {mod} = await import("./lib/misc.js");
				return mod(-2, 2) === 0;
			}
		},
		"setAndReturn": {
			"setAndReturn": async () => {
				const {setAndReturn} = await import("./lib/misc.js"),
				      m = new Map<string, number>();
				return setAndReturn(m, "key", 3) === 3 && m.get("key") === 3;
			},
			"overwrite": async () => {
				const {setAndReturn} = await import("./lib/misc.js"),
				      m = new Map<string, number>([["key", 2]]);
				return m.get("key") === 2 && setAndReturn(m, "key", 3) === 3 && m.get("key") === 3;
			}
		},
		"addAndReturn": {
			"addAndReturn": async () => {
				const {addAndReturn} = await import("./lib/misc.js"),
				      s = new Set<number>();
				return !s.has(3) && addAndReturn(s, 3) === 3 && s.has(3);
			},
			"overwrite": async () => {
				const {addAndReturn} = await import("./lib/misc.js"),
				      s = new Set<number>([3]);
				return s.has(3) && addAndReturn(s, 3) === 3 && s.has(3);
			}
		},
		"pushAndReturn": async () => {
			const {pushAndReturn} = await import("./lib/misc.js"),
			      a: number[] = [];
			return a.length === 0 && pushAndReturn(a, 3) === 3 && a[0] === 3;
		},
		"queue": async () => {
			const {queue} = await import("./lib/misc.js");
			let res = 0;
			queue(async () => res += 1);
			queue(async () => res *= 2);
			queue(async () => res += 3);
			return queue(async () => res *= 5).then(() => res === 25);
		},
		"autoFocus": {
			"focus()": async () => {
				const {autoFocus} = await import("./lib/misc.js");
				let res = 0;
				class focusElement extends HTMLElement {
					focus() {res++;}
					select() {res *= 2;}
				}
				customElements.define("focus-element", focusElement);
				autoFocus(new focusElement());
				return new Promise<boolean>(fn => window.setTimeout(() => fn(res === 1), 100));
			},
			"select()": async () => {
				const {autoFocus} = await import("./lib/misc.js");
				let res = 0;
				class selectElement extends HTMLInputElement {
					focus() {res++;}
					select() {res *= 2;}
				}
				customElements.define("select-element", selectElement, {"extends": "input"});
				autoFocus(new selectElement());
				return new Promise<boolean>(fn => window.setTimeout(() => fn(res === 2), 100));
			}
		},
		"text2DOM": {
			"html": async () => {
				const {text2DOM} = await import("./lib/misc.js"),
				      d = text2DOM("<div><br /></div>");
				return d instanceof DocumentFragment && d.firstChild instanceof HTMLDivElement && d.firstChild?.firstChild instanceof HTMLBRElement;
			},
			"svg": async () => {
				const {text2DOM} = await import("./lib/misc.js"),
				      d = text2DOM("<svg><g></g></svg>");
				return d instanceof DocumentFragment && d.firstChild instanceof SVGSVGElement && d.firstChild?.firstChild instanceof SVGGElement;
			},
			"mix": async () => {
				const {text2DOM} = await import("./lib/misc.js"),
				      d = text2DOM("<div><svg></svg></div>");
				return d instanceof DocumentFragment && d.firstChild instanceof HTMLDivElement && d.firstChild?.firstChild instanceof SVGSVGElement;
			}
		},
		"callable": async () => {
			const {Callable}  = await import("./lib/misc.js"),
			      Fn = class extends Callable<(o: number) => number> {
				#num: number;
				constructor(n: number) {
					super((o: number) => this.#num = o);

					this.#num = n;
				}

				value() {
					return this.#num;
				}
			      },
			      myFn = new Fn(1),
			      old = myFn.value(),
			      middle = myFn(3);

			return old === 1 && middle === 3 && myFn.value() === 3;
		}
	},
	"typeguard.js": {
		"Bool": {
			"returns": {
				"valid": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool();

					return b(true) && b(false);
				},
				"invalid": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool();

					return !b(1) && !b("");
				},
				"true or false": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      t = Bool(true),
					      f = Bool(false);

					return t(true) && !t(false) && !f(true) && f(false);
				}
			},
			"throws": {
				"valid": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool();

					try {
						return b.throw(true) && b.throw(false);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool();

					try {
						b.throw(1);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"bool": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool();

					return JSON.stringify(b.def()) === `["","boolean"]`;
				},
				"true": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool(true);

					return JSON.stringify(b.def()) === `["","true"]`;
				},
				"false": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool(false);

					return JSON.stringify(b.def()) === `["","false"]`;
				}
			},
			"toString": {
				"any": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool();

					return b.toString() === "boolean";
				},
				"true": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool(true);

					return b.toString() === "true";
				},
				"false": async () => {
					const {Bool} = await import("./lib/typeguard.js"),
					      b = Bool(false);

					return b.toString() === "false";
				}
			}
		},
		"Str": {
			"returns": {
				"valid": async () => {
					const {Str} = await import("./lib/typeguard.js"),
					      s = Str();

					return s("") && s("abc") && s("123");
				},
				"invalid": async () => {
					const {Str} = await import("./lib/typeguard.js"),
					      s = Str();

					return !s(1) && !s(false) && !s(null);
				},
				"with regex": async () => {
					const {Str} = await import("./lib/typeguard.js"),
					      s = Str(/^a/);

					return !s("") && s("abc") && !s("123");
				}
			},
			"throws": {
				"valid": async () => {
					const {Str} = await import("./lib/typeguard.js"),
					      s = Str();

					try {
						return s.throw("") && s.throw("abc") && s.throw("123");
					} catch (e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Str} = await import("./lib/typeguard.js"),
					      s = Str();

					try {
						s.throw(false);

						return false;
					} catch(e) {
						return true;
					}
				},
				"with regex": async () => {
					const {Str} = await import("./lib/typeguard.js"),
					      s = Str(/^a/);

					try {
						s.throw("abc");
					} catch(e) {
						console.log(e);

						return false;
					}

					try {
						s.throw("123");

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {Str} = await import("./lib/typeguard.js"),
				      s = Str();

				return JSON.stringify(s.def()) === `["","string"]`;
			},
			"toString": {
				"any": async () => {
					const {Str} = await import("./lib/typeguard.js"),
					      s = Str();

					return s.toString() === "string";
				}
			}
		},
		"Tmpl": {
			"returns": {
				"valid": async () => {
					const {Tmpl, IntStr, Str} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", IntStr(), "def", Str(), "ghi");

					return t("abc0defghi") && t("abc123defsome-stringghi") && t("abc123defghighi");
				},
				"invalid": async () => {
					const {Tmpl, IntStr, Str} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", IntStr(), "def", Str(), "ghi");

					return !t("") && !t(0) && !t("aabc123defghighi") && !t("abc123defghi1") && !t("abconedefghi");
				}
			},
			"throws": {
				"valid": async () => {
					const {Tmpl, IntStr, Str} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", IntStr(), "def", Str(), "ghi");

					try {
						return t.throw("abc0defghi");
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Tmpl, IntStr, Str} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", IntStr(), "def", Str(), "ghi");

					try {
						t.throw("");

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"empty": async () => {
					const {Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("");

					return JSON.stringify(t.def()) === `["","\\"\\""]`;
				},
				"simple": async () => {
					const {Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc");

					return JSON.stringify(t.def()) === `["","\\"abc\\""]`;
				},
				"with params": async () => {
					const {IntStr, Str, Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", IntStr(), "def", Str(), "g$hi");

					return JSON.stringify(t.def()) === `["Template",["abc",["","number"],"def",["","string"],"g$hi"]]`;
				},
				"with templates": async () => {
					const {IntStr, Str, Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", IntStr(), "def", Tmpl("123", Str(), "456", Val("!!"), "---"), "g$hi");

					return JSON.stringify(t.def()) === `["Template",["abc",["","number"],"def123",["","string"],"456!!---g$hi"]]`;
				},
				"collapse adjacent strings": async () => {
					const {Str, Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("beginning", Str(), "", Str(), "end");

					return JSON.stringify(t.def()) === `["Template",["beginning",["","string"],"end"]]`;
				},
				"collapse multiple adjacent strings": async () => {
					const {Str, Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("beginning", Str(), "", Str(), "", Str(), "middle", Str(), "", Str(), "", Str(), "", Str(), "end");

					return JSON.stringify(t.def()) === `["Template",["beginning",["","string"],"middle",["","string"],"end"]]`;
				},
				"reduce to simple `string` if possible": async () => {
					const {Str, Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("", Str(), ""),
					      t2 = Tmpl("", Str(), "", Str(), ""),
					      t3 = Tmpl("", Str(), "", Str(), "", Str(), "");

					return JSON.stringify(t.def()) === `["","string"]` && JSON.stringify(t2.def()) === `["","string"]` && JSON.stringify(t3.def()) === `["","string"]`
				},
				"with ${ in a Val, but still a template": async () => {
					const {IntStr, Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", Val("${not a type}"), "def", IntStr(), "ghi");

					return JSON.stringify(t.def()) === '["Template",["abc${not a type}def",["","number"],"ghi"]]';
				},
				"with ${ in a Val, but now a string": async () => {
					const {Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", Val("${not a type}"), "def");

					return JSON.stringify(t.def()) === '["","\\"abc${not a type}def\\""]';
				},
				"with ${string} in a string value, followed by a Str()": async () => {
					const {Str, Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", Val("${string}"), "", Str(), "def");

					return JSON.stringify(t.def()) === '["Template",["abc${string}",["","string"],"def"]]';
				},
				"with Or in template": async () => {
					const {Or, Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", Or(Val("123"), Val("456")), "def");

					return JSON.stringify(t.def()) === '["Template",["abc",["Or",[["","\\"123\\""],["","\\"456\\""]]],"def"]]';
				}
			},
			"toString": {
				"empty": async () => {
					const {Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("");

					return t.toString() === `""`;
				},
				"simple": async () => {
					const {Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc");

					return t.toString() === `"abc"`;
				},
				"with params": async () => {
					const {IntStr, Str, Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", IntStr(), "def", Str(), "g$hi");

					return t.toString() === "`abc${number}def${string}g$hi`";
				},
				"with templates": async () => {
					const {IntStr, Str, Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", IntStr(), "def", Tmpl("123", Str(), "456", Val("!!"), "---"), "g$hi");

					return t.toString() === "`abc${number}def123${string}456!!---g$hi`";
				},
				"collapse adjacent strings": async () => {
					const {Str, Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("beginning", Str(), "", Str(), "end");

					return t.toString() === "`beginning${string}end`";
				},
				"collapse multiple adjacent strings": async () => {
					const {Str, Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("beginning", Str(), "", Str(), "", Str(), "middle", Str(), "", Str(), "", Str(), "", Str(), "end");

					return t.toString() === "`beginning${string}middle${string}end`";
				},
				"reduce to simple `string` if possible": async () => {
					const {Str, Tmpl} = await import("./lib/typeguard.js"),
					      t = Tmpl("", Str(), ""),
					      t2 = Tmpl("", Str(), "", Str(), ""),
					      t3 = Tmpl("", Str(), "", Str(), "", Str(), "");

					return t.toString() === "string" && t2.toString() === "string" && t3.toString() === "string";
				},
				"with ${ in a Val, but still a template": async () => {
					const {IntStr, Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", Val("${not a type}"), "def", IntStr(), "ghi");

					return t.toString() === "`abc\\${not a type}def${number}ghi`";
				},
				"with ${ in a Val, but now a string": async () => {
					const {Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", Val("${not a type}"), "def");

					return t.toString() === "\"abc${not a type}def\"";
				},
				"with ${string} in a string value, followed by a Str()": async () => {
					const {Str, Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", Val("${string}"), "", Str(), "def");

					return t.toString() === "`abc\\${string}${string}def`";
				},
				"with Or in template": async () => {
					const {Or, Tmpl, Val} = await import("./lib/typeguard.js"),
					      t = Tmpl("abc", Or(Val("123"), Val("456")), "def");

					return t.toString() === '`abc${"123" | "456"}def`';
				}
			}
		},
		"Undefined": {
			"returns": {
				"valid": async () => {
					const {Undefined} = await import("./lib/typeguard.js"),
					      u = Undefined();

					return u(undefined);
				},
				"invalid": async () => {
					const {Undefined} = await import("./lib/typeguard.js"),
					      u = Undefined();

					return !u(null) && !u("") && !u(123);
				}
			},
			"throws": {
				"valid": async () => {
					const {Undefined} = await import("./lib/typeguard.js"),
					      u = Undefined();

					try {
						return u.throw(undefined);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Undefined} = await import("./lib/typeguard.js"),
					      u = Undefined();

					try {
						u.throw(null);

						return false;
					} catch (e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {Undefined} = await import("./lib/typeguard.js"),
				      u = Undefined();

				return JSON.stringify(u.def()) === `["","undefined"]`;
			},
			"toString": async () => {
				const {Undefined} = await import("./lib/typeguard.js"),
				      u = Undefined();

				return u.toString() === "undefined";
			}
		},
		"Opt": {
			"returns": {
				"valid": async () => {
					const {Int, Opt} = await import("./lib/typeguard.js"),
					      o = Opt(Int());

					return o(1) && o(2) && o(undefined);
				},
				"invalid": async () => {
					const {Int, Opt} = await import("./lib/typeguard.js"),
					      o = Opt(Int());

					return !o("") && !o(null);
				}
			},
			"throws": {
				"valid": async () => {
					const {Int, Opt} = await import("./lib/typeguard.js"),
					      o = Opt(Int());

					try {
						return o.throw(undefined);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Int, Opt} = await import("./lib/typeguard.js"),
					      o = Opt(Int());

					try {
						o.throw("");

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Int, Opt} = await import("./lib/typeguard.js"),
					      o = Opt(Int());

					return JSON.stringify(o.def()) === `["Or",[["","number"],["","undefined"]]]`;
				},
				"with undefined": async () => {
					const {Opt, Undefined} = await import("./lib/typeguard.js"),
					      o = Opt(Undefined());

					return JSON.stringify(o.def()) === `["","undefined"]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Int, Opt, Str} = await import("./lib/typeguard.js"),
					      o = Opt(Int()),
					      o2 = Opt(Str());

					return o.toString() === "number | undefined" && o2.toString() === "string | undefined";
				},
				"with undefined": async () => {
					const {Opt, Undefined} = await import("./lib/typeguard.js"),
					      o = Opt(Undefined());

					return o.toString() === "undefined";
				}
			}
		},
		"Null": {
			"returns": {
				"valid": async () => {
					const {Null} = await import("./lib/typeguard.js"),
					      n = Null();

					return n(null);
				},
				"invalid": async () => {
					const {Null} = await import("./lib/typeguard.js"),
					      n = Null();

					return !n(undefined) && !n("") && !n(123);
				}
			},
			"throws": {
				"valid": async () => {
					const {Null} = await import("./lib/typeguard.js"),
					      n = Null();

					try {
						return n.throw(null);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Null} = await import("./lib/typeguard.js"),
					      n = Null();

					try {
						n.throw(undefined);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {Null} = await import("./lib/typeguard.js"),
				      n = Null();

				return JSON.stringify(n.def()) === `["","null"]`;
			},
			"toString": async () => {
				const {Null} = await import("./lib/typeguard.js"),
				      n = Null();

				return n.toString() === "null";
			}
		},
		"Num": {
			"returns": {
				"valid": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num();

					return n(0) && n(-1) && n(3.14) && n(-1.618) && n(-Infinity) && n(Infinity);
				},
				"invalid": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num();

					return !n("") && !n(false) && !n(null);
				},
				"limits": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num(0, 1000);

					return n(0) && n(1000) && !n(1000.1) && !n(Infinity) && !n(-1) && !n(-Infinity);
				}
			},
			"throws": {
				"valid": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num();

					try {
						return n.throw(0);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num();

					try {
						n.throw("");

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"any": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num();

					return JSON.stringify(n.def()) === `["","number"]`;
				},
				"with min": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num(0);

					return JSON.stringify(n.def()) === `["","number","0 <= n"]`;
				},
				"with max": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num(-Infinity, 0);

					return JSON.stringify(n.def()) === `["","number","n <= 0"]`;
				},
				"with min and max": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num(5, 10);

					return JSON.stringify(n.def()) === `["","number","5 <= n <= 10"]`;
				}
			},
			"toString": {
				"any": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num();

					return n.toString() === "number";
				},
				"with min": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num(0);

					return n.toString() === "number /* 0 <= n */";
				},
				"with max": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num(-Infinity, 0);

					return n.toString() === "number /* n <= 0 */";
				},
				"with min and max": async () => {
					const {Num} = await import("./lib/typeguard.js"),
					      n = Num(5, 10);

					return n.toString() === "number /* 5 <= n <= 10 */";
				}
			}
		},
		"Int": {
			"returns": {
				"valid": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int();

					return i(0) && i(-1) && i(Number.MIN_SAFE_INTEGER) && i(Number.MAX_SAFE_INTEGER);
				},
				"invalid": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int();

					return !i(3.14) && !i(-1.618) && !i(Infinity) && !i(-Infinity) && !i("") && !i(false) && !i(null);
				},
				"limits": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(0, 1000);

					return i(0) && i(1000) && !i(1001) && !i(Number.MIN_SAFE_INTEGER) && !i(-1) && !i(Number.MAX_SAFE_INTEGER);
				}
			},
			"throws": {
				"valid": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int();

					try {
						return i.throw(0);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int();

					try {
						i.throw(0.5);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"any": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int();

					return JSON.stringify(i.def()) === `["","number"]`;
				},
				"with min (Infinity for max)": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(0, Infinity);

					return JSON.stringify(i.def()) === `["","number","0 <= i"]`;
				},
				"with min (default for max)": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(0);

					return JSON.stringify(i.def()) === `["","number","0 <= i"]`;
				},
				"with max (-Infinity for min)": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(-Infinity, 0);

					return JSON.stringify(i.def()) === `["","number","i <= 0"]`;
				},
				"with max (Number.MIN_SAFE_INTEGER for min)": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(Number.MIN_SAFE_INTEGER, 0);

					return JSON.stringify(i.def()) === `["","number","i <= 0"]`;
				},
				"with min and max": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(5, 10);

					return JSON.stringify(i.def()) === `["","number","5 <= i <= 10"]`;
				}
			},
			"toString": {
				"any": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int();

					return i.toString() === "number";
				},
				"with min (Infinity for max)": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(0, Infinity);

					return i.toString() === "number /* 0 <= i */";
				},
				"with min (default for max)": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(0);

					return i.toString() === "number /* 0 <= i */";
				},
				"with max (-Infinity for min)": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(-Infinity, 0);

					return i.toString() === "number /* i <= 0 */";
				},
				"with max (Number.MIN_SAFE_INTEGER for min)": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(Number.MIN_SAFE_INTEGER, 0);

					return i.toString() === "number /* i <= 0 */";
				},
				"with min and max": async () => {
					const {Int} = await import("./lib/typeguard.js"),
					      i = Int(5, 10);

					return i.toString() === "number /* 5 <= i <= 10 */";
				}
			}
		},
		"BigInt": {
			"returns": {
				"valid": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt();

					return b(0n) && b(-1n) && b(1000n) && b(-100000n);
				},
				"invalid": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt();

					return !b(3.14) && !b(-1.618) && !b(Infinity) && !b(-Infinity) && !b("") && !b(false) && !b(null);
				},
				"limits": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt(-100n, 100n);

					return b(0n) && b(100n) && b(-100n) && !b(101n) && !b(-101);
				}
			},
			"throws": {
				"valid": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt();

					try {
						return b.throw(0n);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt();

					try {
						b.throw(0.5);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"any": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt();

					return JSON.stringify(b.def()) === `["","bigint"]`;
				},
				"with min (default for max)": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt(0n);

					return JSON.stringify(b.def()) === `["","bigint","0n <= b"]`;
				},
				"with max (Number.MIN_SAFE_INTEGER for min)": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt(undefined, 0n);

					return JSON.stringify(b.def()) === `["","bigint","b <= 0n"]`;
				},
				"with min and max": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt(5n, 10n);

					return JSON.stringify(b.def()) === `["","bigint","5n <= b <= 10n"]`;
				}
			},
			"toString": {
				"any": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt();

					return b.toString() === "bigint";
				},
				"with min (default for max)": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt(0n);

					return b.toString() === "bigint /* 0n <= b */";
				},
				"with max (Number.MIN_SAFE_INTEGER for min)": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt(undefined, 0n);

					return b.toString() === "bigint /* b <= 0n */";
				},
				"with min and max": async () => {
					const {BigInt} = await import("./lib/typeguard.js"),
					      b = BigInt(5n, 10n);

					return b.toString() === "bigint /* 5n <= b <= 10n */";
				}
			}
		},
		"Sym": {
			"returns": {
				"valid": async () => {
					const {Sym} = await import("./lib/typeguard.js"),
					      s = Sym();

					return s(Symbol(""));
				},
				"invalid": async () => {
					const {Sym} = await import("./lib/typeguard.js"),
					      s = Sym();

					return !s("");
				}
			},
			"throws": {
				"valid": async () => {
					const {Sym} = await import("./lib/typeguard.js"),
					      s = Sym();

					try {
						return s.throw(Symbol(""));
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Sym} = await import("./lib/typeguard.js"),
					      s = Sym();

					try {
						s.throw("");

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {Sym} = await import("./lib/typeguard.js"),
				      s = Sym();

				return JSON.stringify(s.def()) === `["","symbol"]`;
			},
			"toString": async () => {
				const {Sym} = await import("./lib/typeguard.js"),
				      s = Sym();

				return s.toString() === "symbol";
			}
		},
		"Val": {
			"returns": {
				"valid - 1": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(1);

					return v(1);
				},
				"invalid - 1": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(1);

					return !v(2);
				},
				"valid - 2": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(2);

					return v(2);
				},
				"invalid - 2": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(2);

					return !v(1);
				},
				"valid - \"abc\"": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val("abc");

					return v("abc");
				},
				"invalid - \"abc\"": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val("abc");

					return !v("def");
				}
			},
			"throws": {
				"valid - 1": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(1);

					try {
						return v.throw(1);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - 1": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(1);

					try {
						v.throw(2);

						return false;
					} catch(e) {
						return true;
					}
				},
				"valid - 2": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(2);

					try {
						return v.throw(2);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - 2": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(2);

					try {
						v.throw(1);

						return false;
					} catch(e) {
						return true;
					}
				},
				"valid - \"abc\"": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val("abc");

					try {
						return v.throw("abc");
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - \"abc\"": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val("abc");

					try {
						v.throw("def");

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"string": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val("abc");

					return JSON.stringify(v.def()) === `["","\\"abc\\""]`;
				},
				"number": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(123);

					return JSON.stringify(v.def()) === `["","123"]`;
				},
				"boolean": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(true);

					return JSON.stringify(v.def()) === `["","true"]`;
				},
				"bigint": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(1024n);

					return JSON.stringify(v.def()) === `["","1024n"]`;
				},
				"null": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(null);

					return JSON.stringify(v.def()) === `["","null"]`;
				},
				"undefined": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(undefined);

					return JSON.stringify(v.def()) === `["","undefined"]`;
				}
			},
			"toString": {
				"string": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val("abc");

					return v.toString() === `"abc"`;
				},
				"number": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(123);

					return v.toString() === `123`;
				},
				"boolean": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(true);

					return v.toString() === `true`;
				},
				"bigint": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(1024n);

					return v.toString() === `1024n`;
				},
				"null": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(null);

					return v.toString() === `null`;
				},
				"undefined": async () => {
					const {Val} = await import("./lib/typeguard.js"),
					      v = Val(undefined);

					return v.toString() === `undefined`;
				}
			}
		},
		"Any": {
			"returns": {
				"valid": async () => {
					const {Any} = await import("./lib/typeguard.js"),
					      a = Any();

					return a(1) && a("abc") && a([1, 2,3]);
				}
			},
			"throws": {
				"valid": async () => {
					const {Any} = await import("./lib/typeguard.js"),
					      a = Any();

					try {
						return a.throw(1) && a.throw("abc") && a.throw([1, 2,3]);
					} catch(e) {
						return false;
					}
				}
			},
			"def": async () => {
				const {Any} = await import("./lib/typeguard.js"),
				      a = Any();

				return JSON.stringify(a.def()) === `["","any"]`;
			},
			"toString": async () => {
				const {Any} = await import("./lib/typeguard.js"),
				      a = Any();

				return a.toString() === "any";
			}
		},
		"Unknown": {
			"returns": {
				"valid": async () => {
					const {Unknown} = await import("./lib/typeguard.js"),
					      u = Unknown();

					return u(1) && u("abc") && u([1, 2,3]);
				}
			},
			"throws": {
				"valid": async () => {
					const {Unknown} = await import("./lib/typeguard.js"),
					      u = Unknown();

					try {
						return u.throw(1) && u.throw("abc") && u.throw([1, 2,3]);
					} catch(e) {
						return false;
					}
				}
			},
			"def": async () => {
				const {Unknown} = await import("./lib/typeguard.js"),
				      u = Unknown();

				return JSON.stringify(u.def()) === `["","unknown"]`;
			},
			"toString": async () => {
				const {Unknown} = await import("./lib/typeguard.js"),
				      u = Unknown();

				return u.toString() === "unknown";
			}
		},
		"Void": {
			"returns": {
				"valid": async () => {
					const {Void} = await import("./lib/typeguard.js"),
					      v = Void();

					return v(1) && v("abc") && v([1, 2,3]);
				}
			},
			"throws": {
				"valid": async () => {
					const {Void} = await import("./lib/typeguard.js"),
					      v = Void();

					try {
						return v.throw(1) && v.throw("abc") && v.throw([1, 2,3]);
					} catch(e) {
						return false;
					}
				}
			},
			"def": async () => {
				const {Void} = await import("./lib/typeguard.js"),
				      v = Void();

				return JSON.stringify(v.def()) === `["","void"]`;
			},
			"toString": async () => {
				const {Void} = await import("./lib/typeguard.js"),
				      v = Void();

				return v.toString() === "void";
			}
		},
		"Arr": {
			"returns": {
				"valid - Num": async () => {
					const {Arr, Num} = await import("./lib/typeguard.js"),
					      a = Arr(Num());

					return a([0, 1, 2]) && a([3, 4, 5, 6]);
				},
				"invalid - Num": async () => {
					const {Arr, Num} = await import("./lib/typeguard.js"),
					      a = Arr(Num());

					return !a(null) && !a(["1", "2", "3"]);
				},
				"valid - Bool": async () => {
					const {Arr, Bool} = await import("./lib/typeguard.js"),
					      a = Arr(Bool());

					return a([true]) && a([false, true]);
				},
				"invalid - Bool": async () => {
					const {Arr, Bool} = await import("./lib/typeguard.js"),
					      a = Arr(Bool());

					return !a(null) && !a(["true", "false", ""]);
				}
			},
			"throws": {
				"valid - Num": async () => {
					const {Arr, Num} = await import("./lib/typeguard.js"),
					      a = Arr(Num());

					try {
						return a.throw([0, 1, 2]);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - Num": async () => {
					const {Arr, Num} = await import("./lib/typeguard.js"),
					      a = Arr(Num());

					try {
						a.throw(null);
						
						return false;
					} catch(e) {
						return true;
					}
				},
				"valid - Bool": async () => {
					const {Arr, Bool} = await import("./lib/typeguard.js"),
					      a = Arr(Bool());

					try {
						return a.throw([true]);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - Bool": async () => {
					const {Arr, Bool} = await import("./lib/typeguard.js"),
					      a = Arr(Bool());

					try {
						a.throw(null);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Arr, Bool} = await import("./lib/typeguard.js"),
					      a = Arr(Bool());

					return JSON.stringify(a.def()) === `["Array",["","boolean"]]`;
				},
				"with comment": async () => {
					const {Arr, Int} = await import("./lib/typeguard.js"),
					      a = Arr(Int(0));

					return JSON.stringify(a.def()) === `["Array",["","number","0 <= i"]]`;
				},
				"complex": async () => {
					const {Arr, Bool, Int, Or} = await import("./lib/typeguard.js"),
					      a = Arr(Or(Int(0, 255), Arr(Bool())));

					return JSON.stringify(a.def()) === `["Array",["Or",[["","number","0 <= i <= 255"],["Array",["","boolean"]]]]]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Arr, Bool} = await import("./lib/typeguard.js"),
					      a = Arr(Bool());

					return a.toString() === "boolean[]";
				},
				"with comment": async () => {
					const {Arr, Int} = await import("./lib/typeguard.js"),
					      a = Arr(Int(0));

					return a.toString() === "number /* 0 <= i */[]";
				},
				"complex": async () => {
					const {Arr, Bool, Int, Or} = await import("./lib/typeguard.js"),
					      a = Arr(Or(Int(0, 255), Arr(Bool())));

					return a.toString() === "(number /* 0 <= i <= 255 */ | boolean[])[]";
				}
			}
		},
		"Tuple": {
			"returns": {
				"valid - empty": async () => {
					const {Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple();

					return t([]);
				},
				"invalid - empty": async () => {
					const {Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple();

					return !t([1]);
				},
				"valid - single string value": async () => {
					const {Str, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Str());

					return t(["abc"]) && t(["def"]);
				},
				"invalid - single string value": async () => {
					const {Str, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Str());

					return !t([]) && !t([1]) && !t(["abc", "def"]);
				},
				"valid - with spread": async () => {
					const {Bool, Int, Null, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Bool(), Null(), ...Int());

					return t([true, null]) && t([true, null, 1]) && t([false, null, 1, 2, 3]);
				},
				"invalid - with spread": async () => {
					const {Bool, Int, Null, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Bool(), Null(), ...Int());

					return !t([true, 1]) && !t([true, null, 1, "2"]) && !t([false, null, "1"]);
				}
			},
			"throws": {
				"valid - empty": async () => {
					const {Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple();

					try {
						return t.throw([]);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - empty": async () => {
					const {Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple();

					try {
						t.throw([1]);

						return false;
					} catch(e) {
						return true;
					}
				},
				"valid - single string value": async () => {
					const {Str, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Str());

					try {
						return t.throw(["abc"]);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - single string value": async () => {
					const {Str, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Str());

					try {
						t.throw([]);

						return false;
					} catch(e) {
						return true;
					}
				},
				"valid - with spread": async () => {
					const {Bool, Int, Null, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Bool(), Null(), ...Int());

					try {
						return t.throw([true, null]);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - with spread": async () => {
					const {Bool, Int, Null, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Bool(), Null(), ...Int());

					try {
						t.throw([true, 1]);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"empty": async () => {
					const {Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple();

					return JSON.stringify(t.def()) === `["Tuple",[]]`;
				},
				"single element": async () => {
					const {Int, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Int());

					return JSON.stringify(t.def()) === `["Tuple",[["","number"]]]`;
				},
				"multiple elements": async () => {
					const {Int, Tuple, Str} = await import("./lib/typeguard.js"),
					      t = Tuple(Int(), Str());

					return JSON.stringify(t.def()) === `["Tuple",[["","number"],["","string"]]]`;
				},
				"tuples within tuples": async () => {
					const {Int, Tuple, Str} = await import("./lib/typeguard.js"),
					      t = Tuple(Int(), Str()),
					      u = Tuple(t, t);

					return JSON.stringify(u.def()) === `["Tuple",[["Tuple",[["","number"],["","string"]]],["Tuple",[["","number"],["","string"]]]]]`;
				},
				"with spread": async () => {
					const {Int, Tuple, Str} = await import("./lib/typeguard.js"),
					      t = Tuple(Int(), ...Str());

					return JSON.stringify(t.def()) === `["Tuple",[["","number"]],["","string"]]`;
				}
			},
			"toString": {
				"empty": async () => {
					const {Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple();

					return t.toString() === "[]";
				},
				"single element": async () => {
					const {Int, Tuple} = await import("./lib/typeguard.js"),
					      t = Tuple(Int());

					return t.toString() === "[number]";
				},
				"multiple elements": async () => {
					const {Int, Tuple, Str} = await import("./lib/typeguard.js"),
					      t = Tuple(Int(), Str());

					return t.toString() === "[number, string]";
				},
				"tuples within tuples": async () => {
					const {Int, Tuple, Str} = await import("./lib/typeguard.js"),
					      t = Tuple(Int(), Str()),
					      u = Tuple(t, t);

					return u.toString() === "[[number, string], [number, string]]";
				},
				"with spread": async () => {
					const {Int, Tuple, Str} = await import("./lib/typeguard.js"),
					      t = Tuple(Int(), ...Str());

					return t.toString() === `[number, ...string[]]`;
				}
			}
		},
		"Class": {
			"return": {
				"valid": async () => {
					const {Class} = await import("./lib/typeguard.js"),
					      c = Class(HTMLElement);

					return c(document.createElement("div")) && c(document.createElementNS("http://www.w3.org/1999/xhtml", "img"));
				},
				"invalid": async () => {
					const {Class} = await import("./lib/typeguard.js"),
					      c = Class(HTMLElement);

					return !c(document.createElementNS("http://www.w3.org/2000/svg", "svg")) && !c(null);
				}
			},
			"throws": {
				"valid": async () => {
					const {Class} = await import("./lib/typeguard.js"),
					      c = Class(HTMLElement);

					try {
						return c.throw(document.createElementNS("http://www.w3.org/1999/xhtml", "div"));
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Class} = await import("./lib/typeguard.js"),
					      c = Class(HTMLElement);

					try {
						c.throw(document.createElementNS("http://www.w3.org/2000/svg", "svg"));

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {Class} = await import("./lib/typeguard.js"),
				      c = Class(HTMLElement);

				return JSON.stringify(c.def()) === `["","HTMLElement"]`;
			},
			"toString": async () => {
				const {Class} = await import("./lib/typeguard.js"),
				      c = Class(HTMLElement);

				return c.toString() === "HTMLElement";
			}
		},
		"Obj": {
			"return": {
				"valid": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Str()
					      });

					return o({"a": 0, "b": ""}) && o({"a": 123, "b": "abc", "c": true});
				},
				"invalid": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Str()
					      });

					return !o({"a": "", "b": 0}) && o({"a": 123, "b": "abc"}) && !o({});
				},
				"valid - optional": async () => {
					const {Num, Obj, Or, Str, Undefined} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Or(Str(), Undefined())
					      });

					return o({"a": 0, "b": ""}) && o({"a": 123});
				},
				"invalid - optional": async () => {
					const {Num, Obj, Or, Str, Undefined} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Or(Str(), Undefined())
					      });

					return !o({"a": "abc", "b": 123}) && !o({"b": ""});
				}
			},
			"throws": {
				"valid": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Str()
					      });

					try {
						return o.throw({"a": 0, "b": ""})
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Str()
					      });

					try {
						o.throw({});

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"empty": async () => {
					const {Obj} = await import("./lib/typeguard.js"),
					      o = Obj();

					return JSON.stringify(o.def()) === `["Object",{}]`;
				},
				"with fields": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Str()
					      });

					return JSON.stringify(o.def()) === `["Object",{"a":["","number"],"b":["","string"]}]`;
				},
				"with odd fields": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a b c": Num(),
						      "b()": Str()
					      });

					return JSON.stringify(o.def()) === `["Object",{"a b c":["","number"],"b()":["","string"]}]`;
				},
				"with object field": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "child": Obj({
							      "a b c": Num(),
							      "b()": Str()
						      })
					      });

					return JSON.stringify(o.def()) === `["Object",{"child":["Object",{"a b c":["","number"],"b()":["","string"]}]}]`;
				},
				"with undefined field": async () => {
					const {Num, Obj, Undefined} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Undefined()
					      });

					return JSON.stringify(o.def()) === `["Object",{"a":["","number"],"b":["","undefined"]}]`;
				},
				"with optional field": async () => {
					const {Num, Obj, Opt, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Opt(Str())
					      });

					return JSON.stringify(o.def()) === `["Object",{"a":["","number"],"b":["Or",[["","string"],["","undefined"]]]}]`;
				}
			},
			"toString": {
				"empty": async () => {
					const {Obj} = await import("./lib/typeguard.js"),
					      o = Obj();

					return o.toString() === "{}";
				},
				"with fields": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Str()
					      });

					return o.toString() === "{\n	a: number;\n	b: string;\n}";
				},
				"with odd fields": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a b c": Num(),
						      "b()": Str()
					      });

					return o.toString() === "{\n	\"a b c\": number;\n	\"b()\": string;\n}";
				},
				"with object field": async () => {
					const {Num, Obj, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "child": Obj({
							      "a b c": Num(),
							      "b()": Str()
						      })
					      });

					return o.toString() === "{\n	child: {\n		\"a b c\": number;\n		\"b()\": string;\n	};\n}";
				},
				"with undefined field": async () => {
					const {Num, Obj, Undefined} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Undefined()
					      });

					return o.toString() === "{\n	a: number;\n	b?: undefined;\n}";
				},
				"with optional field": async () => {
					const {Num, Obj, Opt, Str} = await import("./lib/typeguard.js"),
					      o = Obj({
						      "a": Num(),
						      "b": Opt(Str())
					      });

					return o.toString() === "{\n	a: number;\n	b?: string | undefined;\n}";
				}
			}
		},
		"Part": {
			"returns": {
				"valid": async () => {
					const {Num, Obj, Part, Str} = await import("./lib/typeguard.js"),
					      p = Part(Obj({
						      "a": Num(),
						      "b": Str()
					      }));

					return p({}) && p({"a": 1}) && p({"b": "2"}) && p({"a": 1, "b": "2", "c": false});
				},
				"invalid": async () => {
					const {Num, Obj, Part, Str} = await import("./lib/typeguard.js"),
					      p = Part(Obj({
						      "a": Num(),
						      "b": Str()
					      }));

					return !p({"a": "1"}) && !p({"b": 2});
				},
				"valid - before Req": async () => {
					const {Num, Obj, Part, Req, Str} = await import("./lib/typeguard.js"),
					      p = Part(Req(Obj({
						      "a": Num(),
						      "b": Str()
					      })));

					return p({}) && p({"a": 1}) && p({"b": "2"}) && p({"a": 1, "b": "2", "c": false});
				},
				"invalid - before Req": async () => {
					const {Num, Obj, Part, Req, Str} = await import("./lib/typeguard.js"),
					      p = Part(Req(Obj({
						      "a": Num(),
						      "b": Str()
					      })));

					return !p({"a": "1"}) && !p({"b": 2});
				}
			},
			"throws": {
				"valid": async () => {
					const {Num, Obj, Part, Str} = await import("./lib/typeguard.js"),
					      p = Part(Obj({
						      "a": Num(),
						      "b": Str()
					      }));

					try {
						return p.throw({});
					} catch (e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Num, Obj, Part, Str} = await import("./lib/typeguard.js"),
					      p = Part(Obj({
						      "a": Num(),
						      "b": Str()
					      }));

					try {
						p.throw({"a": "1"});

						return false;
					} catch (e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Num, Obj, Part, Str} = await import("./lib/typeguard.js"),
					      p = Part(Obj({
						      "a": Num(),
						      "b": Str()
					      }));

					return JSON.stringify(p.def()) === `["Object",{"a":["Or",[["","number"],["","undefined"]]],"b":["Or",[["","string"],["","undefined"]]]}]`;
				},
				"inner object": async () => {
					const {Num, Obj, Part, Str} = await import("./lib/typeguard.js"),
					      p = Part(Obj({
						      "a": Num(),
						      "b": Str(),
						      "c": Obj({
							      "a": Num()
						      })
					      }));

					return JSON.stringify(p.def()) === `["Object",{"a":["Or",[["","number"],["","undefined"]]],"b":["Or",[["","string"],["","undefined"]]],"c":["Or",[["Object",{"a":["","number"]}],["","undefined"]]]}]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Num, Obj, Part, Str} = await import("./lib/typeguard.js"),
					      p = Part(Obj({
						      "a": Num(),
						      "b": Str()
					      }));

					return p.toString() === "{\n	a?: number | undefined;\n	b?: string | undefined;\n}";
				},
				"inner object": async () => {
					const {Num, Obj, Part, Str} = await import("./lib/typeguard.js"),
					      p = Part(Obj({
						      "a": Num(),
						      "b": Str(),
						      "c": Obj({
							      "a": Num()
						      })
					      }));

					return p.toString() === "{\n	a?: number | undefined;\n	b?: string | undefined;\n	c?: {\n		a: number;\n	} | undefined;\n}";
				}
			}
		},
		"Req": {
			"returns": {
				"valid": async () => {
					const {Num, Obj, Or, Req, Str, Undefined} = await import("./lib/typeguard.js"),
					      r = Req(Obj({
						      "a": Or(Num(), Undefined()),
						      "b": Or(Str(), Undefined())
					      }));

					return r({"a": 0, "b": "1"}) && r({"a": 2, "b": "3", "c": true});
				},
				"invalid": async () => {
					const {Num, Obj, Or, Req, Str, Undefined} = await import("./lib/typeguard.js"),
					      r = Req(Obj({
						      "a": Or(Num(), Undefined()),
						      "b": Or(Str(), Undefined())
					      }));

					return !r({"a": 0}) && !r({"b": "3"});
				},
				"valid - before Part": async () => {
					const {Num, Obj, Or, Part, Req, Str, Undefined} = await import("./lib/typeguard.js"),
					      r = Req(Part(Obj({
						      "a": Or(Num(), Undefined()),
						      "b": Or(Str(), Undefined())
					      })));

					return r({"a": 0, "b": "1"}) && r({"a": 2, "b": "3", "c": true});
				},
				"invalid - before Part": async () => {
					const {Num, Obj, Or, Part, Req, Str, Undefined} = await import("./lib/typeguard.js"),
					      r = Req(Part(Obj({
						      "a": Or(Num(), Undefined()),
						      "b": Or(Str(), Undefined())
					      })));

					return !r({"a": 0}) && !r({"b": "3"});
				}
			},
			"throws": {
				"valid": async () => {
					const {Num, Obj, Or, Req, Str, Undefined} = await import("./lib/typeguard.js"),
					      r = Req(Obj({
						      "a": Or(Num(), Undefined()),
						      "b": Or(Str(), Undefined())
					      }));

					try {
						return r.throw({"a": 0, "b": "1"});
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Num, Obj, Or, Req, Str, Undefined} = await import("./lib/typeguard.js"),
					      r = Req(Obj({
						      "a": Or(Num(), Undefined()),
						      "b": Or(Str(), Undefined())
					      }));

					try {
						r.throw({"a": 0});

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {Num, Obj, Part, Req, Str} = await import("./lib/typeguard.js"),
				      r = Req(Part(Obj({
					      "a": Num(),
					      "b": Str()
				      })));

				return JSON.stringify(r.def()) === `["Object",{"a":["","number"],"b":["","string"]}]`;
			},
			"toString": async () => {
				const {Num, Obj, Part, Req, Str} = await import("./lib/typeguard.js"),
				      r = Req(Part(Obj({
					      "a": Num(),
					      "b": Str()
				      })));

				return r.toString() === "{\n	a: number;\n	b: string;\n}";
			}
		},
		"Take": {
			"returns": {
				"valid": async () => {
					const {Bool, Int, Obj, Str, Take} = await import("./lib/typeguard.js"),
					      t = Take(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Bool()
					      }), "a", "b");

					return t({"a": 0, "b": "1", "c": 2});
				}
			},
			"throws": {
				"invalid": async () => {
					const {Bool, Int, Obj, Str, Take} = await import("./lib/typeguard.js"),
					      t = Take(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Bool()
					      }), "a", "b");

					try{
						t.throw({});

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Bool, Int, Obj, Str, Take} = await import("./lib/typeguard.js"),
					      t = Take(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Bool()
					      }), "a", "b");

					return JSON.stringify(t.def()) === `["Object",{"a":["","number"],"b":["","string"]}]`;
				},
				"inner obj": async () => {
					const {Bool, Int, Obj, Str, Take} = await import("./lib/typeguard.js"),
					      t = Take(Obj({
						      "a": Int(),
						      "b": Obj({
							      "c": Str()
						      }),
						      "c": Bool()
					      }), "a", "b");

					return JSON.stringify(t.def()) === `["Object",{"a":["","number"],"b":["Object",{"c":["","string"]}]}]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Bool, Int, Obj, Str, Take} = await import("./lib/typeguard.js"),
					      t = Take(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Bool()
					      }), "a", "b");

					return t.toString() === "{\n	a: number;\n	b: string;\n}";
				},
				"inner obj": async () => {
					const {Bool, Int, Obj, Str, Take} = await import("./lib/typeguard.js"),
					      t = Take(Obj({
						      "a": Int(),
						      "b": Obj({
							      "c": Str()
						      }),
						      "c": Bool()
					      }), "a", "b");

					return t.toString() === "{\n	a: number;\n	b: {\n		c: string;\n	};\n}";
				}
			}
		},
		"Skip": {
			"returns": {
				"valid": async () => {
					const {Bool, Int, Obj, Skip, Str} = await import("./lib/typeguard.js"),
					      s = Skip(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Bool()
					      }), "a", "b");

					return s({"a": "0", "b": "1", "c": true});
				}
			},
			"throws": {
				"valid": async () => {
					const {Bool, Int, Obj, Skip, Str} = await import("./lib/typeguard.js"),
					      s = Skip(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Bool()
					      }), "a", "b");

					try {
						s.throw({"a": "0", "b": "1", "c": 2});

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Bool, Int, Obj, Skip, Str} = await import("./lib/typeguard.js"),
					      s = Skip(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Bool()
					      }), "a", "b");

					return JSON.stringify(s.def()) === `["Object",{"c":["","boolean"]}]`;
				},
				"inner obj": async () => {
					const {Bool, Int, Obj, Skip, Str} = await import("./lib/typeguard.js"),
					      s = Skip(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Obj({
							      "a": Bool()
						      })
					      }), "a", "b");

					return JSON.stringify(s.def()) === `["Object",{"c":["Object",{"a":["","boolean"]}]}]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Bool, Int, Obj, Skip, Str} = await import("./lib/typeguard.js"),
					      s = Skip(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Bool()
					      }), "a", "b");

					return s.toString() === "{\n	c: boolean;\n}";
				},
				"inner obj": async () => {
					const {Bool, Int, Obj, Skip, Str} = await import("./lib/typeguard.js"),
					      s = Skip(Obj({
						      "a": Int(),
						      "b": Str(),
						      "c": Obj({
							      "a": Bool()
						      })
					      }), "a", "b");

					return s.toString() === "{\n	c: {\n		a: boolean;\n	};\n}";
				}
			}
		},
		"Recur": {
			"returns": {
				"valid": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o))
					      });

					return o({"a": []}) && o({"a": [{"a": []}, {"a": []}]}) && o({"a": [{"a": [{"a": []}]}]});
				},
				"invalid": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o))
					      });

					return !o({"b": []}) && !o({"a": [{"b": []}, {"a": []}]}) && !o({"a": [{"a": [{"b": []}]}]});
				}
			},
			"throws": {
				"valid": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o))
					      });

					try {
						return o.throw({"a": [{"a": [{"a": []}]}]});
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o))
					      });

					try {
						o.throw({"a": [{"a": [{"b": []}]}]});

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o, "MyType"))
					      });

					return JSON.stringify(o.def()) === `["Recur","MyType",["Object",{"a":["Array",["Recur","MyType"]]}]]`;
				},
				"in deep": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o, "MyType2"))
					      }),
					      p = Obj({"a": o});

					return JSON.stringify(p.def()) === `["Object",{"a":["Recur","MyType2",["Object",{"a":["Array",["Recur","MyType2"]]}]]}]`;
				}
			},
			"toString": {
				"simple - no name": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o))
					      });

					return o.toString() + "" === "type_4";
				},
				"simple - with name": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o, "MyType"))
					      });

					return o + "" === "MyType";
				},
				"in deep": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o, "MyType2"))
					      }),
					      p = Obj({"a": o});

					return p + "" === "{\n	a: MyType2;\n}"
				},
				"multiple calls to toString": async () => {
					type O = {
						a: O[];
					}

					const {Arr, Obj, Recur} = await import("./lib/typeguard.js"),
					      o: import("./lib/typeguard.js").TypeGuard<O> = Obj({
						      "a": Arr(Recur(() => o))
					      });

					return o + "" === o + "";
				}
			}
		},
		"Rec": {
			"returns": {
				"valid - Str key": async () => {
					const {Num, Rec, Str} = await import("./lib/typeguard.js"),
					      r = Rec(Str(), Num());

					return r({}) && r({"a": 1}) && r({"a": 2, "b": 4, "c": 8});
				},
				"invalid - Str key": async () => {
					const {Num, Rec, Str} = await import("./lib/typeguard.js"),
					      r = Rec(Str(), Num());

					return !r({[Symbol("a")]: 1}) && !r({"a": 2, "b": 4, [Symbol("c")]: 8});
				},
				"valid - Sym key": async () => {
					const {Num, Rec, Sym} = await import("./lib/typeguard.js"),
					      r = Rec(Sym(), Num());

					return r({}) && r({[Symbol("a")]: 1}) && r({[Symbol("a")]: 2, [Symbol("b")]: 3});
				},
				"invalid - Sym key": async () => {
					const {Num, Rec, Sym} = await import("./lib/typeguard.js"),
					      r = Rec(Sym(), Num());

					return !r({"": 1}) && !r({"a": 2, [Symbol("b")]: 3});
				},
				"valid - Int key": async () => {
					const {IntStr, Rec, Str} = await import("./lib/typeguard.js"),
					      r = Rec(IntStr(), Str());

					return r({}) && r({"1": "abc"}) && r({"2": "def", "3": "ghi"});
				},
				"invalid - Int key": async () => {
					const {IntStr, Rec, Str} = await import("./lib/typeguard.js"),
					      r = Rec(IntStr(), Str());

					return !r({"": 1}) && !r({"1.1": 2, "1": 3}) && !r({"a": 4, "1": 5});
				}
			},
			"thows": {
				"valid - Str key": async () => {
					const {Num, Rec, Str} = await import("./lib/typeguard.js"),
					      r = Rec(Str(), Num());

					try {
						return r.throw({"a": 1});
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - Str key": async () => {
					const {Num, Rec, Str} = await import("./lib/typeguard.js"),
					      r = Rec(Str(), Num());

					try {
						r.throw({[Symbol("a")]: 1});

						return false;
					} catch(e) {
						return true;
					}
				},
				"valid - Sym key": async () => {
					const {Num, Rec, Sym} = await import("./lib/typeguard.js"),
					      r = Rec(Sym(), Num());

					try {
						return r.throw({[Symbol("a")]: 1});
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - Sym key": async () => {
					const {Num, Rec, Sym} = await import("./lib/typeguard.js"),
					      r = Rec(Sym(), Num());

					try {
						r.throw({"": 1});

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Bool, IntStr, Rec} = await import("./lib/typeguard.js"),
					      r = Rec(IntStr(), Bool());

					return JSON.stringify(r.def()) === `["Record",["Template",["",["","number"],""]],["","boolean"]]`;
				},
				"complex": async () => {
					const {BoolStr, Int, Obj, Rec, Val} = await import("./lib/typeguard.js"),
					      r = Rec(BoolStr(), Rec(Val("abc"), Obj({
						      a: Int(0, 255)
					      })));

					return JSON.stringify(r.def()) === `["Record",["Template",["",["","boolean"],""]],["Record",["","\\"abc\\""],["Object",{"a":["","number","0 <= i <= 255"]}]]]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Bool, IntStr, Rec} = await import("./lib/typeguard.js"),
					      r = Rec(IntStr(), Bool());

					return r.toString() === "Record<`${number}`, boolean>";
				},
				"complex": async () => {
					const {BoolStr, Int, Obj, Rec, Val} = await import("./lib/typeguard.js"),
					      r = Rec(BoolStr(), Rec(Val("abc"), Obj({
						      a: Int(0, 255)
					      })));

					return r.toString() === "Record<`${boolean}`, Record<\"abc\", {\n	a: number /* 0 <= i <= 255 */;\n}>>";
				}
			}
		},
		"Or": {
			"returns": {
				"valid": async () => {
					const {Bool, Num, Or, Sym} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num(), Sym());

					return o(true) && o(false) && o(1) && o(-1234) && o(Symbol("hello"));
				},
				"invalid": async () => {
					const {Bool, Num, Or, Sym} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num(), Sym());

					return !o("") && !o({}) && !o([]);
				}
			},
			"throws": {
				"valid": async () => {
					const {Bool, Num, Or, Sym} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num(), Sym());

					try {
						return o.throw(true);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Bool, Num, Or, Sym} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num(), Sym());

					try {
						o.throw("");

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Bool, Num, Or} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num());

					return JSON.stringify(o.def()) === `["Or",[["","boolean"],["","number"]]]`;
				},
				"complex": async () => {
					const {Bool, BoolStr, IntStr, Num, Or} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num(), Or(BoolStr(), IntStr()));

					return JSON.stringify(o.def()) === `["Or",[["","boolean"],["","number"],["Template",["",["","boolean"],""]],["Template",["",["","number"],""]]]]`;
				},
				"duplicates": async () => {
					const {Bool, Num, Or} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num(), Bool(), Bool(), Num());

					return JSON.stringify(o.def()) === `["Or",[["","boolean"],["","number"]]]`;
				},
				"multi-level duplicates": async () => {
					const {Bool, Num, Or} = await import("./lib/typeguard.js"),
					      o = Or(Or(Or(Bool(), Num()), Bool()), Or(Bool(), Or(Num())));

					return JSON.stringify(o.def()) === `["Or",[["","boolean"],["","number"]]]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Bool, Num, Or} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num());

					return o.toString() === "boolean | number";
				},
				"complex": async () => {
					const {Bool, BoolStr, IntStr, Num, Or} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num(), Or(BoolStr(), IntStr()));

					return o.toString() === "boolean | number | `${boolean}` | `${number}`";
				},
				"duplicates": async () => {
					const {Bool, Num, Or} = await import("./lib/typeguard.js"),
					      o = Or(Bool(), Num(), Bool(), Bool(), Num());

					return o.toString() === "boolean | number";
				},
				"multi-level duplicates": async () => {
					const {Bool, Num, Or} = await import("./lib/typeguard.js"),
					      o = Or(Or(Or(Bool(), Num()), Bool()), Or(Bool(), Or(Num())));

					return o.toString() === "boolean | number";
				}
			}
		},
		"And": {
			"returns": {
				"valid": async () => {
					const {And, Arr, Num, Obj} = await import("./lib/typeguard.js"),
					      a = And(Arr(Num()), Obj({"length": Num(2, 4)}));

					return a([1, 2]) && a([1, 2, 3]) && a([1, 2, 3, 4]);
				},
				"invalid": async () => {
					const {And, Arr, Num, Obj} = await import("./lib/typeguard.js"),
					      a = And(Arr(Num()), Obj({"length": Num(2, 4)}));

					return !a([1]) && !a(["", ""]) && !a([1, 2, 3, 4, 5]);
				}
			},
			"throws": {
				"valid": async () => {
					const {And, Arr, Num, Obj} = await import("./lib/typeguard.js"),
					      a = And(Arr(Num()), Obj({"length": Num(2, 4)}));

					try {
						return a.throw([1, 2]);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {And, Arr, Num, Obj} = await import("./lib/typeguard.js"),
					      a = And(Arr(Num()), Obj({"length": Num(2, 4)}));

					try {
						a.throw([1]);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {And, Bool, Num, Obj} = await import("./lib/typeguard.js"),
					      a = And(Obj({"a": Bool(), "b": Num()}), Obj({"a": Bool(), "b": Bool()}));

					return JSON.stringify(a.def()) === `["And",[["Object",{"a":["","boolean"],"b":["","number"]}],["Object",{"a":["","boolean"],"b":["","boolean"]}]]]`;
				},
				"complex": async () => {
					const {And,BoolStr, IntStr, Or, Str} = await import("./lib/typeguard.js"),
					      a = And(Str(), Or(BoolStr(), IntStr()));

					return JSON.stringify(a.def()) === `["And",[["","string"],["Or",[["Template",["",["","boolean"],""]],["Template",["",["","number"],""]]]]]]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {And, Bool, Num, Obj} = await import("./lib/typeguard.js"),
					      a = And(Obj({"a": Bool(), "b": Num()}), Obj({"a": Bool(), "b": Bool()}));

					return a.toString() === "{\n	a: boolean;\n	b: number;\n} & {\n	a: boolean;\n	b: boolean;\n}";
				},
				"complex": async () => {
					const {And,BoolStr, IntStr, Or, Str} = await import("./lib/typeguard.js"),
					      a = And(Str(), Or(BoolStr(), IntStr()));

					return a.toString() === "string & (`${boolean}` | `${number}`)";
				}
			}
		},
		"MapType": {
			"returns": {
				"valid": async () => {
					const {MapType, Num, Str} = await import("./lib/typeguard.js"),
					      m = MapType(Num(), Str());

					return m(new Map()) && m(new Map([[1, "a"]])) && m(new Map([[1, "a"], [2, "b"]]));
				},
				"invalid": async () => {
					const {MapType, Num, Str} = await import("./lib/typeguard.js"),
					      m = MapType(Num(), Str());

					return !m(new Map([["a", 1]])) && !m(new Map<number | string, number | string>([[1, "a"], ["b", 2]]));
				}
			},
			"throws": {
				"valid": async () => {
					const {MapType, Num, Str} = await import("./lib/typeguard.js"),
					      m = MapType(Num(), Str());

					try {
						return m.throw(new Map([[1, "a"]]));
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {MapType, Num, Str} = await import("./lib/typeguard.js"),
					      m = MapType(Num(), Str());

					try {
						m.throw(new Map([["a", 1]]));

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Bool, Int, MapType} = await import("./lib/typeguard.js"),
					      m = MapType(Int(), Bool());

					return JSON.stringify(m.def()) === `["Map",["","number"],["","boolean"]]`;
				},
				"complex": async () => {
					const {Bool, Int, Obj, MapType, Val} = await import("./lib/typeguard.js"),
					      m = MapType(Bool(), MapType(Val("abc"), Obj({
						      a: Int(0, 255)
					      })));

					return JSON.stringify(m.def()) === `["Map",["","boolean"],["Map",["","\\"abc\\""],["Object",{"a":["","number","0 <= i <= 255"]}]]]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Bool, Int, MapType} = await import("./lib/typeguard.js"),
					      m = MapType(Int(), Bool());

					return m.toString() === "Map<number, boolean>";
				},
				"complex": async () => {
					const {Bool, Int, Obj, MapType, Val} = await import("./lib/typeguard.js"),
					      m = MapType(Bool(), MapType(Val("abc"), Obj({
						      a: Int(0, 255)
					      })));

					return m.toString() === "Map<boolean, Map<\"abc\", {\n	a: number /* 0 <= i <= 255 */;\n}>>";
				}
			}
		},
		"SetType": {
			"returns": {
				"valid": async () => {
					const {Num, SetType} = await import("./lib/typeguard.js"),
					      s = SetType(Num());

					return s(new Set()) && s(new Set([1])) && s(new Set([1, 2, 3]));
				},
				"invalid": async () => {
					const {Num, SetType} = await import("./lib/typeguard.js"),
					      s = SetType(Num());

					return !s(new Set([""])) && !s(new Set([1, false, 3]));
				}
			},
			"throws": {
				"valid": async () => {
					const {Num, SetType} = await import("./lib/typeguard.js"),
					      s = SetType(Num());

					try {
						return s.throw(new Set([1, 2, 3]));
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Num, SetType} = await import("./lib/typeguard.js"),
					      s = SetType(Num());

					try {
						s.throw(new Set([""]));

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Bool, SetType} = await import("./lib/typeguard.js"),
					      s = SetType(Bool());

					return JSON.stringify(s.def()) === `["Set",["","boolean"]]`;
				},
				"complex": async () => {
					const {Int, Obj, SetType} = await import("./lib/typeguard.js"),
					      s = SetType(SetType(Obj({
						      a: Int(0, 255)
					      })));

					return JSON.stringify(s.def()) === `["Set",["Set",["Object",{"a":["","number","0 <= i <= 255"]}]]]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Bool, SetType} = await import("./lib/typeguard.js"),
					      s = SetType(Bool());

					return s.toString() === "Set<boolean>";
				},
				"complex": async () => {
					const {Int, Obj, SetType} = await import("./lib/typeguard.js"),
					      s = SetType(SetType(Obj({
						      a: Int(0, 255)
					      })));

					return s.toString() === "Set<Set<{\n	a: number /* 0 <= i <= 255 */;\n}>>";
				}
			}
		},
		"NumStr": {
			"returns": {
				"valid": async () => {
					const {NumStr} = await import("./lib/typeguard.js"),
					      n = NumStr();

					return n("0") && n("1.1") && n("-1.23") && n("Infinity") && n("-Infinity");
				},
				"invalid": async () => {
					const {NumStr} = await import("./lib/typeguard.js"),
					      n = NumStr();

					return !n(0) && !n(1) && !n(true);
				}
			},
			"throws": {
				"valid": async () => {
					const {NumStr} = await import("./lib/typeguard.js"),
					      n = NumStr();

					try {
						return n.throw("1.111");
					} catch (e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {NumStr} = await import("./lib/typeguard.js"),
					      n = NumStr();

					try {
						n.throw(0);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {NumStr} = await import("./lib/typeguard.js"),
				      n = NumStr();

				return JSON.stringify(n.def()) === `["Template",["",["","number"],""]]`;
			},
			"toString": async () => {
				const {NumStr} = await import("./lib/typeguard.js"),
				      n = NumStr();

				return n.toString() === "`${number}`";
			}
		},
		"IntStr": {
			"returns": {
				"valid": async () => {
					const {IntStr} = await import("./lib/typeguard.js"),
					      i = IntStr();

					return i("0") && i("1") && i("99999999");
				},
				"invalid": async () => {
					const {IntStr} = await import("./lib/typeguard.js"),
					      i = IntStr();

					return !i(0) && !i(1) && !i(true);
				}
			},
			"throws": {
				"valid": async () => {
					const {IntStr} = await import("./lib/typeguard.js"),
					      i = IntStr();

					try {
						return i.throw("1");
					} catch (e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {IntStr} = await import("./lib/typeguard.js"),
					      i = IntStr();

					try {
						i.throw(0);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {IntStr} = await import("./lib/typeguard.js"),
				      i = IntStr();

				return JSON.stringify(i.def()) === `["Template",["",["","number"],""]]`;
			},
			"toString": async () => {
				const {IntStr} = await import("./lib/typeguard.js"),
				      i = IntStr();

				return i.toString() === "`${number}`";
			}
		},
		"BoolStr": {
			"returns": {
				"valid": async () => {
					const {BoolStr} = await import("./lib/typeguard.js"),
					      b = BoolStr();

					return b("true") && b("false");
				},
				"invalid": async () => {
					const {BoolStr} = await import("./lib/typeguard.js"),
					      b = BoolStr();

					return !b(true) && !b(false) && !b("other");
				}
			},
			"throws": {
				"valid": async () => {
					const {BoolStr} = await import("./lib/typeguard.js"),
					      b = BoolStr();

					try {
						return b.throw("true");
					} catch (e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {BoolStr} = await import("./lib/typeguard.js"),
					      b = BoolStr();

					try {
						b.throw(true);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {BoolStr} = await import("./lib/typeguard.js"),
				      b = BoolStr();

				return JSON.stringify(b.def()) === `["Template",["",["","boolean"],""]]`;
			},
			"toString": async () => {
				const {BoolStr} = await import("./lib/typeguard.js"),
				      b = BoolStr();

				return b.toString() === "`${boolean}`";
			}
		},
		"Function": {
			"return": {
				"valid - no specified args": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func();

					return f(() => {}) && f((_: any) => {}) && f(function(_a: any, _b: any, ..._c: any[]) {});
				},
				"invalid - no specified args": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func();

					return !f(0) && !f(true) && !f("() => {}") && !f("function(a, b, c) {}");
				},
				"valid - 2 args": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func(2);

					return f((_a: any, _b: any) => {}) && f(function(_a: any, _b: any) {}) && f(function(_a: any, _b: any, ..._c: any[]) {});
				},
				"invalid - 2 args": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func(2);

					return !f(() => {}) && !f((_a: any) => {}) && !f((_a: any, ..._b: any[]) => {}) && !f(function(_a: any) {}) && !f(function(_a: any, _b: any, _c: any, ..._d: any[]) {});
				}
			},
			"throws": {
				"valid - no specified args": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func();

					try {
						return f.throw(() => {});
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - no specified args": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func();

					try {
						f.throw(0);

						return false;
					} catch(e) {
						return true;
					}
				},
				"valid - 2 args": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func(2);

					try {
						return f.throw((_a: any, _b: any) => {});
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid - 2 args": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func(2);

					try {
						f.throw(() => {});

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": {
				"simple": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func();

					return JSON.stringify(f.def()) === `["","Function"]`;
				},
				"complex": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func(2);

					return JSON.stringify(f.def()) === `["","Function","2"]`;
				}
			},
			"toString": {
				"simple": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func();

					return f.toString() === "Function";
				},
				"complex": async () => {
					const {Func} = await import("./lib/typeguard.js"),
					      f = Func(2);

					return f.toString() === "Function /* 2 */";
				}
			}
		},
		"Forbid": {
			"returns": {
				"valid": async () => {
					const {Bool, Forbid, Null, Num, Or, Str} = await import("./lib/typeguard.js"),
					      f = Forbid(Or(Bool(), Null(), Num(), Str()), Or(Null(), Str()));

					return f(true) && f(false) && f(0);
				},
				"invalid": async () => {
					const {Bool, Forbid, Null, Num, Or, Str} = await import("./lib/typeguard.js"),
					      f = Forbid(Or(Bool(), Null(), Num(), Str()), Or(Null(), Str()));

					return !f(null) && !f("");
				}
			},
			"throws": {
				"valid": async () => {
					const {Bool, Forbid, Null, Num, Or, Str} = await import("./lib/typeguard.js"),
					      f = Forbid(Or(Bool(), Null(), Num(), Str()), Or(Null(), Str()));

					try {
						return f.throw(true);
					} catch(e) {
						console.log(e);

						return false;
					}
				},
				"invalid": async () => {
					const {Bool, Forbid, Null, Num, Or, Str} = await import("./lib/typeguard.js"),
					      f = Forbid(Or(Bool(), Null(), Num(), Str()), Or(Null(), Str()));

					try {
						f.throw(null);

						return false;
					} catch(e) {
						return true;
					}
				}
			},
			"def": async () => {
				const {Bool, Forbid, Null, Num, Or, Str} = await import("./lib/typeguard.js"),
				      f = Forbid(Or(Bool(), Null(), Num(), Str()), Or(Null(), Str()));

				return JSON.stringify(f.def()) === `["Exclude",["Or",[["","boolean"],["","null"],["","number"],["","string"]]],["Or",[["","null"],["","string"]]]]`;
			},
			"toString": async () => {
				const {Bool, Forbid, Null, Num, Or, Str} = await import("./lib/typeguard.js"),
				      f = Forbid(Or(Bool(), Null(), Num(), Str()), Or(Null(), Str()));

				return f.toString() === `Exclude<boolean | null | number | string, null | string>`;
			}
		}
	},
	"casefold": [
		["A", "A", "a"],
		["a", "a", "a"],
		["A", "a", "a"],
		["ẞ", "SS", "ss"],
		["ẞ", "ss", "ss"],
		["1# HarBOR Side", "1# HARboR SiDE", "1# harbor side"]
	].reduce((o, [from, to, exact]) => (o[`${from} == ${to} (${exact})`] = async () => {
		const {default: fold} = await import("./lib/casefold.js"),
		      folded = fold(from);

		return folded === fold(to) && folded === exact;
	}, o), {} as Record<string, () => Promise<boolean>>),
	"parser": {
		"tokeniser": {
			"peek": {
				"abc": async () => {
					const {default: parser} = await import("./lib/parser.js");

					let peeked = false;

					parser("abc", p => {
						peeked = p.peek() === "a";

						return p.done();
					}).next();

					return peeked;
				},
				"cab": async () => {
					let peeked = false;

					const {default: parser, TokenDone} = await import("./lib/parser.js"),
					      tk = parser("cab", p => {
						peeked = p.peek() === "c";

						return p.done();
					      }).next().value;

					return peeked && tk.type === TokenDone && tk.data === "";
				}
			},
			"next": {
				"123": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("123abc", p => [{
							"type": 1 + +(p.next() === "1" && p.next() === "2" && p.next() === "3"),
							"data": p.get()
						}, () => p.done()]).next().value;

					return tk.type === 2 && tk.data === "123";
				},
				"abc": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abc", p => [{
							"type": +(p.next() === "a" && p.next() === "b" && p.next() === "c" && p.next() === ""),
							"data": p.get()
						}, () => p.done()]).next().value;

					return tk.type === 1 && tk.data === "abc";
				}
			},
			"backup": {
				"123": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("123abc", p => {
						p.next();
						p.next();
						p.next();
						p.backup();

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "12";
				},
				"abc": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abc123", p => {
						p.next();
						p.backup();
						p.backup();
						p.next();
						p.next();
						p.next();
						p.backup();
						p.next();

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "abc";
				}
			},
			"reset": {
				"123": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("123abc", p => {
						p.next();
						p.next();
						p.next();
						p.reset();

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "";
				},
				"abc": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abc123", p => {
						p.next();
						p.next();
						p.next();
						p.reset();
						p.next();
						p.next();

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "ab";
				}
			},
			"accept": {
				"abc": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abc", p => {
						p.accept("a");
						p.accept("b");
						p.accept("d");

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "ab";
				},
				"cab": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("cab", p => {
						p.accept("a");
						p.accept("b");
						p.accept("c");

						return [{
							"type": 2,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 2 && tk.data === "c";
				},
				"abc???": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abc", p => {
						p.accept("a");
						p.accept("b");
						p.accept("c");
						p.accept("a");
						p.accept("b");
						p.accept("c");

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "abc";
				}
			},
			"get": {
				"simple": async () => {
					let read = "";

					const {default: parser} = await import("./lib/parser.js");

					parser("12345abcde", p => {
						p.accept("123");
						p.accept("123");
						p.accept("123");
						p.accept("123");
						read = p.get();

						return p.done();
					}).next();

					return read === "123";
				},
				"run": async () => {
					let read = "";

					const {default: parser} = await import("./lib/parser.js");

					parser("12345abcde", p => {
						p.exceptRun("abcde");
						read = p.get();

						return p.done();
					}).next();

					return read === "12345";
				}
			},
			"acceptString": {
				"123": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("1234567890", p => p.return(p.acceptString("123"))).next().value;

					return tk.type === 3 && tk.data === "123";
				},
				"456": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("1234567890", p => p.return(p.acceptString("456"))).next().value;

					return tk.type === 0 && tk.data === "";
				},
				"124": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("1234567890", p => p.return(p.acceptString("124"))).next().value;

					return tk.type === 2 && tk.data === "12";
				},
				"abcdef": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abcd", p => p.return(p.acceptString("abcdef"))).next().value;

					return tk.type === 4 && tk.data === "abcd";
				},
				"aBcDeF": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("aBcD", p => p.return(p.acceptString("abcdef"))).next().value;

					return tk.type === 1 && tk.data === "a";
				},
				"abcdef (2)": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abcd", p => p.return(p.acceptString("aBcDeF"))).next().value;

					return tk.type === 1 && tk.data === "a";
				},
				"aBcDeF (case insensitive)": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("aBcDeFgH", p => p.return(p.acceptString("abcdef", false))).next().value;

					return tk.type === 6 && tk.data === "aBcDeF";
				},
				"aBcDeF (case insensitive, 2)": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abcdefgh", p => p.return(p.acceptString("aBcDeF", false))).next().value;

					return tk.type === 6 && tk.data === "abcdef";
				}
			},
			"acceptWord": {
				"123": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("1234567890", p => {
						p.acceptWord([
							"012345",
							"123",
							"124"
						]);

						return p.return(1);
					      }).next().value;

					return tk.type === 1 && tk.data === "123";
				},
				"125": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("125", p => {
						p.acceptWord([
							"012345",
							"123",
							"124"
						]);

						return p.return(1);
					      }).next().value;

					return tk.type === 1 && tk.data === "";
				},
				"1234567890": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("1234567890", p => {
						p.acceptWord([
							"012345",
							"123",
							"124",
							"12354",
							"1234567"
						]);

						return p.return(1);
					      }).next().value;

					return tk.type === 1 && tk.data === "1234567";
				},
				"AbCdEfGh": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("AbCdEfGh", p => {
						p.acceptWord([
							"abc",
							"aBCDefgh",
							"abcdfg",
							"ABCDFG"
						], false);

						return p.return(1);
					      }).next().value;

					return tk.type === 1 && tk.data === "AbCdEfGh";
				}
			},
			"acceptRun": {
				"aabbbcccc": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("aabbbcccc", p => {
						p.acceptRun("a");
						p.acceptRun("b");
						p.acceptRun("d");

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "aabbb";
				},
				"ccccccaaaabbbbbbb": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("ccccccaaaabbbbbbb", p => {
						p.acceptRun("a");
						p.acceptRun("b");
						p.acceptRun("c");

						return [{
							"type": 2,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 2 && tk.data === "cccccc";
				},
				"aabbbcccc???": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("aabbbcccc", p => {
						p.acceptRun("a");
						p.acceptRun("b");
						p.acceptRun("c");
						p.acceptRun("d");

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "aabbbcccc";
				}
			},
			"length": {
				"simple": async () => {
					let l = 0;

					const {default: parser} = await import("./lib/parser.js");

					parser("12345abcde", p => {
						p.accept("123");
						p.accept("123");
						p.accept("123");
						p.accept("123");
						l = p.length();

						return p.done();
					}).next();

					return l === 3
				},
				"run": async () => {
					let l = 0;

					const {default: parser} = await import("./lib/parser.js");

					parser("12345abcde", p => {
						p.exceptRun("abcde");
						l = p.length();

						return p.done();
					}).next();

					return l === 5
				}
			},
			"except": {
				"abc": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abc", p => {
						p.except("a");
						p.except("b");
						p.except("d");

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "ab";
				},
				"cab": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("cab", p => {
						p.except("a");
						p.except("b");
						p.except("c");

						return [{
							"type": 2,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 2 && tk.data === "cab";
				},
				"abc???": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("abc", p => {
						p.except("a");
						p.except("b");
						p.except("c");
						p.except("a");
						p.except("b");
						p.except("c");

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "abc";
				}
			},
			"exceptRun": {
				"aabbbcccc": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("aabbbcccc", p => {
						p.exceptRun("a");
						p.exceptRun("b");
						p.exceptRun("cd");

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "aabbb";
				},
				"ccccccaaaabbbbbbb": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("ccccccaaaabbbbbbb", p => {
						p.exceptRun("a");
						p.exceptRun("b");
						p.exceptRun("c");

						return [{
							"type": 2,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 2 && tk.data === "ccccccaaaabbbbbbb";
				},
				"aabbbcccc???": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("aabbbcccc", p => {
						p.exceptRun("a");
						p.exceptRun("b");
						p.exceptRun("c");
						p.exceptRun("d");
						p.exceptRun("e");

						return [{
							"type": 1,
							"data": p.get()
						}, () => p.done()];
					      }).next().value;

					return tk.type === 1 && tk.data === "aabbbcccc";
				}
			},
			"done": {
				"empty": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("", p => {
						return p.done();
					      }),
					      a = JSON.stringify(tk.next().value),
					      b = JSON.stringify(tk.next().value);

					return a === `{"type":-1,"data":""}` && a === b;
				},
				"msg": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("", p => {
						return p.done("myMsg");
					      }),
					      a = JSON.stringify(tk.next().value),
					      b = JSON.stringify(tk.next().value);

					return a === `{"type":-1,"data":"myMsg"}` && a === b;
				}
			},
			"error": {
				"empty": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("", p => {
						return p.error();
					      }),
					      a = JSON.stringify(tk.next().value),
					      b = JSON.stringify(tk.next().value);

					return a === `{"type":-2,"data":"unknown error"}` && a === b;
				},
				"msg": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      tk = parser("", p => {
						return p.error("myErr");
					      }),
					      a = JSON.stringify(tk.next().value),
					      b = JSON.stringify(tk.next().value);

					return a === `{"type":-2,"data":"myErr"}` && a === b;
				}
			},
			"multi fn": async () => {
				const {default: parser} = await import("./lib/parser.js"),
				      tk = parser("12345abcde", p => {
					p.exceptRun("abcde");
					return [{"type": 1, "data": p.get()}, p => {
						p.acceptRun("abcde");

						return [{"type": 2, "data": p.get()}, () => p.done()];
					}];
				      }),
				      a = JSON.stringify(tk.next().value),
				      b = JSON.stringify(tk.next().value),
				      c = JSON.stringify(tk.next().value);

				return a === `{"type":1,"data":"12345"}` && b === `{"type":2,"data":"abcde"}` && c === `{"type":-1,"data":""}`;
			},
			"return": async () => {
				const {default: parser} = await import("./lib/parser.js"),
				      tk = parser("12345abcde", p => {
					p.exceptRun("abcde");
					return p.return(1, p => {
						p.acceptRun("abcde");

						return p.return(2);
					});
				      }),
				      a = JSON.stringify(tk.next().value),
				      b = JSON.stringify(tk.next().value),
				      c = JSON.stringify(tk.next().value);

				return a === `{"type":1,"data":"12345"}` && b === `{"type":2,"data":"abcde"}` && c === `{"type":-1,"data":""}`;
			}
		},
		"phraser": {
			"peek": {
				"12345abcde": async () => {
					const {default: parser} = await import("./lib/parser.js");

					let peeked = false;

					parser("12345abcde", p => [{"type": 1, "data": "12345"}, () => p.done()], p => {
						peeked = p.peek() === 1;

						return p.done();
					}).next();

					return peeked;
				},
				"abcde12345": async () => {
					const {default: parser} = await import("./lib/parser.js");

					let peeked = false;

					parser("abcde12345", p => [{"type": 2, "data": ""}, () => p.done()], p => {
						peeked = p.peek() === 2;

						return p.done();
					}).next();

					return peeked;
				}
			},
			"next": {
				"12345abcde": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => [{"type": 2, "data": "abcde"}, () => p.done()]], p => [{"type": +(p.next() === 1 && p.next() === 2), "data": p.get()}, () => p.done()]).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[{"type":1,"data":"12345"},{"type":2,"data":"abcde"}]}`;
				},
				"abcde": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 2, "data": "abcde"}, () => p.done()], p => [{"type": 2 + +(p.next() === 2 && p.next() === -1), "data": p.get()}, () => p.done()]).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[{"type":2,"data":"abcde"}]}`;
				}
			},
			"backup": {
				"12345abcde": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => [{"type": 2, "data": "abcde"}, () => p.done()]], p => {
						p.next();
						p.next();
						p.next();
						p.backup();
						return [{"type": 1, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[{"type":1,"data":"12345"}]}`;
				},
				"abcde": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 2, "data": "abcde"}, () => p.done()], p => {
						p.next();
						p.next();
						p.backup();
						p.next();
						return [{"type": 1, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[{"type":2,"data":"abcde"}]}`;
				}
			},
			"reset": {
				"12345abcde": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => [{"type": 2, "data": "abcde"}, () => p.done()]], p => {
						p.next();
						p.next();
						p.next();
						p.reset();
						p.next();
						return [{"type": 1, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[{"type":1,"data":"12345"}]}`;
				},
				"abcde": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 2, "data": "abcde"}, () => p.done()], p => {
						p.next();
						p.next();
						p.reset();
						return [{"type": 1, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[]}`;
				}
			},
			"accept": {
				"12345abcde": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => [{"type": 2, "data": "abcde"}, () => p.done()]], p => {
						p.accept(1);
						p.accept(2);

						return [{"type": 3, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[{"type":1,"data":"12345"},{"type":2,"data":"abcde"}]}`;
				},
				"abcde12345": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 2, "data": "abcde"}, () => p.done()], p => {
						p.accept(1);
						p.accept(2);

						return [{"type": 3, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[{"type":2,"data":"abcde"}]}`;
				}
			},
			"acceptRun": {
				"12345abcde": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => p.done()], p => {
						p.acceptRun(1);

						return [{"type": 3, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[{"type":1,"data":"12345"}]}`;
				},
				"123": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data":"1"}, () => [{"type": 1, "data":"2"}, () => [{"type": 2, "data":"3"}, () => [{"type": 3, "data":"3"}, () => p.done()]]]], p => {
						p.acceptRun(1, 2);

						return [{"type": 1, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[{"type":1,"data":"1"},{"type":1,"data":"2"},{"type":2,"data":"3"}]}`;
				},
				"123??": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data":"1"}, () => [{"type": 1, "data":"2"}, () => [{"type": 2, "data":"3"}, () => [{"type": 2, "data":"3"}, () => p.done()]]]], p => {
						p.acceptRun(1, 2);

						return [{"type": 1, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[{"type":1,"data":"1"},{"type":1,"data":"2"},{"type":2,"data":"3"},{"type":2,"data":"3"}]}`;
				}
			},
			"length": {
				"simple": async () => {
					let length = 0;

					const {default: parser} = await import("./lib/parser.js");

					parser("", p => [{"type": 1, "data":"1"}, () => [{"type": 1, "data":"2"}, () => [{"type": 2, "data":"3"}, () => [{"type": 3, "data":"3"}, () => p.done()]]]], p => {
						p.accept(1, 2);
						p.accept(1, 2);
						p.accept(1, 2);
						p.accept(1, 2);
						p.accept(1, 2);
						p.accept(1, 2);

						length = p.length();

						return p.done();
					}).next().value;

					return length === 3;
				},
				"run": async () => {
					let length = 0;

					const {default: parser} = await import("./lib/parser.js");

					parser("", p => [{"type": 1, "data":"1"}, () => [{"type": 1, "data":"2"}, () => [{"type": 2, "data":"3"}, () => [{"type": 3, "data":"3"}, () => p.done()]]]], p => {
						p.acceptRun(1, 2);

						length = p.length();

						return p.done();
					}).next().value;

					return length === 3;
				}
			},
			"except": {
				"12345abcde 1,1": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => [{"type": 2, "data": "abcde"}, () => p.done()]], p => {
						p.except(1);
						p.except(1);

						return [{"type": 3, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[]}`;
				},
				"12345abcde 1,2": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => [{"type": 2, "data": "abcde"}, () => p.done()]], p => {
						p.except(1);
						p.except(2);

						return [{"type": 3, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[{"type":1,"data":"12345"}]}`;
				},
				"12345abcde 2,2": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => [{"type": 2, "data": "abcde"}, () => p.done()]], p => {
						p.except(2);
						p.except(2);

						return [{"type": 3, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[{"type":1,"data":"12345"}]}`;
				},
				"12345abcde 2,1": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => [{"type": 2, "data": "abcde"}, () => p.done()]], p => {
						p.except(2);
						p.except(1);

						return [{"type": 3, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[{"type":1,"data":"12345"},{"type":2,"data":"abcde"}]}`;
				}
			},
			"exceptRun": {
				"12345abcde 1": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => p.done()], p => {
						p.exceptRun(1);

						return [{"type": 3, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[]}`;
				},
				"12345abcde 2": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data": "12345"}, () => p.done()], p => {
						p.exceptRun(2);

						return [{"type": 3, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":3,"data":[{"type":1,"data":"12345"}]}`;
				},
				"123 1,2": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data":"1"}, () => [{"type": 1, "data":"2"}, () => [{"type": 2, "data":"3"}, () => [{"type": 3, "data":"3"}, () => p.done()]]]], p => {
						p.exceptRun(1, 2);

						return [{"type": 1, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[]}`;
				},
				"123 3": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data":"1"}, () => [{"type": 1, "data":"2"}, () => [{"type": 2, "data":"3"}, () => [{"type": 3, "data":"3"}, () => p.done()]]]], p => {
						p.exceptRun(3);

						return [{"type": 1, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[{"type":1,"data":"1"},{"type":1,"data":"2"},{"type":2,"data":"3"}]}`;
				},
				"123?? 4": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => [{"type": 1, "data":"1"}, () => [{"type": 1, "data":"2"}, () => [{"type": 2, "data":"3"}, () => [{"type": 2, "data":"3"}, () => p.done()]]]], p => {
						p.exceptRun(4);

						return [{"type": 1, "data": p.get()}, () => p.done()];
					      }).next().value;

					return JSON.stringify(p) === `{"type":1,"data":[{"type":1,"data":"1"},{"type":1,"data":"2"},{"type":2,"data":"3"},{"type":2,"data":"3"}]}`;
				}
			},
			"done": {
				"empty": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => p.done(), p => p.done());

					return JSON.stringify(p.next().value) === `{"type":-1,"data":[]}` && JSON.stringify(p.next().value) === `{"type":-1,"data":[]}`;
				},
				"msg": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => p.done(), p => p.done("msg"));

					return JSON.stringify(p.next().value) === `{"type":-1,"data":[{"type":-1,"data":"msg"}]}` && JSON.stringify(p.next().value) === `{"type":-1,"data":[{"type":-1,"data":"msg"}]}`;
				}
			},
			"error": {
				"empty": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => p.done(), p => p.error());

					return JSON.stringify(p.next().value) === `{"type":-2,"data":[{"type":-2,"data":"unknown error"}]}` && JSON.stringify(p.next().value) === `{"type":-2,"data":[{"type":-2,"data":"unknown error"}]}`;
				},
				"msg": async () => {
					const {default: parser} = await import("./lib/parser.js"),
					      p = parser("", p => p.done(), p => p.error("custom error"));

					return JSON.stringify(p.next().value) === `{"type":-2,"data":[{"type":-2,"data":"custom error"}]}` && JSON.stringify(p.next().value) === `{"type":-2,"data":[{"type":-2,"data":"custom error"}]}`;
				}
			},
			"return": async () => {
				const {default: parser} = await import("./lib/parser.js"),
				      p = parser("", p => [{"type": 1, "data":"1"}, () => [{"type": 1, "data":"2"}, () => [{"type": 2, "data":"3"}, () => [{"type": 3, "data":"3"}, () => p.done()]]]], p => {
					p.acceptRun(1);

					return p.return(4, () => {
						p.acceptRun(2, 3);

						return p.return(5);
					});
				      }),
				      a = JSON.stringify(p.next().value),
				      b = JSON.stringify(p.next().value),
				      c = JSON.stringify(p.next().value);

				return a === `{"type":4,"data":[{"type":1,"data":"1"},{"type":1,"data":"2"}]}` && b === `{"type":5,"data":[{"type":2,"data":"3"},{"type":3,"data":"3"}]}` && c === `{"type":-1,"data":[]}`;
			}
		},
		"withNumbers": {
			"tokens": async () => {
				const {default: parser, withNumbers} = await import("./lib/parser.js"),
				      tk = withNumbers(parser("", p => [{"type": 1, "data": "123"}, () => [{"type": 2, "data": "  \n  "}, () => [{"type": 3, "data": "\n\nabc"}, () => p.done()]]])),
				      a = JSON.stringify(tk.next().value),
				      b = JSON.stringify(tk.next().value),
				      c = JSON.stringify(tk.next().value),
				      d = JSON.stringify(tk.next().value);

				return a === `{"type":1,"data":"123","pos":0,"line":0,"linePos":0}` && b === `{"type":2,"data":"  \\n  ","pos":3,"line":0,"linePos":3}` && c === `{"type":3,"data":"\\n\\nabc","pos":8,"line":1,"linePos":2}` && d === `{"type":-1,"data":"","pos":13,"line":3,"linePos":3}`;
			},
			"phrases": async () => {
				const {default: parser, withNumbers} = await import("./lib/parser.js"),
				      tk = withNumbers(parser("", p => p.done(), p => [
					{"type": 1, "data": [
						{"type": 1, "data": "abc"}
					]}, () => [ {"type": 2, "data": [
						{"type": 2, "data": "123"},
						{"type": 3, "data": "\n456"}
					]}, () => [{"type": 3, "data": [
						{"type": 4, "data": "nl\n"},
						{"type": 5, "data": "Jackdaws love my big sphinx of quartz"},
						{"type": 6, "data": "\n\n\n"}
					]}, () => p.done("msg")]
				      ]])),
				      a = JSON.stringify(tk.next().value),
				      b = JSON.stringify(tk.next().value),
				      c = JSON.stringify(tk.next().value),
				      d = JSON.stringify(tk.next().value),
				      e = JSON.stringify(tk.next().value);

				return a === `{"type":1,"data":[{"type":1,"data":"abc","pos":0,"line":0,"linePos":0}]}` && b === `{"type":2,"data":[{"type":2,"data":"123","pos":3,"line":0,"linePos":3},{"type":3,"data":"\\n456","pos":6,"line":0,"linePos":6}]}` && c === `{"type":3,"data":[{"type":4,"data":"nl\\n","pos":10,"line":1,"linePos":3},{"type":5,"data":"Jackdaws love my big sphinx of quartz","pos":13,"line":2,"linePos":0},{"type":6,"data":"\\n\\n\\n","pos":50,"line":2,"linePos":37}]}` && d === `{"type":-1,"data":[{"type":-1,"data":"msg","pos":53,"line":5,"linePos":0}]}` && d === e;
			}
		},
		"processToEnd": {
			"tokens": async () => {
				const {default: parser, processToEnd} = await import("./lib/parser.js"),
				      tk = processToEnd(parser("", p => [{"type": 1, "data": "123"}, () => [{"type": 2, "data": "  \n  "}, () => [{"type": 3, "data": "\n\nabc"}, () => p.done()]]])),
				      a = JSON.stringify(tk.next().value),
				      b = JSON.stringify(tk.next().value),
				      c = JSON.stringify(tk.next().value),
				      d = tk.next();

				return a === `{"type":1,"data":"123"}` && b === `{"type":2,"data":"  \\n  "}` && c === `{"type":3,"data":"\\n\\nabc"}` && d.done === true && d.value === undefined;
			},
			"phrases": async () => {
				const {default: parser, processToEnd} = await import("./lib/parser.js"),
				      tk = processToEnd(parser("", p => p.done(), p => [
					{"type": 1, "data": [
						{"type": 1, "data": "abc"}
					]}, () => [ {"type": 2, "data": [
						{"type": 2, "data": "123"},
						{"type": 3, "data": "\n456"}
					]}, () => [{"type": 3, "data": [
						{"type": 4, "data": "nl\n"},
						{"type": 5, "data": "Jackdaws love my big sphinx of quartz"},
						{"type": 6, "data": "\n\n\n"}
					]}, () => p.done("msg")]
				      ]])),
				      a = JSON.stringify(tk.next().value),
				      b = JSON.stringify(tk.next().value),
				      c = JSON.stringify(tk.next().value),
				      d = tk.next();

				return a === `{"type":1,"data":[{"type":1,"data":"abc"}]}` && b === `{"type":2,"data":[{"type":2,"data":"123"},{"type":3,"data":"\\n456"}]}` && c === `{"type":3,"data":[{"type":4,"data":"nl\\n"},{"type":5,"data":"Jackdaws love my big sphinx of quartz"},{"type":6,"data":"\\n\\n\\n"}]}` && d.done === true && d.value === undefined;
			}
		}
	},
	"markdown": Object.entries({
		"thematic breaks": {
			"dashes": [
				["---", "<hr>"],
				["-----", "<hr>"],
				["---------------", "<hr>"]
			],
			"dashes with leading spaces": [
				[" ---", "<hr>"],
				["  ---", "<hr>"],
				["   ---", "<hr>"]
			],
			"dashes with whitespace in between": [
				["- - -", "<hr>"],
				["-\t-\t-", "<hr>"],
				["- \t - \t -", "<hr>"]
			],
			"dashes with whitespace at end": [
				["--- ", "<hr>"],
				["---\t", "<hr>"],
				["--- \t \t   \t\t", "<hr>"]
			],
			"stars": [
				["***", "<hr>"],
				["*****", "<hr>"],
				["***************", "<hr>"]
			],
			"stars with leading spaces": [
				[" ***", "<hr>"],
				["  ***", "<hr>"],
				["   ***", "<hr>"]
			],
			"stars with whitespace in between": [
				["* * *", "<hr>"],
				["*\t*\t*", "<hr>"],
				["* \t * \t *", "<hr>"]
			],
			"stars with whitespace at end": [
				["*** ", "<hr>"],
				["***\t", "<hr>"],
				["*** \t \t   \t\t", "<hr>"]
			],
			"underscores": [
				["___", "<hr>"],
				["_____", "<hr>"],
				["_______________", "<hr>"]
			],
			"underscores with leading spaces": [
				[" ___", "<hr>"],
				["  ___", "<hr>"],
				["   ___", "<hr>"]
			],
			"underscores with whitespace in between": [
				["_ _ _", "<hr>"],
				["_\t_\t_", "<hr>"],
				["_ \t _ \t _", "<hr>"]
			],
			"underscores with whitespace at end": [
				["___ ", "<hr>"],
				["___\t", "<hr>"],
				["___ \t \t   \t\t", "<hr>"]
			],
			"wrong characters": [
				["+++", "<p>+++</p>"],
				["===", "<p>===</p>"]
			],
			"inconsistant characters": [
				[" -*-", "<p>-*-</p>"],
				[" -_-", "<p>-_-</p>"]
			],
			"not enough characters": [
				["--", "<p>--</p>"],
				["**", "<p>**</p>"],
				["__", "<p>__</p>"]
			],
			"too much indentation": [
				["    ---", "<pre><code>---</code></pre>"],
				["    ***", "<pre><code>***</code></pre>"],
				["    ___", "<pre><code>___</code></pre>"]
			],
			"non-whitespace at end": [
				["---a", "<p>---a</p>"],
				["*** b", "<p>*** b</p>"],
				["___\tc", "<p>___\tc</p>"]
			],
			"invalid characters in line": [
				["_ _ _ _ a", "<p>_ _ _ _ a</p>"],
				["a------", "<p>a------</p>"],
				["---a---", "<p>---a---</p>"]
			],
			"surrounding text": [
				["Foo\n    ***", "<p>Foo\n***</p>"],
				["Foo\n   ***", "<p>Foo</p><hr>"],
				["Foo\n   ***\nText After", "<p>Foo</p><hr><p>Text After</p>"],
				["Foo\n    ---", "<p>Foo\n---</p>"],
				["Foo\n   ---", "<h2>Foo</h2>"],
				["Foo\n   ---\nText After", "<h2>Foo</h2><p>Text After</p>"],
				["Foo\n    ___", "<p>Foo\n___</p>"],
				["Foo\n   ___", "<p>Foo</p><hr>"],
				["Foo\n   ___\nText After", "<p>Foo</p><hr><p>Text After</p>"]
			]
		},
		"headings": {
			"empty headings": [
				["#", "<h1></h1>"],
				["##", "<h2></h2>"],
				["###", "<h3></h3>"],
				["####", "<h4></h4>"],
				["#####", "<h5></h5>"],
				["######", "<h6></h6>"]
			],
			"heading1": [
				["# Some Text", "<h1>Some Text</h1>"],
				["#   Some Text\t", "<h1>Some Text</h1>"],
				[" # Some Text", "<h1>Some Text</h1>"],
				["  # Some Text", "<h1>Some Text</h1>"],
				["   # Some Text", "<h1>Some Text</h1>"],
				["# Some Text #", "<h1>Some Text</h1>"],
				["# Some Text ##", "<h1>Some Text</h1>"],
				["# Some Text ##  ", "<h1>Some Text</h1>"],
				["# Some Text #########", "<h1>Some Text</h1>"],
				["# Some Text ###\\######", "<h1>Some Text #########</h1>"],
				["#           Some Text With Long Spaces              ", "<h1>Some Text With Long Spaces</h1>"]
			],
			"heading2": [
				["## Some Text", "<h2>Some Text</h2>"],
				["##   Some Text\t", "<h2>Some Text</h2>"],
				[" ## Some Text", "<h2>Some Text</h2>"],
				["  ## Some Text", "<h2>Some Text</h2>"],
				["   ## Some Text", "<h2>Some Text</h2>"],
				["## Some Text #", "<h2>Some Text</h2>"],
				["## Some Text ##", "<h2>Some Text</h2>"],
				["## Some Text ##\t\t", "<h2>Some Text</h2>"],
				["## Some Text #########", "<h2>Some Text</h2>"],
				["## Some Text ###\\######", "<h2>Some Text #########</h2>"],
				["##           Some Text With Long Spaces              ", "<h2>Some Text With Long Spaces</h2>"]
			],
			"heading3": [
				["### Some Text", "<h3>Some Text</h3>"],
				["###   Some Text\t", "<h3>Some Text</h3>"],
				[" ### Some Text", "<h3>Some Text</h3>"],
				["  ### Some Text", "<h3>Some Text</h3>"],
				["   ### Some Text", "<h3>Some Text</h3>"],
				["### Some Text #", "<h3>Some Text</h3>"],
				["### Some Text ##", "<h3>Some Text</h3>"],
				["### Some Text ##\t ", "<h3>Some Text</h3>"],
				["### Some Text #########", "<h3>Some Text</h3>"],
				["### Some Text ###\\######", "<h3>Some Text #########</h3>"],
				["###           Some Text With Long Spaces              ", "<h3>Some Text With Long Spaces</h3>"]
			],
			"heading4": [
				["#### Some Text", "<h4>Some Text</h4>"],
				["####   Some Text\t", "<h4>Some Text</h4>"],
				[" #### Some Text", "<h4>Some Text</h4>"],
				["  #### Some Text", "<h4>Some Text</h4>"],
				["   #### Some Text", "<h4>Some Text</h4>"],
				["#### Some Text #", "<h4>Some Text</h4>"],
				["#### Some Text ##", "<h4>Some Text</h4>"],
				["#### Some Text ##\t ", "<h4>Some Text</h4>"],
				["#### Some Text #########", "<h4>Some Text</h4>"],
				["#### Some Text ###\\######", "<h4>Some Text #########</h4>"],
				["####           Some Text With Long Spaces              ", "<h4>Some Text With Long Spaces</h4>"]
			],
			"heading5": [
				["##### Some Text", "<h5>Some Text</h5>"],
				["#####   Some Text\t", "<h5>Some Text</h5>"],
				[" ##### Some Text", "<h5>Some Text</h5>"],
				["  ##### Some Text", "<h5>Some Text</h5>"],
				["   ##### Some Text", "<h5>Some Text</h5>"],
				["##### Some Text #", "<h5>Some Text</h5>"],
				["##### Some Text ##", "<h5>Some Text</h5>"],
				["##### Some Text ## \t", "<h5>Some Text</h5>"],
				["##### Some Text #########", "<h5>Some Text</h5>"],
				["##### Some Text ###\\######", "<h5>Some Text #########</h5>"],
				["#####           Some Text With Long Spaces              ", "<h5>Some Text With Long Spaces</h5>"]
			],
			"heading6": [
				["###### Some Text", "<h6>Some Text</h6>"],
				["######   Some Text\t", "<h6>Some Text</h6>"],
				[" ###### Some Text", "<h6>Some Text</h6>"],
				["  ###### Some Text", "<h6>Some Text</h6>"],
				["   ###### Some Text", "<h6>Some Text</h6>"],
				["###### Some Text #", "<h6>Some Text</h6>"],
				["###### Some Text ##", "<h6>Some Text</h6>"],
				["###### Some Text ## \t", "<h6>Some Text</h6>"],
				["###### Some Text #########", "<h6>Some Text</h6>"],
				["###### Some Text ###\\######", "<h6>Some Text #########</h6>"],
				["######           Some Text With Long Spaces              ", "<h6>Some Text With Long Spaces</h6>"]
			],
			"not a heading": [
				["####### heading", "<p>####### heading</p>"],
				["#hashtag", "<p>#hashtag</p>"],
				["#5 bolt", "<p>#5 bolt</p>"],
				["\\# not a title", "<p># not a title</p>"],
				["    # foo", "<pre><code># foo</code></pre>"],
				["foo\n    # bar", "<p>foo\n# bar</p>"]
			]
		},
		"setext": {
			"equals": [
				["heading\n=", "<h1>heading</h1>"],
				["heading\n==", "<h1>heading</h1>"],
				["heading\n===", "<h1>heading</h1>"],
				["heading\n=====", "<h1>heading</h1>"],
				["heading\n ====", "<h1>heading</h1>"],
				["heading\n  ====", "<h1>heading</h1>"],
				["heading\n   ====", "<h1>heading</h1>"],
				["heading\n== ", "<h1>heading</h1>"],
				["heading\n==\t", "<h1>heading</h1>"],
				["heading\n==\t \t  ", "<h1>heading</h1>"]
			],
			"dashes": [
				["heading\n-", "<h2>heading</h2>"],
				["heading\n--", "<h2>heading</h2>"],
				["heading\n---", "<h2>heading</h2>"],
				["heading\n----", "<h2>heading</h2>"],
				["heading\n ----", "<h2>heading</h2>"],
				["heading\n  ----", "<h2>heading</h2>"],
				["heading\n   ----", "<h2>heading</h2>"],
				["heading\n-- ", "<h2>heading</h2>"],
				["heading\n--\t", "<h2>heading</h2>"],
				["heading\n--\t \t  ", "<h2>heading</h2>"]
			],
			"not a heading": [
				["heading\n    ====", "<p>heading\n====</p>"],
				["heading\n    ----", "<p>heading\n----</p>"],
				["heading\n==== a", "<p>heading\n==== a</p>"],
				["heading\n---- a", "<p>heading\n---- a</p>"],
				["heading\n== ==", "<p>heading\n== ==</p>"],
				["heading\n-- --", "<p>heading</p><hr>"],
				["    Foo\n    ---\n\n    Foo\n---", "<pre><code>Foo\n---\n\nFoo\n</code></pre><hr>"],
				["> foo\n---", "<blockquote><p>foo</p></blockquote><hr>"],
				["> foo\nbar\n===", "<blockquote><p>foo\nbar\n===</p></blockquote>"],
				["====", "<p>====</p>"],
				["---\n---", "<hr><hr>"]
			],
			"complex setext header": [
				["Foo\nbar\n---\nbaz", "<h2>Foo\nbar</h2><p>baz</p>"],
				["Foo\n\nbar\n---\nbaz", "<p>Foo</p><h2>bar</h2><p>baz</p>"],
				["Foo\nbar\n\n---\nbaz", "<p>Foo\nbar</p><hr><p>baz</p>"],
				["Foo\nbar\n\\---\nbaz", "<p>Foo\nbar\n---\nbaz</p>"],
				["---\nFoo\n---\nBar\n---\nBaz", "<hr><h2>Foo</h2><h2>Bar</h2><p>Baz</p>"]
			]
		},
		"code blocks": {
			"simple code blocks": [
				["    a simple\n      indented code block", "<pre><code>a simple\n  indented code block</code></pre>"],
				["\ta simple\n\t  indented code block", "<pre><code>a simple\n  indented code block</code></pre>"],
				["    <a/>\n    *hi*\n", "<pre><code>&lt;a/&gt;\n*hi*\n</code></pre>"],
				["    an indented code block\n\n    with a blank line", "<pre><code>an indented code block\n\nwith a blank line</code></pre>"],
				["    foo  \t", "<pre><code>foo  \t</code></pre>"],
				["    foo  \t\n    \t \t", "<pre><code>foo  \t\n\t \t</code></pre>"],
				["    chunk1\n\n    chunk2\n  \n \n \n    chunk3", "<pre><code>chunk1\n\nchunk2\n\n\n\nchunk3</code></pre>"],
				["    chunk1\n      \n      chunk2", "<pre><code>chunk1\n  \n  chunk2</code></pre>"],
				["        foo\n    bar", "<pre><code>    foo\nbar</code></pre>"],
				["    \n    foo\n    ", "<pre><code>foo\n</code></pre>"],
				["    foo  ", "<pre><code>foo  </code></pre>"],
				["    </textarea>", "<pre><code>&lt;/textarea&gt;</code></pre>"]
			],
			"code blocks with surrounding": [
				["a simple\n      paragraph", "<p>a simple\nparagraph</p>"],
				["a paragraph\n\n    a simple\n      indented code block", "<p>a paragraph</p><pre><code>a simple\n  indented code block</code></pre>"],
				["    a simple\n      indented code block\na paragraph", "<pre><code>a simple\n  indented code block\n</code></pre><p>a paragraph</p>"],
				["# Heading\n    foo\nHeading\n------\n    foo\n----", "<h1>Heading</h1><pre><code>foo\n</code></pre><h2>Heading</h2><pre><code>foo\n</code></pre><hr>"]
			],
			"not a code block": [
				["Foo\n    bar", "<p>Foo\nbar</p>"]
			]
		},
		"fenced code blocks": {
			"simple fenced": [
				["```\nCode Here\n```", "<pre><code>Code Here\n</code></pre>"],
				["~~~\nCode Here\n~~~", "<pre><code>Code Here\n</code></pre>"],
				[" ````\n Code Here\n```\nabc\n ````", "<pre><code>Code Here\n```\nabc\n</code></pre>"],
				["   ~~~~\n Code Here\n~~~\nabc\n   ~~~~", "<pre><code>Code Here\n~~~\nabc\n</code></pre>"],
				["   ```\n   Code Here\n  ~~~\n abc\n  ~~~\n   ```", "<pre><code>Code Here\n~~~\nabc\n~~~\n</code></pre>"],
				["   ~~~\n   Code Here\n  ```\n abc\n  ```\n   ~~~", "<pre><code>Code Here\n```\nabc\n```\n</code></pre>"],
				["```\n``` a\n```", "<pre><code>``` a\n</code></pre>"],
				["```\nCode Here", "<pre><code>Code Here</code></pre>"],
				["```\n<\n >\n```", "<pre><code>&lt;\n &gt;\n</code></pre>"],
				["~~~\n<\n >\n~~~", "<pre><code>&lt;\n &gt;\n</code></pre>"],
				["```", "<pre><code></code></pre>"],
				["~~~", "<pre><code></code></pre>"],
				["```\n\n\n  \n```", "<pre><code>  \n</code></pre>"],
				["~~~\n\n\n  \n~~~", "<pre><code>  \n</code></pre>"],
				["```\n```", "<pre><code></code></pre>"],
				["~~~\n~~~", "<pre><code></code></pre>"],
				["  ```\naaa\n  aaa\n  ```", "<pre><code>aaa\naaa\n</code></pre>"],
				["  ~~~\naaa\n  aaa\n  ~~~", "<pre><code>aaa\naaa\n</code></pre>"],
				["   ```\n   aaa\n    aaa\n  aaa\n   ```", "<pre><code>aaa\n aaa\naaa\n</code></pre>"],
				["   ~~~\n   aaa\n    aaa\n  aaa\n   ~~~", "<pre><code>aaa\n aaa\naaa\n</code></pre>"],
				["```\naaa\n  ```", "<pre><code>aaa\n</code></pre>"],
				["~~~\naaa\n  ~~~", "<pre><code>aaa\n</code></pre>"],
				["~~~~~~\naaa\n~~~ ~~", "<pre><code>aaa\n~~~ ~~</code></pre>"],
				["```\naaa\n    ```", "<pre><code>aaa\n    ```</code></pre>"],
				["~~~\naaa\n    ~~~", "<pre><code>aaa\n    ~~~</code></pre>"],
				["```\n``` aaa\n```", "<pre><code>``` aaa\n</code></pre>"],
				["~~~\n~~~ aaa\n~~~", "<pre><code>~~~ aaa\n</code></pre>"],
				["```\n</textarea>\n```", "<pre><code>&lt;/textarea&gt;\n</code></pre>"]
			],
			"fenced with info string": [
				["```bash\nCode Here\n```", "<pre class=\"language-bash\"><code>Code Here\n</code></pre>"],
				["~~~ cpp \nCode Here\n~~~", "<pre class=\"language-cpp\"><code>Code Here\n</code></pre>"],
				[" ````	python	\n Code Here\n```\nabc\n ````", "<pre class=\"language-python\"><code>Code Here\n```\nabc\n</code></pre>"],
				["   ~~~~	code here \n Code Here\n```\nabc\n   ~~~~", "<pre class=\"language-code language-here\"><code>Code Here\n```\nabc\n</code></pre>"],
				["```ruby\ndef foo(x)\n  return 3\nend\n```", "<pre class=\"language-ruby\"><code>def foo(x)\n  return 3\nend\n</code></pre>"],
				["~~~ aa ``` ~~~\nfoo\n~~~", "<pre class=\"language-aa\"><code>foo\n</code></pre>"]
			],
			"mixed blocks": [
				["> ```\n> aaa\n\nbbb", "<blockquote><pre><code>aaa\n</code></pre></blockquote><p>bbb</p>"],
				["> ~~~\n> aaa\n\nbbb", "<blockquote><pre><code>aaa\n</code></pre></blockquote><p>bbb</p>"],
				["foo\n```\nbar\n```\nbaz", "<p>foo</p><pre><code>bar\n</code></pre><p>baz</p>"],
				["foo\n---\n~~~\nbar\n~~~\n# baz", "<h2>foo</h2><pre><code>bar\n</code></pre><h1>baz</h1>"]
			],
			"not a fenced code block": [
				["    ```\n    aaa\n    ```", "<pre><code>```\naaa\n```</code></pre>"]
			]
		},
		"raw html": {
			"type 1": [
				['<pre language="haskell"><code>\nimport Text.HTML.TagSoup\n\nmain :: IO ()\nmain = print $ parseTags tags\n</code></pre>\nokay', '<pre language="haskell"><code>\nimport Text.HTML.TagSoup\n\nmain :: IO ()\nmain = print $ parseTags tags\n</code></pre>\n<p>okay</p>'],
				['<script type="text/javascript">\n// JavaScript example\n\ndocument.getElementById("demo").innerHTML = "Hello JavaScript!";\n</script>\nokay', '<script type="text/javascript">\n// JavaScript example\n\ndocument.getElementById("demo").innerHTML = "Hello JavaScript!";\n</script>\n<p>okay</p>'],
				['<textarea>\n\n*foo*\n\n_bar_\n\n</textarea>', '<textarea>\n*foo*\n\n_bar_\n\n</textarea>'],
				['<style\n  type="text/css">\nh1 {color:red;}\n\np {color:blue;}\n</style>\nokay', '<style type="text/css">\nh1 {color:red;}\n\np {color:blue;}\n</style>\n<p>okay</p>']
			],
			"type 2": [
				['<!-- foo -->*bar*\nbaz', '<!-- foo -->*bar*\n<p>baz</p>']
			],
			"type 3": [
				["<?php\n\n\n  echo '>';\n\n?>\nokay", "<!--?php\n\n\n  echo '-->';\n\n?&gt;\n<p>okay</p>"]
			],
			"type 4": [
				["<!DOCTYPE html>", ""]
			],
			"type 5": [
				["<![CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]>\nokay", "<!--[CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]-->\n<p>okay</p>"]
			],
			"type 6": [
				["<center>\nData\n</center>", "<center>\nData\n</center>"],
				["<center>Data</center>", "<center>Data</center>"],
				["<center>More\nData", "<center>More\nData</center>"],
				["Text Before\n\n<center>\nData\n</center>\nText After", "<p>Text Before</p><center>\nData\n</center>\nText After"],
				["Text Before\n\n<center>\nData\n</center>\n\nText After", "<p>Text Before</p><center>\nData\n</center>\n\n<p>Text After</p>"],
				["<center>More\nData\n\nClose?", "<center>More\nData\n\n<p>Close?</p></center>"],
				["</center>*bar*\n\nbaz", "*bar*\n\n<p>baz</p>"]
			],
			"type 7": [
				["<Warning>\n*bar*\n</Warning>", "<warning>\n*bar*\n</warning>"],
				['<i class="foo">\n*bar*\n</i>', '<i class="foo">\n*bar*\n</i>'],
				["<del>\n*foo*\n</del>", "<del>\n*foo*\n</del>"],
				["<del>\n\n*foo*\n\n</del>", "<del>\n\n<p><em>foo</em></p></del>"],
				['Foo\n<a href="bar">\nbaz', '<p>Foo\n<a href="bar">\nbaz</a></p>'],
				['Foo\n<foo>\nbaz\n</foo>\nMore Foo\n\nMore Text', '<p>Foo\n<foo>\nbaz\n</foo>\nMore Foo</p><p>More Text</p>']
			]
		},
		"link reference": {
			"simple": [
				["[foo]: /url \"title\"\n\n[foo]", "<p><a href=\"/url\" title=\"title\">foo</a></p>"],
				["   [foo]: \n      /url  \n           'the title'  \n\n[foo]", "<p><a href=\"/url\" title=\"the title\">foo</a></p>"],
				["[Foo*bar\\]]:my_(url) 'title (with parens)'\n\n[Foo*bar\\]]", "<p><a href=\"my_(url)\" title=\"title (with parens)\">Foo*bar]</a></p>"],
				["[Foo bar]:\n<my url>\n'title'\n\n[Foo bar]", "<p><a href=\"my url\" title=\"title\">Foo bar</a></p>"],
				["[foo]: /url '\ntitle\nline1\nline2\n'\n\n[foo]", "<p><a href=\"/url\" title=\"\ntitle\nline1\nline2\n\">foo</a></p>"],
				["[foo]: /url 'title\n\nwith blank line'\n\n[foo]", "<p>[foo]: /url 'title</p><p>with blank line'</p><p>[foo]</p>"],
				["[foo]:\n/url\n\n[foo]", "<p><a href=\"/url\">foo</a></p>"],
				["[foo]:\n\n[foo]", "<p>[foo]:</p><p>[foo]</p>"],
				["[foo]: <>\n\n[foo]", "<p><a href=\"\">foo</a></p>"],
				["[foo]: <bar>(baz)\n\n[foo]", "<p>[foo]: <bar>(baz)</bar></p><p>[foo]</p>"],
				["[foo]: /url\\bar\\*baz \"foo\\\"bar\\baz\"\n\n[foo]", "<p><a href=\"/url\\bar*baz\" title=\"foo&quot;bar\\baz\">foo</a></p>"],
				["[foo]\n\n[foo]: url", "<p><a href=\"url\">foo</a></p>"],
				["[foo]\n\n[foo]: first\n[foo]: second", "<p><a href=\"first\">foo</a></p>"],
				["[FOO]: /url\n\n[Foo]", "<p><a href=\"/url\">Foo</a></p>"],
				["[ΑΓΩ]: /φου\n\n[αγω]", "<p><a href=\"/φου\">αγω</a></p>"],
				["[foo]: /url", ""],
				["[\nfoo\n]: /url\nbar", "<p>bar</p>"],
				["[foo]: /url \"title\" ok", "<p>[foo]: /url \"title\" ok</p>"],
				["[foo]: /url\n\"title\" ok", "<p>\"title\" ok</p>"],
				["    [foo]: /url \"title\"\n\n[foo]", "<pre><code>[foo]: /url \"title\"\n</code></pre><p>[foo]</p>"],
				["```\n[foo]: /url\n```\n\n\n[foo]", "<pre><code>[foo]: /url\n</code></pre><p>[foo]</p>"],
				["Foo\n[bar]: /baz\n\n[bar]", "<p>Foo\n[bar]: /baz</p><p>[bar]</p>"],
				["# [Foo]\n[foo]: /url\n> bar", "<h1><a href=\"/url\">Foo</a></h1><blockquote><p>bar</p></blockquote>"],
				["[foo]: /url\nbar\n===\n[foo]", "<h1>bar</h1><p><a href=\"/url\">foo</a></p>"],
				["[foo]: /url\n===\n[foo]", "<p>===\n<a href=\"/url\">foo</a></p>"],
				["[foo]: /foo-url \"foo\"\n[bar]: /bar-url\n  \"bar\"\n[baz]: /baz-url\n\n[foo],\n[bar],\n[baz]", "<p><a href=\"/foo-url\" title=\"foo\">foo</a>,\n<a href=\"/bar-url\" title=\"bar\">bar</a>,\n<a href=\"/baz-url\">baz</a></p>"],
				["[foo]\n\n> [foo]: /url", "<p><a href=\"/url\">foo</a></p><blockquote></blockquote>"]
			]
		},
		"paragraphs": {
			"leading whitespace": [
				["aaa\n\nbbb", "<p>aaa</p><p>bbb</p>"],
				["aaa\nbbb\n\nccc\nddd", "<p>aaa\nbbb</p><p>ccc\nddd</p>"],
				["aaa\nbbb\n\n\nccc\nddd", "<p>aaa\nbbb</p><p>ccc\nddd</p>"],
				["  aaa\nbbb", "<p>aaa\nbbb</p>"],
				["aaa\n             bbb\n                                       ccc", "<p>aaa\nbbb\nccc</p>"],
				["    aaa\nbbb", "<pre><code>aaa\n</code></pre><p>bbb</p>"]
			]
		},
		"block quotes": {
			"simple": [
				["> # Foo\n> bar\n> baz", "<blockquote><h1>Foo</h1><p>bar\nbaz</p></blockquote>"],
				["># Foo\n>bar\n> baz", "<blockquote><h1>Foo</h1><p>bar\nbaz</p></blockquote>"],
				["   > # Foo\n   > bar\n > baz", "<blockquote><h1>Foo</h1><p>bar\nbaz</p></blockquote>"],
				[" >", "<blockquote></blockquote>"],
				[" >\n>  \n> ", "<blockquote></blockquote>"],
				[">\n> foo\n>  ", "<blockquote><p>foo</p></blockquote>"],
				["> foo\n\n> bar", "<blockquote><p>foo</p></blockquote><blockquote><p>bar</p></blockquote>"],
				["> foo\n> bar", "<blockquote><p>foo\nbar</p></blockquote>"],
				["> foo\n>\n> bar", "<blockquote><p>foo</p><p>bar</p></blockquote>"],
				["foo\n> bar", "<p>foo</p><blockquote><p>bar</p></blockquote>"],
				["> aaa\n***\n> bbb", "<blockquote><p>aaa</p></blockquote><hr><blockquote><p>bbb</p></blockquote>"],
				[">     code\n\n>    not code", "<blockquote><pre><code>code\n</code></pre></blockquote><blockquote><p>not code</p></blockquote>"]
			],
			"not a block quote": [
				["    > # Foo\n    > bar\n    > baz", "<pre><code>&gt; # Foo\n&gt; bar\n&gt; baz</code></pre>"]
			],
			"laziness": [
				["> # Foo\n> bar\nbaz", "<blockquote><h1>Foo</h1><p>bar\nbaz</p></blockquote>"],
				["> bar\nbaz\n> foo", "<blockquote><p>bar\nbaz\nfoo</p></blockquote>"],
				["> foo\n> ---", "<blockquote><h2>foo</h2></blockquote>"],
				["> foo\n---", "<blockquote><p>foo</p></blockquote><hr>"],
				[">     foo\n    bar", "<blockquote><pre><code>foo\n</code></pre></blockquote><pre><code>bar</code></pre>"],
				["> ```\nfoo\n```", "<blockquote><pre><code></code></pre></blockquote><p>foo</p><pre><code></code></pre>"],
				["> foo\n    - bar", "<blockquote><p>foo\n- bar</p></blockquote>"],
				["> bar\nbaz", "<blockquote><p>bar\nbaz</p></blockquote>"],
				["> bar\n\nbaz", "<blockquote><p>bar</p></blockquote><p>baz</p>"],
				["> bar\n>\nbaz", "<blockquote><p>bar</p></blockquote><p>baz</p>"]
			],
			"multi depth": [
				["> > > foo\nbar", "<blockquote><blockquote><blockquote><p>foo\nbar</p></blockquote></blockquote></blockquote>"],
				[">>> foo\n> bar\n>>baz", "<blockquote><blockquote><blockquote><p>foo\nbar\nbaz</p></blockquote></blockquote></blockquote>"]
			]
		},
		"list items": {
			"simple": [
				["1.  A paragraph\n    with two lines.\n\n        indented code\n\n    > A block quote.", "<ol><li><p>A paragraph\nwith two lines.</p><pre><code>indented code\n</code></pre><blockquote><p>A block quote.</p></blockquote></li></ol>"],
				["- one\n\n two", "<ul><li>one</li></ul><p>two</p>"],
				["- one\n\n  two", "<ul><li><p>one</p><p>two</p></li></ul>"],
				[" -    one\n\n     two", "<ul><li>one</li></ul><pre><code> two</code></pre>"],
				[" -    one\n\n      two", "<ul><li><p>one</p><p>two</p></li></ul>"],
				["   > > 1.  one\n>>\n>>     two", "<blockquote><blockquote><ol><li><p>one</p><p>two</p></li></ol></blockquote></blockquote>"],
				[">>- one\n>>\n  >  > two", "<blockquote><blockquote><ul><li>one</li></ul><p>two</p></blockquote></blockquote>"],
				["- foo\n\n\n\n  bar", "<ul><li><p>foo</p><p>bar</p></li></ul>"],
				["1.  foo\n\n    ```\n    bar\n    ```\n    baz\n\n    > bam", "<ol><li><p>foo</p><pre><code>bar\n</code></pre><p>baz</p><blockquote><p>bam</p></blockquote></li></ol>"],
				["- Foo\n\n      bar\n\n\n      baz", "<ul><li><p>Foo</p><pre><code>bar\n\n\nbaz</code></pre></li></ul>"],
				["123456789. ok", "<ol start=\"123456789\"><li>ok</li></ol>"],
				["0. ok", "<ol start=\"0\"><li>ok</li></ol>"],
				["003. ok", "<ol start=\"3\"><li>ok</li></ol>"],
				["- foo\n\n      bar", "<ul><li><p>foo</p><pre><code>bar</code></pre></li></ul>"],
				["  10.  foo\n\n           bar", "<ol start=\"10\"><li><p>foo</p><pre><code>bar</code></pre></li></ol>"],
				["1.     indented code\n\n   paragraph\n\n       more code", "<ol><li><pre><code>indented code\n</code></pre><p>paragraph</p><pre><code>more code</code></pre></li></ol>"],
				["1.      indented code\n\n   paragraph\n\n       more code", "<ol><li><pre><code> indented code\n</code></pre><p>paragraph</p><pre><code>more code</code></pre></li></ol>"],
				["-    foo\n\n  bar", "<ul><li>foo</li></ul><p>bar</p>"],
				["-  foo\n\n   bar", "<ul><li><p>foo</p><p>bar</p></li></ul>"],
				["-\n  foo\n-\n  ```\n  bar\n  ```\n-\n      baz", "<ul><li>foo</li><li><pre><code>bar\n</code></pre></li><li><pre><code>baz</code></pre></li></ul>"],
				["-   \n  foo", "<ul><li>foo</li></ul>"],
				["-\n\n  foo", "<ul><li></li></ul><p>foo</p>"],
				["- foo\n-\n- bar", "<ul><li>foo</li><li></li><li>bar</li></ul>"],
				["- foo\n-   \n- bar", "<ul><li>foo</li><li></li><li>bar</li></ul>"],
				["1. foo\n2.\n3. bar", "<ol><li>foo</li><li></li><li>bar</li></ol>"],
				["*", "<ul><li></li></ul>"],
				[" 1.  A paragraph\n     with two lines.\n\n         indented code\n\n     > A block quote.", "<ol><li><p>A paragraph\nwith two lines.</p><pre><code>indented code\n</code></pre><blockquote><p>A block quote.</p></blockquote></li></ol>"],
				["  1.  A paragraph\n      with two lines.\n\n          indented code\n\n      > A block quote.", "<ol><li><p>A paragraph\nwith two lines.</p><pre><code>indented code\n</code></pre><blockquote><p>A block quote.</p></blockquote></li></ol>"],
				["   1.  A paragraph\n       with two lines.\n\n           indented code\n\n       > A block quote.", "<ol><li><p>A paragraph\nwith two lines.</p><pre><code>indented code\n</code></pre><blockquote><p>A block quote.</p></blockquote></li></ol>"],
				["  1.  A paragraph\nwith two lines.\n\n          indented code\n\n      > A block quote.", "<ol><li><p>A paragraph\nwith two lines.</p><pre><code>indented code\n</code></pre><blockquote><p>A block quote.</p></blockquote></li></ol>"],
				["  1.  A paragraph\n    with two lines.", "<ol><li>A paragraph\nwith two lines.</li></ol>"],
				["> 1. > Blockquote\ncontinued here.", "<blockquote><ol><li><blockquote><p>Blockquote\ncontinued here.</p></blockquote></li></ol></blockquote>"],
				["> 1. > Blockquote\n> continued here.", "<blockquote><ol><li><blockquote><p>Blockquote\ncontinued here.</p></blockquote></li></ol></blockquote>"],
				["- foo\n  - bar\n    - baz\n      - boo", "<ul><li>foo<ul><li>bar<ul><li>baz<ul><li>boo</li></ul></li></ul></li></ul></li></ul>"],
				["- foo\n - bar\n  - baz\n   - boo", "<ul><li>foo</li><li>bar</li><li>baz</li><li>boo</li></ul>"],
				["10) foo\n    - bar", "<ol start=\"10\"><li>foo<ul><li>bar</li></ul></li></ol>"],
				["10) foo\n   - bar", "<ol start=\"10\"><li>foo</li></ol><ul><li>bar</li></ul>"],
				["- - foo", "<ul><li><ul><li>foo</li></ul></li></ul>"],
				["1. - 2. foo", "<ol><li><ul><li><ol start=\"2\"><li>foo</li></ol></li></ul></li></ol>"],
				["- # Foo\n- Bar\n  ---\n  baz", "<ul><li><h1>Foo</h1></li><li><h2>Bar</h2>baz</li></ul>"]
			],
			"not a list item": [
				["-one\n\n2.two", "<p>-one</p><p>2.two</p>"],
				["1234567890. ok", "<p>1234567890. ok</p>"],
				["-1. not ok", "<p>-1. not ok</p>"],
				["foo\n*\n\nfoo\n1.", "<p>foo\n*</p><p>foo\n1.</p>"],
				["    1.  A paragraph\n        with two lines.\n\n            indented code\n\n        > A block quote.", "<pre><code>1.  A paragraph\n    with two lines.\n\n        indented code\n\n    &gt; A block quote.</code></pre>"],
				["- foo\n\n- bar\n\n- baz", "<ul><li><p>foo</p></li><li><p>bar</p></li><li><p>baz</p></li></ul>"]
			]
		},
		"list": {
			"simple": [
				["- foo\n- bar\n+ baz", "<ul><li>foo</li><li>bar</li></ul><ul><li>baz</li></ul>"],
				["1. foo\n2. bar\n3) baz", "<ol><li>foo</li><li>bar</li></ol><ol start=\"3\"><li>baz</li></ol>"],
				["Foo\n- bar\n- baz", "<p>Foo</p><ul><li>bar</li><li>baz</li></ul>"],
				["The number of windows in my house is\n1.  The number of doors is 6.", "<p>The number of windows in my house is</p><ol><li>The number of doors is 6.</li></ol>"],
				["- foo\n  - bar\n    - baz\n\n\n      bim", "<ul><li>foo<ul><li>bar<ul><li><p>baz</p><p>bim</p></li></ul></li></ul></li></ul>"],
				["- foo\n- bar\n\n<!-- -->\n\n- baz\n- bim", "<ul><li>foo</li><li>bar</li></ul><!-- -->\n<ul><li>baz</li><li>bim</li></ul>"],
				["-   foo\n\n    notcode\n\n-   foo\n\n<!-- -->\n\n    code", "<ul><li><p>foo</p><p>notcode</p></li><li><p>foo</p></li></ul><!-- -->\n<pre><code>code</code></pre>"],
				["- a\n - b\n  - c\n   - d\n  - e\n - f\n- g", "<ul><li>a</li><li>b</li><li>c</li><li>d</li><li>e</li><li>f</li><li>g</li></ul>"],
				["1. a\n\n  2. b\n\n   3. c", "<ol><li><p>a</p></li><li><p>b</p></li><li><p>c</p></li></ol>"],
				["- a\n - b\n  - c\n   - d\n    - e", "<ul><li>a</li><li>b</li><li>c</li><li>d\n- e</li></ul>"],
				["1. a\n\n  2. b\n\n    3. c", "<ol><li><p>a</p></li><li><p>b</p></li></ol><pre><code>3. c</code></pre>"],
				["- a\n- b\n\n- c", "<ul><li><p>a</p></li><li><p>b</p></li><li><p>c</p></li></ul>"],
				["* a\n*\n\n* c", "<ul><li><p>a</p></li><li></li><li><p>c</p></li></ul>"],
				["- a\n- b\n\n\n  c\n- d", "<ul><li><p>a</p></li><li><p>b</p><p>c</p></li><li><p>d</p></li></ul>"],
				["- a\n- b\n\n\n  [ref]: /url\n- d", "<ul><li><p>a</p></li><li><p>b</p></li><li><p>d</p></li></ul>"],
				["- a\n- ```\n  b\n\n\n\n  ```\n- c", "<ul><li>a</li><li><pre><code>b\n\n\n\n</code></pre></li><li>c</li></ul>"],
				["- a\n  - b\n\n    c\n- d", "<ul><li>a<ul><li><p>b</p><p>c</p></li></ul></li><li>d</li></ul>"],
				["* a\n  > b\n  > \n* c", "<ul><li>a<blockquote><p>b</p></blockquote></li><li>c</li></ul>"],
				["- a\n  > b\n  ```\n  c\n  ```\n- d", "<ul><li>a<blockquote><p>b</p></blockquote><pre><code>c\n</code></pre></li><li>d</li></ul>"],
				["- a", "<ul><li>a</li></ul>"],
				["- a\n  - b", "<ul><li>a<ul><li>b</li></ul></li></ul>"],
				["1. ```\n   foo\n   ```\n\n   bar", "<ol><li><pre><code>foo\n</code></pre><p>bar</p></li></ol>"],
				["* foo\n  * bar\n\n  baz", "<ul><li><p>foo</p><ul><li>bar</li></ul><p>baz</p></li></ul>"],
				["- a\n  - b\n  - c\n\n- d\n  - e\n  - f", "<ul><li><p>a</p><ul><li>b</li><li>c</li></ul></li><li><p>d</p><ul><li>e</li><li>f</li></ul></li></ul>"],
				["- a\n\t- b\n\t- c\n\t\t- d", "<ul><li>a<ul><li>b</li><li>c<ul><li>d</li></ul></li></ul></li></ul>"]
			],
			"not a list": [
				["The number of windows in my house is\n14.  The number of doors is 6.", "<p>The number of windows in my house is\n14.  The number of doors is 6.</p>"],
				["The number of windows in my house is\n2.  The number of doors is 6.", "<p>The number of windows in my house is\n2.  The number of doors is 6.</p>"]
			]
		},
		"list task items": {
			"simple": [
				["- [ ] foo\n- [x] bar", "<ul><li><input disabled=\"\" type=\"checkbox\"> foo</li><li><input checked=\"\" disabled=\"\" type=\"checkbox\"> bar</li></ul>"],
				["- [x] foo\n  - [ ] bar\n  - [x] baz\n- [ ] bim", "<ul><li><input checked=\"\" disabled=\"\" type=\"checkbox\"> foo<ul><li><input disabled=\"\" type=\"checkbox\"> bar</li><li><input checked=\"\" disabled=\"\" type=\"checkbox\"> baz</li></ul></li><li><input disabled=\"\" type=\"checkbox\"> bim</li></ul>"]
			]
		},
		"table": {
			"simple": [
				["| Heading 1 | Heading 2\n| --------- | ---------\n| Cell 1    | Cell 2\n| Cell 3    | Cell 4", "<table><thead><tr><th>Heading 1</th><th>Heading 2</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></tbody></table>"],
				["| Header 1 | Header 2 | Header 3 | Header 4 |\n| :------: | -------: | :------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   | Cell 4   |\n| Cell 5   | Cell 6   | Cell 7   | Cell 8   |", "<table><thead><tr><th style=\"text-align:center\">Header 1</th><th style=\"text-align:right\">Header 2</th><th style=\"text-align:left\">Header 3</th><th>Header 4</th></tr></thead><tbody><tr><td style=\"text-align:center\">Cell 1</td><td style=\"text-align:right\">Cell 2</td><td style=\"text-align:left\">Cell 3</td><td>Cell 4</td></tr><tr><td style=\"text-align:center\">Cell 5</td><td style=\"text-align:right\">Cell 6</td><td style=\"text-align:left\">Cell 7</td><td>Cell 8</td></tr></tbody></table>"],
				["Header 1|Header 2|Header 3|Header 4\n:-------|:------:|-------:|--------\nCell 1  |Cell 2  |Cell 3  |Cell 4\n*Cell 5*|Cell 6  |Cell 7  |Cell 8", "<table><thead><tr><th style=\"text-align:left\">Header 1</th><th style=\"text-align:center\">Header 2</th><th style=\"text-align:right\">Header 3</th><th>Header 4</th></tr></thead><tbody><tr><td style=\"text-align:left\">Cell 1</td><td style=\"text-align:center\">Cell 2</td><td style=\"text-align:right\">Cell 3</td><td>Cell 4</td></tr><tr><td style=\"text-align:left\"><em>Cell 5</em></td><td style=\"text-align:center\">Cell 6</td><td style=\"text-align:right\">Cell 7</td><td>Cell 8</td></tr></tbody></table>"],
				["> foo|foo\n> ---|---\n> bar|bar\nbaz|baz", "<blockquote><table><thead><tr><th>foo</th><th>foo</th></tr></thead><tbody><tr><td>bar</td><td>bar</td></tr></tbody></table></blockquote><p>baz|baz</p>"],
				["| foo\n|----\n| test2", "<table><thead><tr><th>foo</th></tr></thead><tbody><tr><td>test2</td></tr></tbody></table>"],
				["-   foo|foo\n---|---\nbar|bar", "<table><thead><tr><th>-   foo</th><th>foo</th></tr></thead><tbody><tr><td>bar</td><td>bar</td></tr></tbody></table>"],
				["|	foo	|	bar	|\n|	---	|	---	|\n|	baz	|	quux	|", "<table><thead><tr><th>foo</th><th>bar</th></tr></thead><tbody><tr><td>baz</td><td>quux</td></tr></tbody></table>"],
				["paragraph\nfoo|foo\n---|---\nbar|bar", "<p>paragraph</p><table><thead><tr><th>foo</th><th>foo</th></tr></thead><tbody><tr><td>bar</td><td>bar</td></tr></tbody></table>"],
				["| Heading 1 | Heading 2\n| --------- | ---------\n| Cell 1 | Cell 2\n| \\\\\\\`|\\\\\\\`", "<table><thead><tr><th>Heading 1</th><th>Heading 2</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>\\\`</td><td>\\\`</td></tr></tbody></table>"],
				["# | 1 | 2\n--|--|--\nx | `\\` | `x`", "<table><thead><tr><th>#</th><th>1</th><th>2</th></tr></thead><tbody><tr><td>x</td><td><code>\\</code></td><td><code>x</code></td></tr></tbody></table>"],
				["# | 1 | 2\n--|--|--\nx | \\`\\` | `x`", "<table><thead><tr><th>#</th><th>1</th><th>2</th></tr></thead><tbody><tr><td>x</td><td>``</td><td><code>x</code></td></tr></tbody></table>"],
				["| 1 | 2 |\n| :-----: |  :-----: |\n| 3 | 4 | 5 | 6 |", "<table><thead><tr><th style=\"text-align:center\">1</th><th style=\"text-align:center\">2</th></tr></thead><tbody><tr><td style=\"text-align:center\">3</td><td style=\"text-align:center\">4</td></tr></tbody></table>"],
				["| 1 | 2 | 3 | 4 |\n| :-----: |  :-----: |  :-----: |  :-----: |\n| 5 | 6 |", "<table><thead><tr><th style=\"text-align:center\">1</th><th style=\"text-align:center\">2</th><th style=\"text-align:center\">3</th><th style=\"text-align:center\">4</th></tr></thead><tbody><tr><td style=\"text-align:center\">5</td><td style=\"text-align:center\">6</td><td style=\"text-align:center\"></td><td style=\"text-align:center\"></td></tr></tbody></table>"],
				["| foo |\n:-----:\n| bar |", "<table><thead><tr><th style=\"text-align:center\">foo</th></tr></thead><tbody><tr><td style=\"text-align:center\">bar</td></tr></tbody></table>"],
				["  | Col1a | Col2a |\n  | ----- | ----- |\n  | Col1b | Col2b |", "<table><thead><tr><th>Col1a</th><th>Col2a</th></tr></thead><tbody><tr><td>Col1b</td><td>Col2b</td></tr></tbody></table>"],
				["    | Col1a | Col2a |\n  | ----- | ----- |\n  | Col1b | Col2b |", "<pre><code>| Col1a | Col2a |\n</code></pre><p>| ----- | ----- |\n| Col1b | Col2b |</p>"],
				["  | Col1a | Col2a |\n    | ----- | ----- |\n  | Col1b | Col2b |", "<p>| Col1a | Col2a |\n| ----- | ----- |\n| Col1b | Col2b |</p>"],
				["  | Col1a | Col2a |\n  | ----- | ----- |\n    | Col1b | Col2b |", "<table><thead><tr><th>Col1a</th><th>Col2a</th></tr></thead></table><pre><code>| Col1b | Col2b |</code></pre>"],
				["  | Col1a | Col2a |\n  | ----- | ----- |", "<table><thead><tr><th>Col1a</th><th>Col2a</th></tr></thead></table>"],
				["Col1a | Col1b | Col1c\n----- | -----\nCol2a | Col2b | Col2c", "<p>Col1a | Col1b | Col1c\n----- | -----\nCol2a | Col2b | Col2c</p>"],
				["| Heading 1 | Heading 2\n| --------- | ---------\n| Cell 1 | Cell 2\n| `Cell 3\\|` | Cell 4", "<table><thead><tr><th>Heading 1</th><th>Heading 2</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td><code>Cell 3|</code></td><td>Cell 4</td></tr></tbody></table>"],
				["| Heading 1 | Heading 2\n| --------- | ---------\n| Cell 1 | Cell 2\n| `Cell 3\\|` | Cell 4", "<table><thead><tr><th>Heading 1</th><th>Heading 2</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td><code>Cell 3\|</code></td><td>Cell 4</td></tr></tbody></table>"],
				["- Level 1\n\n   - Level 2\n\n      | Column 1 | Column 2 |\n      | -------- | -------- |\n      | abcdefgh | ijklmnop |", "<ul><li><p>Level 1</p><ul><li><p>Level 2</p><table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>abcdefgh</td><td>ijklmnop</td></tr></tbody></table></li></ul></li></ul>"],
				["- Level 1\n\n	- Level 2\n\n		| Column 1 | Column 2 |\n		| -------- | -------- |\n		| abcdefgh | ijklmnop |", "<ul><li><p>Level 1</p><ul><li><p>Level 2</p><table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>abcdefgh</td><td>ijklmnop</td></tr></tbody></table></li></ul></li></ul>"],
				["| foo | bar |\n| --- | --- |\n| baz | bim |", "<table><thead><tr><th>foo</th><th>bar</th></tr></thead><tbody><tr><td>baz</td><td>bim</td></tr></tbody></table>"],
				["| abc | defghi |\n:-: | -----------:\nbar | baz", "<table><thead><tr><th style=\"text-align:center\">abc</th><th style=\"text-align:right\">defghi</th></tr></thead><tbody><tr><td style=\"text-align:center\">bar</td><td style=\"text-align:right\">baz</td></tr></tbody></table>"],
				["| f\\|oo  |\n| ------ |\n| b `\\|` az |\n| b **\\|** im |", "<table><thead><tr><th>f|oo</th></tr></thead><tbody><tr><td>b <code>|</code> az</td></tr><tr><td>b <strong>|</strong> im</td></tr></tbody></table>"],
				["| abc | def |\n| --- | --- |\n| bar | baz |\n> bar", "<table><thead><tr><th>abc</th><th>def</th></tr></thead><tbody><tr><td>bar</td><td>baz</td></tr></tbody></table><blockquote><p>bar</p></blockquote>"]
			],
			"not a table": [
				["foo|foo\n-----|-----s\nbar|bar", "<p>foo|foo\n-----|-----s\nbar|bar</p>"],
				["foo|foo\n-----:-----\nbar|bar", "<p>foo|foo\n-----:-----\nbar|bar</p>"],
				["foo|foo\n-----||-----\nbar|bar", "<p>foo|foo\n-----||-----\nbar|bar</p>"],
				["foo|foo\n-----|-::-\nbar|bar", "<p>foo|foo\n-----|-::-\nbar|bar</p>"],
				["foo\n-----|-----\nbar|bar", "<p>foo\n-----|-----\nbar|bar</p>"],
				["|\n|\n|", "<p>|\n|\n|</p>"]
			]
		},
		"inline": {
			"code": [
				["`foo`", "<p><code>foo</code></p>"],
				["`` foo ` bar ``", "<p><code>foo ` bar</code></p>"],
				["` `` `", "<p><code>``</code></p>"],
				["`  ``  `", "<p><code> `` </code></p>"],
				["` a`", "<p><code> a</code></p>"],
				["`\tb\t`", "<p><code>\tb\t</code></p>"],
				["` `\n`  `", "<p><code> </code>\n<code>  </code></p>"],
				["``\nfoo\nbar  \nbaz\n``", "<p><code>foo bar   baz</code></p>"],
				["``\nfoo \n``", "<p><code>foo </code></p>"],
				["`foo   bar \nbaz`", "<p><code>foo   bar  baz</code></p>"],
				["`foo\\`bar`", "<p><code>foo\\</code>bar`</p>"],
				["``foo`bar``", "<p><code>foo`bar</code></p>"],
				["` foo `` bar `", "<p><code>foo `` bar</code></p>"],
				["*foo`*`", "<p>*foo<code>*</code></p>"],
				["[not a `link](/foo`)", "<p>[not a <code>link](/foo</code>)</p>"],
				["`<a href=\"`\">`", "<p><code>&lt;a href=\"</code>\"&gt;`</p>"],
				["`<http://foo.bar.`baz>`", "<p><code>&lt;http://foo.bar.</code>baz&gt;`</p>"],
				["```foo``", "<p>```foo``</p>"],
				["`foo", "<p>`foo</p>"],
				["`foo``bar``", "<p>`foo<code>bar</code></p>"],
				["foo`</textarea>`", "<p>foo<code>&lt;/textarea&gt;</code></p>"]
			],
			"emphasis": [
				["*foo bar*", "<p><em>foo bar</em></p>"],
				["a * foo bar*", "<p>a * foo bar*</p>"],
				["a*\"foo\"*", "<p>a*\"foo\"*</p>"],
				["* a *", "<p>*&nbsp;a&nbsp;*</p>"],
				["foo*bar*", "<p>foo<em>bar</em></p>"],
				["5*6*78", "<p>5<em>6</em>78</p>"],
				["_foo bar_", "<p><em>foo bar</em></p>"],
				["_ foo bar_", "<p>_ foo bar_</p>"],
				["a_\"foo\"_", "<p>a_\"foo\"_</p>"],
				["foo_bar_", "<p>foo_bar_</p>"],
				["5_6_78", "<p>5_6_78</p>"],
				["пристаням_стремятся_", "<p>пристаням_стремятся_</p>"],
				["aa_\"bb\"_cc", "<p>aa_\"bb\"_cc</p>"],
				["foo-_(bar)_", "<p>foo-<em>(bar)</em></p>"],
				["_foo*", "<p>_foo*</p>"],
				["*foo bar *", "<p>*foo bar *</p>"],
				["*foo bar\n*", "<p>*foo bar\n*</p>"],
				["*(*foo)", "<p>*(*foo)</p>"],
				["*(*foo*)*", "<p><em>(<em>foo</em>)</em></p>"],
				["*foo*bar", "<p><em>foo</em>bar</p>"],
				["_foo bar _", "<p>_foo bar _</p>"],
				["_(_foo)", "<p>_(_foo)</p>"],
				["_(_foo_)_", "<p><em>(<em>foo</em>)</em></p>"],
				["_foo_bar", "<p>_foo_bar</p>"],
				["_пристаням_стремятся", "<p>_пристаням_стремятся</p>"],
				["_foo_bar_baz_", "<p><em>foo_bar_baz</em></p>"],
				["_(bar)_.", "<p><em>(bar)</em>.</p>"],
				["**foo bar**", "<p><strong>foo bar</strong></p>"],
				["** foo bar**", "<p>** foo bar**</p>"],
				["a**\"foo\"**", "<p>a**\"foo\"**</p>"],
				["foo**bar**", "<p>foo<strong>bar</strong></p>"],
				["__foo bar__", "<p><strong>foo bar</strong></p>"],
				["__ foo bar__", "<p>__ foo bar__</p>"],
				["__\nfoo bar__", "<p>__\nfoo bar__</p>"],
				["a__\"foo\"__", "<p>a__\"foo\"__</p>"],
				["foo__bar__", "<p>foo__bar__</p>"],
				["5__6__78", "<p>5__6__78</p>"],
				["пристаням__стремятся__", "<p>пристаням__стремятся__</p>"],
				["__foo, __bar__, baz__", "<p><strong>foo, <strong>bar</strong>, baz</strong></p>"],
				["foo-__(bar)__", "<p>foo-<strong>(bar)</strong></p>"],
				["**foo bar **", "<p>**foo bar **</p>"],
				["**(**foo)", "<p>**(**foo)</p>"],
				["*(**foo**)*", "<p><em>(<strong>foo</strong>)</em></p>"],
				["**Gomphocarpus (*Gomphocarpus physocarpus*, syn.\n*Asclepias physocarpa*)**", "<p><strong>Gomphocarpus (<em>Gomphocarpus physocarpus</em>, syn.\n<em>Asclepias physocarpa</em>)</strong></p>"],
				["**foo \"*bar*\" foo**", "<p><strong>foo \"<em>bar</em>\" foo</strong></p>"],
				["**foo**bar", "<p><strong>foo</strong>bar</p>"],
				["__foo bar __", "<p>__foo bar __</p>"],
				["__(__foo)", "<p>__(__foo)</p>"],
				["_(__foo__)_", "<p><em>(<strong>foo</strong>)</em></p>"],
				["__foo__bar", "<p>__foo__bar</p>"],
				["__пристаням__стремятся", "<p>__пристаням__стремятся</p>"],
				["__foo__bar__baz__", "<p><strong>foo__bar__baz</strong></p>"],
				["__(bar)__.", "<p><strong>(bar)</strong>.</p>"],
				["*foo [bar](/url)*", "<p><em>foo <a href=\"/url\">bar</a></em></p>"],
				["*foo\nbar*", "<p><em>foo\nbar</em></p>"],
				["_foo __bar__ baz_", "<p><em>foo <strong>bar</strong> baz</em></p>"],
				["_foo _bar_ baz_", "<p><em>foo <em>bar</em> baz</em></p>"],
				["__foo_ bar_", "<p><em><em>foo</em> bar</em></p>"],
				["*foo *bar**", "<p><em>foo <em>bar</em></em></p>"],
				["*foo **bar** baz*", "<p><em>foo <strong>bar</strong> baz</em></p>"],
				["*foo**bar**baz*", "<p><em>foo<strong>bar</strong>baz</em></p>"],
				["*foo**bar*", "<p><em>foo**bar</em></p>"],
				["***foo** bar*", "<p><em><strong>foo</strong> bar</em></p>"],
				["*foo **bar***", "<p><em>foo <strong>bar</strong></em></p>"],
				["*foo**bar***", "<p><em>foo<strong>bar</strong></em></p>"],
				["foo***bar***baz", "<p>foo<em><strong>bar</strong></em>baz</p>"],
				["foo******bar*********baz", "<p>foo<strong><strong><strong>bar</strong></strong></strong>***baz</p>"],
				["*foo **bar *baz* bim** bop*", "<p><em>foo <strong>bar <em>baz</em> bim</strong> bop</em></p>"],
				["*foo [*bar*](/url)*", "<p><em>foo <a href=\"/url\"><em>bar</em></a></em></p>"],
				["** is not an empty emphasis", "<p>** is not an empty emphasis</p>"],
				["**** is not an empty strong emphasis", "<p>**** is not an empty strong emphasis</p>"],
				["**foo [bar](/url)**", "<p><strong>foo <a href=\"/url\">bar</a></strong></p>"],
				["**foo\nbar**", "<p><strong>foo\nbar</strong></p>"],
				["__foo _bar_ baz__", "<p><strong>foo <em>bar</em> baz</strong></p>"],
				["__foo __bar__ baz__", "<p><strong>foo <strong>bar</strong> baz</strong></p>"],
				["____foo__ baz__", "<p><strong><strong>foo</strong> baz</strong></p>"],
				["**foo **bar****", "<p><strong>foo <strong>bar</strong></strong></p>"],
				["**foo *bar* baz**", "<p><strong>foo <em>bar</em> baz</strong></p>"],
				["**foo*bar*baz**", "<p><strong>foo<em>bar</em>baz</strong></p>"],
				["***foo* bar**", "<p><strong><em>foo</em> bar</strong></p>"],
				["**foo *bar***", "<p><strong>foo <em>bar</em></strong></p>"],
				["**foo *bar **baz**\nbim* bop**", "<p><strong>foo <em>bar <strong>baz</strong>\nbim</em> bop</strong></p>"],
				["**foo [*bar*](/url)**", "<p><strong>foo <a href=\"/url\"><em>bar</em></a></strong></p>"],
				["__ is not an empty emphasis", "<p>__ is not an empty emphasis</p>"],
				["____ is not an empty strong emphasis", "<p>____ is not an empty strong emphasis</p>"],
				["foo ***", "<p>foo ***</p>"],
				["foo *\\**", "<p>foo <em>*</em></p>"],
				["foo *_*", "<p>foo <em>_</em></p>"],
				["foo *****", "<p>foo *****</p>"],
				["foo **\\***", "<p>foo <strong>*</strong></p>"],
				["foo **_**", "<p>foo <strong>_</strong></p>"],
				["**foo*", "<p>*<em>foo</em></p>"],
				["*foo**", "<p><em>foo</em>*</p>"],
				["***foo**", "<p>*<strong>foo</strong></p>"],
				["****foo*", "<p>***<em>foo</em></p>"],
				["**foo***", "<p><strong>foo</strong>*</p>"],
				["*foo****", "<p><em>foo</em>***</p>"],
				["foo ___", "<p>foo ___</p>"],
				["foo _\\__", "<p>foo <em>_</em></p>"],
				["foo _*_", "<p>foo <em>*</em></p>"],
				["foo _____", "<p>foo _____</p>"],
				["foo __\\___", "<p>foo <strong>_</strong></p>"],
				["foo __*__", "<p>foo <strong>*</strong></p>"],
				["__foo_", "<p>_<em>foo</em></p>"],
				["_foo__", "<p><em>foo</em>_</p>"],
				["___foo__", "<p>_<strong>foo</strong></p>"],
				["__foo___", "<p><strong>foo</strong>_</p>"],
				["_foo____", "<p><em>foo</em>___</p>"],
				["**foo**", "<p><strong>foo</strong></p>"],
				["*_foo_*", "<p><em><em>foo</em></em></p>"],
				["__foo__", "<p><strong>foo</strong></p>"],
				["_*foo*_", "<p><em><em>foo</em></em></p>"],
				["****foo****", "<p><strong><strong>foo</strong></strong></p>"],
				["____foo____", "<p><strong><strong>foo</strong></strong></p>"],
				["******foo******", "<p><strong><strong><strong>foo</strong></strong></strong></p>"],
				["***foo***", "<p><em><strong>foo</strong></em></p>"],
				["_____foo_____", "<p><em><strong><strong>foo</strong></strong></em></p>"],
				["*foo _bar* baz_", "<p><em>foo _bar</em> baz_</p>"],
				["*foo __bar *baz bim__ bam*", "<p><em>foo <strong>bar *baz bim</strong> bam</em></p>"],
				["**foo **bar baz**", "<p>**foo <strong>bar baz</strong></p>"],
				["*foo *bar baz*", "<p>*foo <em>bar baz</em></p>"],
				["*[bar*](/url)", "<p>*<a href=\"/url\">bar*</a></p>"],
				["_foo [bar_](/url)", "<p>_foo <a href=\"/url\">bar_</a></p>"],
				["*<img src=\"foo\" title=\"*\"/>", "<p>*<img src=\"foo\" title=\"*\"></p>"],
				["**<a href=\"**\">", "<p>**<a href=\"**\"></a></p>"],
				["__<a href=\"__\">", "<p>__<a href=\"__\"></a></p>"],
				["*a `*`*", "<p><em>a <code>*</code></em></p>"],
				["_a `_`_", "<p><em>a <code>_</code></em></p>"],
				["**a<http://foo.bar/?q=**>", "<p>**a<a href=\"http://foo.bar/?q=**\">http://foo.bar/?q=**</a></p>"],
				["__a<http://foo.bar/?q=__>", "<p>__a<a href=\"http://foo.bar/?q=__\">http://foo.bar/?q=__</a></p>"]
			],
			"underline": [
				["_foo bar_", "<p><u>foo bar</u></p>"],
				["aa_\"bb\"_cc", "<p>aa_\"bb\"_cc</p>"],
				["foo-_(bar)_", "<p>foo-<u>(bar)</u></p>"],
				["_(_foo)", "<p>_(_foo)</p>"],
				["_(_foo_)_", "<p><u>(<u>foo</u>)</u></p>"],
				["_foo_bar_baz_", "<p><u>foo_bar_baz</u></p>"],
				["_(bar)_.", "<p><u>(bar)</u>.</p>"],
				["foo__bar__", "<p>foo__bar__</p>"],
				["5__6__78", "<p>5__6__78</p>"],
				["__(__foo)", "<p>__(__foo)</p>"],
				["_(__foo__)_", "<p><u>(<strong>foo</strong>)</u></p>"],
				["_foo __bar__ baz_", "<p><u>foo <strong>bar</strong> baz</u></p>"],
				["__foo _bar_ baz__", "<p><strong>foo <u>bar</u> baz</strong></p>"],
				["foo ___", "<p>foo ___</p>"],
				["foo _\\__", "<p>foo <u>_</u></p>"],
				["foo _*_", "<p>foo <u>*</u></p>"],
				["foo _____", "<p>foo _____</p>"],
				["__foo_", "<p>_<u>foo</u></p>"],
				["_foo__", "<p><u>foo</u>_</p>"],
				["_foo____", "<p><u>foo</u>___</p>"],
				["_____foo_____", "<p><u><strong><strong>foo</strong></strong></u></p>"],
				["_a `_`_", "<p><u>a <code>_</code></u></p>"]
			],
			"subscript": [
				["Subscript: H~2~O", "<p>Subscript: H<sub>2</sub>O</p>"],
				["~foo\\~", "<p>~foo~</p>"],
				["~foo bar~", "<p>~foo bar~</p>"],
				["~foo\\ bar\\ baz~", "<p><sub>foo bar baz</sub></p>"],
				["~\\ foo\\ ~", "<p><sub> foo </sub></p>"],
				["~foo\\\\\\\\\\\\\\\ bar~", "<p><sub>foo\\\\\\ bar</sub></p>"],
				["**~foo~ bar**", "<p><strong><sub>foo</sub> bar</strong></p>"],
				["*~f", "<p>*~f</p>"]
			],
			"superscript": [
				["^test^", "<p><sup>test</sup></p>"],
				["^foo\\^", "<p>^foo^</p>"],
				["2^4 + 3^5", "<p>2^4 + 3^5</p>"],
				["^foo~bar^baz^bar~foo^", "<p><sup>foo~bar</sup>baz<sup>bar~foo</sup></p>"],
				["^\\ foo\\ ^", "<p><sup> foo </sup></p>"],
				["^foo\\\\\\\\\\\\\\ bar^", "<p><sup>foo\\\\\\ bar</sup></p>"],
				["^foo\\\\\\\\\\\\ bar^", "<p>^foo\\\\\\ bar^</p>"],
				["**^foo^ bar**", "<p><strong><sup>foo</sup> bar</strong></p>"]
			],
			"strikethrough": [
				["~~Strikeout~~", "<p><s>Strikeout</s></p>"],
				["x ~~~~foo~~ bar~~", "<p>x <s><s>foo</s> bar</s></p>"],
				["x ~~foo ~~bar~~~~", "<p>x <s>foo <s>bar</s></s></p>"],
				["x ~~~~foo~~~~", "<p>x <s><s>foo</s></s></p>"],
				["x ~~a ~~foo~~~~~~~~~~~bar~~ b~~\n\nx ~~a ~~foo~~~~~~~~~~~~bar~~ b~~", "<p>x <s>a <s>foo</s></s>~~~<s><s>bar</s> b</s></p><p>x <s>a <s>foo</s></s>~~~~<s><s>bar</s> b</s></p>"],
				["**~~test**~~\n\n~~**test~~**", "<p><strong>~~test</strong>~~</p><p><s>**test</s>**</p>"],
				["[~~link]()~~\n\n~~[link~~]()", "<p><a href=\"\">~~link</a>~~</p><p>~~<a href=\"\">link~~</a></p>"],
				["~~`code~~`\n\n`~~code`~~", "<p>~~<code>code~~</code></p><p><code>~~code</code>~~</p>"],
				["~~foo ~~bar~~ baz~~\n\n~~f **o ~~o b~~ a** r~~", "<p><s>foo <s>bar</s> baz</s></p><p><s>f <strong>o <s>o b</s> a</strong> r</s></p>"],
				["foo ~~ bar ~~ baz", "<p>foo ~~ bar ~~ baz</p>"],
				["[~~foo~~]()", "<p><a href=\"\"><s>foo</s></a></p>"],
				["~~test\n~~\n\n~~\ntest~~\n\n~~\ntest\n~~", "<p>~~test\n~~</p><p>~~\ntest~~</p><p>~~\ntest\n~~</p>"],
				["a~~\"foo\"~~", "<p>a~~\"foo\"~~</p>"],
				["-~~~~;~~~~~~", "<p>-<s><s>;</s></s>~~</p>"]
			],
			"insert": [
				["++Insert++", "<p><ins>Insert</ins></p>"],
				["x ++++foo++ bar++", "<p>x <ins><ins>foo</ins> bar</ins></p>"],
				["x ++foo ++bar++++", "<p>x <ins>foo <ins>bar</ins></ins></p>"],
				["x ++++foo++++", "<p>x <ins><ins>foo</ins></ins></p>"],
				["x +++foo+++", "<p>x +<ins>foo</ins>+</p>"],
				["**++test**++\n\n++**test++**", "<p><strong>++test</strong>++</p><p><ins>**test</ins>**</p>"],
				["[++link]()++\n\n++[link++]()", "<p><a href=\"\">++link</a>++</p><p>++<a href=\"\">link++</a></p>"],
				["++`code++`\n\n`++code`++", "<p>++<code>code++</code></p><p><code>++code</code>++</p>"],
				["++foo ++bar++ baz++", "<p><ins>foo <ins>bar</ins> baz</ins></p>"],
				["++f **o ++o b++ a** r++", "<p><ins>f <strong>o <ins>o b</ins> a</strong> r</ins></p>"],
				["foo ++ bar ++ baz", "<p>foo ++ bar ++ baz</p>"],
				["++test\n++\n\n++\ntest++\n\n++\ntest\n++", "<p>++test\n++</p><p>++\ntest++</p><p>++\ntest\n++</p>"],
				["x ++a ++foo+++++++++++bar++ b++\n\nx ++a ++foo++++++++++++bar++ b++", "<p>x <ins>a <ins>foo</ins></ins>+++<ins><ins>bar</ins> b</ins></p><p>x <ins>a <ins>foo</ins></ins>++++<ins><ins>bar</ins> b</ins></p>"],
				["a++\"foo\"++", "<p>a++\"foo\"++</p>"],
				["[++foo++]()", "<p><a href=\"\"><ins>foo</ins></a></p>"],
				["-++++;++++++", "<p>-<ins><ins>;</ins></ins>++</p>"]
			],
			"mark": [
				["==Mark==", "<p><mark>Mark</mark></p>"],
				["x ====foo== bar==", "<p>x <mark><mark>foo</mark> bar</mark></p>"],
				["x ==foo ==bar====", "<p>x <mark>foo <mark>bar</mark></mark></p>"],
				["x ====foo====", "<p>x <mark><mark>foo</mark></mark></p>"],
				["x ===foo===", "<p>x =<mark>foo</mark>=</p>"],
				["**==test**==\n\n==**test==**", "<p><strong>==test</strong>==</p><p><mark>**test</mark>**</p>"],
				["[==link]()==\n\n==[link==]()", "<p><a href=\"\">==link</a>==</p><p>==<a href=\"\">link==</a></p>"],
				["==`code==`\n\n`==code`==", "<p>==<code>code==</code></p><p><code>==code</code>==</p>"],
				["==foo ==bar== baz==", "<p><mark>foo <mark>bar</mark> baz</mark></p>"],
				["==f **o ==o b== a** r==", "<p><mark>f <strong>o <mark>o b</mark> a</strong> r</mark></p>"],
				["foo == bar == baz", "<p>foo == bar == baz</p>"],
				["==test\n== a\n\n==\ntest==\n\n==\ntest\n==", "<p>==test\n== a</p><p>==\ntest==</p><h1>==\ntest</h1>"],
				["x ==a ==foo===========bar== b==\n\nx ==a ==foo============bar== b==", "<p>x <mark>a <mark>foo</mark></mark>===<mark><mark>bar</mark> b</mark></p><p>x <mark>a <mark>foo</mark></mark>====<mark><mark>bar</mark> b</mark></p>"],
				["a==\"foo\"==", "<p>a==\"foo\"==</p>"],
				["[==foo==]()", "<p><a href=\"\"><mark>foo</mark></a></p>"],
				["-====;======", "<p>-<mark><mark>;</mark></mark>==</p>"]
			],
			"links": [
				["[link](/uri \"title\")", "<p><a href=\"/uri\" title=\"title\">link</a></p>"],
				["[link](/uri)", "<p><a href=\"/uri\">link</a></p>"],
				["[](./target.md)", "<p><a href=\"./target.md\"></a></p>"],
				["[link]()", "<p><a href=\"\">link</a></p>"],
				["[link](<>)", "<p><a href=\"\">link</a></p>"],
				["[]()", "<p><a href=\"\"></a></p>"],
				["[link](/my uri)", "<p>[link](/my uri)</p>"],
				["[link](</my uri>)", "<p><a href=\"/my uri\">link</a></p>"],
				["[link](foo\nbar)", "<p>[link](foo\nbar)</p>"],
				["[link](<foo\nbar>)", "<p>[link](<foo bar=\"\">)</foo></p>"],
				["[a](<b)c>)", "<p><a href=\"b)c\">a</a></p>"],
				["[link](<foo\\>)", "<p>[link](&lt;foo&gt;)</p>"],
				["[a](<b)c\n[a](<b)c>\n[a](<b>c)", "<p>[a](&lt;b)c\n[a](&lt;b)c&gt;\n[a](<b>c)</b></p>"],
				["[link](\\(foo\\))", "<p><a href=\"(foo)\">link</a></p>"],
				["[link](foo(and(bar)))", "<p><a href=\"foo(and(bar))\">link</a></p>"],
				["[link](foo(and(bar))", "<p>[link](foo(and(bar))</p>"],
				["[link](foo\\(and\\(bar\\))", "<p><a href=\"foo(and(bar)\">link</a></p>"],
				["[link](<foo(and(bar)>)", "<p><a href=\"foo(and(bar)\">link</a></p>"],
				["[link](foo\\)\\:)", "<p><a href=\"foo):\">link</a></p>"],
				["[link](#fragment)\n\n[link](http://example.com#fragment)\n\n[link](http://example.com?foo=3#frag)", "<p><a href=\"#fragment\">link</a></p><p><a href=\"http://example.com#fragment\">link</a></p><p><a href=\"http://example.com?foo=3#frag\">link</a></p>"],
				["[link](foo\\bar)", "<p><a href=\"foo\\bar\">link</a></p>"],
				["[link](foo%20b&auml;)", "<p><a href=\"foo%20bä\">link</a></p>"],
				["[link](\"title\")", "<p><a href=\"&quot;title&quot;\">link</a></p>"],
				["[link](/url \"title\")\n[link](/url 'title')\n[link](/url (title))", "<p><a href=\"/url\" title=\"title\">link</a>\n<a href=\"/url\" title=\"title\">link</a>\n<a href=\"/url\" title=\"title\">link</a></p>"],
				["[link](/url \"title \\\"&quot;\")", "<p><a href=\"/url\" title=\"title &quot;&quot;\">link</a></p>"],
				["[link](/url \"title\")", "<p><a href=\"/url&nbsp;&quot;title&quot;\">link</a></p>"],
				["[link](/url \"title \"and\" title\")", "<p>[link](/url \"title \"and\" title\")</p>"],
				["[link](/url 'title \"and\" title')", "<p><a href=\"/url\" title=\"title &quot;and&quot; title\">link</a></p>"],
				["[link](   /uri\n  \"title\"  )", "<p><a href=\"/uri\" title=\"title\">link</a></p>"],
				["[link] (/uri)", "<p>[link] (/uri)</p>"],
				["[link [foo [bar]]](/uri)", "<p><a href=\"/uri\">link [foo [bar]]</a></p>"],
				["[link] bar](/uri)", "<p>[link] bar](/uri)</p>"],
				["[link \\[bar](/uri)", "<p><a href=\"/uri\">link [bar</a></p>"],
				["[link *foo **bar** `#`*](/uri)", "<p><a href=\"/uri\">link <em>foo <strong>bar</strong> <code>#</code></em></a></p>"],
				["[![moon](moon.jpg)](/uri)", "<p><a href=\"/uri\"><img src=\"moon.jpg\" alt=\"moon\"></a></p>"],
				["[foo [bar](/uri)](/uri)", "<p>[foo <a href=\"/uri\">bar</a>](/uri)</p>"],
				["[foo *[bar [baz](/uri)](/uri)*](/uri)", "<p>[foo <em>[bar <a href=\"/uri\">baz</a>](/uri)</em>](/uri)</p>"],
				["![[[foo](uri1)](uri2)](uri3)", "<p><img src=\"uri3\" alt=\"[foo](uri2)\"></p>"],
				["*[foo*](/uri)", "<p>*<a href=\"/uri\">foo*</a></p>"],
				["[foo *bar](baz*)", "<p><a href=\"baz*\">foo *bar</a></p>"],
				["*foo [bar* baz]", "<p><em>foo [bar</em> baz]</p>"],
				["[foo <bar attr=\"](baz)\">", "<p>[foo <bar attr=\"](baz)\"></bar></p>"],
				["[foo`](/uri)`", "<p>[foo<code>](/uri)</code></p>"],
				["[foo<http://example.com/?search=](uri)>", "<p>[foo<a href=\"http://example.com/?search=](uri)\">http://example.com/?search=](uri)</a></p>"],
				["[foo][bar]\n\n[bar]: /url \"title\"", "<p><a href=\"/url\" title=\"title\">foo</a></p>"],
				["[link [foo [bar]]][ref]\n\n[ref]: /uri", "<p><a href=\"/uri\">link [foo [bar]]</a></p>"],
				["[link \\[bar][ref]\n\n[ref]: /uri", "<p><a href=\"/uri\">link [bar</a></p>"],
				["[link *foo **bar** `#`*][ref]\n\n[ref]: /uri", "<p><a href=\"/uri\">link <em>foo <strong>bar</strong> <code>#</code></em></a></p>"],
				["[![moon](moon.jpg)][ref]\n\n[ref]: /uri", "<p><a href=\"/uri\"><img src=\"moon.jpg\" alt=\"moon\"></a></p>"],
				["[foo [bar](/uri)][ref]\n\n[ref]: /uri", "<p>[foo <a href=\"/uri\">bar</a>]<a href=\"/uri\">ref</a></p>"],
				["[foo *bar [baz][ref]*][ref]\n\n[ref]: /uri", "<p>[foo <em>bar <a href=\"/uri\">baz</a></em>]<a href=\"/uri\">ref</a></p>"],
				["*[foo*][ref]\n\n[ref]: /uri", "<p>*<a href=\"/uri\">foo*</a></p>"],
				["[foo *bar][ref]*\n\n[ref]: /uri", "<p><a href=\"/uri\">foo *bar</a>*</p>"],
				["[foo <bar attr=\"][ref]\">\n\n[ref]: /uri", "<p>[foo <bar attr=\"][ref]\"></bar></p>"],
				["[foo`][ref]`\n\n[ref]: /uri", "<p>[foo<code>][ref]</code></p>"],
				["[foo<http://example.com/?search=][ref]>\n\n[ref]: /uri", "<p>[foo<a href=\"http://example.com/?search=][ref]\">http://example.com/?search=][ref]</a></p>"],
				["[foo][BaR]\n\n[bar]: /url \"title\"", "<p><a href=\"/url\" title=\"title\">foo</a></p>"],
				["[ẞ]\n\n[SS]: /url", "<p><a href=\"/url\">ẞ</a></p>"],
				["[Foo\n  bar]: /url\n\n[Baz][Foo bar]", "<p><a href=\"/url\">Baz</a></p>"],
				["[foo] [bar]\n\n[bar]: /url \"title\"", "<p>[foo] <a href=\"/url\" title=\"title\">bar</a></p>"],
				["[foo]\n[bar]\n\n[bar]: /url \"title\"", "<p>[foo]\n<a href=\"/url\" title=\"title\">bar</a></p>"],
				["[foo]: /url1\n\n[foo]: /url2\n\n[bar][foo]", "<p><a href=\"/url1\">bar</a></p>"],
				["[bar][foo\\!]\n\n[foo!]: /url", "<p>[bar][foo!]</p>"],
				["[foo][ref[]\n\n[ref[]: /uri", "<p>[foo][ref[]</p><p>[ref[]: /uri</p>"],
				["[foo][ref[bar]]\n\n[ref[bar]]: /uri", "<p>[foo][ref[bar]]</p><p>[ref[bar]]: /uri</p>"],
				["[[[foo]]]\n\n[[[foo]]]: /url", "<p>[[[foo]]]</p><p>[[[foo]]]: /url</p>"],
				["[foo][ref\\[]\n\n[ref\\[]: /uri", "<p><a href=\"/uri\">foo</a></p>"],
				["[bar\\\\]: /uri\n\n[bar\\\\]", "<p><a href=\"/uri\">bar\\</a></p>"],
				["[]\n\n[]: /uri", "<p>[]</p><p>[]: /uri</p>"],
				["[\n ]\n\n[\n ]: /uri", "<p>[\n]</p><p>[\n]: /uri</p>"],
				["[foo][]\n\n[foo]: /url \"title\"", "<p><a href=\"/url\" title=\"title\">foo</a></p>"],
				["[*foo* bar][]\n\n[*foo* bar]: /url \"title\"", "<p><a href=\"/url\" title=\"title\"><em>foo</em> bar</a></p>"],
				["[Foo][]\n\n[foo]: /url \"title\"", "<p><a href=\"/url\" title=\"title\">Foo</a></p>"],
				["[foo] \n[]\n\n[foo]: /url \"title\"", "<p><a href=\"/url\" title=\"title\">foo</a>\n[]</p>"],
				["[foo]\n\n[foo]: /url \"title\"", "<p><a href=\"/url\" title=\"title\">foo</a></p>"],
				["[*foo* bar]\n\n[*foo* bar]: /url \"title\"", "<p><a href=\"/url\" title=\"title\"><em>foo</em> bar</a></p>"],
				["[[*foo* bar]]\n\n[*foo* bar]: /url \"title\"", "<p>[<a href=\"/url\" title=\"title\"><em>foo</em> bar</a>]</p>"],
				["[[bar [foo]\n\n[foo]: /url", "<p>[[bar <a href=\"/url\">foo</a></p>"],
				["[Foo]\n\n[foo]: /url \"title\"", "<p><a href=\"/url\" title=\"title\">Foo</a></p>"],
				["[foo] bar\n\n[foo]: /url", "<p><a href=\"/url\">foo</a> bar</p>"],
				["\\[foo]\n\n[foo]: /url \"title\"", "<p>[foo]</p>"],
				["[foo*]: /url\n\n*[foo*]", "<p>*<a href=\"/url\">foo*</a></p>"],
				["[foo][bar]\n\n[foo]: /url1\n[bar]: /url2", "<p><a href=\"/url2\">foo</a></p>"],
				["[foo][]\n\n[foo]: /url1", "<p><a href=\"/url1\">foo</a></p>"],
				["[foo]()\n\n[foo]: /url1", "<p><a href=\"\">foo</a></p>"],
				["[foo](not a link)\n\n[foo]: /url1", "<p><a href=\"/url1\">foo</a>(not a link)</p>"],
				["[foo][bar][baz]\n\n[baz]: /url", "<p>[foo]<a href=\"/url\">bar</a></p>"],
				["[foo][bar][baz]\n\n[baz]: /url1\n[bar]: /url2", "<p><a href=\"/url2\">foo</a><a href=\"/url1\">baz</a></p>"],
				["[foo][bar][baz]\n\n[baz]: /url1\n[foo]: /url2", "<p>[foo]<a href=\"/url1\">bar</a></p>"]
			],
			"images": [
				["![foo](/url \"title\")", "<p><img src=\"/url\" alt=\"foo\" title=\"title\"></p>"],
				["![foo *bar*]\n\n[foo *bar*]: train.jpg \"train & tracks\"", "<p><img src=\"train.jpg\" alt=\"foo bar\" title=\"train &amp; tracks\"></p>"],
				["![foo ![bar](/url)](/url2)", "<p><img src=\"/url2\" alt=\"foo bar\"></p>"],
				["![foo [bar](/url)](/url2)", "<p><img src=\"/url2\" alt=\"foo bar\"></p>"],
				["![foo *bar*][]\n\n[foo *bar*]: train.jpg \"train & tracks\"", "<p><img src=\"train.jpg\" alt=\"foo bar\" title=\"train &amp; tracks\"></p>"],
				["![foo *bar*][foobar]\n\n[FOOBAR]: train.jpg \"train & tracks\"", "<p><img src=\"train.jpg\" alt=\"foo bar\" title=\"train &amp; tracks\"></p>"],
				["![foo](train.jpg)", "<p><img src=\"train.jpg\" alt=\"foo\"></p>"],
				["My ![foo bar](/path/to/train.jpg  \"title\"   )", "<p>My <img src=\"/path/to/train.jpg\" alt=\"foo bar\" title=\"title\"></p>"],
				["![foo](<url>)", "<p><img src=\"url\" alt=\"foo\"></p>"],
				["![](/url)", "<p><img src=\"/url\" alt=\"\"></p>"],
				["![foo][bar]\n\n[bar]: /url", "<p><img src=\"/url\" alt=\"foo\"></p>"],
				["![foo][bar]\n\n[BAR]: /url", "<p><img src=\"/url\" alt=\"foo\"></p>"],
				["![foo][]\n\n[foo]: /url \"title\"", "<p><img src=\"/url\" alt=\"foo\" title=\"title\"></p>"],
				["![*foo* bar][]\n\n[*foo* bar]: /url \"title\"", "<p><img src=\"/url\" alt=\"foo bar\" title=\"title\"></p>"],
				["![Foo][]\n\n[foo]: /url \"title\"", "<p><img src=\"/url\" alt=\"Foo\" title=\"title\"></p>"],
				["![foo] \n[]\n\n[foo]: /url \"title\"", "<p><img src=\"/url\" alt=\"foo\" title=\"title\">\n[]</p>"],
				["![foo]\n\n[foo]: /url \"title\"", "<p><img src=\"/url\" alt=\"foo\" title=\"title\"></p>"],
				["![*foo* bar]\n\n[*foo* bar]: /url \"title\"", "<p><img src=\"/url\" alt=\"foo bar\" title=\"title\"></p>"],
				["![[foo]]\n\n[[foo]]: /url \"title\"", "<p>![[foo]]</p><p>[[foo]]: /url \"title\"</p>"],
				["![Foo]\n\n[foo]: /url \"title\"", "<p><img src=\"/url\" alt=\"Foo\" title=\"title\"></p>"],
				["!\\[foo]\n\n[foo]: /url \"title\"", "<p>![foo]</p>"],
				["\\![foo]\n\n[foo]: /url \"title\"", "<p>!<a href=\"/url\" title=\"title\">foo</a></p>"]
			],
			"autolinks": [
				["<http://foo.bar.baz>", "<p><a href=\"http://foo.bar.baz\">http://foo.bar.baz</a></p>"],
				["<http://foo.bar.baz/test?q=hello&id=22&boolean>", "<p><a href=\"http://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean\">http://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean</a></p>"],
				["<irc://foo.bar:2233/baz>", "<p><a href=\"irc://foo.bar:2233/baz\">irc://foo.bar:2233/baz</a></p>"],
				["<MAILTO:FOO@BAR.BAZ>", "<p><a href=\"MAILTO:FOO@BAR.BAZ\">MAILTO:FOO@BAR.BAZ</a></p>"],
				["<a+b+c:d>", "<p><a href=\"a+b+c:d\">a+b+c:d</a></p>"],
				["<made-up-scheme://foo,bar>", "<p><a href=\"made-up-scheme://foo,bar\">made-up-scheme://foo,bar</a></p>"],
				["<http://../>", "<p><a href=\"http://../\">http://../</a></p>"],
				["<localhost:5001/foo>", "<p><a href=\"localhost:5001/foo\">localhost:5001/foo</a></p>"],
				["<http://foo.bar/baz bim>", "<p>&lt;http://foo.bar/baz bim&gt;</p>"],
				["<http://example.com/\\[\\>", "<p><a href=\"http://example.com/\\[\\\">http://example.com/\\[\\</a></p>"],
				["<foo@bar.example.com>", "<p><a href=\"mailto:foo@bar.example.com\">foo@bar.example.com</a></p>"],
				["<foo+special@Bar.baz-bar0.com>", "<p><a href=\"mailto:foo+special@Bar.baz-bar0.com\">foo+special@Bar.baz-bar0.com</a></p>"],
				["<foo\\+@bar.example.com>", "<p>&lt;foo+@bar.example.com&gt;</p>"],
				["<>", "<p>&lt;&gt;</p>"],
				["< http://foo.bar >", "<p>&lt; http://foo.bar &gt;</p>"],
				["<m:abc>", "<p>&lt;m:abc&gt;</p>"],
				["<foo.bar.baz>", "<p>&lt;foo.bar.baz&gt;</p>"],
				["http://example.com", "<p>http://example.com</p>"],
				["foo@bar.example.com", "<p>foo@bar.example.com</p>"]
			],
			"HTML": [
				["<a><bab><c2c>", "<p><a><bab><c2c></c2c></bab></a></p>"],
				["<a/><b2/>", "<p><a><b2></b2></a></p>"],
				["<a  /><b2\ndata=\"foo\" >", "<p><a><b2 data=\"foo\"></b2></a></p>"],
				["<a foo=\"bar\" bam = 'baz <em>\"</em>'\n_boolean zoop:33=zoop:33 />", "<p><a foo=\"bar\" bam=\"baz <em>&quot;</em>\" _boolean=\"\" zoop:33=\"zoop:33\"></a></p>"],
				["Foo <responsive-image src=\"foo.jpg\" />", "<p>Foo <responsive-image src=\"foo.jpg\"></responsive-image></p>"],
				["<33> <__>", "<p>&lt;33&gt; &lt;__&gt;</p>"],
				["<a h*#ref=\"hi\">", "<p>&lt;a h*#ref=\"hi\"&gt;</p>"],
				["<a href=\"hi'> <a href=hi'>", "<p>&lt;a href=\"hi'&gt; &lt;a href=hi'&gt;</p>"],
				["< a><\nfoo><bar/ >\n<foo bar=baz\nbim!bop />", "<p>&lt; a&gt;&lt;\nfoo&gt;&lt;bar/ &gt;\n&lt;foo bar=baz\nbim!bop /&gt;</p>"],
				["<a href='bar'title=title>", "<p>&lt;a href='bar'title=title&gt;</p>"],
				["</a></foo >", "<p></p>"],
				["</a href=\"foo\">", "<p>&lt;/a href=\"foo\"&gt;</p>"],
				["foo <!-- this is a --\ncomment - with hyphens -->", "<p>foo <!-- this is a --\ncomment - with hyphens --></p>"],
				["foo <!--> foo -->\n\nfoo <!-- foo--->", "<p>foo &lt;!--&gt; foo --&gt;</p><p>foo &lt;!-- foo---&gt;</p>"],
				["foo <?php echo $a; ?>", "<p>foo <!--?php echo $a; ?--></p>"],
				["foo <!ELEMENT br EMPTY>", "<p>foo <!--ELEMENT br EMPTY--></p>"],
				["foo <![CDATA[>&<]]>", "<p>foo <!--[CDATA[-->&amp;&lt;]]&gt;</p>"],
				["foo <a href=\"&ouml;\">", "<p>foo <a href=\"ö\"></a></p>"],
				["foo <a href=\"\\*\">", "<p>foo <a href=\"\\*\"></a></p>"],
				["<a href=\"\\\"\">", "<p>&lt;a href=\"\"\"&gt;</p>"],
			],
			"hard line breaks": [
				["foo  \nbaz", "<p>foo<br>baz</p>"],
				["foo\\\nbaz", "<p>foo<br>baz</p>"],
				["foo       \nbaz", "<p>foo<br>baz</p>"],
				["foo  \n     bar", "<p>foo<br>bar</p>"],
				["foo\\\n     bar", "<p>foo<br>bar</p>"],
				["*foo  \nbar*", "<p><em>foo<br>bar</em></p>"],
				["*foo\\\nbar*", "<p><em>foo<br>bar</em></p>"],
				["`code  \nspan`", "<p><code>code   span</code></p>"],
				["`code\\\nspan`", "<p><code>code\\ span</code></p>"],
				["a <a href=\"foo  \nbar\">", "<p>a <a href=\"foo  \nbar\"></a></p>"],
				["a <a href=\"foo\\\nbar\">", "<p>a <a href=\"foo\\\nbar\"></a></p>"],
				["foo\\", "<p>foo\\</p>"],
				["foo  ", "<p>foo</p>"],
				["### foo\\", "<h3>foo\\</h3>"],
				["### foo  ", "<h3>foo</h3>"]
			],
			"soft line breaks": [
				["foo\nbaz", "<p>foo\nbaz</p>"],
				["foo \n baz", "<p>foo\nbaz</p>"],
			],
			"textual content": [
				["hello $.;'there", "<p>hello $.;'there</p>"],
				["Foo χρῆν", "<p>Foo χρῆν</p>"],
				["Multiple     spaces", "<p>Multiple     spaces</p>"]
			]
		},
		"no extension": {
			"task list items": [
				["- [ ] foo\n- [x] bar", "<ul><li>[ ] foo</li><li>[x] bar</li></ul>"],
				["- [x] foo\n  - [ ] bar\n  - [x] baz\n- [ ] bim", "<ul><li>[x] foo<ul><li>[ ] bar</li><li>[x] baz</li></ul></li><li>[ ] bim</li></ul>"]
			],
			"table": [
				["| Heading 1 | Heading 2\n| --------- | ---------\n| Cell 1    | Cell 2\n| Cell 3    | Cell 4", "<p>| Heading 1 | Heading 2\n| --------- | ---------\n| Cell 1    | Cell 2\n| Cell 3    | Cell 4</p>"],
				["| Header 1 | Header 2 | Header 3 | Header 4 |\n| :------: | -------: | :------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   | Cell 4   |\n| Cell 5   | Cell 6   | Cell 7   | Cell 8   |", "<p>| Header 1 | Header 2 | Header 3 | Header 4 |\n| :------: | -------: | :------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   | Cell 4   |\n| Cell 5   | Cell 6   | Cell 7   | Cell 8   |</p>"],
				["Header 1|Header 2|Header 3|Header 4\n:-------|:------:|-------:|--------\nCell 1  |Cell 2  |Cell 3  |Cell 4\n*Cell 5*|Cell 6  |Cell 7  |Cell 8", "<p>Header 1|Header 2|Header 3|Header 4\n:-------|:------:|-------:|--------\nCell 1  |Cell 2  |Cell 3  |Cell 4\n<em>Cell 5</em>|Cell 6  |Cell 7  |Cell 8</p>"],
				["> foo|foo\n> ---|---\n> bar|bar\nbaz|baz", "<blockquote><p>foo|foo\n---|---\nbar|bar\nbaz|baz</p></blockquote>"]
			],
			"subscript": [
				["Subscript: H~2~O", "<p>Subscript: H~2~O</p>"],
				["~foo\\ bar\\ baz~", "<p>~foo\\ bar\\ baz~</p>"],
				["~\\ foo\\ ~", "<p>~\\ foo\\ ~</p>"],
				["~foo\\\\\\\\\\\\\\\ bar~", "<p>~foo\\\\\\\\ bar~</p>"]
			],
			"superscript": [
				["^test^", "<p>^test^</p>"],
				["^foo~bar^baz^bar~foo^", "<p>^foo~bar^baz^bar~foo^</p>"],
				["^\\ foo\\ ^", "<p>^\\ foo\\ ^</p>"],
				["^foo\\\\\\\\\\\\\\ bar^", "<p>^foo\\\\\\\\ bar^</p>"]
			],
			"strikethrough": [
				["~~Strikeout~~", "<p>~~Strikeout~~</p>"],
				["x ~~~~foo~~ bar~~", "<p>x ~~~~foo~~ bar~~</p>"],
				["x ~~foo ~~bar~~~~", "<p>x ~~foo ~~bar~~~~</p>"],
				["x ~~~~foo~~~~", "<p>x ~~~~foo~~~~</p>"]
			],
			"insert": [
				["++Insert++", "<p>++Insert++</p>"],
				["x ++++foo++ bar++", "<p>x ++++foo++ bar++</p>"],
				["x ++foo ++bar++++", "<p>x ++foo ++bar++++</p>"],
				["x ++++foo++++", "<p>x ++++foo++++</p>"]
			],
			"mark": [
				["==Mark==", "<p>==Mark==</p>"],
				["x ====foo== bar==", "<p>x ====foo== bar==</p>"],
				["x ==foo ==bar====", "<p>x ==foo ==bar====</p>"],
				["x ====foo====", "<p>x ====foo====</p>"]
			],
			"underline": [
				["_foo bar_", "<p><em>foo bar</em></p>"],
				["foo-_(bar)_", "<p>foo-<em>(bar)</em></p>"],
				["_(_foo_)_", "<p><em>(<em>foo</em>)</em></p>"],
				["_foo_bar_baz_", "<p><em>foo_bar_baz</em></p>"]
			]
		}
	} as Record<string, Record<string, [string, string][]>>).reduce((o, [title, tests]) => (o[title] = Object.entries(tests).reduce((p, [subtitle, testArr]) => (p[subtitle] = testArr.reduce((q, [input, output], n) => (q[n+1] = Object.defineProperty(async () => {
		const {default: parseMarkdown} = await import("./lib/markdown.js"),
		      {code, div, pre} = await import ("./lib/html.js"),
		      tags: any = Object.assign({"code": (info: string, text: string) => pre({"class": info.replace(/[^\w ]/g, "").split(/[ \t]+/).filter(l => l.trim()).map(l => `language-${l}`) || null}, code(text))}, title === "no extension" ? {
			"underline": null,
			"subscript": null,
			"superscript": null,
			"strikethrough": null,
			"insert": null,
			"highlight": null,
			"table": null,
			"checkbox": null
		      } : subtitle === "underline" ? {} : {"underline": null}),
		      generated = div(parseMarkdown(input, tags)).innerHTML;

		if (generated !== output) {
			console.log(input, generated);
		}

		return generated === output;
	}, "toString", {"value": () => JSON.stringify(input) + " => " + JSON.stringify(output)}), q), {} as Record<string, () => Promise<boolean>>), p), {} as Record<string, Record<string, () => Promise<boolean>>>), o), {} as Record<string, Record<string, Record<string, () => Promise<boolean>>>>)
});
