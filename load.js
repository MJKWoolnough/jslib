"use strict";

const pageLoad = document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn));

window.include = url => import(url);

export {pageLoad};
