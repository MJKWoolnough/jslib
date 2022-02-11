((data: Record<string, Record<string, Record<string, () => Promise<boolean>>>>) => {
	const completeSpan = document.createElement("span"),
	      failSpan = document.createElement("span"),
	      df = document.createDocumentFragment();
	let completeNum = 0,
	    totalNum = 0,
	    failNum = 0;
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
})({
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
				error(4)
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
				error(4)
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
				const {default: rpc} = await import("./lib/rpc.js");
				return rpc("/rpc").then(rpc => rpc.request("static").then(d => d === "123"));
			},
			"echo test": async () => {
				const {default: rpc} = await import("./lib/rpc.js");
				return rpc("/rpc").then(rpc => rpc.request("echo", "456").then(d => d === "456"));
			},
			"broadcast test": async () => {
				const {default: rpc} = await import("./lib/rpc.js");
				return rpc("/rpc").then(rpc => {
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
				const {default: rpc} = await import("./lib/rpc.js");
				return rpc("/rpc").then(rpc => {
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
				const {default: rpc} = await import("./lib/rpc.js");
				return rpc("/rpc").then(rpc => {
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
				const {default: rpc} = await import("./lib/rpc.js");
				return rpc("/rpc").then(rpc => rpc.request("unknown").then(() => false).catch(() => true));
			},
			"close test": async () => {
				const {default: rpc} = await import("./lib/rpc.js");
				return rpc("/rpc").then(rpc => rpc.request("close").then(() => false).catch(() => true));
			},
			"close all test": async () => {
				const {default: rpc} = await import("./lib/rpc.js");
				return rpc("/rpc").then(rpc => {
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
			}
		}
	}
});
