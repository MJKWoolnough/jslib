#!/bin/bash

tags="annotation annotation-xml maction math menclose merror mfenced mfrac mi mmultiscripts mn mo mover mpadded mphantom mprescripts mroot mrow ms mspace msqrt mstyle msub msubsup msup mtable mtd mtext mtr munder munderover semantics";

ts="lib.ts/math.ts";
js="lib.js/math.js";

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
		echo "import type {DOMBind} from './dom.js';";
		echo "import {bindElement} from './dom.js';";
		echo -en "\nexport const ns = \"http://www.w3.org/1998/Math/MathML\",\n[";
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
		echo -n "] = \"$tags\".split(\" \").map(e => bindElement(ns, e)) as DOMBind<MathMLElement>[];";
	) > "$ts";
fi;

if [ -n "$js" ]; then
	(
		echo -e "import {bindElement} from './dom.js';\n";
		echo -en "export const ns = \"http://www.w3.org/1998/Math/MathML\",\n[";
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
		echo "] = \"$tags\".split(\" \").map(e => bindElement(ns, e));";
	) > "$js";
fi;
