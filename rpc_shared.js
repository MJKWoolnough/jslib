"use strict";

import {Subscription} from './inter.js';
import {HTTPRequest, WS} from './conn.js';

const nop = () => {};

class Request {
	constructor() {
		this.success = nop;
		this.error = nop;
	}
	getPromise() {
		return new Promise((successFn, errorFn) => {
			this.success = successFn;
			this.error = errorFn;
		});
	}
	subscribed() {
		return false;
	}
}

class AwaitRequest {
	constructor() {
		this.clearPromise()
		this.subscription = null;
		this.subscriptionSuccess = nop;
		this.subscriptionError = nop;
	}
	getPromise() {
		if (this.promise === null) {
			this.promise =  new Promise((successFn, errorFn) => {
				this.promiseSuccess = successFn;
				this.promiseError = errorFn;
			});
		}
		return this.promise;
	}
	getSubscription() {
		if (this.subscription === null) {
			this.subscription = new Subscription((successFn, errorFn) => {
				this.subscriptionSuccess = successFn;
				this.subscriptionError = errorFn;
			});
		}
		return this.subscription;
	}
	clearPromise() {
		this.promise = null;
		this.promiseSuccess = nop;
		this.promiseError = nop;
	}
	success(data) {
		this.promiseSuccess(data);
		this.clearPromise();
		this.subscriptionSuccess(data);
	}
	error(e) {
		this.promiseError(e);
		this.clearPromise();
		this.subscriptionError(e);
	}
	subscribed() {
		return this.subscription !== null;
	}
}

export default class RequestHandler {
	constructor(sender) {
		this.closed = false;
		this.nextID = 0;
		this.requests = new Map();
		this.sender = sender;
	}
	handleMessage(e) {
		const data = JSON.parse(e.data),
		      id = parseInt(data["id"]);
		if (!this.requests.has(id)) {
			return;
		}
		const req = this.requests.get(id);
		if (data["error"] !== undefined && data["error"] !== null) {
			req.error(new Error(data["error"]));
		} else {
			req.success(data["result"]);
		}
		if (!req.subscribed()) {
			this.requests.delete(id);
		}
	}
	handleError(e) {
		if (!this.closed) {
			this.closed = true;
			if (e.hasOwnProperty("type") && e["type"] === "close") {
				const err = new Error("Closed: " + e.code);
				err.name = "closed";
				this.requests.forEach(r => r.error(err));
			} else {
				const err = e instanceof Error ? e : new Error("error");
				this.requests.forEach(r => r.error(err));
			}
			this.requests.clear();
		}
	}
	getRequest(id) {
		if (this.requests.has(id)) {
			return this.requests.get(id);
		}
		const r = id >= 0 ? new Request() : new AwaitRequest();
		this.requests.set(id, r);
		return r;
	}
	request(method, data = null) {
		if (this.closed) {
			return Promise.reject(new Error("RPC Closed"));
		}
		this.sender(JSON.stringify({
			"method": method,
			"id": this.nextID,
			"params": [data]
		}));
		return this.getRequest(this.nextID++).getPromise();
	}
	await(id, keep = false) {
		if (this.closed) {
			return Promise.reject(new Error("RPC Closed"));
		}
		if (id >= 0) {
			return Promise.reject(new Error("await IDs must be < 0"));
		}
		if (keep) {
			return this.getRequest(id).getSubscription();
		}
		return this.getRequest(id).getPromise();
	}
	close() {
		if (this.closed) {
			return false;
		}
		this.closed = true;
		this.requests.forEach(r => r.error(new Error("RPC Closed")));
		return true;
	}
}
