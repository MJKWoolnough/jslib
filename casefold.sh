#!/bin/bash

mode=0;

declare firstFrom="";
declare firstTo="";
declare lastFrom="";
declare lastTo="";
declare mode=0;
declare lastHad953=false;
declare has953=false;
declare toWithout953="";

setStart() {
	firstFrom="$from";
	firstTo="$to";
	setLast;
	mode=1;

	if $has953; then
		mode=4;
		lastTo="$toWithout953";
	fi;
}

setLast() {
	lastFrom="$from";
	lastTo="$to";
}

printPrevious() {
	local diff=$(( $firstTo - $firstFrom ));
	case $mode in
	1)
		echo "add($firstFrom, $firstTo);";;
	2)
		if [ "$diff" = "32" ]; then
			diff="";
		else
			diff=", $diff";
		fi;

		echo "addRange($firstFrom, $lastFrom$diff);";;
	3)
		if [ "$diff" = "1" ]; then
			diff="";
		else
			diff=", $diff";
		fi;

		echo "altAdd($firstFrom, $lastFrom$diff);";;
	4)
		if [ "$firstFrom" = "$lastFrom" ]; then
			echo -n "add($firstFrom, ";
			echo -n "$firstTo" | sed -e 's/,/, /';
			echo ");";
		else
			if [ "$diff" = "32" ]; then
				diff="";
			else
				diff=", $diff";
			fi;

			echo "addRange953($firstFrom, $lastFrom$diff);";
		fi;;
	esac;
}

declare source="$(
	cat <<HEREDOC
/**
 * The casefold module provides a simple Unicode case-folding function.
 *
 * @module casefold
 */
/** */

const cf = new Map<string, string>(),#const cf = new Map(),
      add = (from: number, ...to: number[]) => cf.set(String.fromCharCode(from), String.fromCharCode(...to)),#      add = (from, ...to) => cf.set(String.fromCharCode(from), String.fromCharCode(...to)),
      addRange = (start: number, end: number, shift = 32) => {#      addRange = (start, end, shift = 32) => {
	for (let i = start; i <= end; i++) {
		add(i, i + shift);
	}
      },
      addRange953 = (start: number, end: number, shift: number) => {#      addRange953 = (start, end, shift) => {
	for (let i = start; i <= end; i++) {
		add(i, i + shift, 953);
	}
      },
      altAdd = (start: number, end: number, shift = 1) => {#      altAdd = (start, end, shift = 1) => {
	for (let i = start; i <= end; i += 2) {
		add(i, i + shift);
	}
      };

HEREDOC
	while read line; do
		from="$(( $(echo "$line" | cut -d';' -f1 | sed -e 's/^0*/0x/') ))";
		to="$(echo -n "$line" | cut -d';' -f3 | sed -e 's/^ *0*/0x/' -e 's/ 0*/ 0x/g' | tr ' ' '\n' | while read char; do echo $(( $char ));done | tr '\n' ',' | sed -e 's/,$//')";

		has953="$(echo "$to" | grep ",953$" > /dev/null && echo "true" || echo "false")";
		toWithout953="$(echo "$to" | grep -v ",953$" || echo "$to" | sed -e 's/,953$//')";

		if echo "$toWithout953" | grep "," &> /dev/null; then
			printPrevious;
			echo "add($from, ${to//,/, });";
			mode=0;
		else
			case $mode in
			0)
				setStart "$from" "$to";;
			1)
				if [ "$(( $lastFrom + 1 ))" = "$from" -a "$(( $lastTo + 1 ))" = "$to" ]; then
					setLast;
					mode=2;
				elif [ "$(( $lastFrom + 2 ))" = "$from" -a "$(( $lastTo + 2 ))" = "$to" ]; then
					setLast;
					mode=3;
				else
					printPrevious;
					setStart;
				fi;;
			2)
				if [ "$(( $lastFrom + 1 ))" = "$from" -a "$(( $lastTo + 1 ))" = "$to" ]; then
					setLast "$from" "$to";
				else
					printPrevious;
					setStart;
				fi;;
			3)
				if [ "$(( $lastFrom + 2 ))" = "$from" -a "$(( $lastTo + 2 ))" = "$to" ]; then
					setLast "$from" "$to";
				else
					printPrevious;
					setStart;
				fi;;
			4)
				if [ "$(( $lastFrom + 1 ))" = "$from" -a "$(( $lastTo + 1 ))" = "$toWithout953" -a $lastHad953 = $has953 ]; then
					to="$toWithout953";
					setLast;
				else
					printPrevious;
					setStart;
				fi;;
			esac;
		fi;

		lastHad953=$has953;
	done < <(curl "https://www.unicode.org/Public/UCD/latest/ucd/CaseFolding.txt" 2> /dev/null | grep -v " [ST];" | grep -v "^#" | grep -v "^$");

	printPrevious;
cat <<HEREDOC

/**
 * The default export folds the case on the given string according to the following table of mappings:
 *
 * https://www.unicode.org/Public/UCD/latest/ucd/CaseFolding.txt
 *
 * @param {string} str The string to be folded.
 *
 * @return {string} The folded string.
 */
export default (str: string): string => {#export default str => {
	let ret = "";

	for (const c of str) {
		ret += cf.get(c) ?? c;
	}

	return ret;
}
HEREDOC
)";

echo "$source" | cut -d'#' -f1 > lib.ts/casefold.ts;
echo "$source" | cut -d'#' -f2 > lib.js/casefold.js;
