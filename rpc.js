"use strict";

import {RPC as rpcWS} from './rpc_ws.js';
import {RPC as rpcXH} from './rpc_xh.js';

const RPC = (path, allowWS = true, allowXH = false, xhPing = 1000) => {
	if (allowWS) {
		if (!allowXH) {
			return rpcWs(path);
		}
		return rpcWS(path).catch(() => rpcXH(path, xhPing));
	} else if (allowXH) {
		return rpcXH(path, xhPing);
	}
      };

export {RPC};
