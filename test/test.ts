((data: Record<string, Record<string, Record<string, () => Promise<boolean>>>>) => {
	const completeSpan = document.createElement("span"),
	      failSpan = document.createElement("span"),
	      df = document.createDocumentFragment();
	let completeNum = 0,
	    totalNum = 0,
	    failNum = 0,
	    opened = false;
	failSpan.setAttribute("class", "fails");
	completeSpan.innerText = "0";
	for (const [library, libTests] of Object.entries(data)) {
		const libDet = df.appendChild(document.createElement("details")),
		      libSum = libDet.appendChild(document.createElement("summary")),
		      libCom = document.createElement("span"),
		      libFail = document.createElement("span");
		let libTotalNum = 0,
		    libCompleteNum = 0,
		    libFails = 0;
		libFail.setAttribute("class", "fails");
		libCom.innerText = "0";
		for (const [section, tests] of Object.entries(libTests)) {
			const sectionDet = libDet.appendChild(document.createElement("details")),
			      sectionSum = sectionDet.appendChild(document.createElement("summary")),
			      sectionCom = document.createElement("span"),
			      sectionFail = document.createElement("span"),
			      ul = sectionDet.appendChild(document.createElement("ul"));
			let sectionTotalNum = 0,
			    sectionCompleteNum = 0,
			    sectionFails = 0;
			sectionFail.setAttribute("class", "fails");
			sectionCom.innerText = "0";
			for (const [description, test] of Object.entries(tests)) {
				sectionTotalNum++;
				libTotalNum++;
				totalNum++;
				const li = ul.appendChild(document.createElement("li"));
				li.innerText = description;
				li.setAttribute("title", test.toString());
				test().catch(error => {
					console.log({library, section, description, error});
					alert(`Error in library ${library}, section ${section}, test "${description}": check console for details`);
					return false;
				}).then(pass => {
					li.setAttribute("class", pass ? "pass" : "fail");
					if (pass) {
						sectionCom.innerText = (++sectionCompleteNum)+"";
						libCom.innerText = (++libCompleteNum)+"";
						completeSpan.innerText = (++completeNum)+"";
					} else {
						sectionDet.toggleAttribute("open", true);
						libDet.toggleAttribute("open", true);
						sectionFail.innerText = (++sectionFails)+"";
						libFail.innerText = (++libFails)+"";
						failSpan.innerText = (++failNum)+"";
					}
				});
			}
			sectionSum.append(section + ": ", sectionCom, "/" + sectionTotalNum, sectionFail);
		}
		libSum.append(library + ": ", libCom, "/" + libTotalNum, libFail);
	}
	window.addEventListener("load", () => document.body.replaceChildren("Tests: ", completeSpan, "/" + totalNum, failSpan, df));
	window.addEventListener("keypress", (e: KeyboardEvent) => {
		if (e.key === "o") {
			opened = !opened;
			Array.from(document.getElementsByTagName("details"), e => e.toggleAttribute("open", opened));
		}
	});
})({
	"load.js": {
		"pageLoad": {
			"pageLoad": async () => {
				const {default: pageLoad} = await import("./lib/load.js");
				return Promise.race([
					pageLoad,
					new Promise(sFn => setTimeout(() => sFn(false), 10000))
				]).then(v => v !== false);
			}
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
			"then": async () => {
				let res = false,
				    sFn = (_: boolean) => {};
				const {Subscription} = await import("./lib/inter.js");
				new Subscription<boolean>(s => sFn = s).then(b => res = b).catch(() => res = false);
				sFn(true);
				return res;
			},
			"then-chain": async () => {
				let res = false,
				    sFn = (_: boolean) => {};
				const {Subscription} = await import("./lib/inter.js"),
				      s = new Subscription<boolean>(s => sFn = s);
				s.then(b => b).then(b => res = b).catch(() => res = false);;
				sFn(true);
				return res;
			},
			"multi-then": async () => {
				let res = 0,
				    sFn = (_: number) => {};
				const {Subscription} = await import("./lib/inter.js"),
				      s = new Subscription<number>(s => sFn = s);
				s.then(b => res += b).catch(() => res = 0);
				s.then(b => res += b).catch(() => res = 0);;
				s.then(b => res += b).catch(() => res = 0);;
				sFn(1);
				return res === 3;
			},
			"multi-then-chain": async () => {
				let res = 0,
				    sFn = (_: number) => {};
				const {Subscription} = await import("./lib/inter.js"),
				      s = new Subscription<number>(s => sFn = s);
				s.then(b => b + 1).then(b => res += b);
				s.then(b => b + 2).then(b => res += b);
				s.then(b => b + 3).then(b => res += b);
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
				new Subscription<boolean>(s => sFn = s).then(() => {throw 1}).catch(e => res += e);
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
				new Subscription<boolean>(s => sFn = s).then(() => {}).finally(() => res++);
				new Subscription<boolean>(() => {}).then(() => {}).finally(() => res++);
				sFn(false);
				return res === 1;
			},
			"error finally": async () => {
				let res = 0,
				    sFn = (_: boolean) => {};
				const {Subscription} = await import("./lib/inter.js");
				new Subscription<boolean>(s => sFn = s).then(() => {throw 1}).finally(() => res++);
				new Subscription<boolean>(() => {}).then(() => {throw 1}).finally(() => res++);
				sFn(false);
				return res === 1;
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
				new Subscription((_sFn, _eFn, cFn) => cFn(() => res++)).then(() => {}).cancel();
				new Subscription((_sFn, _eFn, cFn) => cFn(() => res++)).then(() => {});
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
				      first = sc().then(n => res += n * 2, n => res += n * 3),
				      second = sc().then(n => res += n * 5, n => res += n * 7);
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
				      first = sc().then(n => res += n * 2, n => res += n * 3),
				      second = sc().then(n => res += n * 5, n => res += n * 7);
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
				      ).then(n => res += typeof n === "string" ? n.length : n, e => res *= e);
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
				s.then(num => res *= num, num => res %= num).cancel();
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
		"autoFocus": {
			"focus()": async () => {
				const {autoFocus} = await import("./lib/dom.js");
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
				const {autoFocus} = await import("./lib/dom.js");
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
		"bind": {
			"bind text": async () => {
				const {amendNode, bind} = await import("./lib/dom.js"),
				      text = bind("HELLO"),
				      elm = amendNode(document.createElement("div"), text),
				      start = elm.textContent;
				text.value = "GOODBYE";
				return start === "HELLO" && elm.textContent === "GOODBYE";
			},
			"bind text (multiple)": async () => {
				const {amendNode, bind} = await import("./lib/dom.js"),
				      text = bind("HELLO"),
				      elm = amendNode(document.createElement("div"), text),
				      elm2 = amendNode(document.createElement("div"), ["Other ", text, " Text"]),
				      start = elm.textContent,
				      start2 = elm2.textContent;
				text.value = "GOODBYE";
				return start === "HELLO" && start2 == "Other HELLO Text" && elm.textContent === "GOODBYE" && elm2.textContent === "Other GOODBYE Text";
			},
			"bind attr": async () => {
				const {amendNode, bind} = await import("./lib/dom.js"),
				      attr = bind("FIRST"),
				      elm = amendNode(document.createElement("div"), {"TEST": attr}),
				      start = elm.getAttribute("TEST");
				attr.value = "SECOND";
				return start === "FIRST" && elm.getAttribute("TEST") === "SECOND";
			},
			"bind attr (multiple)": async () => {
				const {amendNode, bind} = await import("./lib/dom.js"),
				      attr = bind("FIRST"),
				      elm = amendNode(document.createElement("div"), {"TEST": attr, "TEST2": attr}),
				      elm2 = amendNode(document.createElement("div"), {"TEST3": attr}),
				      start = elm.getAttribute("TEST"),
				      start2 = elm.getAttribute("TEST2"),
				      start3 = elm2.getAttribute("TEST3");
				attr.value = "SECOND";
				return start === "FIRST" && start2 === "FIRST" && start3 === "FIRST" && elm.getAttribute("TEST") === "SECOND" && elm.getAttribute("TEST2") === "SECOND" && elm2.getAttribute("TEST3") === "SECOND";
			}
		},
		"bind (template)": {
			"single bind": async () => {
				const {amendNode, bind} = await import("./lib/dom.js"),
				      a = bind(" "),
				      text = bind`HELLO${a}WORLD`,
				      elm = amendNode(document.createElement("div"), text),
				      start = elm.textContent;
				a.value = ",";
				return start === "HELLO WORLD" && elm.textContent === "HELLO,WORLD";
			},
			"single bind (attr)": async () => {
				const {amendNode, bind} = await import("./lib/dom.js"),
				      a = bind(" "),
				      text = bind`HELLO${a}WORLD`,
				      elm = amendNode(document.createElement("div"), {text}),
				      start = elm.getAttribute("text");
				a.value = ",";
				return start === "HELLO WORLD" && elm.getAttribute("text") === "HELLO,WORLD";
			},
			"double bind": async () => {
				const {amendNode, bind} = await import("./lib/dom.js"),
				      a = bind("One"),
				      b = bind("Two"),
				      text = bind`1: ${a}\n2: ${b}`,
				      elm = amendNode(document.createElement("div"), text),
				      start = elm.textContent;
				a.value = "Uno";
				const start2 = elm.textContent;
				b.value = "Dos";
				return start === `1: One\n2: Two` && start2 === `1: Uno\n2: Two` && elm.textContent === `1: Uno\n2: Dos`;
			},
			"double bind (attr)": async () => {
				const {amendNode, bind} = await import("./lib/dom.js"),
				      a = bind("One"),
				      b = bind("Two"),
				      text = bind`1: ${a}\n2: ${b}`,
				      elm = amendNode(document.createElement("div"), {text}),
				      start = elm.getAttribute("text");
				a.value = "Uno";
				const start2 = elm.getAttribute("text");
				b.value = "Dos";
				return start === `1: One\n2: Two` && start2 === `1: Uno\n2: Two` && elm.getAttribute("text") === `1: Uno\n2: Dos`;
			}
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
		"RPC": {
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
					rpc.subscribe(-1).then(data => res += +(data === "123"));
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
			}
		}
	},
	"bbcode.js": {
		"tokeniser": {
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
			}
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
			},
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
			},
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
			},
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
			},
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
			},
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
			},
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
		},
		"complex tags": {
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
			},
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
			},
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
				return +new Fraction(1n, 2n) === 0.5;
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
			}
		}
	},
	"css.js": {
		"compound selectors": {
			"empty": async () => {
				const {default: CSS} = await import("./lib/css.js");
				return new CSS().add("", {"a": 0}) + "" === "";
			},
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
		"query": {
			"@supports": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      css = new CSS();
				return css.query("@supports (display: flex)", {"a": {"opacity": 0}}) + "" === "@supports (display: flex) {\n  a { opacity: 0; }\n}";

			},
			"@media": async () => {
				const {default: CSS} = await import("./lib/css.js"),
				      css = new CSS();
				return css.query("@media screen and (min-width: 900px)", {
					"article": {
						"padding": "1rem 3rem"
					}
				}) + "" === "@media screen and (min-width: 900px) {\n  article { padding: 1rem 3rem; }\n}";
			}
		}
	}
});
