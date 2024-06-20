#!/bin/bash

filesDone=""

function depCheck {
	declare file="$1";

	if [ ! -z "$(echo "$filesDone" | grep "$file")" ]; then
		return 1;
	fi;

	declare deps="$(echo -e "$2\n$file")";
	declare dir="$(dirname "$file")";

	while read import; do
		declare realImport="$(realpath "$dir/$import")";

		if [ ! -z "$(echo "$deps" | grep "$realImport")" ]; then
			echo "CIRCULAR: $file <-> $realImport"

			return 0;
		else
			if depCheck "$realImport" "$deps"; then
				echo "$realImport";

				return 0;
			fi;
		fi;
	done < <(grep "^import " "$file" | grep -v "^import type" | cut -d"'" -f2);

	filesDone="$(echo -e "$filesDone\n$file")";

	return 1;
}

start="$(realpath "$1")";

if depCheck "$start" ""; then
	echo "$start";
fi;
