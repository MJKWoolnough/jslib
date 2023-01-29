/**
 * The load module contains a single default export, a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | Promise} which is resolved when the page finished loading.
 * @module load
 */
/** */

/** This Promise successfully resolves when the page is loaded. */
export default document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn, {"once": true}));
