declare const pageLoad: Promise<void>;

const test = (() => {
	const handleError = (e: any) => {
		console.log(e);
		alert(e instanceof Error ? e.message : e instanceof Error ? e.message : e);
	      },
	      ul = document.createElement("ul"),
	      completeSpan = document.createElement("span"),
	      totalSpan = document.createElement("span");
	let p = pageLoad.then(() => {
		document.body.innerText = "";
		document.body.append("Tests: ", completeSpan, "/", totalSpan, ul);
	    }),
	    complete = 0,
	    total = 0;
	return (desc: string, fn: () => boolean | Promise<boolean>) => {
		const li = document.createElement("li");
		li.innerText = desc;
		p = p.finally(async () => {
			const pass = await fn();
			li.setAttribute("class", pass ? "pass" : "fail");
			if (pass) {
				completeSpan.innerText = ++complete + "";
			}
		}).catch(handleError);
		ul.append(li);
		totalSpan.innerText = ++total + "";
	};
      })();

test("pageLoad", () => true);

// inter.js

// -- Pipe

test("Pipe Send/Receive", async () => {
	const {Pipe} = await import("./lib/inter.js"),
	      p = new Pipe<boolean>();
	let res: boolean = false;
	p.receive(v => res = v);
	p.send(true);
	return res;
});

test("Pipe Send/Multi-receive", async () => {
	const {Pipe} = await import("./lib/inter.js"),
	      p = new Pipe<number>();
	let num = 0;
	p.receive(v => num += v);
	p.receive(v => num += v);
	p.receive(v => num += v);
	p.send(2);
	return num === 6;
});

test("Pipe Remove", async () => {
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
});

test("Pipe Bind", async () => {
	const {Pipe} = await import("./lib/inter.js"),
	      [send, receive] = new Pipe<boolean>().bind();
	let res: boolean = false;
	receive(v => res = v);
	send(true);
	return res;
});

// -- Requester

test("Requester Respond/Request value", async () => {
	const {Requester} = await import("./lib/inter.js"),
	      r = new Requester<boolean>();
	r.responder(true);
	return r.request();
});

test("Requester Respond/Request fn", async () => {
	const {Requester} = await import("./lib/inter.js"),
	      r = new Requester<boolean>();
	r.responder(() => true);
	return r.request();
});

test("Requester No Responder", async () => {
	const {Requester} = await import("./lib/inter.js"),
	      r = new Requester<boolean>();
	try {
		r.request();
	} catch(e) {
		return true;
	}
	return false;
});


// -- Subscription

test("Subscription then", async () => {
	let res = false,
	    sFn = (_: boolean) => {};
	const {Subscription} = await import("./lib/inter.js");
	new Subscription<boolean>(s => sFn = s).then(b => res = b).catch(() => res = false);
	sFn(true);
	return res;
});

test("Subscription then-chain", async () => {
	let res = false,
	    sFn = (_: boolean) => {};
	const {Subscription} = await import("./lib/inter.js"),
	      s = new Subscription<boolean>(s => sFn = s);
	s.then(b => b).then(b => res = b).catch(() => res = false);;
	sFn(true);
	return res;
});

test("Subscription multi-then", async () => {
	let res = 0,
	    sFn = (_: number) => {};
	const {Subscription} = await import("./lib/inter.js"),
	      s = new Subscription<number>(s => sFn = s);
	s.then(b => res += b).catch(() => res = 0);
	s.then(b => res += b).catch(() => res = 0);;
	s.then(b => res += b).catch(() => res = 0);;
	sFn(1);
	return res === 3;
});

test("Subscription multi-then-chain", async () => {
	let res = 0,
	    sFn = (_: number) => {};
	const {Subscription} = await import("./lib/inter.js"),
	      s = new Subscription<number>(s => sFn = s);
	s.then(b => b + 1).then(b => res += b);
	s.then(b => b + 2).then(b => res += b);
	s.then(b => b + 3).then(b => res += b);
	sFn(1);
	return res === 9;
});

test("Subscription catch", async () => {
	let res = 0,
	    eFn = (_: any) => {};
	const {Subscription} = await import("./lib/inter.js");
	new Subscription<boolean>((_, e) => eFn = e).catch(e => res += e);
	eFn(1);
	return res === 1;
});

test("Subscription error catch", async () => {
	let res = 0,
	    sFn = (_: boolean) => {};
	const {Subscription} = await import("./lib/inter.js");
	new Subscription<boolean>(s => sFn = s).then(() => {throw 1}).catch(e => res += e);
	sFn(false);
	return res === 1;
});

test("Subscription finally", async () => {
	let res = 0,
	    sFn = (_: boolean) => {};
	const {Subscription} = await import("./lib/inter.js");
	new Subscription<boolean>(s => sFn = s).finally(() => res++);
	new Subscription<boolean>(() => {}).finally(() => res++);
	sFn(false);
	return res === 1;
});

