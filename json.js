"use strict";
offer((function() {
	const whitespace = "\t\r\n ",
	      escapes = "\"\\/bfnrt",
	      hexDigits = "0123456789abcdefABCDEF",
	      digits = "0123456789",
	      exp = "eE",
	      pm = "+-",
	      readWhitespace = function(data) {
		for (let pos = 0; pos < data.length; pos++) {
			if (!whitespace.includes(data.charAt(pos))) {
				return pos;
			}
		}
		return data.length;
	      },
	      readString = function(data) {
		for (let pos = 1; pos < data.length; pos++) {
			switch (data.charAt(pos)) {
			case "\"":
				return pos + 1;
			case "\\":
				pos++;
				const c = data.charAt(pos);
				if (c === "u") {
					pos++;
					for (let j = 0; j < 4; j++, pos++) {
						if (!hexDigits.includes(data.charAt(pos))) {
							return -pos;
						}
					}
				} else if (escapes.includes(c)) {
					return -pos;
				}
			}
		}
		return -data.length;
	      },
	      readElement = function(data) {
		let pos = readWhitespace(data);
		switch (data.charAt(pos)) {
		case "\"":
			const j = readString(data.substring(pos));
			if (j < 0) {
				return j - pos;
			}
			return j + pos;
		case "{":
			pos++;
			pos += readWhitespace(data.substring(pos));
			if (data.charAt(pos) === "}") {
				return pos + 1;
			}
			while(pos < data.length) {
				pos += readWhitespace(data.substring(pos));
				const j = readString(data.substring(pos));
				if (j < 0) {
					return j - pos;
				}
				pos += j;
				pos += readWhitespace(data.substring(pos));
				if (data.charAt(pos) !== ":") {
					return j - pos;
				}
				pos++;
				pos += readWhitespace(data.substring(pos));
				const k = readElement(data.substring(pos));
				if (k < 0) {
					return k - pos;
				}
				pos += k;
				pos += readWhitespace(data.substring(pos));
				switch (data.charAt(pos)) {
				case ",":
					pos++;
					break;
				case "}":
					pos++;
					return pos;
				default:
					return -pos;
				}
			}
			return -pos;
		case "[":
			pos++;
			while (pos < data.length) {
				pos += readWhitespace(data.substring(pos));
				const j = readElement(data.substring(pos));
				if (j < 0) {
					return j - pos;
				}
				pos += j;
				pos += readWhitespace(data.substring(pos));
				switch (data.charAt(pos)) {
				case ",":
					pos++;
					break;
				case "]":
					pos++;
					return pos;
				default:
					return -pos;
				}
			}
		case "t":
			if (data.startsWith("true", pos)) {
				return pos + 4;
			} else {
				return -pos;
			}
			break;
		case "f":
			if (data.startsWith("false", pos)) {
				return pos + 5;
			} else {
				return -pos;
			}
		case "n":
			if (data.startsWith("null", pos)) {
				return pos + 4;
			} else {
				return -pos;
			}
		case "-":
			pos++;
			break;
		default:
			if (digits.indexOf(data.charAt(pos)) < 0) {
				return -pos;
			}
		}
		if (data.charAt(pos) === "0") {
			pos++;
		} else {
			if (!digits.includes(data.charAt(pos))) {
				return -pos;
			}
			pos++;
			for(; pos < data.length; pos++) {
				if (!digits.includes(data.charAt(pos))) {
					break;
				}
			}
		}
		if (data.charAt(pos) === ".") {
			pos++;
			if (!digits.includes(data.charAt(pos))) {
				return -pos;
			}
			pos++;
			for (; pos < data.length; pos++) {
				if (!digits.includes(data.charAt(pos))) {
					break;
				}
			}
		}
		if (exp.includes(data.charAt(pos))) {
			pos++;
			if (pm.includes(data.charAt(pos))) {
				pos++;
			}
			if (!digits.includes(data.charAt(pos))) {
				return -pos;
			}
			pos++;
			for (; pos < data.length; pos++) {
				if (!digits.includes(data.charAt(pos))) {
					break;
				}
			}
		}
		return pos;
	      },
	      split = function (odata) {
		let ret = [],
		    total = readWhitespace(odata),
		    data = odata.substring(total);
		while(data.length > 0) {
			const len = readElement(data);
			if (len <= 0 && data.length != len) {
				total -= len;
				const obj = ret.length,
				      oline = odata.substring(0, total).replace(/[^\n]/g, "").length,
				      sline = odata.substring(total-len, total).replace(/[^\n]/g, "").length,
				      ochar = total - (oline === 0 ? 0 : odata.substring(0, total).lastIndexOf("\n")),
				      schar = -len - (sline === 0 ? 0 : odata.substring(total-len, total).lastIndexOf("\n"));
				throw new SyntaxError(`split: invalid JSON at ${oline}:${ochar} (${obj}:${sline}:${schar})`);
			}
			total += len;
			ret.push(data.substring(0, len));
			data = data.substring(len);
			data = data.substring(readWhitespace(data));
		}
		return ret;
	      },
	      parse = data => split(data).map(d => JSON.parse(d)),
	      stringify = (...objs) => objs.map(o => JSON.stringify(o)).reduce((a, v) => a + v);
	return Object.freeze({split, parse, stringify});
}()));
