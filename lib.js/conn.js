import {Subscription} from './inter.js';

const once = {"once": true};

export const HTTPRequest = (url, props = {}) => new Promise((successFn, errorFn) => {
	const xh = new XMLHttpRequest();
	xh.open(
		props["method"] ?? "GET",
		url,
		true,
		props["user"] ?? null,
		props["password"] ?? null
	);
	if (props.hasOwnProperty("headers") && typeof props["headers"] === "object") {
		for (const [header, value] of Object.entries(props["headers"])) {
			xh.setRequestHeader(header, value);
		}
	}
	if (props["type"] !== undefined) {
		xh.setRequestHeader("Content-Type", props["type"]);
	}
	xh.addEventListener("readystatechange", () => {
		if (xh.readyState === 4) {
			if (xh.status === 200) {
				successFn(props["response"] === "xh" ? xh : xh.response);
			} else {
				errorFn(new Error(xh.responseText));
			}
		}
	});
	if (props["onuploadprogress"]) {
		xh.upload.addEventListener("progress", props["onuploadprogress"]);
	}
	if (props["ondownloadprogress"]) {
		xh.addEventListener("progress", props["ondownloadprogress"]);
	}
	switch (props["response"]) {
	case "text":
		xh.overrideMimeType("text/plain");
		break;
	case "xml":
		xh.overrideMimeType("text/xml");
		xh.responseType = "document";
		break;
	case "json":
		xh.overrideMimeType("application/json");
	case "document":
	case "blob":
	case "arraybuffer":
		xh.responseType = props["response"];
		break;
	}
	xh.send(props["data"] ?? null);
}),
WS = url => new Promise((successFn, errorFn) => {
	const ws = new WSConn(url);
	ws.addEventListener("open", () => {
		ws.removeEventListener("error", errorFn);
		successFn(ws);
	}, once);
	ws.addEventListener("error", errorFn, once);
});

export class WSConn extends WebSocket {
	when(ssFn, eeFn) {
		return new Subscription((sFn, eFn, cFn) => {
			const w = this,
			      ac = new AbortController(),
			      o = {"signal": ac.signal},
			      end = () => ac.abort();
			w.addEventListener("message", sFn, o);
			w.addEventListener("error", e => eFn(e.error), o);
			w.addEventListener("close", e => {
				if (!e.wasClean) {
					eFn(new Error(e.reason));
				}
				end();
			}, o);
			cFn(end);
		}).then(ssFn, eeFn);
	}
}
