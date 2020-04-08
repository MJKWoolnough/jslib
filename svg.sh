#!/bin/bash

#tags="$(cat ~/.node/lib64/node_modules/typescript/lib/lib.dom.d.ts | sed -n '/^interface SVGElementTagNameMap {$/,/^}$/p' | tail -n+2 | head -n-1 | cut -d'"' -f2 | tr '\n' ' ' | sed -e 's/ $//')";
tags="a circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata path pattern polygon polyline radialGradient rect script stop style svg switch symbol text textPath title tspan use view";

if [ -n "$1" ]; then
	sed '/\["'${1/\//\\\/}'svg.js"/Q';
	echo "}], [\"${1}svg.js\", () => {";
	echo "	const {createHTML} = include(\"$1dom.js\", true);";
	echo "	return \"$tags\".split(\" \").map(e => [e.replace(/^switch$/, \"switche\"), {\"value\": createSVG.bind(null, e)}]);";
	sed -n '/^}]/,$p';
	exit 0;
fi;

(
	echo -e "import {createSVG, Children, Props} from './dom.js';\n";
	echo -n "export const ";
	first=true;
	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo ",";
		fi;
		echo -n "$tag = createSVG.bind(null, \"$tag\") as (properties?: Props | Children, children?: Props | Children) => SVGElementTagNameMap[\"$tag\"]";
	done | sed -e 's/^switch /switche /';
	echo ";";
) > lib.ts/svg.ts;

(
	echo -e "import {createSVG} from './dom.js';\n";
	echo -n "export const [";
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
) > lib.js/svg.js;
