#!/bin/bash

#tags="$(cat ~/.node/lib64/node_modules/typescript/lib/lib.dom.d.ts | sed -n '/^interface HTMLElementTagNameMap {$/,/^}$/p' | tail -n+2 | head -n-1 | cut -d'"' -f2 | tr '\n' ' ' | sed -e 's/ $//')";
tags="a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark marquee menu meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr";

ts="lib.ts/html.ts";
js="lib.js/html.js";

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
		echo -e "import {createHTML} from './dom.js';\n";
		echo -e "export {createHTML};\n";
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
		echo -n "] = \"$tags\".split(\" \").map(e => createHTML.bind(null, e)) as [";
		first=true;
		for tag in $tags; do
			if $first; then
				first=false;
			else
				echo -n ", ";
			fi;
			echo -n "DOMBind<HTMLElementTagNameMap[\"$tag\"]>";
		done;
		echo "];";
	) > "$ts";
fi;

if [ -n "$js" ]; then
	(
		echo -e "import {createHTML} from './dom.js';\n";
		echo -e "export {createHTML};\n";
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
	) > "$js";
fi;
