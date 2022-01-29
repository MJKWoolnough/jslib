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
