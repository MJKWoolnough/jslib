import parser, {processToEnd} from './parser.js';

/**
 * This module contains a full {@link https://en.wikipedia.org/wiki/BBCode | BBCode} parser, allowing for custom tags and text handling.
 *
 * The current implementation requires tags be properly nested.
 *
 * @module bbcode
 * @requires module:parser
 */
/** */

const textToken = 1,
      openToken = 2,
      closeToken = 3,
      nameChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      tagStart = "[",
      tagStop = "]",
      tagEndStart = "/",
      tagAttr = "=",
      parseText = t => {
	if (!t.exceptRun(tagStart)) {
		if (t.length()) {
			return t.return(textToken);
		}

		return t.done();
	}

	if (t.length()) {
		return t.return(textToken, parseOpen);
	}

	return parseOpen(t);
      },
      parseOpen = t => {
	if (!t.accept(tagStart)) {
		return parseText(t);
	}

	if (t.accept(tagEndStart)) {
		return parseClose(t);
	}

	if (!t.accept(nameChars)) {
		return parseText(t);
	}

	t.acceptRun(nameChars);

	if (t.accept(tagAttr)) {
		if (t.accept("\"")) {
			Loop:
			while (true) {
				switch (t.exceptRun("\\\"")) {
				case "\\":
					t.except("");
					t.except("");

					continue;
				case "\"":
					t.except("");
					break Loop;
				default:
					t.reset();
					t.except("");

					return parseText(t);
				}
			}
		} else {
			t.exceptRun(tagStop);
		}
	}

	if (!t.accept(tagStop)) {
		return parseText(t);
	}

	return t.return(openToken, parseText);
      },
      parseClose = t => {
	if (!t.accept(nameChars) || t.acceptRun(nameChars) !== tagStop) {
		return parseText(t);
	}

	t.except("");

	return t.return(closeToken, parseText);
      },
      mergeText = p => {
	if (p.accept(textToken)) {
		p.acceptRun(textToken);

		return p.return(textToken, mergeText);
	}

	p.except(0);

	const tks = p.get();

	if (tks.length) {
		return [{"type": tks[0].type, "data": tks}, mergeText];
	}

	return p.done();
      },
      processText = function* (text) {
	const tags = [];

	Loop:
	for (const tks of processToEnd(parser(text, parseText, mergeText))) {
		switch (tks.type) {
		case textToken:
			const text = tks.data.reduce((t, {data}) => t + data, "");

			while (yield text) {}

			break;
		case openToken: {
			const fullText = tks.data[0].data,
			      [tagName, attr] = fullText.slice(1, -1).split(tagAttr),
			      open = {tagName, "attr": attr?.startsWith("\"") ? JSON.parse(attr) : attr ?? null, fullText};

			while (true) {
				switch (yield open) {
				default:
					continue Loop;
				case 1:
					tags.unshift(tagName);
				case true:
				}
			}
		};
		case closeToken:
			const fullText = tks.data[0].data,
			      tagName = fullText.slice(2, -1),
			      close =  {tagName, fullText};

			if (tags[0] === tagName) {
				tags.shift();

				while ((yield undefined) !== 1) {}
			}

			while (yield close) {}
		}
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
 * @param {OpenTag | CloseTag | string} t Tag to determine if it is an `OpenTag`.
 *
 * @return {boolean} `true` if `t` is an `OpenTag`.
 */
isOpenTag = t => typeof t === "object" && t.attr !== undefined,
/**
 * Intended for tag parsers, this function determines if a token is a {@link CloseTag}.
 *
 * @param {OpenTag | CloseTag | string} t Tag to determine if it is a `CloseTag`.
 *
 * @return {boolean} `true` if `t` is a `CloseTag`.
 */
isCloseTag = t => typeof t === "object" && t.attr === undefined,
/**
 * Intended for tag parsers, this function determines if a token is a `string`.
 *
 * @param {OpenTag | CloseTag | string} t Tag to determine if it is a `string`.
 *
 * @return {boolean} `true` if `t` is a `string`.
 */
isString = t => typeof t === "string",
/**
 * Intended for tag parsers, appends parse BBCode to the passed {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}.
 *
 * @param {Node} node         The {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node} to append the parsed contents to.
 * @param {Tokeniser} t       The Tokeniser to parse from.
 * @param {Parsers} p         The object containing the parsers.
 * @param {string} [closeTag] Optional string containing the name of the closing tag.
 *
 * @returns {Node} The passed in node.
 */
process = (node, t, p, closeTag) => {
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

/**
 * Intended for tag parses, this defines an opening tag, with a possible attribute.
 *
 * @typedef {Object} OpenTag
 * @property {string} tagName     This is the parsed tag name for the opening tag.
 * @property {string | null} attr This is the parsed attribute, if one was provided, or `null` if one was not.
 * @property {string} fullText    This is the full text of the parsed opening tag, including brackets and any attribute.
 */

/**
 * Intended for tag parses, this defines a closing tag, with a possible attribute.
 *
 * @typedef {Object} CloseTag
 * @property {string} tagName  This is the parsed tag name for the closing tag.
 * @property {string} fullText This is the full text of the parsed closing tag, including brackets.
 */

/**
 * Intended for tag parses, this type is a generator that will yield a token, which will either be a {@link CloseTag}, {@link OpenTag}, or string. When calling `next` on this Generator, you can pass in `true` to the `next` method retrieve the last token generated. If you pass in `1` to the `next` method, when it has just outputted an {@link OpenTag}, the processor will not move past the corresponding {@link CloseTag} until `1` is again passed to the `next` method.
 *
 * @typedef {Generator<OpenTag | CloseTag | string, void, true | 1 | undefined>} Tokeniser
 */

/**
 * A function that takes a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}, a {@link Tokeniser}, and a {@link Parsers} object. This function should process tokens from the {@link Tokeniser}, appending to the {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}, until its tag data finishes. This function should return nothing.
 *
 * @typedef {(node: Node, t: Tokeniser, p: Parsers) => void} TagFn
 */

/**
 * This function parses the given text according, handling the tags with the given parsers, and appending all generated {@link https://developer.mozilla.org/en-US/docs/Web/API/Node | Node}s to a {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment | DocumentFragment}, which is returned.
 *
 * @param {Parsers} parsers The bbcode tag parsers.
 * @param {string} text     The text to be parsed.
 *
 * @return {DocumentFragment} DocumentFragment containing the parsed elements.
 */
export default (parsers, text) => process(document.createDocumentFragment(), processText(text), parsers);
