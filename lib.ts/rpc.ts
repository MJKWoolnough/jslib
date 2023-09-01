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

type MessageData = {
	id: number;
	result?: any;
	error?: RPCError;
}

type handler = [(data: any) => void, (data: Error) => void];

/**
 * This unexported type is the interface used by {@link RPC} to send and receive data. This is implemented by {@link conn:WSConn | WSConn}.
 */
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
      },
      makeHandler = <T>(sFn: (data: T) => void, eFn: (data: any) => void, typeCheck?: (data: any) => data is T): handler => [(a: any) => {
	try {
		if (!typeCheck || typeCheck(a)) {
			sFn(a);
		} else {
			eFn(new TypeError("invalid type"));
		}
	} catch(e) {
		eFn(e);
	}
      }, eFn];

/** This class is the error type for RPC, and contains a `code` number, `message` string, and a data field for any addition information of the error. */
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

class Queue extends Array<string> {
	#send: (msg: string) => void;
	constructor(send: (msg: string) => void) {
		super();

		this.#send = send;
	}

	close() {
		for (const msg of this) {
			this.#send(msg);
		}
	}

	send(data: string) {
		this.push(data);
	}

	when() {}
}

export class RPC {
	#c?: Conn | null;
	#id: number = 0;
	#r = new Map<number, handler>();
	#a = new Map<number, Set<handler>>();
	#sFn?: (data: {data: any}) => void;
	#eFn?: (error: Error) => void;
	/**
	 * Creates an RPC object with a [Conn](#rpc_conn)
	 *
	 * @param {Conn} [conn] An interface that is used to do the network communication. If conn is not provided the requests will be queued until one is provided via reconnect.
	 */
	constructor(conn?: Conn) {
		this.#connInit(conn);
	}
	#connInit(conn?: Conn) {
		(this.#c = conn ?? new Queue((msg: string) => this.#c?.send(msg))).when(this.#sFn ??= ({data}) => {
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
	reconnect(conn?: Conn) {
		const c = this.#c;

		this.#connInit(conn);

		c?.close();
	}
	request<T = any>(method: string, typeCheck?: (a: any) => a is T): Promise<T>;
	request<T = any>(method: string, params: any, typeCheck?: (a: any) => a is T): Promise<T>;
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
	request<T = any>(method: string, paramsOrTypeCheck?: Exclude<any, Function> | ((a: any) => a is T), typeCheck?: (a: any) => a is T): Promise<T> {
		const c = this.#c;
		return c ? new Promise<T>((sFn, eFn) => {
			typeCheck ??= paramsOrTypeCheck instanceof Function ? paramsOrTypeCheck : undefined;
			const id = this.#id++;
			this.#r.set(id, makeHandler(sFn, eFn, typeCheck));
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
	await<T = any>(id: number, typeCheck?: (a: any) => a is T): Promise<T> {
		const h: handler = [noop, noop],
		      a = this.#a,
		      s = a.get(id) ?? newSet(a, id),
		      p = new Promise<T>((sFn, eFn) => {
			[h[0], h[1]] = makeHandler(sFn, eFn, typeCheck);
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
	subscribe<T = any>(id: number, typeCheck?: (a: any) => a is T): Subscription<T> {
		return new Subscription<T>((sFn, eFn, cFn) => {
			const h = makeHandler(sFn, eFn, typeCheck),
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
