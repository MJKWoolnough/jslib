"use strict";

import {RequestHandler} from './rpc_shared.js';
import {WS} from './conn.js';

const RPC = path => WS(path).then(ws => {
	const rh = new RequestHandler(ws.send),
	      closer = () => {
		if (rh.close()) {
			ws.close();
		}
	      };
	ws.when(rh.handleMessage.bind(rh), rh.handleError.bind(rh));
	window.addEventListener("beforeunload", closer);
	return Object.freeze({
		"request": rh.request.bind(rh),
		"await": rh.await.bind(rh),
		"close": (...data) => {
			if (rh.close()) {
				ws.close(...data);
				window.removeEventListener("beforeunload", closer);
			}
		}
	});
      });

export {RPC};
