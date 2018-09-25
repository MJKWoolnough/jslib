"use strict";
const {pageLoad, offer, include} = (function() {
	const toURL = url => (new URL(url, (document.currentScript ? document.currentScript.src : window.location.href).match(/.*\//))).href,
	      included = new Map(),
	      offer = obj => document.currentScript.dispatchEvent(new CustomEvent("executed", {"detail": obj})),
	      include = (function() {
		return function(url) {
			const aURL = toURL(url);
			if (included.has(aURL)) {
				return included.get(aURL);
			}
			const p = new Promise((successFn, errorFn) => {
				const elm = document.createElement("script");
				elm.setAttribute("src", aURL);
				elm.setAttribute("type", "application/javascript")
				elm.addEventListener("error", () => {
					document.head.removeChild(elm);
					errorFn(new URIError("error including: " + aURL));
				});
				elm.addEventListener("executed", ({detail}) => {
					document.head.removeChild(elm);
					successFn(detail);
				});
				document.head.appendChild(elm);
			});
			included.set(aURL, p);
			return p;
		}
	      }()),
	      pageLoad = document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn));
	return {pageLoad, offer, include};
      }());
