#!/bin/bash

#declare tags="$(cat ~/.node/lib64/node_modules/typescript/lib/lib.dom.d.ts | sed -n '/^interface MathMLElementTagNameMap {$/,/^}$/p' | tail -n+2 | head -n-1 | cut -d'"' -f2 | tr '\n' ' ' | sed -e 's/ $//')";
declare tags="annotation annotation-xml maction math merror mfrac mi mmultiscripts mn mo mover mpadded mphantom mprescripts mroot mrow ms mspace msqrt mstyle msub msubsup msup mtable mtd mtext mtr munder munderover semantics";

(
	cat <<-HEREDOC
	import {tags} from './dom.js';

	/**
	 * The math module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement | MathMLElement)s.
	 *
	 * @module math
	 * @requires module:dom
	 */
	/** */

	export const
	/** This constant contains the XMLNamespace of MathMLElements. */
	ns = "http://www.w3.org/1998/Math/MathML",
	HEREDOC

	echo -n "{";

	declare first=true;

	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo -n ", ";
		fi;

		if [ "$tag" = "annotation-xml" ]; then
			echo -n "\"$tag\": annotationXML";
		else
			echo -n "$tag";
		fi;
	done;

	echo "} = tags(ns);";
) | tee lib.ts/math.ts > lib.js/math.js;
