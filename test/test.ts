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
