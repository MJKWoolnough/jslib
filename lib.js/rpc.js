import {WS} from './conn.js';
import {Subscription} from './inter.js';

const noop = () => {},
      noops = [noop, noop],
      set = (m, id, s) => {
	m.set(id, s);
	return s;
      };

export class RPCError {
	code;
	message;
	data;
	constructor(code, message, data) {
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
	#c;
	#v;
	#id = 0;
	#r = new Map();
	#a = new Map();
	constructor(conn, version) {
		this.#c = conn;
		this.#v = version;
		this.#connInit();
	}
	#connInit() {
		this.#c?.when(({data}) => {
			const message = JSON.parse(data),
			      id = typeof message.id === "string" ? parseInt(message.id) : message.id,
			      e = message.error,
			      i = +!!e,
			      m = e ? new RPCError(e.code, e.message, e.data) : message.result;
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
	reconnect(conn) {
		this.#c?.close();
		this.#c = conn;
		this.#connInit();
	}
	request(method, data) {
		const c = this.#c;
		return c ? new Promise((sFn, eFn) => {
			const id = this.#id++,
			      v = this.#v;
			this.#r.set(id, [sFn, eFn])
			c.send(JSON.stringify({
				"jsonrpc": v.toFixed(1),
				id,
				method,
				"params": v === 1 ? [data] : data
			}));
		}) : Promise.reject("RPC Closed");
	}
	await(id) {
		const h = [noop, noop],
		      a = this.#a,
		      s = a.get(id) ?? set(a, id, new Set()),
		      p = new Promise((sFn, eFn) => {
			h[0] = sFn;
			h[1] = eFn;
			s.add(h);
		      });
		p.finally(() => s.delete(h));
		return p;
	}
	subscribe(id) {
		return new Subscription((sFn, eFn, cFn) => {
			const h = [sFn, eFn],
			      a = this.#a,
			      s = a.get(id) ?? set(a, id, new Set());
			s.add(h);
			cFn(() => s.delete(h));
		});
	}
	close() {
		this.#c?.close();
		this.#c = null;
	}
}

export default (path, version = 1) => WS(path).then(c => new RPC(c, version));
