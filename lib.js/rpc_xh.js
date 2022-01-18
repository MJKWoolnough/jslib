import RequestHandler from './rpc_shared.js';
import {HTTPRequest} from './conn.js';

const sep = "\x1E";

export default (path, xhPing = 1000, version = 1) => {
	let sto = -1,
	    si = -1;
	const todo = [],
	      sender = () => {
		HTTPRequest(path, {
			"method": "POST",
			"type": "application/json",
			"response": "text",
			"headers": headerID,
			"data": todo.join(sep)
		}).then((responseText) => typeof responseText !== "string" ? "" : responseText.split(sep).forEach(data => rh.handleMessage({data})), rh.handleError);
		todo.splice(0, todo.length);
		sto = -1;
	      },
	      rh = new RequestHandler(msg => {
		todo.push(msg);
		if (sto === -1) {
			if (si !== -1) {
				window.clearInterval(si);
				si = window.setInterval(sender, xhPing);
			}
			sto = window.setTimeout(sender, 1);
		}
	      }, version),
	      headerID = Object.freeze({"X-RPCID": Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("")});
	return Promise.resolve(Object.freeze({
		"request": rh.request.bind(rh),
		"await": (id, keep = false) => {
			if (si === -1 && xhPing > 0) {
				si = window.setInterval(sender, xhPing);
			}
			return rh.await(id, keep);
		},
		"close": () => {
			if (rh.close() && sto !== -1) {
				window.clearTimeout(sto);
				sto = -1;
			}
		}
	}));
};
