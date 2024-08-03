#!/bin/bash

tags="annotation annotation-xml maction math menclose merror mfenced mfrac mi mmultiscripts mn mo mover mpadded mphantom mprescripts mroot mrow ms mspace msqrt mstyle msub msubsup msup mtable mtd mtext mtr munder munderover semantics";

(
	echo "import {tags} from './dom.js';";
	echo -en "\n/**\n * The math module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement | MathMLElement)s.\n *\n * @module math\n * @requires module:dom\n */\n/** */\n\nexport const\n/** This constant contains the XMLNamespace of MathMLElements. */\nns = \"http://www.w3.org/1998/Math/MathML\",\n{";

	first=true;

	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo -n ", ";
		fi;

		if [ "$tag" = "annotation-xml" ]; then
			echo -n "annotationXML";
		else
			echo -n "$tag";
		fi;
	done;

	echo -n "} = tags(ns);";
) > lib.ts/math.ts;

(
	echo -e "import {tags} from './dom.js';\n";
	echo -en "\n/**\n * The math module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement | MathMLElement)s.\n *\n * @module math\n * @requires module:dom\n */\n/** */\n\nexport const\n/** This constant contains the XMLNamespace of MathMLElements. */\nns = \"http://www.w3.org/1998/Math/MathML\",\n[";

	first=true;

	for tag in $tags; do
		if $first; then
			first=false;
		else
			echo -n ", ";
		fi;

		if [ "$tag" = "annotation-xml" ]; then
			echo -n "annotationXML";
		else
			echo -n "$tag";
		fi;
	done;

	echo "] = tags(ns);";
) > lib.js/math.js;
