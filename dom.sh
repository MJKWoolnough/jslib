#!/bin/bash

tags="$(cat ~/.node/lib64/node_modules/typescript/lib/lib.dom.d.ts | sed -n '/^interface HTMLElementTagNameMap {$/,/^}$/p' | tail -n+2 | head -n-1 | cut -d'"' -f2 | tr '\n' ' ' | sed -e 's/ $//')";

if [ "$1" = "lib" ]; then
	sed '/\["lib\/dom.js"/q';
	echo "	const {createHTML} = include("html.js", true);";
	echo "	yield * \"$tags\".split(\" \").map(e => [e.replace(/^var$/, \"vare\"), {\"value\": createHTML.bind(null, e)}]);";
	sed -n '/^}]/,$p';
	exit 0;
fi;

(
	echo -e "import {createHTML, Children, Props} from 'html.js';\n";
	echo -n "export const ";
	first=true;
	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo ",";
		fi;
		echo -n "$tag = createHTML.bind(null, \"$tag\") as (properties?: Props | Children, children?: Props | Children) => HTMLElementTagNameMap[\"$tag\"]";
	done | sed -e 's/^var /vare /';
	echo ";";
) > lib.ts/dom.ts;

(
	echo -e "import {createHTML, Children, Props} from 'html.js';\n";
	echo -n "export const [";
	first=true;
	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo -n ", ";
		fi;
		if [ "$tag" = "var" ]; then
			echo -n "vare";
		else 
			echo -n "$tag";
		fi;
	done;
	echo "] = \"$tags\".split(\" \").map(e => createHTML.bind(null, e));";
) > lib.js/dom.js;
