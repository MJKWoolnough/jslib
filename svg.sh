#!/bin/bash

#tags="$(cat ~/.node/lib64/node_modules/typescript/lib/lib.dom.d.ts | sed -n '/^interface SVGElementTagNameMap {$/,/^}$/p' | tail -n+2 | head -n-1 | cut -d'"' -f2 | tr '\n' ' ' | sed -e 's/ $//')";
tags="a animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect script set stop style svg switch symbol text textPath title tspan use view";

(
	echo "import {tags} from './dom.js';";
	echo -en "\n/**\n * The svg module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGElement | SVGElement)s.\n *\n * @module svg\n * @requires module:dom\n */\n/** */\n\nexport const\n/** This constant contains the XMLNamespace of SVGElements. */\nns = \"http://www.w3.org/2000/svg\",\n/**\n * This function takes either a {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement | SVGSVGElement} or a {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGSymbolElement | SVGSymbolElement} and returns a URL encoded SVG data string.\n * @param {SVGSVGElement | SVGSymbolElement} s The SVG or Symbol element to be stringified.\n *\n * @return {string} The string representation of the input.\n */\nsvgData = (s: SVGSVGElement | SVGSymbolElement) => \"data:image/svg+xml,\" + encodeURIComponent(\"<svg xmlns=\\\"\" + ns + \"\\\"\" + (s instanceof SVGSVGElement ? s.outerHTML.slice(4) : s.outerHTML.slice(7, -7) + \"svg>\")),\n{";

	first=true;

	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo -n ", ";
		fi;

		if [ "$tag" = "switch" ]; then
			echo -n "switch: switche";
		else
			echo -n "$tag";
		fi;
	done;

	echo -n "} = tags(ns);";
) > lib.ts/svg.ts;

(
	echo "import {tags} from './dom.js';";
	echo -en "\n/**\n * The svg module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGElement | SVGElement)s.\n *\n * @module svg\n * @requires module:dom\n */\n/** */\n\nexport const\n/** This constant contains the XMLNamespace of SVGElements. */\nns = \"http://www.w3.org/2000/svg\",\n/**\n * This function takes either a {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement | SVGSVGElement} or a {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGSymbolElement | SVGSymbolElement} and returns a URL encoded SVG data string.\n * @param {SVGSVGElement | SVGSymbolElement} s The SVG or Symbol element to be stringified.\n *\n * @return {string} The string representation of the input.\n */\nsvgData = s => \"data:image/svg+xml,\" + encodeURIComponent(\"<svg xmlns=\\\"\" + ns + \"\\\"\" + (s instanceof SVGSVGElement ? s.outerHTML.slice(4) : s.outerHTML.slice(7, -7) + \"svg>\")),\n{";

	first=true;

	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo -n ", ";
		fi;

		if [ "$tag" = "switch" ]; then
			echo -n "switch: switche";
		else
			echo -n "$tag";
		fi;
	done;

	echo "} = tags(ns);";
) > lib.js/svg.js;
