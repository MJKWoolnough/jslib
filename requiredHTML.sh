#!/bin/bash

filesDone="";
tags="";

function scanFile {
	declare file="$1";
	if [ ! -z "$(echo "$filesDone" | grep "$file")" ]; then
		return;
	fi;
	filesDone="$(echo -e "$filesDone\n$file")";
	declare dir="$(dirname "$file")";
	declare import;
	while read import; do
		declare realImport="$(realpath "$dir/$(echo "$import" | cut -d"'" -f2)")";
		scanFile "$realImport";
		if [ ! -z "$(echo "$realImport" | sed -ne '/lib[^\/]*\/html.js$/p')" ]; then
			if [ ! -z "$(echo "$import" | grep "*")" ]; then
				echo "!!";
				exit 1;
			fi;
			tags="$tags,$(echo "$import" | cut -d'{' -f2 | cut -d'}' -f1 | sed -e 's/ as [^,}]*//g' | tr -d ' ')";
		fi;
	done < <(grep "^import " "$file" | grep -v "^import type");
}

for f; do
	scanFile "$(realpath "$f")";
done;

echo -n "\"";
echo "$tags" | tr ',' '\n' | grep -v "^$" | grep -v "createHTML" | sort | uniq | tr '\n' ' ' | sed -e 's/ $//';
echo "\"";
