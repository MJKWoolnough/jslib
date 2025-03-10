#!/bin/bash

#declare tags="$(cat ~/.node/lib64/node_modules/typescript/lib/lib.dom.d.ts | sed -n '/^interface HTMLElementTagNameMap {$/,/^}$/p' | tail -n+2 | head -n-1 | cut -d'"' -f2 | tr '\n' ' ' | sed -e 's/ $//')";
declare tags="a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr";

(
	cat <<-HEREDOC
	import {tags} from './dom.js';

	/**
	 * The html module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement | HTMLElement)s.
	 *
	 * @module html
	 * @requires module:dom
	 */
	/** */

	export const
	/** This constant contains the XMLNamespace of HTMLElements. */
	ns = "http://www.w3.org/1999/xhtml",
	HEREDOC

	echo -n "{";

	declare first="true";

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
) | tee lib.ts/html.ts > lib.js/html.js;
