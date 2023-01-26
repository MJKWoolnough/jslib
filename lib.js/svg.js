import {bindElement} from './dom.js';

/**
 * The svg module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGElement | SVGElement)s.
 *
 * @module svg
 * @requires module:dom
 */
/** */

export const
/** This constant contains the XMLNamespace of SVGElements. */
ns = "http://www.w3.org/2000/svg",
/**
 * This function takes either a {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement | SVGSVGElement} or a {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGSymbolElement | SVGSymbolElement} and returns a URL encoded SVG data string.
 * @param {SVGSVGElement | SVGSymbolElement} s The SVG or Symbol element to be stringified.
 *
 * @return {string} The string representation of the input.
 */
svgData = s => "data:image/svg+xml," + encodeURIComponent("<svg xmlns=\"" + ns + "\"" + (s instanceof SVGSVGElement ? s.outerHTML.slice(4) : s.outerHTML.slice(7, -7) + "svg>")),
[a, animate, animateMotion, animateTransform, circle, clipPath, defs, desc, ellipse, feBlend, feColorMatrix, feComponentTransfer, feComposite, feConvolveMatrix, feDiffuseLighting, feDisplacementMap, feDistantLight, feDropShadow, feFlood, feFuncA, feFuncB, feFuncG, feFuncR, feGaussianBlur, feImage, feMerge, feMergeNode, feMorphology, feOffset, fePointLight, feSpecularLighting, feSpotLight, feTile, feTurbulence, filter, foreignObject, g, image, line, linearGradient, marker, mask, metadata, mpath, path, pattern, polygon, polyline, radialGradient, rect, script, set, stop, style, svg, switche, symbol, text, textPath, title, tspan, use, view] = "a animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect script set stop style svg switch symbol text textPath title tspan use view".split(" ").map(e => bindElement(ns, e));
