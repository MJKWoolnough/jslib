#!/bin/bash

#tags="$(cat ~/.node/lib64/node_modules/typescript/lib/lib.dom.d.ts | sed -n '/^interface HTMLElementTagNameMap {$/,/^}$/p' | tail -n+2 | head -n-1 | cut -d'"' -f2 | tr '\n' ' ' | sed -e 's/ $//')";
tags="a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr";

(
	echo "import {tags} from './dom.js';";
	echo -en "\n/**\n * The html module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement | HTMLElement)s.\n *\n * @module html\n * @requires module:dom\n */\n/** */\n\nexport const\n/** This constant contains the XMLNamespace of HTMLElements. */\nns = \"http://www.w3.org/1999/xhtml\",\n{";

	first=true;

	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo -n ", ";
		fi;

		if [ "$tag" = "var" ]; then
			echo -n "var: vare";
		else
			echo -n "$tag";
		fi;
	done;

	echo -n "} = tags(ns);";
) > lib.ts/html.ts;

(
	echo -e "import {tags} from './dom.js';\n";
	echo -en "\n/**\n * The html module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement | HTMLElement)s.\n *\n * @module html\n * @requires module:dom\n */\n/** */\n\nexport const\n/** This constant contains the XMLNamespace of HTMLElements. */\nns = \"http://www.w3.org/1999/xhtml\",\n{";

	first=true;

	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo -n ", ";
		fi;

		if [ "$tag" = "var" ]; then
			echo -n "var: vare";
		else
			echo -n "$tag";
		fi;
	done;

	echo "} = tags(ns);";
) > lib.js/html.js;
