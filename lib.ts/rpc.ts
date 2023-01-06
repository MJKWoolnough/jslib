import {Subscription} from './inter.js';

type MessageData = {
	id: number;
	result?: any;
	error?: RPCError;
}

type handler = [(data: any) => void, (data: Error) => void];

interface Conn {
	close: () => void;
	send: (data: string) => void;
	when: (sFn: (data: {data: string}) => void, eFn: (error: Error) => void) => void;
}

const noop = () => {},
      noops = [noop, noop],
      newSet = (m: Map<number, Set<handler>>, id: number) => {
	const s = new Set<handler>();
	m.set(id, s);
	return s;
      };

export class RPCError implements Error {
	code: number;
	message: string;
	data?: any;
	constructor(code: number, message: string, data?: any) {
		this.code = code;
		this.message = message;
		this.data = data;
		Object.freeze(this);
	}
	get name() {
		return "RPCError";
	}
	toString() {
		return this.message;
	}
}

export class RPC {
	#c?: Conn | null;
	#id: number = 0;
	#r = new Map<number, handler>();
	#a = new Map<number, Set<handler>>();
	constructor(conn: Conn) {
		this.#connInit(conn);
	}
	#connInit(conn: Conn) {
		(this.#c = conn).when(({data}) => {
			const message = JSON.parse(data) as MessageData,
			      id = typeof message.id === "string" ? parseInt(message.id) : message.id,
			      e = message.error,
			      i = +!!e,
			      m = e ? new RPCError(e.code, e.message, e.data) : message.result as RPCError;
			if (id >= 0) {
				(this.#r.get(id) ?? noops)[i](m);
				this.#r.delete(id);
			} else {
				for (const r of this.#a.get(id) ?? []) {
					r[i](m);
				}
			}
		}, err => {
			this.close();
			for (const [, r] of this.#r) {
				r[1](err);
			}
			for (const [, s] of this.#a) {
				for (const r of s) {
					r[1](err);
				}
			}
		});
	}
	reconnect(conn: Conn) {
		this.#c?.close();
		this.#connInit(conn);
	}
	request<T = any>(method: string, typeCheck?: (a: any) => a is T): Promise<T>;
	request<T = any>(method: string, params: any, typeCheck?: (a: any) => a is T): Promise<T>;
	request<T = any>(method: string, paramsOrTypeCheck?: Exclude<any, Function> | ((a: any) => a is T), typeCheck?: (a: any) => a is T) {
		const c = this.#c;
		return c ? new Promise<T>((sFn, eFn) => {
			typeCheck ??= paramsOrTypeCheck instanceof Function ? paramsOrTypeCheck : undefined;
			const id = this.#id++;
			this.#r.set(id, [a => (!typeCheck || typeCheck(a)) ? sFn(a) : eFn(new TypeError("invalid type")), eFn]);
			c.send(JSON.stringify({
				id,
				method,
				"params": paramsOrTypeCheck instanceof Function ? undefined : paramsOrTypeCheck
			}));
		}) : Promise.reject("RPC Closed");
	}
	await<T = any>(id: number, typeCheck?: (a: any) => a is T) {
		const h: handler = [noop, noop],
		      a = this.#a,
		      s = a.get(id) ?? newSet(a, id),
		      p = new Promise<T>((sFn, eFn) => {
			h[0] = a => (!typeCheck || typeCheck(a)) ? sFn(a) : eFn(new TypeError("invalid type"));
			h[1] = eFn;
			s.add(h);
		      });
		p.finally(() => s.delete(h)).catch(() => {});
		return p;
	}
	subscribe<T = any>(id: number, typeCheck?: (a: any) => a is T) {
		return new Subscription<T>((sFn, eFn, cFn) => {
			const h: handler = [a => (!typeCheck || typeCheck(a)) ? sFn(a) : eFn(new TypeError("invalid type")), eFn],
			      a = this.#a,
			      s = a.get(id) ?? newSet(a, id);
			s.add(h);
			cFn(() => s.delete(h));
		});
	}
	close() {
		this.#c?.close();
		this.#c = null;
	}
}
