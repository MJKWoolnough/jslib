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
