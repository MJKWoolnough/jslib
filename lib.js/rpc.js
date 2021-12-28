import rpcWS from './rpc_ws.js';
import rpcXH from './rpc_xh.js';

export default (path, allowWS = true, allowXH = false, xhPing = 1000, version = 1) => {
	if (allowWS) {
		const p = rpcWS(path, version);
		if (allowXH) {
			return p.catch(() => rpcXH(path, xhPing, version));
		}
		return p;
	} else if (allowXH) {
		return rpcXH(path, xhPing, version);
	}
	return Promise.reject(new Error("no type allowed"));
}
