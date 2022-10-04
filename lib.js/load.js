export default document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn, {"once": true}));
