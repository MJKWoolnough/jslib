import {WS} from './conn.js';
import {Subscription} from './inter.js';

const noop = () => {},
      noops = [noop, noop],
      set = (m, id, s) => {
	      m.set(id, s);
	      return s;
      };

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
			      i = +!!message.error,
			      m = message.error || message.result;
			for (const r of id >= 0 ? [this.#r.get(id) ?? noops] : this.#a.get(id) ?? []) {
				r[i](m);
			}
		}, err => {
			this.close();
			const e = Object.freeze({
				"code": -999,
				"message": err
			});
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
	request (method, data) {
		if (!this.#c) {
			return Promise.reject("RPC Closed");
		}
		const id = this.#id++,
		      r = {
			id,
			method,
			"params": this.#v === 1 ? [data] : data
		};
		if (this.#v === 2) {
			r["jsonrpc"] = "2.0";
		}
		return new Promise<any>((sFn, eFn) => {
			this.#r.set(id, [sFn, eFn])
			this.#c?.send(JSON.stringify(r));
		});
	}
	await (id) {
		if (!this.#c) {
			return Promise.reject("RPC Closed");
		}
		const h = [noop, noop],
		      s = this.#a.get(id) ?? set(this.#a, id, new Set()),
		      p = new Promise<any>((sFn, eFn) => {
			h[0] = sFn;
			h[1] = eFn;
			s.add(h);
		      });
		p.finally(() => s.delete(h));
		return p;
	}
	subscribe (id) {
		if (!this.#c) {
			return new Subscription((_, eFn) => eFn("RPC Closed"));
		}
		return new Subscription<any>((sFn, eFn, cFn) => {
			const h = [sFn, eFn],
			      s = this.#a.get(id) ?? set(this.#a, id, new Set());
			s.add(h);
			cFn(() => s.delete(h));
		});
	}
	close () {
		this.#c?.close();
		this.#c = null;
	}
}

export default (path, version = 1) => WS(path).then(c => new RPC(c, version));
