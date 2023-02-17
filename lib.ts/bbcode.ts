/**
 * This module contains a full {@link https://en.wikipedia.org/wiki/BBCode | BBCode} parser, allowing for custom tags and text handling.
 *
 * @module bbcode
 */
/** */

const parseText = function* (text: string): Tokeniser {
	const tags: string[] = [];
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
								tags.shift();
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

export const
/**
 * A {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol | Symbol} used to indicate the text processor in the Parsers type passed to the (default) parsing function.
 */
text = Symbol("text"),
/**
 * Intended for tag parsers, this function determines if a token is an {@link OpenTag}.
 *
 * @param {OpenTag | CloseTag | string} t Tag to determine if it is an OpenTag.
 *
 * @return {boolean} `true` if `t` is an `OpenTag`.
 */
isOpenTag = (t: OpenTag | CloseTag | string): t is OpenTag => typeof t === "object" && (t as OpenTag).attr !== undefined,
/**
 * Intended for tag parsers, this function determines if a token is a {@link CloseTag}.
 *
 * @param {OpenTag | CloseTag | string} t Tag to determine if it is a CloseTag.
 *
 * @return {boolean} `true` if `t` is an `CloseTag`.
 */
isCloseTag = (t: OpenTag | CloseTag | string): t is CloseTag => typeof t === "object" && (t as OpenTag).attr === undefined,
/**
 * Intended for tag parsers, this function determines if a token is a string.
 *
 * @param {OpenTag | CloseTag | string} t Tag to determine if it is a CloseTag.
 * 
 * @return {boolean} `true` if `t` is an `string`.
 */
isString = (t: OpenTag | CloseTag | string): t is string => typeof t === "string",
/**
 * Intended for tag parsers, appends parse BBCode to the passed {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}.
 *
 * @typeParam {Node} T
 * @param {T} node            The {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node} to append the parsed contents to.
 * @param {Tokeniser} t       The Tokeniser to parse from.
 * @param {Parsers} p         The object containing the parsers.
 * @param {string} [closeTag] Optional string containing the name of the closing tag.
 *
 * @return {T} The passed in node.
 */
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

/** Intended for tag parses, this defines an opening tag, with a possible attribute. */
export type OpenTag = {
	/** This is the parsed tag name for the opening tag. */
	tagName: string;
	/** This is the parsed attribute, if one was provided, or `null` if one was not. */
	attr: string | null;
	/** This is the full text of the parsed opening tag, including brackets and any attribute. */
	fullText: string;
}

/** Intended for tag parses, this defines a closing tag, with a possible attribute. */
export type CloseTag = {
	/** This is the parsed tag name for the closing tag. */
	tagName: string;
	/** This is the full text of the parsed opening tag, including brackets. */
	fullText: string;
}

/**
 * Intended for tag parses, this type is a generator that will yield a token, which will either be a {@link CloseTag}, {@link OpenTag}, or string. When calling `next` on this Generator, you can pass in `true` to the `next` method retrieve the last token generated. If you pass in `1` to the `next` method, when it has just outputted an {@link OpenTag}, the processor will not move past the corresponding {@link CloseTag} until `1` is again passed to the `next` method.
 */
export type Tokeniser = Generator<OpenTag | CloseTag | string, void, true | 1 | undefined>;

/**
 * A function that takes a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}, a {@link Tokeniser}, and a {@link Parsers} object. This function should process tokens from the {@link Tokeniser}, appending to the {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}, until its tag data finishes. This function should return nothing.
 */
export type TagFn = (node: Node, t: Tokeniser, p: Parsers) => void;

/**
 * This type represents an Object, which contains the tag parsers for specific tags and the text processor. This object **must** contain the {@link text} {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol | Symbol}, specifying a text formatting function, which takes a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node} to be appended to, and the string to be formatted. In addition, this object should contain string keys, which correspond to tag names, the values of which should be {@link TagFn}s.
 */
export type Parsers = {
	[key: string]: TagFn;
	[text]: (node: Node, t: string) => void;
}

/**
 * This function parses the given text according, handling the tags with the given parsers, and appending all generated {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}s to a {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment}, which is returned.
 *
 * @param {Parsers} parsers The bbcode tag parsers.
 * @param {string} text     The text to be parsed.
 *
 * @return {DocumentFragment} DocumentFragment containing the parsed elements.
 */
export default (parsers: Parsers, text: string): DocumentFragment => process(document.createDocumentFragment(), parseText(text), parsers);
