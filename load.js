"use strict";

export default document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn));

Object.defineProperty(window, "include", {value: url => import(url)});
