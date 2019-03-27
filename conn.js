"use strict";

import {Subscription} from './inter.js';

export const HTTPRequest = (url, props = {}) => new Promise((successFn, errorFn) => {
	const xh = new XMLHttpRequest();
	xh.open(
		props.hasOwnProperty("method") ? props["method"] : "GET",
		url,
		true,
		props.hasOwnProperty("user") ? props["user"] : null,
		props.hasOwnProperty("password") ? props["password"] : null
	);
	if (props.hasOwnProperty("headers") && typeof props["headers"] == "object") {
		props["headers"].entries().forEach(([header, value]) => xh.setRequestHeader(header, value));
	}
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
					break;
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
      }),
      WS = url => new Promise((successFn, errorFn) => {
		const ws = new WebSocket(url);
		ws.addEventListener("open", () => successFn(Object.freeze({
			close: ws.close.bind(ws),
			send: ws.send.bind(ws),
			when: Subscription.prototype.then.bind(new Subscription((sFn, eFn) => {
				ws.removeEventListener("error", errorFn);
				ws.addEventListener("message", sFn);
				ws.addEventListener("error", eFn);
				ws.addEventListener("close", eFn);
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
