#!/bin/bash

#tags="$(cat ~/.node/lib64/node_modules/typescript/lib/lib.dom.d.ts | sed -n '/^interface HTMLElementTagNameMap {$/,/^}$/p' | tail -n+2 | head -n-1 | cut -d'"' -f2 | tr '\n' ' ' | sed -e 's/ $//')";
tags="a abbr address applet area article aside audio b base basefont bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark marquee menu meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr";

if [ "$1" = "lib" ]; then
	sed '/\["'${2/\//\\\/}'"/q';
	echo "	const {createHTML} = include(\"$3\", true);";
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
	echo -e "import {createHTML} from 'html.js';\n";
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
