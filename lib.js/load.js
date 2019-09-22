"use strict";

Object.defineProperties(window, {
	"pageLoad": { value: document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn)) },
	"include": { value: url => import(url) }
});
