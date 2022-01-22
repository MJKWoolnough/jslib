import {Subscription} from './inter.js';

type properties = {
	method?: string;
	user?: string;
	password?: string;
	headers?: object;
	type?: string;
	response?: string;
	onprogress?: (event: ProgressEvent) => void;
	data?: XMLHttpRequestBodyInit;
}

const once = {"once": true};

export const HTTPRequest = (url: string, props: properties = {}) => new Promise((successFn, errorFn) => {
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
				errorFn(new Error(xh.responseText));
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
WS = (url: string) => new Promise<Readonly<WSConn>>((successFn, errorFn) => {
	const ws = new WebSocket(url);
	ws.addEventListener("open", () => {
		ws.removeEventListener("error", errorFn);
		successFn(Object.freeze({
			close: (code?: number, reason?: string) => ws.close(code, reason),
			send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => ws.send(data),
			when: (ssFn?: (data: MessageEvent) => void, eeFn?: (data: string) => void) => new Subscription<MessageEvent>((sFn, eFn, cFn) => {
				const err = (e: Event) => eFn((e as ErrorEvent).error),
				      end = () => {
					ws.removeEventListener("message", sFn);
					ws.removeEventListener("error", err);
					ws.removeEventListener("close", close);
				      },
				      close = (e: CloseEvent) => {
					if (!e.wasClean) {
						eFn(new Error(e.reason));
					}
					end();
				      };
				ws.addEventListener("message", sFn);
				ws.addEventListener("error", err);
				ws.addEventListener("close", close, once);
				cFn(end);
			}).then(ssFn, eeFn),
			get binaryType() {
				return ws.binaryType;
			},
			set binaryType(t: BinaryType) {
				ws.binaryType = t;
			}
		}))
	}, once);
	ws.addEventListener("error", errorFn, once);
});

export interface WSConn {
	close: (code?: number, reason?: string) => void;
	send: (data: string | ArrayBuffer | Blob | ArrayBufferView) => any;
	when: (successFn?: (event: MessageEvent) => void, errorFn?: (event: string) => void) => Subscription<any>;
	binaryType: BinaryType;
}