test("Subscription finally-chain", async () => {
	let res = 0,
	    sFn = (_: boolean) => {};
	const {Subscription} = await import("./lib/inter.js");
	new Subscription<boolean>(s => sFn = s).then(() => {}).finally(() => res++);
	new Subscription<boolean>(() => {}).then(() => {}).finally(() => res++);
	sFn(false);
	return res === 1;
});

test("Subscription error finally", async () => {
	let res = 0,
	    sFn = (_: boolean) => {};
	const {Subscription} = await import("./lib/inter.js");
	new Subscription<boolean>(s => sFn = s).then(() => {throw 1}).finally(() => res++);
	new Subscription<boolean>(() => {}).then(() => {throw 1}).finally(() => res++);
	sFn(false);
	return res === 1;
});

test("Subscription cancel", async () => {
	let res = 0;
	const {Subscription} = await import("./lib/inter.js");
	new Subscription((_sFn, _eFn, cFn) => cFn(() => res++)).cancel();
	new Subscription((_sFn, _eFn, cFn) => cFn(() => res++));
	return res === 1;
});

test("Subscription chain-cancel", async () => {
	let res = 0;
	const {Subscription} = await import("./lib/inter.js");
	new Subscription((_sFn, _eFn, cFn) => cFn(() => res++)).then(() => {}).cancel();
	new Subscription((_sFn, _eFn, cFn) => cFn(() => res++)).then(() => {});
	return res === 1;
});

// -- WaitGroup

test("WaitGroup add-done", async () => {
	let res = 0;
	const {WaitGroup} = await import("./lib/inter.js"),
	      wg = new WaitGroup();
	wg.onComplete(() => res = 1);
	res++;
	wg.add();
	res++;
	wg.done();
	return res === 1;
});

test("WaitGroup multi-add-done", async () => {
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
});

test("WaitGroup error-done", async () => {
	let res = false;
	const {WaitGroup} = await import("./lib/inter.js"),
	      wg = new WaitGroup();
	wg.onComplete(() => res = true);
	wg.add();
	wg.error();
	return res;
});

test("WaitGroup multi-error-done", async () => {
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
});

test("WaitGroup onUpdate", async () => {
	let res = 0;
	const {WaitGroup} = await import("./lib/inter.js"),
	      wg = new WaitGroup();
	wg.onUpdate(wi => res += wi.waits * 2 + wi.done * 3 + wi.errors * 5);
	wg.add();
	wg.add();
	wg.error();
	wg.done();
	return res === 27;
});

test("WaitGroup onUpdate/onComplete", async () => {
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
});

// dom.js

// -- amendNode

test("amendNode type test (div)", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("div")) instanceof HTMLDivElement;
});

test("amendNode type test (span)", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("span")) instanceof HTMLSpanElement;
});

test("amendNode no property", () => {
	return document.createElement("div").getAttribute("property") === null;
});

test("amendNode string property", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("div"), {"property": "value"}).getAttribute("property") === "value";
});

test("amendNode number property", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("div"), {"property": 1}).getAttribute("property") === "1";
});

test("amendNode boolean property", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("div"), {"property": true}).getAttribute("property") === "";
});

test("amendNode unset boolean property", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(amendNode(document.createElement("div"), {"property": true}), {"property": false}).getAttribute("property") === null;
});

test("amendNode ToString property", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("div"), {"property": {}}).getAttribute("property") === "[object Object]";
});

test("amendNode remove string property", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(amendNode(document.createElement("div"), {"property": "value"}), {"property": undefined}).getAttribute("property") === null;
});

test("amendNode remove number property", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(amendNode(document.createElement("div"), {"property": 1}), {"property": undefined}).getAttribute("property") === null;
});

test("amendNode remove boolean property", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(amendNode(document.createElement("div"), {"property": true}), {"property": undefined}).getAttribute("property") === null;
});

test("amendNode remove ToString property", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(amendNode(document.createElement("div"), {"property": {}}), {"property": undefined}).getAttribute("property") === null;
});

test("amendNode class set string", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("div"), {"class": "class1 class2"}).getAttribute("class") === "class1 class2";
});

test("amendNode class set array", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("div"), {"class": ["class1", "class2"]}).getAttribute("class") === "class1 class2";
});

test("amendNode class set multi-array", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(amendNode(document.createElement("div"), {"class": ["class1", "class2"]}), {"class": ["class3"]}).getAttribute("class") === "class1 class2 class3";
});

test("amendNode class set array -> string", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(amendNode(document.createElement("div"), {"class": ["class1", "class2"]}), {"class": "class3"}).getAttribute("class") === "class3";
});

