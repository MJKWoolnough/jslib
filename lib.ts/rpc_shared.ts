import {Subscription} from './inter.js';

type promiseFn = (...data: any) => any;

const nop: promiseFn = () => {};

class Request {
	success: promiseFn;
	error: promiseFn;
	constructor() {
		this.success = nop;
		this.error = nop;
	}
	getPromise() {
		return new Promise<any>((successFn, errorFn) => {
			this.success = successFn;
			this.error = errorFn;
		});
	}
	getSubscription(): Subscription<any> {
		throw new Error();
	}
	subscribed() {
		return false;
	}
}

class AwaitRequest {
	subscription?: Subscription<any>;
	subscriptionSuccess: promiseFn;
	subscriptionError: promiseFn;
	promise?: Promise<any>;
	promiseSuccess?: promiseFn;
	promiseError?: promiseFn;
	constructor() {
		this.clearPromise()
		this.subscriptionSuccess = nop;
		this.subscriptionError = nop;
	}
	getPromise() {
		if (this.promise === undefined) {
			this.promise = new Promise<any>((successFn, errorFn) => {
				this.promiseSuccess = successFn;
				this.promiseError = errorFn;
			});
		}
		return this.promise;
	}
	getSubscription() {
		if (this.subscription === undefined) {
			this.subscription = new Subscription((successFn, errorFn) => {
				this.subscriptionSuccess = successFn;
				this.subscriptionError = errorFn;
			});
		}
		return this.subscription;
	}
	clearPromise() {
		this.promise = undefined;
		this.promiseSuccess = nop;
		this.promiseError = nop;
	}
	success(data: any) {
		if (this.promiseSuccess !== undefined) {
			this.promiseSuccess(data);
		}
		this.clearPromise();
		this.subscriptionSuccess(data);
	}
	error(e: Error) {
		if (this.promiseError !== undefined) {
			this.promiseError(e);
		}
		this.clearPromise();
		this.subscriptionError(e);
	}
	subscribed() {
		return this.subscription !== null;
	}
}

interface messageData {
	id?: number,
	data?: string;
	error?: string;
}

export default class RequestHandler {
	closed: boolean;
	nextID: number
	requests: Map<number, Request | AwaitRequest>
	sender: (data: string) => void;
	constructor(sender: (data: string) => void) {
		this.closed = false;
		this.nextID = 0;
		this.requests = new Map();
		this.sender = sender;
	}
	handleMessage(e: messageData) {
		const data = e.data !== undefined ? JSON.parse(e.data) : "",
		      id = parseInt(data["id"]);
		if (!this.requests.has(id)) {
			return;
		}
		const req = this.requests.get(id);
		if (req === undefined) {
			throw Error("request " + id + " undefined");
		}
		if (data["error"] !== undefined && data["error"] !== null) {
			req.error(new Error(data["error"]));
		} else {
			req.success(data["result"]);
		}
		if (!req.subscribed()) {
			this.requests.delete(id);
		}
	}
	handleError(e: any) {
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
	getRequest(id: number): Request | AwaitRequest {
		if (this.requests.has(id)) {
			const r = this.requests.get(id);
			if (r === undefined) {
				throw Error("request " + id + " undefined");
			}
			return r;
		}
		const r = id >= 0 ? new Request() : new AwaitRequest();
		this.requests.set(id, r);
		return r;
	}
	request(method: string, data?: any): Promise<any> {
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
	await(id: number, keep = false): Subscription<any> | Promise<any> {
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

export interface RPCType {
	request: (method: string, data?: any) => Promise<any>;
	await: Await;
	close: () => void;
}

interface Await {
	(id: number): Promise<any>;
	(id: number, keep?: false): Promise<any>;
	(id: number, keep?: true): Subscription<any>;
}
