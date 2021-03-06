import {Subscription} from './inter.js';

type properties = {
	method?: string;
	user?: string;
	password?: string;
	headers?: object;
	type?: string;
	response?: string;
	onprogress?: (event: ProgressEvent) => void;
	data?: string | Document | BodyInit;
}

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
	xh.send(props.hasOwnProperty("data") ? props["data"] : null);
      }),
      WS = (url: string) => new Promise<Readonly<WSConn>>((successFn, errorFn) => {
		const ws = new WebSocket(url);
		ws.addEventListener("open", () => successFn(Object.freeze({
			close:  ws.close.bind(ws),
			send: ws.send.bind(ws),
			when: Subscription.prototype.then.bind(new Subscription((sFn, eFn) => {
				ws.removeEventListener("error", errorFn);
				ws.addEventListener("message", sFn);
				ws.addEventListener("error", (e: Event) => eFn((e as ErrorEvent).error));
				ws.addEventListener("close", (e: CloseEvent) => {
					if (!e.wasClean) {
						eFn(new Error(e.reason));
					}
				});
			})),
			get binaryType() {
				return ws.binaryType;
			},
			set binaryType(t: BinaryType) {
				ws.binaryType = t;
			},
		})));
		ws.addEventListener("error", errorFn);
      });

interface WSConn {
	close: (code?: number, reason?: string) => void;
	send: (data: string | ArrayBuffer | Blob | ArrayBufferView) => any;
	when: (successFn?: (event: MessageEvent) => void, errorFn?: (event: Event) => void) => Subscription<any>;
	binaryType: BinaryType;
}
