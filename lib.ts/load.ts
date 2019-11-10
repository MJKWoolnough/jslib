/*

This file should be included in an HTML script element, and it creates two globally accessible features, which can be added to a TypeScript file with the following declarations

declare const pageLoad: Promise<void>;
declare const include: (url: string) => Promise<Object>;
*/

Object.defineProperties(window, {
	"pageLoad": {value: document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn))},
	"include": {value: (url: string) => import(url)}
});
