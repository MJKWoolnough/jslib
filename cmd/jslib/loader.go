package main

const (
	loaderHead = `"use strict";
const {pageLoad, offer, include} = (function() {
	const urlRe = /[^(@]*[(@](.+?):[0-9]+:[0-9]+[)\n]/g,
	      toURL = url => (new URL(url, (document.currentScript ? document.currentScript.src : new Error().stack.replace(urlRe, "$1\n").split("\n")[2]).match(/.*\//))).href,
	      included = new Map(),
	      offer = obj => document.currentScript.dispatchEvent(new CustomEvent("executed", {"detail": obj})),
	      include = function(url) {
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
	      },
	      offerNow = (url, fn) => () => included.set(url, fn());
	      pageLoad = document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn));
	      return {pageLoad: pageLoad`
	loaderFoot = `, offer: offer, include: include};
      }());`
)
