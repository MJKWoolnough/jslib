import {WS} from './conn.js';
import {Subscription} from './inter.js';

const noop = () => {},
      noops = [noop, noop],
      newSet = (m, id) => {
	const s = new Set();
	m.set(id, s);
	return s;
      };

export class RPCError {
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

export class RPC {
	#c;
	#id = 0;
	#r = new Map();
	#a = new Map();
	constructor(conn) {
		this.#connInit(conn);
	}
	#connInit(conn) {
		this.#c = conn;
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
		this.#connInit(conn);
	}
	request(method, params) {
		const c = this.#c;
		return c ? new Promise((sFn, eFn) => {
			const id = this.#id++;
			this.#r.set(id, [sFn, eFn]);
			c.send(JSON.stringify({
				id,
				method,
				params
			}));
		}) : Promise.reject("RPC Closed");
	}
	await(id) {
		const h = [noop, noop],
		      a = this.#a,
		      s = a.get(id) ?? newSet(a, id),
		      p = new Promise((sFn, eFn) => {
			h[0] = sFn;
			h[1] = eFn;
			s.add(h);
		      });
		p.finally(() => s.delete(h)).catch(() => {});
		return p;
	}
	subscribe(id) {
		return new Subscription((sFn, eFn, cFn) => {
			const h = [sFn, eFn],
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

export default path => WS(path).then(c => new RPC(c));
