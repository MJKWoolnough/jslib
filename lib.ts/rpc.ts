import type {WSConn} from './conn.js';
import {WS} from './conn.js';
import {Subscription} from './inter.js';

type MessageData = {
	id: number;
	result?: any;
	error?: RPCError;
}

type handler = [(data: any) => void, (data: RPCError) => void];

const noop = () => {},
      noops = [noop, noop],
      set = (m: Map<number, Set<handler>>, id: number, s: Set<handler>) => {
	m.set(id, s);
	return s;
      };

export class RPCError {
	code: number;
	message: string;
	data?: any;
	constructor(code: number, message: string, data?: any) {
		this.code = code;
		this.message = message;
		this.data = data;
		Object.freeze(this);
	}
	toString() {
		return this.message;
	}
}

class RPC {
	#c: WSConn | null;
	#v: number;
	#id: number = 0;
	#r = new Map<number, handler>();
	#a = new Map<number, Set<handler>>();
	constructor(conn: WSConn, version: number) {
		this.#c = conn;
		this.#v = version;
		conn.when(({data}) => {
			const message = JSON.parse(data) as MessageData,
			      id = typeof message.id === "string" ? parseInt(message.id) : message.id,
			      e = message.error,
			      i = +!!e,
			      m = e ? new RPCError(e.code, e.message, e.data) : message.result as RPCError;
			if (id >= 0) {
				(this.#r.get(id) ?? noops)[i](m);
			} else {
				for (const r of this.#a.get(id) ?? []) {
					r[i](m);
				}
			}
		}, err => {
			this.close();
			const e = new RPCError(-999, err);
			for (const [, r] of this.#r) {
				r[1](e);
			}
			for (const [, s] of this.#a) {
				for (const r of s) {
					r[1](e);
				}
			}
		});
	}
	request<T = any>(method: string, data?: any) {
		const c = this.#c;
		if (!c) {
			return Promise.reject("RPC Closed");
		}
		return new Promise<T>((sFn, eFn) => {
			const id = this.#id++,
			      v = this.#v;
			this.#r.set(id, [sFn, eFn])
			c.send(JSON.stringify({
				"jsonrpc": v.toFixed(1),
				id,
				method,
				"params": v === 1 ? [data] : data
			}));
		});
	}
	await<T = any>(id: number) {
		if (!this.#c) {
			return Promise.reject("RPC Closed");
		}
		const h: handler = [noop, noop],
		      a = this.#a,
		      s = a.get(id) ?? set(a, id, new Set<handler>()),
		      p = new Promise<T>((sFn, eFn) => {
			h[0] = sFn;
			h[1] = eFn;
			s.add(h);
		      });
		p.finally(() => s.delete(h));
		return p;
	}
	subscribe<T = any>(id: number) {
		if (!this.#c) {
			return new Subscription<never>((_, eFn) => eFn("RPC Closed"));
		}
		return new Subscription<T>((sFn, eFn, cFn) => {
			const h: handler = [sFn, eFn],
			      a = this.#a,
			      s = a.get(id) ?? set(a, id, new Set<handler>());
			s.add(h);
			cFn(() => s.delete(h));
		});
	}
	close() {
		this.#c?.close();
		this.#c = null;
	}
}

export default (path: string, version: 1 | 1.1 | 2 = 1) => WS(path).then(c => new RPC(c, version));
