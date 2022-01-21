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
		conn.when(({data}) => {
			const message = JSON.parse(data),
			      id = typeof message.id === "string" ? parseInt(message.id) : message.id,
			      e = message.error,
			      i = +!!e,
			      m = e ? new RPCError(e.code, e.message, e.data) : message.result;
			for (const r of id >= 0 ? [this.#r.get(id) ?? noops] : this.#a.get(id) ?? []) {
				r[i](m);
			}
		}, (err) => {
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
	request(method, data) {
		if (!this.#c) {
			return Promise.reject("RPC Closed");
		}
		const id = this.#id++,
		      v = this.#v,
		      r = {
			id,
			method,
			"params": v === 1 ? [data] : data
		};
		if (v === 2) {
			r["jsonrpc"] = "2.0";
		}
		return new Promise((sFn, eFn) => {
			this.#r.set(id, [sFn, eFn])
			this.#c?.send(JSON.stringify(r));
		});
	}
	await(id) {
		if (!this.#c) {
			return Promise.reject("RPC Closed");
		}
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
		if (!this.#c) {
			return new Subscription((_, eFn) => eFn("RPC Closed"));
		}
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
