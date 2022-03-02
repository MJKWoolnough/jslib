const parseText = function* (text: string): Tokeniser {
	const tags = [""];
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
				let c = text.charCodeAt(pos);
				if (c >= 65 && c <=90 || c >=97 && c <=122 || c >= 48 && c <= 57) {
					continue;
				} else if (pos > start + +end + 1) {
					const startAttr = pos;
					let attr: string | null = null;
					if (c === 61 && !end) { // '='
						if (text.charAt(pos+1) === '"') {
							attr = "";
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
									break TagLoop;
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
						c = text.charCodeAt(pos);
					}
					if (c === 93) { // ']'
						if (last !== start) {
							const t = text.slice(last, start);
							while (yield t) {}
						}
						last = pos+1;
						const t = Object.freeze(end ? {
							"tagName": text.slice(start+2, pos).toLowerCase(),
							"fullText": text.slice(start, pos+1)
						} : {
							"tagName": text.slice(start+1, startAttr).toLowerCase(),
							attr,
							"fullText": text.slice(start, pos+1)
						});
						if (end) {
							if (tags[0] === t.tagName) {
								tags.pop();
								while ((yield undefined!) !== 1) {}
							}
							while (yield t) {}
						} else {
							OpenLoop:
							while (true) {
								switch (yield t) {
								default:
									break OpenLoop;
								case 1:
									tags.unshift(t.tagName);
								case true:
								}
							}
						}
					}
				}
				break;
			}
		}
	}
	if (last < text.length) {
		const t = text.slice(last);
		while (yield t) {}
	}
      };

export const text = Symbol("text"),
isOpenTag = (t: OpenTag | CloseTag | string): t is OpenTag => typeof t === "object" && (t as OpenTag).attr !== undefined,
isCloseTag = (t: OpenTag | CloseTag | string): t is CloseTag => typeof t === "object" && (t as OpenTag).attr === undefined,
isString = (t: OpenTag | CloseTag | string): t is string => typeof t === "string",
process = <T extends Node>(node: T, t: Tokeniser, p: Parsers, closeTag?: string) => {
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
				break;
			}
			p[text](node, tk.fullText);
		} else {
			p[text](node, tk);
		}
	}
	return node;
};

export type OpenTag = {
	tagName: string;
	attr: string | null;
	fullText: string;
}

export type CloseTag = {
	tagName: string
	fullText: string;
}

export type Tokeniser = Generator<OpenTag | CloseTag | string, void, true | 1 | undefined>;

export type TagFn = (node: Node, t: Tokeniser, p: Parsers) => void;

export type Parsers = {
	[key: string]: TagFn;
	[text]: (node: Node, t: string) => void;
}

export default (parsers: Parsers, text: string) => process(document.createDocumentFragment(), parseText(text), parsers);
