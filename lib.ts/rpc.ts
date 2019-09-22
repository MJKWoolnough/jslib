import rpcWS from './rpc_ws.js';
import rpcXH from './rpc_xh.js';

export default (path: string, allowWS = true, allowXH = false, xhPing = 1000) => {
	if (allowWS) {
		if (!allowXH) {
			return rpcWS(path);
		}
		return rpcWS(path).catch(() => rpcXH(path, xhPing));
	} else if (allowXH) {
		return rpcXH(path, xhPing);
	}
	return Promise.reject(new Error("no type allowed"));
}
