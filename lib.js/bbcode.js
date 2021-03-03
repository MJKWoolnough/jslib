const parseText = function* (text) {
	let last = 0;
	for (let pos = 0; pos < text.length; pos++) {
		if (text.charAt(pos) === '[') {
			const start = pos,
			      end = text.charAt(pos+1) === '/';
			if (end) {
				pos++;
			}
			for (pos++; pos < text.length; pos++) {
				const c = text.charCodeAt(pos);
				if (c >= 65 && c <=90 || c >=97 && c <=122) {
					continue;
				} else if (c === 93 && pos > start + (end ? 2 : 1)) { // ']'
					if (last != start) {
						const t = text.slice(last, start);
						while (yield t) {}
					}
					const t = end ? {
						"tagName": text.slice(start+2, pos),
						"fullText": text.slice(start, pos+1)
					} : {
						"tagName": text.slice(start+1, pos),
						"attr": null,
						"fullText": text.slice(start, pos+1)
					};
					last = pos+1;
					while (yield t) {}
				} else if (c === 61 && !end && pos > start + 1) { // '='
					if (last != start) {
						const t = text.slice(last, start);
						while (yield t) {}
					}
					const startAttr = pos;
					for (pos++; pos < text.length; pos++) {
						if (text.charAt(pos) === ']') {
							break;
						}
					}
					const t = {
						"tagName": text.slice(start+1, startAttr),
						"attr": text.slice(startAttr+1, pos),
						"fullText": text.slice(start, pos+1)
					};
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
}
