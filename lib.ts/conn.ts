import {Subscription} from './inter.js';

type properties = {
	method?: string;
	user?: string;
	password?: string;
	headers?: object;
	type?: string;
	response?: "text" | "xml" | "json" | "blob" | "arraybuffer" | "document" | "xh";
	onuploadprogress?: (event: ProgressEvent) => void;
	ondownloadprogress?: (event: ProgressEvent) => void;
	data?: XMLHttpRequestBodyInit;
}

interface requestReturn {
	(url: string, props: properties & {"response": "text"}): Promise<string>;
	(url: string, props: properties & {"response": "xml" | "document"}): Promise<XMLDocument>;
	(url: string, props: properties & {"response": "blob"}): Promise<Blob>;
	(url: string, props: properties & {"response": "arraybuffer"}): Promise<ArrayBuffer>;
	(url: string, props: properties & {"response": "xh"}): Promise<XMLHttpRequest>;
	(url: string, props?: properties): Promise<any>;
}

const once = {"once": true};

export const HTTPRequest: requestReturn = (url: string, props: properties = {}) => new Promise((successFn, errorFn) => {
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
		xh.responseType = "document"
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
WS = (url: string) => new Promise<WSConn>((successFn, errorFn) => {
	const ws = new WSConn(url);
	ws.addEventListener("open", () => {
		ws.removeEventListener("error", errorFn);
		successFn(ws);
	}, once);
	ws.addEventListener("error", errorFn, once);
});

export class WSConn extends WebSocket {
	when<T = any>(ssFn?: (data: MessageEvent) => T, eeFn?: (data: string) => any) {
		return new Subscription<MessageEvent>((sFn, eFn, cFn) => {
			const w = this,
			      ac = new AbortController(),
			      o: AddEventListenerOptions = {"signal": ac.signal},
			      end = () => ac.abort();
			w.addEventListener("message", sFn, o);
			w.addEventListener("error", (e: Event) => eFn((e as ErrorEvent).error), o);
			w.addEventListener("close", (e: CloseEvent) => {
				if (!e.wasClean) {
					eFn(new Error(e.reason));
				}
				end();
			}, o);
			cFn(end);
		}).then<T, any>(ssFn, eeFn);
	}
}
