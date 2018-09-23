"use strict";
const pageLoad = document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn)),
      {offer, include} = (function() {
	const included = new Map(),
	      offer = obj => document.currentScript.dispatchEvent(new CustomEvent("executed", {"detail": obj})),
	      include = (function() {
		return function(url) {
			if (included.has(url)) {
				return included.get(url);
			}
			const p = new Promise((successFn, errorFn) => {
				const elm = document.createElement("script");
				elm.setAttribute("src", url);
				elm.setAttribute("type", "application/javascript")
				elm.addEventListener("error", () => {
					document.head.removeChild(elm);
					errorFn(new URIError("error including: " + url));
				});
				elm.addEventListener("executed", ({detail}) => {
					document.head.removeChild(elm);
					successFn(detail);
				});
				document.head.appendChild(elm);
			});
			included.set(url, p);
			return p;
		}
	      }());
	return {offer, include};
      }());
