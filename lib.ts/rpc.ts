import rpcWS from './rpc_ws.js';
import rpcXH from './rpc_xh.js';

export default (path: string, allowWS = true, allowXH = false, xhPing = 1000, version = 1) => {
	if (allowWS) {
		if (!allowXH) {
			return rpcWS(path, version);
		}
		return rpcWS(path, version).catch(() => rpcXH(path, xhPing, version));
	} else if (allowXH) {
		return rpcXH(path, xhPing, version);
	}
	return Promise.reject(new Error("no type allowed"));
}
