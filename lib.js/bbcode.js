const parseText = function* (text) {
	let last = 0;
	for (let pos = 0; pos < text.length; pos++) {
		if (text.charAt(pos) === '[') {
			const start = pos,
			      end = text.charAt(pos+1) === '/';
			if (end) {
				pos++;
			}
			TagLoop:
			for (pos++; pos < text.length; pos++) {
				const c = text.charCodeAt(pos);
				if (c >= 65 && c <=90 || c >=97 && c <=122 || c >= 48 && c <= 57) {
					continue;
				} else if (c === 93 && pos > start + (end ? 2 : 1)) { // ']'
					if (last != start) {
						const t = text.slice(last, start);
						while (yield t) {}
					}
					const t = Object.freeze(end ? {
						"tagName": text.slice(start+2, pos).toLowerCase(),
						"fullText": text.slice(start, pos+1)
					} : {
						"tagName": text.slice(start+1, pos).toLowerCase(),
						"attr": null,
						"fullText": text.slice(start, pos+1)
					});
					last = pos+1;
					while (yield t) {}
				} else if (c === 61 && !end && pos > start + 1) { // '='
					if (last != start) {
						const t = text.slice(last, start);
						while (yield t) {}
					}
					const startAttr = pos;
					let attr = "";
					if (text.charAt(pos+1) === '"') {
						pos++;
						AttrLoop:
						for (pos++; pos < text.length; pos++) {
							const c = text.charAt(pos);
							switch (c) {
							case '"':
								if (text.charAt(pos+1) === ']') {
									pos++;
									break AttrLoop;
								}
								pos = startAttr;
								continue TagLoop;
							case '\\':
								pos++;
								const d = text.charAt(pos);
								switch (d) {
								case '"':
								case "'":
								case '\\':
									attr += d;
								}
								break;
							default:
								attr += c;
							}
						}
					} else {
						for (pos++; pos < text.length; pos++) {
							if (text.charAt(pos) === ']') {
								break;
							}
						}
						attr = text.slice(startAttr+1, pos);
					}
					const t = Object.freeze({
						"tagName": text.slice(start+1, startAttr).toLowerCase(),
						attr,
						"fullText": text.slice(start, pos+1)
					});
					last = pos+1;
					while (yield t) {}
				}
				break;
			}
		}
	}
	if (last < text.length) {
		while(yield text.slice(last)) {}
	}
      };

export const text = Symbol("text"),
isOpenTag = t => typeof t === "object" && t.attr !== undefined,
isCloseTag = t => typeof t === "object" && t.attr === undefined,
isString = t => typeof t === "string",
process = function(node, t, p, closeTag) {
	while (true) {
		const tk = t.next().value;
		if (!tk) {
			break;
		} else if (isOpenTag(tk)) {
			const pr = p[tk.tagName];
			if (pr) {
				pr(node, t, p);
			} else {
				p[text](node, tk.fullText);
			}
		} else if (isCloseTag(tk)) {
			if (tk.tagName === closeTag) {
				return;
			}
			p[text](node, tk.fullText);
		} else {
			p[text](node, tk);
		}
	}
};

export default function (node, parsers, text) {
	process(node, parseText(text), parsers);
	return node;
}
