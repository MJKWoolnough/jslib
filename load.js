"use strict";
const pageLoad = new Promise(successFn => window.addEventListener("load", successFn)),
      offer = obj => document.currentScript.dispatchEvent(new CustomEvent("executed", {"detail": obj})),
      include = (function() {
	const included = new Map();
	return function(url) {
		if (included.has(url)) {
			return included.get(url);
		}
		const css = url.substr(-3) === "css",
		      elm = document.createElement(css ? "link" : "script");
		elm.setAttribute(css ? "href" : "src", url);
		elm.setAttribute("type", css ? "text/css" : "application/javascript")
		if (css) {
			elm.setAttribute("rel", "stylesheet");
		}
		const p = new Promise((successFn, errorFn) => {
			elm.addEventListener("load", successFn);
			elm.addEventListener("error", () => {
				document.head.removeChild(elm);
				errorFn(new URIError("error including: " + url));
			});
			if (!css) {
				elm.addEventListener("executed", ({detail}) => {
					elm.removeEventListener("load", successFn);
					document.head.removeChild(elm);
					successFn(detail);
				});
			}
			document.head.appendChild(elm);
		});
		included.set(url, p);
		return p;
	}
      }());
