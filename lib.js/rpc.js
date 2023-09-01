import {Subscription} from './inter.js';

/**
 * The rpc module implements a JSON RPC class.
 *
 * This module directly imports the {@link module:inter} module.
 *
 * @module rpc
 * @requires module:inter
 */
/** */

/**
 * This unexported type is the interface used by {@link RPC} to send and receive data. This is implemented by {@link conn:WSConn | WSConn}.
 *
 * @typedef {Object} Conn
 * @property {() => void} close
 * @property {(data: string) => void} send
 * @property {(sFn: (data: {data: string}) => void, eFn: (error: Error) => void) => void} when
 */

const noop = () => {},
      noops = [noop, noop],
      newSet = (m, id) => {
	const s = new Set();
	m.set(id, s);
	return s;
      };

/** This class is the error type for RPC, and contains a `code` number, `message` string, and a data field for any addition information of the error. */
export class RPCError {
	constructor(code, message, data) {
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

class Queue extends Array {
	#send;
	constructor(send) {
		super();

		this.#send = send;
	}

	close() {
		for (const msg of this) {
			this.#send(msg);
		}
	}

	send(data) {
		this.push(data);
	}

	when() {}
}

export class RPC {
	#c;
	#id = 0;
	#r = new Map();
	#a = new Map();
	#sFn;
	#eFn;
	/**
	 * Creates an RPC object with a [Conn](#rpc_conn)
	 *
	 * @param {Conn} [conn] An interface that is used to do the network communication. If conn is not provided the requests will be queued until one is provided via reconnect.
	 */
	constructor(conn) {
		this.#connInit(conn);
	}
	#connInit(conn) {
		(this.#c = conn ?? new Queue(msg => this.#c?.send(msg))).when(this.#sFn ??= ({data}) => {
			const message = JSON.parse(data),
			      id = typeof message.id === "string" ? parseInt(message.id) : message.id,
			      e = message.error,
			      i = +!!e,
			      m = e ? new RPCError(e.code, e.message, e.data) : message.result;
			if (id >= 0) {
				(this.#r.get(id) ?? noops)[i](m);
				this.#r.delete(id);
			} else {
				for (const r of this.#a.get(id) ?? []) {
					r[i](m);
				}
			}
		}, this.#eFn ??= err => {
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
	/**
	 * Reuses the RPC object with a new {@link Conn}.
	 *
	 * @param {Conn} conn An interface that is used to do the network communication.
	 */
	reconnect(conn) {
		const c = this.#c;

		this.#connInit(conn);

		c?.close();
	}
	/**
	 * The request method calls the remote procedure named by the `method` param, and sends any `params` data, JSON encoded, to it.
	 *
	 * The typeCheck function can be specified to check that the data returned matches the format expected.
	 *
	 * It is recommended to use a checker function, and the {@link module:typeguard} module can aid with that.
	 *
	 * @typeParam {any} T
	 * @param {string} method                                                     The method name to be called.
	 * @param {Exclude<any, Function> | ((a: any) => a is T)} [paramsOrTypeCheck] Either the params to be sent to the specified method, or a typecheck function.
	 * @param {(a: any) => a is T} [typeCheck]                                    A typecheck function, if one was supplied to the second param.
	 *
	 * @return {Promise<T>} A Promise that will resolve with the returned data from the remote procedure call.
	 */
	request(method, paramsOrTypeCheck, typeCheck) {
		const c = this.#c;
		return c ? new Promise((sFn, eFn) => {
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
	/**
	 * The await method will wait for a message with a matching ID, which must be negative, and resolve the promise with the data that message contains.
	 *
	 * The typeCheck function can be specified to check that the data returned matches the format expected.
	 *
	 * It is recommended to use a checker function, and the {@link module:typeguard} module can aid with that.
	 *
	 * @param {number} id                      The ID to wait for.
	 * @param {(a: any) => a is T} [typeCheck] An optional typecheck function.
	 *
	 * @return {Promise<T>} A Promise that will resolve with the returned data.
	 */
	await(id, typeCheck) {
		const h = [noop, noop],
		      a = this.#a,
		      s = a.get(id) ?? newSet(a, id),
		      p = new Promise((sFn, eFn) => {
			h[0] = a => (!typeCheck || typeCheck(a)) ? sFn(a) : eFn(new TypeError("invalid type"));
			h[1] = eFn;
			s.add(h);
		      });
		p.finally(() => s.delete(h)).catch(() => {});
		return p;
	}
	/**
	 * The subscribe method will wait for a message with a matching ID, which must be negative, and resolve the {@link inter:Subscription} with the data that message contains for each message with that ID.
	 *
	 * The typeCheck function can be specified to check that the data returned matches the format expected.
	 *
	 * It is recommended to use a checker function, and the {@link module:typeguard} module can aid with that.
	 *
	 * @param {number} id                      The ID to wait for.
	 * @param {(a: any) => a is T} [typeCheck] An optional typecheck function.
	 *
	 * @return {Subscription<T>} A Subscription that will resolve whenever data is received.
	 */
	subscribe(id, typeCheck) {
		return new Subscription((sFn, eFn, cFn) => {
			const h = [a => {
				try {
					if (!typeCheck || typeCheck(a)) {
						sFn(a);
					} else {
						eFn(new TypeError("invalid type"));
					}
				} catch (e) {
					eFn(e);
				}
			      }, eFn],
			      a = this.#a,
			      s = a.get(id) ?? newSet(a, id);
			s.add(h);
			cFn(() => s.delete(h));
		});
	}
	/** Closes the RPC connection. */
	close() {
		const c = this.#c;

		this.#c = null;

		c?.close();
	}
}