test("amendNode class set DOMTokenList", async () => {
	const {amendNode} = await import("./lib/dom.js"),
	      div = amendNode(document.createElement("div"), {"class": ["class1", "class2"]});
	return amendNode(document.createElement("div"), {"class": div.classList}).getAttribute("class") === "class1 class2";
});

test("amendNode style set string", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("div"), {"style": "font-size: 2em; color: rgb(255, 0, 0);"}).getAttribute("style") === "font-size: 2em; color: rgb(255, 0, 0);";
});

test("amendNode style set object", async () => {
	const {amendNode} = await import("./lib/dom.js");
	return amendNode(document.createElement("div"), {"style": {"font-size": "2em", "color": "rgb(255, 0, 0)"}}).getAttribute("style") === "font-size: 2em; color: rgb(255, 0, 0);";
});

test("amendNode style set CSSStyleDeclaration", async () => {
	const {amendNode} = await import("./lib/dom.js"),
	      div = amendNode(document.createElement("div"), {"style": {"font-size": "2em", "color": "rgb(255, 0, 0)"}});
	return amendNode(document.createElement("div"), {"style": div.style}).getAttribute("style") === "font-size: 2em; color: rgb(255, 0, 0);";
});

type W = typeof window & {
	res: number;
};

test("amendNode event string set", async () => {
	const {amendNode} = await import("./lib/dom.js");
	(window as W).res = 0;
	amendNode(document.createElement("div"), {"onclick": "window.res++"}).click();
	return (window as W).res === 1;
});

test("amendNode event string unset", async () => {
	const {amendNode} = await import("./lib/dom.js");
	(window as W).res = 0;
	amendNode(amendNode(document.createElement("div"), {"onclick": "window.res++"}), {"onclick": undefined}).click();
	return (window as W).res === 0;
});

test("amendNode event arrow fn set", async () => {
	let res = 0;
	const {amendNode} = await import("./lib/dom.js"),
	      div = amendNode(document.createElement("div"), {"onclick": () => res++});
	div.click();
	div.click();
	return res === 2;
});

test("amendNode event fn set", async () => {
	let res = 0;
	const {amendNode} = await import("./lib/dom.js"),
	      div = amendNode(document.createElement("div"), {"onclick": function(this: HTMLDivElement) {res += +(this === div)}});
	div.click();
	div.click();
	return res === 2;
});

test("amendNode event EventListenerObject set", async () => {
	let res = 0;
	const {amendNode} = await import("./lib/dom.js"),
	      he = {"handleEvent": function(this: object) {res += +(this === he)}},
	      div = amendNode(document.createElement("div"), {"onclick": he});
	div.click();
	div.click();
	return res === 2;
});

test("amendNode event array arrow fn once set", async () => {
	let res = 0;
	const {amendNode} = await import("./lib/dom.js"),
	      div = amendNode(document.createElement("div"), {"onclick": [() => res++, {"once": true}, false]});
	div.click();
	div.click();
	return res === 1;
});

test("amendNode event array fn once set", async () => {
	let res = 0;
	const {amendNode} = await import("./lib/dom.js"),
	      div = amendNode(document.createElement("div"), {"onclick": [function(this: HTMLDivElement) {res += +(this === div)}, {"once": true}, false]});
	div.click();
	div.click();
	return res === 1;
});

test("amendNode event EventListenerObject once set", async () => {
	let res = 0;
	const {amendNode} = await import("./lib/dom.js"),
	      he = {"handleEvent": function(this: object) {res += +(this === he)}},
	      div = amendNode(document.createElement("div"), {"onclick": [he, {"once": true}, false]});
	div.click();
	div.click();
	return res === 1;
});

test("amendNode event array arrow fn remove", async () => {
	let res = 0;
	const {amendNode} = await import("./lib/dom.js"),
	      fn = () => res++,
	      div = amendNode(amendNode(document.createElement("div"), {"onclick": [fn, {}, false]}), {"onclick": [fn, {}, true]});
	div.click();
	div.click();
	return res === 0;
});

test("amendNode event array fn remove", async () => {
	let res = 0;
	const {amendNode} = await import("./lib/dom.js"),
	      fn = function(this: HTMLDivElement) {res += +(this === div)},
	      div = amendNode(amendNode(document.createElement("div"), {"onclick": [fn, {}, false]}), {"onclick": [fn, {}, true]});
	div.click();
	div.click();
	return res === 0;
});

test("amendNode event EventListenerObject remove", async () => {
	let res = 0;
	const {amendNode} = await import("./lib/dom.js"),
	      he = {"handleEvent": function(this: object) {res += +(this === he)}},
	      div = amendNode(amendNode(document.createElement("div"), {"onclick": [he, {}, false]}), {"onclick": [he, {}, true]});
	div.click();
	div.click();
	return res === 0;
});
