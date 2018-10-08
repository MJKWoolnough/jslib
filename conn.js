offer((async function() {
	const {Subscription} = await include("inter.js"),
	      urlRe = /[^(@]*[(@](.+?):[0-9]+:[0-9]+[)\n]/g,
	      toURL = url => (new URL(url, (document.currentScript ? document.currentScript.src : new Error().stack.replace(urlRe, "$1\n").split("\n")[2]).match(/.*\//))).href,
	      HTTPRequest = function(url, props = {}) {
		return new Promise((successFn, errorFn) => {
			const xh = new XMLHttpRequest();
			xh.open(
				props.hasOwnProperty("method") ? props["method"] : "GET",
				toURL(url),
				true,
				props.hasOwnProperty("user") ? props["user"] : null,
				props.hasOwnProperty("password") ? props["password"] : null
			);
			if (props.hasOwnProperty("type")) {
				xh.setRequestHeader("Content-Type", props["type"]);
			}
			xh.addEventListener("readystatechange", () => {
				if (xh.readyState === 4) {
					if (xh.status === 200) {
						switch (props["response"].toLowerCase()) {
						case "text":
							successFn.call(xh, xh.responseText);
							break;
						case "json":
							successFn.call(xh, JSON.parse(xh.responseText));
							break
						default:
							successFn.call(xh, xh.response);
						}
					} else {
						errorFn.call(xh, new Error(xh.responseText));
					}
				}
			});
			if (props.hasOwnProperty("onprogress")) {
				xh.upload.addEventListener("progress", props["onprogress"]);
			}
			xh.send(props.hasOwnProperty("data") ? props["data"] : null);
		});
	      },
	      WS = function(path) {
		const url = toURL(path).replace(/^http/, "ws");
		return new Promise((successFn, errorFn) => {
			const ws = new WebSocket(url);
			ws.addEventListener("open", () => successFn(Object.freeze({
				close: ws.close.bind(ws),
				send: ws.send.bind(ws),
				when: new Subscription((successFn, errorFn) => {
					ws.addEventListener("message", successFn);
					ws.addEventListener("error", errorFn);
					ws.addEventListener("close", errorFn);
				}).then,
				get type() {
					return ws.type;
				},
				set type(t) {
					ws.type = t;
				},
			})));
			ws.addEventListener("error", errorFn);
		});
	      };
	return Object.freeze({HTTPRequest, WS});
}()));
