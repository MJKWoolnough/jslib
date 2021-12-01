#!/bin/bash

#tags="$(cat ~/.node/lib64/node_modules/typescript/lib/lib.dom.d.ts | sed -n '/^interface SVGElementTagNameMap {$/,/^}$/p' | tail -n+2 | head -n-1 | cut -d'"' -f2 | tr '\n' ' ' | sed -e 's/ $//')";
tags="a animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect set script stop style svg switch symbol text textPath title tspan use view";

ts="lib.ts/svg.ts";
js="lib.js/svg.js";

if [ -n "$1" ]; then
	tags="$1";
	if [ -n "$2" ]; then
		case "$2" in
		*".js")
			js="$2";
			ts="";;
		*".ts")
			js="";
			ts="$2";;
		esac;
	fi;
fi;

if [ -n "$ts" ]; then
	(
		echo -e "import type {DOMBind} from './dom.js';";
		echo -e "import {createElements} from './dom.js';\n";
		echo -en "export const ns = \"http://www.w3.org/2000/svg\",\ncreateSVG = createElements(ns),\n[";
		first=true;
		for tag in $tags; do
			if $first; then
				first=false;
			else
				echo -n ", ";
			fi;
			if [ "$tag" = "switch" ]; then
				echo -n "switche";
			else
				echo -n "$tag";
			fi;
		done;
		echo -n "] = \"$tags\".split(\" \").map(e => createSVG.bind(null, e)) as [";
		first=true;
		for tag in $tags; do
			if $first; then
				first=false;
			else
				echo -n ",";
			fi;
			echo -n "DOMBind<";
			case "$tag" in
			"animate"|"animateMotion"|"animateTransform")
				echo -n "SVGA${tag:1}Element";;
			"mpath"|"set")
				echo -n "SVGElement";;
			*)
				echo -n "SVGElementTagNameMap[\"$tag\"]";;
			esac;
			echo -n ">";
		done;
		echo "];";
	) > "$ts";
fi;

if [ -n "$js" ]; then
	(
		echo -e "import {createElements} from './dom.js';\n";
		echo -en "export const ns = \"http://www.w3.org/2000/svg\",\ncreateSVG = createElements(ns),\n[";
		first=true;
		for tag in $tags; do
			if $first; then
				first=false;
			else
				echo -n ", ";
			fi;
			if [ "$tag" = "switch" ]; then
				echo -n "switche";
			else
				echo -n "$tag";
			fi;
		done;
		echo "] = \"$tags\".split(\" \").map(e => createSVG.bind(null, e));";
	) > "$js";
fi;
