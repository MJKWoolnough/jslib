((data: Record<string, Record<string, Record<string, () => Promise<boolean>>>>) => {
	const completeSpan = document.createElement("span"),
	      failSpan = document.createElement("span"),
	      df = document.createDocumentFragment();
	let completeNum = 0,
	    totalNum = 0,
	    failNum = 0;
	failSpan.setAttribute("class", "fails");
	for (const [library, libTests] of Object.entries(data)) {
		const libDet = df.appendChild(document.createElement("details")),
		      libSum = libDet.appendChild(document.createElement("summary")),
		      libCom = document.createElement("span"),
		      libFail = document.createElement("span");
		let libTotalNum = 0,
		    libCompleteNum = 0,
		    libFails = 0;
		libFail.setAttribute("class", "fails");
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
			for (const [description, test] of Object.entries(tests)) {
				sectionTotalNum++;
				libTotalNum++;
				totalNum++;
				const li = ul.appendChild(document.createElement("li"));
				li.innerText = description;
				li.setAttribute("title", test.toString());
				test().then(pass => {
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
				}).catch((error: any) => {
					console.log({library, section, description, error});
					alert(`Error in library ${library}, section ${section}: check console for details`);
				});
			}
			sectionSum.append(section + ": ", sectionCom, "/" + sectionTotalNum, sectionFail);
		}
		libSum.append(library + ": ", libCom, "/" + libTotalNum, libFail);
	}
	window.addEventListener("load", () => document.body.replaceChildren("Tests: ", completeSpan, "/", totalNum+"", failSpan, df));
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
			"Bind": async () => {
				const {Pipe} = await import("./lib/inter.js"),
				      [send, receive] = new Pipe<boolean>().bind();
				let res: boolean = false;
				receive(v => res = v);
				send(true);
				return res;
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
				return new Promise<boolean>(fn => {
					class focusElement extends HTMLElement {
						focus() {fn(true);}
					}
					customElements.define("focus-element", focusElement);
					autoFocus(new focusElement());
					window.setTimeout(() => fn(false), 1000);
				});
			},
			"select()": async () => {
				const {autoFocus} = await import("./lib/dom.js");
				return new Promise<boolean>(fn => {
					class selectElement extends HTMLInputElement {
						focus() {}
						select() {fn(true);}
					}
					customElements.define("select-element", selectElement, {"extends": "input"});
					autoFocus(new selectElement());
					window.setTimeout(() => fn(false), 1000);
				});
			}
		}
	}
});
