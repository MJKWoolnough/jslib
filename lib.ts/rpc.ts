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
		conn.when(({data}: MessageEvent) => {
			const message = JSON.parse(data) as MessageData,
			      id = typeof message.id === "string" ? parseInt(message.id) : message.id,
			      e = message.error,
			      i = +!!e,
			      m = e ? new RPCError(e.code, e.message, e.data) : message.result as RPCError;
			for (const r of id >= 0 ? [this.#r.get(id) ?? noops] : this.#a.get(id) ?? []) {
				r[i](m);
			}
		}, (err: string) => {
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
	request(method: string, data?: any) {
		if (!this.#c) {
			return Promise.reject("RPC Closed");
		}
		const id = this.#id++,
		      v = this.#v,
		      r: Record<string, any> = {
			id,
			method,
			"params": v === 1 ? [data] : data
		};
		if (v === 2) {
			r["jsonrpc"] = "2.0";
		}
		return new Promise<any>((sFn, eFn) => {
			this.#r.set(id, [sFn, eFn])
			this.#c?.send(JSON.stringify(r));
		});
	}
	await(id: number) {
		if (!this.#c) {
			return Promise.reject("RPC Closed");
		}
		const h: handler = [noop, noop],
		      a = this.#a,
		      s = a.get(id) ?? set(a, id, new Set<handler>()),
		      p = new Promise<any>((sFn, eFn) => {
			h[0] = sFn;
			h[1] = eFn;
			s.add(h);
		      });
		p.finally(() => s.delete(h));
		return p;
	}
	subscribe(id: number) {
		if (!this.#c) {
			return new Subscription((_, eFn) => eFn("RPC Closed"));
		}
		return new Subscription<any>((sFn, eFn, cFn) => {
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

export default (path: string, version: 1 | 2 = 1) => WS(path).then(c => new RPC(c, version));
