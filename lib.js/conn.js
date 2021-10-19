import {Subscription} from './inter.js';

export const HTTPRequest = (url, props = {}) => new Promise((successFn, errorFn) => {
	const xh = new XMLHttpRequest();
	xh.open(
		props["method"] !== undefined ? props["method"] : "GET",
		url,
		true,
		props["user"] !== undefined ? props["user"] : null,
		props["password"] !== undefined ? props["password"] : null
	);
	if (props.hasOwnProperty("headers") && typeof props["headers"] === "object") {
		Object.entries(props["headers"]).forEach(([header, value]) => xh.setRequestHeader(header, value));
	}
	if (props["type"] !== undefined) {
		xh.setRequestHeader("Content-Type", props["type"]);
	}
	xh.addEventListener("readystatechange", () => {
		if (xh.readyState === 4) {
			if (xh.status === 200) {
				switch (props["response"]) {
				case "text":
					successFn(xh.responseText);
					break;
				case "json":
					successFn(JSON.parse(xh.responseText));
					break;
				case "xh":
					successFn(xh);
					break;
				default:
					successFn(xh.response);
				}
			} else {
				errorFn.call(xh, new Error(xh.responseText));
			}
		}
	});
	if (props["onprogress"] !== undefined) {
		xh.upload.addEventListener("progress", props["onprogress"]);
	}
	switch (props["response"]) {
	case "text":
		xh.overrideMimeType("text/plain");
		break;
	case "json":
		xh.overrideMimeType("application/json");
		break;
	case "xml":
		xh.overrideMimeType("text/xml");
		break;
	case "document":
	case "blob":
	case "arraybuffer":
		xh.responseType = props["response"];
		break;
	}
	xh.send(props["data"] ?? null);
      }),
      WS = url => new Promise((successFn, errorFn) => {
	const ws = new WebSocket(url);
	ws.addEventListener("open", () => successFn(Object.freeze({
		close: ws.close.bind(ws),
		send: ws.send.bind(ws),
		when: Subscription.prototype.then.bind(new Subscription((sFn, eFn) => {
			ws.removeEventListener("error", errorFn);
			ws.addEventListener("message", sFn);
			ws.addEventListener("error", e => eFn(e.error));
			ws.addEventListener("close", e => {
				if (!e.wasClean) {
					eFn(new Error(e.reason));
				}
			});
		})),
		get binaryType() {
			return ws.binaryType;
		},
		set binaryType(t) {
			ws.binaryType = t;
		},
	})));
	ws.addEventListener("error", errorFn);
      });
