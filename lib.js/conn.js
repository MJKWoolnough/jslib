import {Subscription} from './inter.js';

const once = {"once": true},
      base = new URL(window.location+"");

export const HTTPRequest = (url, props = {}) => new Promise((successFn, errorFn) => {
	const xh = new XMLHttpRequest();
	xh.open(props["method"] ?? "GET", url);
	if (props.hasOwnProperty("headers") && typeof props["headers"] === "object") {
		for (const [header, value] of Object.entries(props["headers"])) {
			xh.setRequestHeader(header, value);
		}
	}
	if (props["type"] !== undefined) {
		xh.setRequestHeader("Content-Type", props["type"]);
	}
	if (props["user"] || props["password"]) {
		xh.setRequestHeader("Authorization", "Basic " + btoa(`${props["user"] ?? ""}:${props["password"] ?? ""}`));
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
	if (props["signal"]) {
		props["signal"].addEventListener("abort", () => {
			xh.abort();
			errorFn(new Error("Aborted"));
		}, {"once": true});
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
	constructor(url, protocols) {
		super(new URL(url, base), protocols);
	}
	when(ssFn, eeFn) {
		return new Subscription((sFn, eFn, cFn) => {
			const w = this,
			      ac = new AbortController(),
			      o = {"signal": ac.signal},
			      end = () => ac.abort();
			w.addEventListener("message", sFn, o);
			w.addEventListener("error", e => eFn(e.error), o);
			w.addEventListener("close", e => {
				const err = new Error(e.reason);
				err.name = "CloseError";
				eFn(err);
				end();
			}, o);
			cFn(end);
		}).when(ssFn, eeFn);
	}
}

base.protocol = base.protocol === "https" ? "wss" : "ws";
