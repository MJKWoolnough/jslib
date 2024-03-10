import {Subscription} from './inter.js';

/**
 * The conn module contains some convenience wrappers around {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest | XMLHttpRequest} and {@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket | WebSocket}.
 *
 * This module directly imports the {@link module:inter} module.
 *
 * @module conn
 * @requires module:inter
 */

/** This object modifies an HTTPRequest. */
export type Properties = {
	/** Can change the request method. */
	method?: string;
	/** Allows the setting of a Basic Authorization username. */
	user?: string;
	/** Allows the settings of a Basic Authorization password. */
	password?: string;
	/** An object to allow the setting or arbitrary headers. */
	headers?: object;
	/** Sets the Content-Type of the request. */
	type?: string;
	/**
	 * This determines the expected return type of the promise. One of `text`, `xml`, `json`, `blob`, `arraybuffer`, `document`, or `xh`. The default is `text` and `xh` simply returns the {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest | XMLHttpRequest} object as a response. Response type `json` will parse the retrieved text as JSON and return the parsed object.
	 */
	response?: "" | "text" | "xml" | "json" | "blob" | "arraybuffer" | "document" | "xh";
	/**
	 * This function is used to check whether parsed JSON matches the expected data structure.
	 *
	 * It is recommended to use a checker function when receiving data, and the {@link module:typeguard | TypeGuard} module can aid with that.
	 * */
	checker?: (data: unknown) => boolean;
	/** This sets an event handler to monitor any upload progress. */
	onuploadprogress?: (event: ProgressEvent) => void;
	/** This sets an event handler to monitor any download process. */
	ondownloadprogress?: (event: ProgressEvent) => void;
	/**
	 * This is an {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send#body | XMLHttpRequestBodyInit} and is send as the body of the request.
	 */
	data?: XMLHttpRequestBodyInit;
	/**
	 * An {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to be used to cancel any request.
	 */
	signal?: AbortSignal;
}

interface requestReturn {
	(url: string, props?: Exclude<Properties, "checker"> & {"response"?: "text" | ""}): Promise<string>;
	(url: string, props: Exclude<Properties, "checker"> & {"response": "xml" | "document"}): Promise<XMLDocument>;
	(url: string, props: Exclude<Properties, "checker"> & {"response": "blob"}): Promise<Blob>;
	(url: string, props: Exclude<Properties, "checker"> & {"response": "arraybuffer"}): Promise<ArrayBuffer>;
	(url: string, props: Exclude<Properties, "checker"> & {"response": "xh"}): Promise<XMLHttpRequest>;
	<T = any>(url: string, props: Properties & {"response": "json", "checker"?: (data: unknown) => data is T}): Promise<T>;
}

const once = {"once": true},
      base = new URL(window.location+"");

export const
/**
 * In its simplest incarnation, this function takes a URL and returns a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} which will return the string response from that URL. However, the passed {@link Properties} object can modify both how the request is sent and the response interpreted.
 *
 * @typeParam T
 * @param {string} url         The URL to request.
 * @param {Properties} [props] An optional object containing properties to modify the request.
 *
 * @return {Promise<T | string | XMLDocument | Blob | ArrayBuffer | XMLHttpRequest>} A promise resolving to a type that depends on the options passed.
 */
HTTPRequest: requestReturn = <T = any>(url: string, props: Properties = {}): Promise<T | string | XMLDocument | Blob | ArrayBuffer | XMLHttpRequest> => new Promise((successFn, errorFn) => {
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
			if (xh.status >= 200 && xh.status < 300) {
				if (props["response"] === "json" && props["checker"] && !props.checker(xh.response)) {
					errorFn(new TypeError("received JSON does not match expected format"));
				} else {
					successFn(props["response"] === "xh" ? xh : xh.response);
				}
			} else {
				errorFn(new Error(xh.response));
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
	}
	if (props["signal"]) {
		const signal = props["signal"];
		signal.addEventListener("abort", () => {
			xh.abort();
			errorFn(signal.reason instanceof Error ? signal.reason : new Error(signal.reason));
		}, once);
	}
	xh.send(props["data"] ?? null);
}),
/**
 * This function takes a url and returns a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} which will resolve with an initiated {@link WSConn} on a successful connection.
 *
 * @param {string} url An absolute or relative URL to connect to.
 *
 * @returns {Promise<WSConn>} A Promise that resolves to a WSConn.
 */
WS = (url: string) => new Promise<WSConn>((successFn, errorFn) => {
	const ws = new WSConn(url);
	ws.addEventListener("open", () => {
		ws.removeEventListener("error", errorFn);
		successFn(ws);
	}, once);
	ws.addEventListener("error", errorFn, once);
});

/**
 * WSConn extends the {@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket | WebSocket} class, allowing for the passed URL to be relative to the current URL.
 *
 * In addition, it adds the {@link WSConn/when} method.
 */
export class WSConn extends WebSocket {
	/**
	 * The constructor is nearly identical to usage of the parent class except that the url param need not be absolute.
	 *
	 * @param {string} url                    URL to connect to, can be absolute or relative.
	 * @param {string | string[]} [protocols] Either a single, or array of, [sub-]protocols.
	 */
	constructor(url: string, protocols?: string | string[]) {
		super(new URL(url, base), protocols);
	}
	/**
	 * This method acts like the {@link module:inter/Subscription.when | when} method of the {@link inter:Subscription | Subscription} class from the {@link module:inter | inter} module, taking an optional success function, which will receive a MessageEvent object, and an optional error function, which will receive an error. The method returns a {@link inter/Subscription} object with the success and error functions set to those provided.
	 *
	 * @typeParam {any} T = Success type
	 * @typeParam {any} U = Error type
	 * @param {(data: MessageEvent) => T} [ssFn] Function to be called when a message arrives.
	 * @param {(data: Error) => U} [eeFn]        Function to be called when an error occurs.
	 *
	 * @return {Subscription<T | Y>} A {@link inter:Subscription | Subscription} object.
	 */
	when<T = any, U = any>(ssFn?: (data: MessageEvent) => T, eeFn?: (data: Error) => U): Subscription<T | U> {
		return new Subscription<MessageEvent>((sFn, eFn, cFn) => {
			const w = this,
			      ac = new AbortController(),
			      o = {"signal": ac.signal};
			w.addEventListener("message", sFn, o);
			w.addEventListener("error", (e: Event) => eFn((e as ErrorEvent).error), o);
			w.addEventListener("close", (e: CloseEvent) => {
				const err = new Error(e.reason);
				err.name = "CloseError";
				eFn(err);
				ac.abort();
			}, o);
			cFn(() => ac.abort());
		}).when<T, U>(ssFn, eeFn);
	}
}

base.protocol = base.protocol === "https" ? "wss" : "ws";
