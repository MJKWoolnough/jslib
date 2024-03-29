/**
 * This module contains a full CommonMark parser with several optional (enabled by default) extensions.
 *
 * @module markdown
 * @requires module:casefold
 * @requires module:parser
 */
/** */

import CaseFold from './casefold.js';
import {text2DOM} from './misc.js';
import {TokenDone, Tokeniser} from './parser.js';
import Parser from './parser.js';

/**
 * This type allows for the overriding of default processing behaviour.
 *
 * Most of the fields simply allow for alternate Node creation behaviour and custom processing.
 * typedef {Object} Tags
 * @property {null | [keyof HTMLElementTagNameMap, ...string[]][]}                              allowedHTML    This field allows the whitelisting of raw HTML elements. Takes an array of tuples, of which the first element is the HTML element name, and the remaining elements are allowed attributes names.
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              blockquote 
 * @property {(info: string, text: string) => Element | DocumentFragment}                       code
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              heading1
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              heading2
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              heading3
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              heading4
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              heading5
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              heading6
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              paragraphs
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              unorderedList
 * @property {(start: string, c: DocumentFragment) => Element | DocumentFragment}               orderedList
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              listItem
 * @property {null | (checked: boolean) => Element | DocumentFragment}                          checkbox       Set to null to disable the Task List Item extension.
 * @property {() => Element | DocumentFragment}                                                 thematicBreaks
 * @property {(href: string, title: string, c: DocumentFragment) => Element | DocumentFragment} link
 * @property {(src: string, title: string, alt: string) => Element | DocumentFragment}          image
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              inlineCode
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              italic
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              bold
 * @property {null | (c: DocumentFragment) => Element | DocumentFragment}                       underline      Set to null to disable the underline extension. When enabled, will replace single underscore emphasis with underline tags.
 * @property {null | (c: DocumentFragment) => Element | DocumentFragment}                       subscript      Set to null to disable the subscript extension.
 * @property {null | (c: DocumentFragment) => Element | DocumentFragment}                       superscript    Set to null to disable the superscript extension.
 * @property {null | (c: DocumentFragment) => Element | DocumentFragment}                       strikethrough  Set to null to disable the strikethrough extension.
 * @property {null | (c: DocumentFragment) => Element | DocumentFragment}                       insert         Set to null to disable the insert extension.
 * @property {null | (c: DocumentFragment) => Element | DocumentFragment}                       highlight      Set to null to disable the highlight extension.
 * @property {null | (c: DocumentFragment) => Element | DocumentFragment}                       table          Set to null to disable the table extension.
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              thead
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              tbody
 * @property {(c: DocumentFragment) => Element | DocumentFragment}                              tr
 * @property {(alignment: string, c: DocumentFragment) => Element | DocumentFragment}           th
 * @property {(alignment: string, c: DocumentFragment) => Element | DocumentFragment}           td
 * @property {() => Element | DocumentFragment}                                                 break
 */

let inlineStarts = "",
    taskListItems = false;

const makeNode = (nodeName, params = {}, children = "") => {
	const node = document.createElement(nodeName);

	for(const key in params) {
		node.setAttribute(key, params[key]);
	}

	if (typeof children === "string") {
		node.innerText = children;
	} else {
		node.append(children);
	}

	return node;
      },
      setHTML = (node, html) => {
	node.innerHTML = html;

	return node;
      },
      setText = (node, text) => {
	node.textContent = text;

	return node;
      },
      tags = [
	["blockquote", "blockquote"],
	["paragraphs", "p"],
	["unorderedList", "ul"],
	["listItem", "li"],
	["inlineCode", "code"],
	["italic", "em"],
	["bold", "strong"],
	["underline", "u"],
	["subscript", "sub"],
	["superscript", "sup"],
	["strikethrough", "s"],
	["insert", "ins"],
	["highlight", "mark"],
	["table", "table"],
	["thead", "thead"],
	["tbody", "tbody"],
	["tr", "tr"],
	...Array.from({"length": 6}, (_, n) => [`heading${n+1}`, `h${n+1}`])
      ].reduce((o, [key, tag]) => (o[key] = c => makeNode(tag, {}, c), o), {
	"code": (_, text) => makeNode("pre", {}, text),
	"orderedList": (start, c) => makeNode("ol", start ? {start} : {}, c),
	"allowedHTML": null,
	"checkbox": checked => makeNode("input", checked ? {"checked": "", "disabled": "", "type": "checkbox"} : {"disabled": "", "type": "checkbox"}),
	"thematicBreaks": () => makeNode("hr"),
	"link": (href, title, c) => makeNode("a", title ? {href, title} : {href}, c),
	"image": (src, title, alt) => makeNode("img", title ? {src, alt, title} : {src, alt}),
	"th": (alignment, c) => makeNode("th", alignment ? {"style": "text-align:"+alignment} : {}, c),
	"td": (alignment, c) => makeNode("td", alignment ? {"style": "text-align:"+alignment} : {}, c),
	"break": () => makeNode("br")
      }),
      whiteSpace = " ",
      nl = "\n",
      whiteSpaceNL = whiteSpace + nl,
      letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      number = "0123456789",
      scheme = letter + number + "+.-",
      control = Array.from({"length": 31}).reduce((t, _, n) => t + String.fromCharCode(n), String.fromCharCode(127)),
      emailStart = letter + number + "!#$&&'*+-/=?^_`{|}~.",
      emailLabelStr = letter + number + "-",
      htmlElements = ["pre", "script", "style", "textarea", "address", "article", "aside", "base", "basefont", "blockquote", "body", "caption", "center", "col", "colgroup", "dd", "details", "dialog", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "iframe", "legend", "li", "link", "main", "menu", "menuitem", "nav", "noframes", "ol", "optgroup", "option", "p", "param", "search", "section", "summary", "table", "tbody", "td", "tfoot", "th", "thead", "title", "tr", "track", "ul"],
      type1Elements = htmlElements.slice(0, 4),
      notTable = () => null,
      parseTable = tk => {
	while (true) {
		switch (tk.exceptRun("|\\\n")) {
		default:
			return null;
		case '|':
			tk.next();

			if (tk.acceptRun(whiteSpace) === nl || !tk.peek()) {
				return null;
			}

			return new TableBlock(tk);
		case '\\':
			tk.next();
			tk.next();
		}
	}
      },
      parseIndentedCodeBlockStart = (tk, inParagraph) => {
	if (!inParagraph && tk.accept(" ") && tk.length() === 4) {
		return new IndentedCodeBlock(tk);
	}

	return null;
      },
      parseBlockQuoteStart = tk => {
	if (tk.accept(">")) {
		return new BlockQuote(tk);
	}

	return null;
      },
      parseThematicBreak = tk => {
	const tbChar = tk.next();

	switch (tbChar) {
	case '*':
	case '-':
	case '_':
		tk.acceptRun(whiteSpace);

		if (tk.accept(tbChar)) {
			tk.acceptRun(whiteSpace);

			if (tk.accept(tbChar)) {
				tk.acceptRun(whiteSpace + tbChar);

				if (tk.accept(nl) || !tk.peek()) {
					return new ThematicBreakBlock(tk);
				}
			}
		}
	}

	return null;
      },
      parseListBlockStart = (tk, inParagraph) => {
	const lbChar = tk.next();

	switch (lbChar) {
	case '*':
	case '-':
	case '+':
		if (tk.accept(inParagraph ? whiteSpace : whiteSpaceNL)) {
			tk.backup();

			return new ListBlock(tk);
		} else if (!inParagraph && !tk.peek()) {
			return new ListBlock(tk);
		}

		break;
	case '0':
	case '2':
	case '3':
	case '4':
	case '5':
	case '6':
	case '7':
	case '8':
	case '9':
		if (inParagraph) {
			break;
		}
	case '1':
		const l = tk.length();

		if (!inParagraph) {
			tk.acceptRun(number);
		}

		if (tk.length() - l < 9 && tk.accept(".)")) {
			if (tk.accept(inParagraph ? whiteSpace : whiteSpaceNL)) {
				tk.backup();

				return new ListBlock(tk);
			} else if (!inParagraph && tk.peek() === "") {
				return new ListBlock(tk);
			}
		}
	}

	return null;
      },
      parseATXHeader = tk => {
	const level = tk.acceptString("######");

	if (level > 0 && (tk.accept(whiteSpace) || tk.peek() === nl || !tk.peek())) {
		return new ATXHeadingBlock(tk, level);
	}

	return null;
      },
      parseFencedCodeBlockStart = tk => {
	const fcbChar = tk.next();

	switch (fcbChar) {
	case '`':
	case '~':
		if (tk.accept(fcbChar) && tk.accept(fcbChar)) {
			tk.acceptRun(fcbChar);

			if (tk.exceptRun(nl + (fcbChar === '`' ? '`' : "")) !== fcbChar) {
				tk.accept(nl);

				return new FencedCodeBlock(tk, fcbChar);
			}
		}
	}

	return null;
      },
      parseHTML1 = tk => {
	if (tk.accept("<")) {
		tk.accept("/");

		if (type1Elements.indexOf(tk.acceptWord(type1Elements, false).toLowerCase()) >= 0 && (tk.accept(whiteSpace + ">") || tk.peek() === nl)) {
			return new HTMLBlock(tk, 1);
		}
	}

	return null;
      },
      parseHTML2 = tk => {
	if (tk.acceptString("<!--") === 4) {
		return new HTMLBlock(tk, 2);
	}

	return null;
      },
      parseHTML3 = tk => {
	if (tk.acceptString("<?") === 2) {
		return new HTMLBlock(tk, 3);
	}

	return null;
      },
      parseHTML4 = tk => {
	if (tk.acceptString("<!") === 2 && tk.accept(letter)) {
		return new HTMLBlock(tk, 4);
	}

	return null;
      },
      parseHTML5 = tk => {
	if (tk.acceptString("<![CDATA[") === 9) {
		return new HTMLBlock(tk, 5);
	}

	return null;
      },
      parseHTML6 = tk => {
	if (tk.accept("<")) {
		tk.accept("/");

		if (htmlElements.indexOf(tk.acceptWord(htmlElements, false).toLowerCase()) >= 0 && (tk.accept(whiteSpace + ">") || (tk.accept("/") && tk.accept(">") || tk.peek() === nl))) {
			return new HTMLBlock(tk, 6);
		}
	}

	return null;
      },
      isTag = (tk, multiline = false) => {
	if (tk.accept("/") && tk.accept(letter)) {
		tk.acceptRun(letter + number + "-");
		tk.acceptRun(whiteSpace);

		if (multiline && tk.accept(nl)) {
			tk.acceptRun(whiteSpace);
		}

		return tk.accept(">");
	} else if (tk.accept(letter)) {
		tk.acceptRun(letter + number + "-");

		while (true) {
			let hasSpace = true;

			if (tk.accept(whiteSpace)) {
				tk.acceptRun(whiteSpace);
				tk.accept(nl);
				tk.acceptRun(whiteSpace);
			} else if (multiline && tk.accept(nl)) {
				tk.acceptRun(whiteSpace);
			} else {
				hasSpace = false;
			}

			if (tk.accept("/")) {
				if (tk.accept(">")) {
					return true;
				}

				break;
			} else if (tk.accept(">")) {
				return true;
			} else if (!hasSpace || !tk.accept(letter + "_:")) {
				break;
			}

			tk.acceptRun(letter + number + "_.:-");

			hasSpace = true;

			if (tk.accept(whiteSpace)) {
				tk.acceptRun(whiteSpace);
				tk.accept(nl);
				tk.acceptRun(whiteSpace);
			} else if (multiline && tk.accept(nl)) {
				tk.acceptRun(whiteSpace);
			} else {
				hasSpace = false;
			}

			if (tk.accept("=")) {
				tk.acceptRun(whiteSpace);

				if (tk.accept("'")) {
					tk.exceptRun("'");

					if (!tk.accept("'")) {
						break;
					}
				} else if (tk.accept('"')) {
					tk.exceptRun('"');

					if (!tk.accept('"')) {
						break;
					}
				} else if (tk.accept(whiteSpace + "\n\"'=<>`")) {
					break;
				} else {
					tk.exceptRun(whiteSpace + "\n\"'=<>`");
				}
			} else if (hasSpace) {
				tk.backup();
			}
		}
	}

	return false;
      },
      parseHTML7 = (tk, inParagraph) => {
	if (!inParagraph && tk.accept("<") && isTag(tk) && (!tk.acceptRun(whiteSpace) || tk.accept(nl))) {
		return new HTMLBlock(tk, 7);
	}

	return null;
      },
      parseLinkLabel = tk => {
	if (tk.accept("[")) {
		tk.acceptRun(whiteSpace);

		if (tk.accept(nl)) {
			tk.acceptRun(whiteSpace);
		}

		if (!tk.accept("]") && !tk.accept(nl)) {
			Loop:
			while (true) {
				switch (tk.exceptRun("\\[]\n")) {
				default:
					break Loop;
				case nl:
					tk.next();
					tk.acceptRun(whiteSpace);

					if (tk.peek() === nl) {
						return false;
					}

					break;
				case ']':
					tk.next();

					return true;
				case '\\':
					tk.next();
					tk.next();
				}
			}
		}
	}

	return false;
      },
      processLinkRef = ref => CaseFold(ref).replaceAll(/\s+/g, " "),
      parseLinkReference = (tk, inParagraph) => {
	if (!inParagraph && parseLinkLabel(tk) && tk.accept(":")) {
		const colon = tk.length(),
		      ftk = subTokeniser(tk);

		tk.acceptRun(whiteSpace);

		if (tk.accept(nl)) {
			tk.acceptRun(whiteSpace);
		}

		const h = parseLinkDestination(ftk),
		      p = tk.length();

		if (h && (ftk.accept(whiteSpace) || ftk.peek() === nl || !ftk.peek())) {
			ftk.acceptRun(whiteSpace);

			const hasNL = ftk.accept(nl),
			      nlPos = tk.length();

			if (hasNL) {
				ftk.acceptRun(whiteSpace);
			}

			const title = processEscapedPunctuation(parseLinkTitle(ftk)),
			      href = processEscapedPunctuation(h + "");

			if (!title) {
				ftk.reset();
				tk.reset();

				for (let i = 0; i < p; i++) {
					tk.next();
				}
			}

			ftk.acceptRun(whiteSpace);

			let hasTitle = true;

			if (!ftk.accept(nl) && ftk.peek()) {
				if (!hasNL) {
					return null;
				}

				hasTitle = false;

				ftk.reset();
				tk.reset();

				for (let i = 0; i < nlPos; i++) {
					tk.next();
				}
			}

			const ref = processLinkRef(tk.get().slice(0, colon - 2).trim().slice(1));

			if (!links.has(ref)) {
				links.set(ref, {href, "title" : hasTitle ? title : ""});
			}

			return new LinkLabelBlock();
		}
	}

	return null;
      },
      parseParagraph = (tk, inParagraph) => {
	if (!inParagraph) {
		const last = tk.acceptRun(whiteSpace);

		if (last && last !== nl) {
			return new ParagraphBlock(tk);
		}
	}

	return null;
      },
      acceptThreeSpaces = tk => tk.acceptString("   "),
      parseBlock = [
	parseIndentedCodeBlockStart,
	parseBlockQuoteStart,
	parseThematicBreak,
	parseTable,
	parseListBlockStart,
	parseATXHeader,
	parseFencedCodeBlockStart,
	parseHTML1,
	parseHTML2,
	parseHTML3,
	parseHTML4,
	parseHTML5,
	parseHTML6,
	parseHTML7,
	parseLinkReference,
	parseParagraph
      ],
      encoder = makeNode("textarea"),
      punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
      tokenText = 1,
      tokenCode = 2,
      tokenEmphasis = 3,
      tokenImageOpen = 4,
      tokenLinkOpen = 5,
      tokenLinkClose = 6,
      tokenParenOpen = 7,
      tokenParenClose = 8,
      tokenHTML = 9,
      tokenAutoLink = 10,
      tokenAutoEmail = 11,
      tokenHTMLMD = 12,
      tokenDeactivatedLink = 13,
      tokenCaret = 14,
      parseText = tk => {
	while (true) {
		switch (tk.exceptRun(inlineStarts)) {
		case '\\':
			tk.next();
			tk.next();
			break;
		case '`':
			return tk.return(tokenText, parseCode);
		case '*':
		case '_':
		case '~':
		case '+':
		case '=':
			return tk.return(tokenText, parseEmphasis);
		case '!':
			return tk.return(tokenText, parseImageOpen);
		case '[':
			return tk.return(tokenText, parseLinkOpen);
		case ']':
			return tk.return(tokenText, parseLinkClose);
		case '(':
			return tk.return(tokenText, parseParenOpen);
		case ')':
			return tk.return(tokenText, parseParenClose);
		case '<':
			return tk.return(tokenText, parseHTML);
		case '^':
			return tk.return(tokenText, parseCaret);
		default:
			return tk.return(tokenText);
		}
	}
      },
      parseCode = tk => {
	tk.acceptRun("`");

	const numTicks = tk.length();

	while (true) {
		switch (tk.exceptRun("`")) {
		default:
			tk.reset();
			tk.acceptRun("`");

			return parseText(tk);
		case '`':
			const l = tk.length();

			tk.acceptRun("`");

			if (tk.length() - l === numTicks) {
				return tk.return(tokenCode, parseText);
			}
		}
	}
      },
      parseEmphasis = tk => {
	tk.acceptRun(tk.next());
	
	return tk.return(tokenEmphasis, parseText);
      },
      parseCaret = tk => {
	tk.next();

	if (tk.accept("^")) {
		tk.acceptRun("^");

		return parseText(tk);
	}

	return tk.return(tokenCaret, parseText);
      },
      parseImageOpen = tk => {
	tk.next();

	if (tk.accept("[")) {
		return tk.return(tokenImageOpen, parseText);
	}

	return parseText(tk);
      },
      [parseLinkOpen, parseLinkClose, parseParenOpen, parseParenClose] = [tokenLinkOpen, tokenLinkClose, tokenParenOpen, tokenParenClose].map(t => tk => {
	tk.next();

	return tk.return(t, parseText);
      }),
      parseHTML = tk => {
	tk.next();

	if (tk.accept("!")) {
		if (tk.accept("-")) {
			if (tk.accept("-")) {
				tk.accept("-");

				if (!tk.accept(">")) {
					while (tk.exceptRun("-")) {
						tk.next();

						if (tk.accept("-")) {
							if (tk.accept(">")) {
								return tk.return(tokenHTML, parseText);
							}
						}
					}
				}
			}
		} else if (tk.accept(letter)) {
			if (tk.exceptRun(">") === ">") {
				tk.next();

				return tk.return(tokenHTML, parseText);
			}
		} else if (tk.acceptString("[CDATA[") === 7) {
			while (tk.exceptRun("]")) {
				tk.next();

				if (tk.accept("]")) {
					tk.acceptRun("]");

					if (tk.accept(">")) {
						return tk.return(tokenHTML, parseText);
					}
				}
			}
		}
	} else if (tk.accept("?")) {
		while (tk.exceptRun("?")) {
			tk.next();

			if (tk.accept(">")) {
				return tk.return(tokenHTML, parseText);
			}
		}
	} else if (isTag(tk, true)) {
		return tk.return(tokenHTML, parseText);
	}

	tk.reset();

	return parseAutoLink(tk);
      },
      parseAutoLink = tk => {
	tk.next();

	if (tk.accept(letter) && tk.accept(scheme)) {
		tk.acceptRun(scheme);

		if (tk.accept(":") && tk.exceptRun(control + " <>") === ">") {
			tk.next();

			return tk.return(tokenAutoLink, parseText);
		}
	}

	tk.reset();

	return parseEmailAutolink(tk);
      },
      parseEmailAutolink = tk => {
	tk.next();

	if (tk.accept(emailStart)) {
		tk.acceptRun(emailStart);

		if (tk.accept("@")) {
			let good = true;

			do {
				if (!tk.accept(number + letter)) {
					good = false;

					break;
				}

				tk.acceptRun(emailLabelStr);
				tk.backup();

				if (!tk.accept(number + letter)) {
					good = false;
				}
			} while (tk.accept("."));

			if (good && tk.accept(">")) {
				return tk.return(tokenAutoEmail, parseText);
			}
		}
	}

	tk.reset();
	tk.next();

	return parseText(tk);
      },
      parseLinkDestination = tk => {
	if (tk.accept("<")) {
		tk.get();

		while (true) {
			switch (tk.exceptRun("\n\\<>")) {
			case '>':
				const dest = tk.get();

				tk.next();

				tk.get();

				return dest || [];
			default:
				return "";
			case '\\':
				tk.next();
				tk.next();
			}
		}
	}

	tk.get();

	let paren = 0;

	while (true) {
		switch (tk.exceptRun(control + " \\()")) {
		default:
			return tk.get();
		case '\\':
			tk.next();
			tk.next();

			break;
		case '(':
			tk.next();

			paren++;

			break;
		case ')':
			if (!paren) {
				return tk.get();
			}

			tk.next();

			paren--;
		}
	}
      },
      parseLinkTitle = tk => {
	const next = tk.peek();

	switch (next) {
	case ')':
		break;
	case '"':
	case '\'':
	case '(':
		let paren = 0;

		tk.next();
		tk.get();

		while (true) {
			switch (tk.exceptRun(next === "(" ? "\n()\\" : "\n\\" + next)) {
			default:
				return "";
			case nl:
				tk.next();
				tk.acceptRun(whiteSpace);

				if (tk.accept(nl)) {
					return "";
				}

				break;
			case '\\':
				tk.next();
				tk.next();

				break;
			case '(':
				tk.next();

				paren++;

				break;
			case '"':
			case '\'':
				const titleText = tk.get();

				tk.next();

				return titleText;
			case ')':
				if (!paren) {
					const titleText = tk.get();

					tk.next();

					return titleText;
				}

				tk.next();

				paren--;
			}
		}
	}

	return "";
      },
      makeLink = (uid, stack, start, end, refLink) => {
	stack[start] = {
		"type": tokenHTMLMD,
		"data": openTag(uid, "a", false, refLink)
	};

	stack[end] = {
		"type": tokenHTMLMD,
		"data": closeTag("a")
	};

	processEmphasis(uid, stack, start, end)
      },
      makeImage = (uid, stack, start, end, refLink) => {
	let alt = "";

	for (let i = start + 1; i < end; i++) {
		const tk = stack[i];

		if ("alt" in tk) {
			alt += tk.alt;
		} else {
			switch (tk.type) {
			default:
				alt += tk.data;
			case tokenHTML:
			case tokenHTMLMD:
			case tokenEmphasis:
			}
		}

		tk.type = tokenText;
		tk.data = "";
	}

	stack[start] = {
		"type": tokenHTMLMD,
		"data": openTag(uid, "img", true, {"src": refLink.href, "title": refLink.title, alt}),
		alt
	};

	stack[end].type = tokenText;
	stack[end].data = "";
      },
      processLinkAndImage = (uid, stack, start, end) => {
	let pos = end + 1,
	    c = 0,
	    dest = "",
	    titleText = "";

	const tk = new Tokeniser({"next": () => {
		if (c >= stack[pos]?.data.length) {
			pos++;
			c = 0;
		}

		switch (stack[pos]?.type) {
		case tokenCode:
		case tokenAutoLink:
		case tokenAutoEmail:
			return {"value": "", "done": false};
		}

		return {"value": stack[pos]?.data[c++] ?? "", "done": false};
	      }});

	if (!tk.accept("(")) {
		if (tk.peek() === "[") {
			if (!parseLinkLabel(tk)) {
				return false;
			}

			const refLink = links.get(processLinkRef(tk.get().slice(1, -1)));

			if (refLink) {
				(stack[start].type === tokenLinkOpen ? makeLink : makeImage)(uid, stack, start, end, refLink);

				stack.splice(end + 1, pos - end);
			}

			return true;
		}

		return false;
	}

	tk.acceptRun(whiteSpaceNL);

	dest = parseLinkDestination(tk) + "";

	if (!tk.accept(whiteSpace) && tk.peek() !== nl && tk.peek() !== ")") {
		return false;
	}

	tk.acceptRun(whiteSpaceNL);

	if (tk.peek() !== ")") {
		titleText = parseLinkTitle(tk);

		tk.acceptRun(whiteSpaceNL);
	}

	if (!tk.accept(")")) {
		return false;
	}

	const ref = {"href": processEscapedPunctuation(dest), "title": processEscapedPunctuation(titleText)};

	if (stack[start].type === tokenLinkOpen) {
		makeLink(uid, stack, start, end, ref);

		for (let i = start + 1; i < end; i++) {
			switch (stack[i].type) {
			case tokenEmphasis:
			case tokenParenOpen:
			case tokenParenClose:
			case tokenLinkClose:
			case tokenLinkOpen:
				stack[i].type = tokenText;
			}
		}
	} else {
		makeImage(uid, stack, start, end, ref);
	}

	stack.splice(end + 1, pos - end);

	return true;
      },
      processLinksAndImages = (uid, stack) => {
	for (let i = 1; i < stack.length; i++) {
		const closeTK = stack[i];

		if (closeTK.type === tokenLinkClose) {
			let hasNest = false,
			    linkDone = false;

			for (let j = i - 1; j >= 0; j--) {
				const openTK = stack[j];

				hasNest ||= openTK.type === tokenHTMLMD && openTK.data.at(1) === 'a';

				if (linkDone) {
					if (openTK.type === tokenLinkOpen) {
						openTK.type = tokenDeactivatedLink;
					}
				} else if (openTK.type === tokenDeactivatedLink) {
					openTK.type = tokenText;

					break;
				} else if (openTK.type === tokenImageOpen || !hasNest && openTK.type === tokenLinkOpen) {
					if (!processLinkAndImage(uid, stack, j, i)) {
						let ref = "";

						for (let k = j + 1; k < i; k++) {
							ref += stack[k].data;
						}

						const refLink = links.get(processLinkRef(ref));


						if (refLink) {
							(openTK.type === tokenLinkOpen ? makeLink : makeImage)(uid, stack, j, i, refLink);

							if (stack[i+1]?.type === tokenLinkOpen && stack[i+2]?.type === tokenLinkClose) {
								stack.splice(i+1, 2);
							}

							break;
						}

						closeTK.type = tokenText;
						openTK.type = tokenText;
					} else if (openTK.type === tokenLinkOpen) {
						linkDone = true;

						continue;
					}

					break;
				}
			}

			closeTK.type = tokenText;
		}
	}
      },
      isWhitespace = /\s/,
      isPunctuation = /\p{P}/u,
      isLeftFlanking = (stack, pos) => {
	const openTk = stack[pos],
	      allowEscapedWhitespace = openTk.type === tokenEmphasis && openTk.data.at(0) === "~" || openTk.type === tokenCaret;

	if (openTk.type === tokenEmphasis || allowEscapedWhitespace) {
		const lastChar = stack[pos - 1]?.data.at(-1) ?? " ",
		      nextChar = stack[pos + 1]?.data.at(0) ?? " ",
		      nextNextChar = stack[pos + 1]?.data.at(1) ?? " ";

		return !isWhitespace.test(nextChar) && ((!isPunctuation.test(nextChar) || allowEscapedWhitespace && nextChar === "\\" && isWhitespace.test(nextNextChar)) || isWhitespace.test(lastChar) || isPunctuation.test(lastChar));
	}

	return false;
      },
      isRightFlanking = (stack, pos) => {
	const closeTk = stack[pos],
	      allowEscapedWhitespace = closeTk.type === tokenEmphasis && closeTk.data.at(0) === "~" || closeTk.type === tokenCaret;

	if (closeTk.type === tokenEmphasis || allowEscapedWhitespace) {
		const lastChar = stack[pos - 1]?.data.at(-1) ?? " ",
		      lastLastChar = stack[pos - 1]?.data.at(-2) ?? " ",
		      nextChar = stack[pos + 1]?.data.at(0) ?? " ";

		return (!isWhitespace.test(lastChar) || allowEscapedWhitespace && lastLastChar === "\\") && (!isPunctuation.test(lastChar) || isWhitespace.test(nextChar) || isPunctuation.test(nextChar));
	}

	return false;
      },
      isEmphasisOpening = (stack, pos) => isLeftFlanking(stack, pos) && (stack[pos].data.at(0) !== "_" || !isRightFlanking(stack, pos) || isPunctuation.test(stack[pos - 1]?.data.at(-1) ?? "_")),
      isEmphasisClosing = (stack, pos) => isRightFlanking(stack, pos) && (stack[pos].data.at(0) !== "_" || !isLeftFlanking(stack, pos) || isPunctuation.test(stack[pos + 1]?.data.at(0) ?? "_")),
      emphasisTags = {
	"*": ["em", "strong"],
	"_": ["em", "strong"],
	"~": ["sub", "s"],
	"^": ["sup"],
	"=": ["", "mark"],
	"+": ["", "ins"]
      },
      processEmphasis = (uid, stack, start = 0, end = stack.length) => {
	const levels = {
		"*": [start, start, start],
		"_": [start, start, start],
		"~": [start, start, start],
		"^": [start, start, start],
		"=": [start, start, start],
		"+": [start, start, start]
	      };

	Loop:
	for (let i = start + 1; i < end; i++) {
		if (isEmphasisClosing(stack, i)) {
			const close = stack[i],
			      closeLength = close.data.length,
			      level = (closeLength - 1) % 3,
			      isCloseOpen = isEmphasisOpening(stack, i),
			      char = close.data.at(0),
			      charLevel = levels[char];

			for (let j = i - 1; j >= charLevel[level]; j--) {
				const open = stack[j],
				      openLength = open.data.length,
				      isDouble = closeLength > 1 && openLength > 1,
				      escapedSpaces = !isDouble && (char === "~" || char === "^"),
				      tag = emphasisTags[char][+isDouble];

				if ((char === "=" || char === "+") && !isDouble || !tag) {
					continue;
				}

				if (escapedSpaces) {
					let lastEscape = false;

					for (let k = j + 1; k < i; k++) {
						for (const c of stack[k].data) {
							switch (c) {
							case '\\':
								lastEscape = !lastEscape;

								break;
							case ' ':
							case '\t':
							case nl:
								if (!lastEscape) {
									stack[j].type = stack[i].type = tokenText;

									continue Loop;
								}
							default:
								lastEscape = false;
							}
						}
					}
				}

				if (isEmphasisOpening(stack, j) && char === open.data.at(0) && (!isCloseOpen && !isEmphasisClosing(stack, j) || char === "=" || char === "~" || char === "+" || (closeLength + openLength) % 3 !== 0 || closeLength % 3 === 0 || openLength % 3 === 0)) {
					const chars = isDouble ? 2 : 1,
					      closingTag = {"type": tokenHTMLMD, "data": closeTag(tag)},
					      openingTag = {"type": tokenHTMLMD, "data": openTag(uid, tag)};

					for (let k = j + 1; k < i; k++) {
						switch (stack[k].type) {
						case tokenEmphasis:
						case tokenCaret:
							stack[k].type = tokenText;
						}

						if (escapedSpaces) {
							stack[k].data = stack[k].data.replaceAll(/\\([ \n\t])/g, "$1");
						}
					}

					stack[i].data = stack[i].data.slice(chars);
					stack[j].data = stack[j].data.slice(chars);

					if (stack[i].data) {
						stack.splice(i, 0, closingTag);
						end++;
					} else {
						stack[i] = closingTag;
					}

					if (stack[j].data) {
						stack.splice(j+1, 0, openingTag);
						i++;
						end++;
					} else {
						stack[j] = openingTag;
					}

					continue Loop;
				}
			}

			charLevel[level] = i;

			if (!isCloseOpen) {
				stack[i].type = tokenText;
			}

		}
	}

	for (let i = start + 1; i < end; i++) {
		switch (stack[i].type) {
		case tokenEmphasis:
		case tokenCaret:
			stack[i].type = tokenText;
		}
	}
      },
      processEscapedPunctuation = text => setHTML(encoder, punctuation.split("").reduce((text, char) => text.replaceAll("\\"+char, char), text)).innerText,
      parseInline = (uid, text) => {
	const stack = Parser(text, parseText, p => p.return(p.exceptRun(TokenDone))).next().value.data.filter(t => t.data);

	processLinksAndImages(uid, stack);
	processEmphasis(uid, stack);

	let res = "";

	for (const tk of stack) {
		switch (tk.type) {
		case tokenCode:
			res += tag(uid, "code", setText(encoder, tk.data.replace(/^`+/, "").replace(/`+$/, "").replaceAll(nl, " ").replace(/^ (.+) $/, "$1")).innerHTML);

			break;
		case tokenHTML:
		case tokenHTMLMD:
			res += tk.data;

			break;
		case tokenAutoLink:
			const href = tk.data.slice(1, -1);

			res += tag(uid, "a", href, {href});

			break;
		case tokenAutoEmail:
			const email = tk.data.slice(1, -1);

			res += tag(uid, "a", email, {"href": "mailto:" + email});

			break;
		default:
			res += processEscapedPunctuation(tk.data).replaceAll(/\n +/g, nl).split(/ + \n|\\\n/g).map(t => setText(encoder, t.replaceAll(/ +\n/g, nl)).innerHTML).join(tag(uid, "br"));
		}
	}

	return res;
      },
      tagNameToTag = {
	"P": "paragraphs",
	"BLOCKQUOTE": "blockquote",
	"UL": "unorderedList",
	"LI": "listItem",
	"CODE": "inlineCode",
	"EM": "italic",
	"STRONG": "bold",
	"U": "underline",
	"SUB": "subscript",
	"SUP": "superscript",
	"S": "strikethrough",
	"INS": "insert",
	"MARK": "highlight",
	"TABLE": "table",
	"THEAD": "thead",
	"TBODY": "tbody",
	"TR": "tr"
      },
      createMarkdownElement = (tags, uid, node) => {
	switch (node.nodeName) {
	case "HR":
		return tags.thematicBreaks();
	case "PRE":
		return tags.code(node.getAttribute("type") ?? "", node.textContent ?? "");
	case "OL":
		return tags.orderedList(node.getAttribute("start") ?? "", sanitise(node.childNodes, tags, uid));
	case "P":
	case "BLOCKQUOTE":
	case "UL":
	case "LI":
	case "CODE":
	case "EM":
	case "STRONG":
	case "U":
	case "SUB":
	case "SUP":
	case "S":
	case "INS":
	case "MARK":
	case "TABLE":
	case "THEAD":
	case "TBODY":
	case "TR":
		return tags[tagNameToTag[node.nodeName]](sanitise(node.childNodes, tags, uid));
	case "INPUT":
		return tags.checkbox(node.hasAttribute("checked"));
	case "BR":
		return tags.break();
	case "A":
		return tags.link(node.getAttribute("href") ?? "", node.getAttribute("title") ?? "", sanitise(node.childNodes, tags, uid));
	case "IMG":
		return tags.image(node.getAttribute("src") ?? "", node.getAttribute("title") ?? "", node.getAttribute("alt") ?? "");
	case "TH":
		return tags.th(node.getAttribute("align") ?? "", sanitise(node.childNodes, tags, uid));
	case "TD":
		return tags.td(node.getAttribute("align") ?? "", sanitise(node.childNodes, tags, uid));
	}

	return tags[`heading${node.nodeName.charAt(1)}`](sanitise(node.childNodes, tags, uid));
      },
      sanitise = (childNodes, tags, uid) => {
	const df = document.createDocumentFragment();

	Loop:
	for (const node of Array.from(childNodes)) {
		if (node instanceof Element) {
			if (node.hasAttribute(uid)) {
				df.append(createMarkdownElement(tags, uid, node));
			} else if (tags.allowedHTML) {
				for (const [name, ...attrs] of tags.allowedHTML) {
					if (node.nodeName === name) {
						const tag = makeNode(node.nodeName, {}, sanitise(node.childNodes, tags, uid));

						for (const attr of attrs) {
							const a = node.getAttributeNode(attr);

							if (a) {
								tag.setAttributeNode(a);
							}
						}

						df.append(tag);

						continue Loop;
					}
				}

				df.append(sanitise(node.childNodes, tags, uid));
			} else {
				node.replaceChildren(sanitise(node.childNodes, tags, uid));

				df.append(node);
			}
		} else {
			df.append(node);
		}
	}

	return df;
      },
      openTag = (uid, name, close = false, attrs = {}) => {
	const t = makeNode(name, attrs);

	t.toggleAttribute(uid);

	return close ? t.outerHTML : t.outerHTML.replace(closeTag(name), "");
      },
      closeTag = name => `</${name}>`,
      tag = (uid, name, contents, attrs = {}) => {
	const close = contents === undefined;

	return openTag(uid, name, close, attrs) + (close ? "" : contents + closeTag(name));
      },
      isOpenParagraph = b => b instanceof ParagraphBlock && b.open,
      isLastGrandChildOpenParagraph = b => b instanceof ContainerBlock ? isLastGrandChildOpenParagraph(b.children.at(-1)) : b instanceof ParagraphBlock ? b.open : false,
      isLazyBlock = (tk, inList = false) => {
	tk.reset();

	const ftk = subTokeniser(tk);

	for (const block of parseBlock) {
		acceptThreeSpaces(ftk);

		if (block(ftk, !inList || block !== parseListBlockStart)) {
			tk.reset();

			return false;
		}

		ftk.reset();
	}

	tk.reset();

	return true;
      },
      readEOL = tk => {
	tk.exceptRun(nl);
	tk.next();

	return tk.get();
      },
      links = new Map(),
      alignment = ["", "left", "right", "center"].map(align => (align ? {align}: {})),
      subTokeniser = tk => tk instanceof TabStopTokeniser ? tk.sub() : new Tokeniser({"next": () => ({"value": tk.next(), "done": false})}),
      fixEscapedPipesInCodeBlocks = c => {
	const tk = new Tokeniser(c);

	let ret = "";

	while (true) {
		switch (tk.exceptRun("\\")) {
		default:
			return ret + tk.get();
		case '\\':
			tk.next();

			if (tk.peek() === "|") {
				tk.backup();

				ret += tk.get();

				tk.next();

				tk.get();
			}

			tk.next();
		}
	}
      };

class TabStopTokeniser extends Tokeniser {
	#tabs;
	#pos = 0;

	constructor(text, tabs, pos) {
		if (typeof text === "string") {
			let t = "",
			    linePos = 0,
			    curr = 0,
			    last = 0;

			tabs = [];

			for (const c of text) {
				if (c === nl) {
					linePos = 0;
				} else if (c === "\t") {
					const ts = 4 - (linePos % 4);

					tabs.push([t.length + curr - last, ts]);

					linePos += ts;

					t += text.slice(last, curr) + " ".repeat(ts);

					last = curr + 1;
				} else {
					linePos++;
				}

				curr++;
			}

			text = t + text.slice(last);
			tabs.reverse();
		}

		super(text);


		this.#tabs = tabs ?? [];
		this.#pos = pos ?? 0;
	}

	get() {
		let t = super.get();

		const l = t.length;

		for (const [start, ts] of this.#tabs) {
			if (start < this.#pos) {
				break;
			}
			if (start - this.#pos < l) {
				const s = start - this.#pos;

				t = t.slice(0, s) + "\t" + t.slice(s + ts);
			}
		}

		this.#pos += l;

		return t;
	}

	sub() {
		return new TabStopTokeniser({"next": () => ({"value": this.next(), "done": false})}, this.#tabs, this.#pos + this.length());
	}
}

class Block {
	open = true;
}

class ContainerBlock extends Block {
	children = [];

	process(tk, lazy = false) {
		const lastChild = this.children.at(-1),
		      inParagraph = isOpenParagraph(lastChild);

		if (lastChild?.open) {
			acceptThreeSpaces(tk);

			if (lastChild.accept(tk, lazy)) {
				return true;
			}

			tk.reset();
		}

		for (const block of parseBlock) {
			acceptThreeSpaces(tk);

			const b = block(tk, inParagraph);

			if (b) {
				if (lastChild?.open && b instanceof TableBlock) {
					b.setLast(lastChild);
				}

				this.children.push(b);

				return true;
			}

			tk.reset();
		}

		if (inParagraph) {
			acceptThreeSpaces(tk);
			lastChild.add(tk);
		} else {
			readEOL(tk);

			return false;
		}

		return true;
	}

	setTableEOF() {
		const lastChild = this.children.at(-1);

		if (lastChild instanceof TableBlock) {
			lastChild.setEOF();
		}
	}

	toHTML(uid) {
		this.setTableEOF();

		return this.children.reduce((t, c) => t + c.toHTML(uid), "");
	}
}

class Document extends ContainerBlock {
	#uid;

	constructor(text) {
		super();

		do {
			this.#uid = "";

			while (this.#uid.length < 20) {
				this.#uid += String.fromCharCode(65 + Math.random() * 26);
			}

		} while (text.includes(this.#uid));

		const tk = new TabStopTokeniser(text);

		while(tk.peek()) {
			this.process(tk);
		}
	}

	accept() {
		return false;
	}

	render(tags) {
		const ret = sanitise(text2DOM(this.toHTML(this.#uid)).childNodes, tags, this.#uid);

		encoder.replaceChildren();
		links.clear();

		return ret;
	}
}

class BlockQuote extends ContainerBlock {
	constructor(tk) {
		super();

		tk.accept(" ");
		tk.get();

		this.process(tk);
	}

	accept(tk, lazy) {
		if (tk.accept(">")) {
			tk.accept(" ");
			tk.get();
		} else if (!lazy) {
			if (!tk.acceptRun(whiteSpace) || tk.accept(nl)) {
				this.open = false;

				return true;
			}

			if (!isLazyBlock(tk)) {
				this.open = false;

				return false;
			}

			lazy = true;
		}

		if (lazy && !isLastGrandChildOpenParagraph(this)) {
			return false;
		}

		tk.reset();

		this.process(tk, lazy);

		if (lazy) {
			this.open = this.children.at(-1)?.open ?? false;
		}

		return true;
	}

	toHTML(uid) {
		return tag(uid, "blockquote", super.toHTML(uid));
	}
}

class ListItemBlock extends ContainerBlock {
	loose = false;
	hasEmpty = false;
	#lastEmpty = false;

	constructor(tk) {
		super();

		this.process(tk);
	}

	accept(tk, empty) {
		if (!this.children.length && empty) {
			tk.acceptRun(whiteSpace);
			tk.accept(nl);
			tk.get();

			this.hasEmpty = true;
			this.open = false;

			return true;
		}

		this.loose = this.hasEmpty;

		const prev = this.children.at(-1),
		      ret = this.process(tk),
		      now = this.children.at(-1);

		if (this.#lastEmpty && prev !== now) {
			this.loose = true;
		} else if (empty && now?.open === false) {
			this.hasEmpty = true;
		}

		this.#lastEmpty = empty;

		return ret || !!this.children.length;
	}

	#handleTaskList(uid) {
		const firstChild = this.children.at(0);

		if (firstChild instanceof ParagraphBlock) {
			const t = (firstChild.lines.at(0) ?? "").replace(/^ *(\[[xX ]\] *)?.*/, "$1").replace(nl, "");

			if (t) {
				firstChild.lines[0] = firstChild.lines[0].replace(/^ *\[[xX ]\]/, "");

				return tag(uid, "input", undefined, t.at(1) === " " ? {} : {"checked": ""}) + t.slice(3) + super.toHTML(uid);
			}
		}

		return super.toHTML(uid);
	}

	toHTML(uid) {
		if (!this.loose) {
			for (const c of this.children) {
				if (c instanceof ParagraphBlock) {
					c.loose = false;
				}
			}
		}

		return tag(uid, "li", taskListItems && !this.loose ? this.#handleTaskList(uid) : super.toHTML(uid));
	}
}

class ListBlock extends ContainerBlock {
	#marker;
	#spaces;
	#lastSpaces;
	#loose = false;
	#lastEmpty = false;

	constructor(tk) {
		super();

		tk.acceptString("    ");

		if (tk.peek() === " ") {
			tk.backup();
			tk.backup();
			tk.backup();
		}

		const spaces = tk.get(),
		      marker = spaces.trimEnd();

		this.#spaces = marker.length;

		tk.acceptRun(whiteSpace);

		if (tk.accept(nl)) {
			this.#spaces++;
		} else {
			this.#spaces += spaces.length - marker.length;
		}

		this.#lastSpaces = this.#spaces;

		tk.reset();

		this.#marker = marker.trimStart();

		this.children.push(new ListItemBlock(tk));
	}

	#newItem(tk) {
		if (tk.length() > 3) {
			return false;
		}

		switch (this.#marker) {
		case "-":
		case "+":
		case "*":
			if (tk.accept(this.#marker) && (tk.accept(whiteSpace) || tk.peek() === nl) || tk.peek() === "") {
				break;
			}

			return false;
		default:
			if (tk.accept(number)) {
				tk.acceptRun(number);

				if (tk.accept(this.#marker.at(-1)) && (tk.accept(whiteSpace) || tk.peek() === nl) || tk.peek() === "") {
					break;
				}
			}

			return false;
		}

		if (tk.peek() !== nl && tk.peek() !== "") {
			for (let i = tk.length(); i < this.#spaces; i++) {
				if (!tk.accept(" ")) {
					return false;
				}
			}
		}

		let lastSpaces = tk.get().length;

		if (tk.peek() === nl) {
			lastSpaces++;
		}

		if (lastSpaces >= this.#spaces) {
			this.#lastSpaces = lastSpaces;
		}


		return true;
	}

	accept(tk, lazy) {
		tk.acceptRun(whiteSpace);

		const empty = tk.accept(nl) || tk.peek() === "";

		if (this.#hasSpaces(tk) && this.children.at(-1)?.open || empty) {
			this.#lastEmpty = empty;

			return this.children.at(-1).accept(tk, empty);
		} else if (this.#newItem(tk)) {
			this.#loose ||= this.children.at(-1).hasEmpty || this.#lastEmpty;

			this.#lastEmpty = false;

			this.children.push(new ListItemBlock(tk));

			return true;
		} if (this.#lazyContinuation(tk, lazy)) {
			this.#lastEmpty = empty;

			return true;
		}

		this.open = false;

		return false;
	}

	#hasSpaces(tk) {
		tk.reset();

		if (tk.peek() === " ") {
			for (let i = 0; i < this.#lastSpaces; i++) {
				if (!tk.accept(" ")) {
					return false;
				}
			}

			tk.get();

			return true;
		}

		return false;
	}

	#lazyContinuation(tk, lazy) {
		if (!lazy) {
			if (!isLazyBlock(tk, true)) {
				return false;
			}

			lazy = true;
		}

		if (lazy && isLastGrandChildOpenParagraph(this)) {
			if (this.children.at(-1).accept(tk, lazy)) {
				return true;
			}
		}

		return false;
	}

	toHTML(uid) {
		if (!this.#loose) {
			for (const c of this.children) {
				if (c.loose) {
					this.#loose = true;

					break;
				}
			}
		}

		if (this.#loose) {
			for (const c of this.children) {
				c.loose = true;
			}
		}

		const attr = {};

		let type = "ul";

		switch (this.#marker) {
		default:
			const start = this.#marker.slice(0, -1).replace(/^0+(?!$)/, "");

			type = "ol";

			if (start !== "1") {
				attr["start"] = start;
			}
		case "-":
		case "+":
		case "*":
		}

		return tag(uid, type, super.toHTML(uid), attr);
	}
}

class LeafBlock extends Block {
	lines = [];

	accept() {
		return false;
	}
}

class HTMLBlock extends LeafBlock {
	#htmlKind;

	constructor(tk, htmlKind) {
		super();

		this.#htmlKind = htmlKind;

		tk.reset();
		this.accept(tk);
	}

	accept(tk) {
		S:
		switch (this.#htmlKind) {
		case 1:
			while (true) {
				switch (tk.exceptRun("<\n")) {
				default:
					break S;
				case "<":
					tk.next();

					if (tk.accept("/") && tk.acceptWord(type1Elements) && tk.accept(">")) {
						this.open = false;

						break S;
					}
				}
			}
		case 2:
			while (true) {
				switch (tk.exceptRun("-\n")) {
				default:
					break S;
				case "-":
					tk.next();

					if (tk.accept("-") && tk.acceptRun("-") === ">") {
						this.open = false;

						break S;
					}
				}
			}
		case 3:
			while (true) {
				switch (tk.exceptRun("?\n")) {
				default:
					break S;
				case "?":
					tk.next();

					if (tk.accept(">")) {
						this.open = false;

						break S;
					}
				}
			}
		case 4:
			this.open = tk.exceptRun(">\n") !== ">";

			break;
		case 5:
			while (true) {
				switch (tk.exceptRun("]\n")) {
				default:
					break S;
				case "]":
					tk.next();

					if (tk.accept("]") && tk.accept(">")) {
						this.open = false;

						break S;
					}
				}
			}
		case 6:
		case 7:
			this.open = tk.acceptRun(whiteSpace) !== nl;

			break;
		}

		this.lines.push(readEOL(tk));

		return true;
	}

	toHTML() {
		return this.lines.join("");
	}
}

class LinkLabelBlock extends Block {
	constructor() {
		super();

		this.open = false;
	}

	accept() {
		return false;
	}

	toHTML() {
		return "";
	}
}

class ParagraphBlock extends LeafBlock {
	#settextLevel = 0;
	loose = true;

	constructor(tk) {
		super();

		this.add(tk);
	}

	add(tk) {
		this.lines.push(readEOL(tk).trimStart());
	}

	accept(tk, lazy = false) {
		if (!lazy && this.lines.length && (tk.peek() === "-" || tk.peek() === "=")) {
			const stChar = tk.next();

			tk.acceptRun(stChar);

			if (!tk.acceptRun(whiteSpace) || tk.accept(nl)) {
				this.#settextLevel = 1 + +(stChar === '-');
				this.open = false;

				tk.get();

				return true;
			}
		} else if (tk.acceptRun(whiteSpace) === nl) {
			tk.next();
			tk.get();

			this.open = false;

			return true;
		}

		return false;
	}

	toHTML(uid) {
		const text = parseInline(uid, this.lines.join("").trim());

		return text ? this.loose || this.#settextLevel ? tag(uid, this.#settextLevel === 0 ? "p" : `h${this.#settextLevel}`, text) : text : "";
	}
}

class ATXHeadingBlock extends LeafBlock {
	#level;
	#text;

	constructor(tk, level) {
		super();

		this.#level = level;
		this.open = false;

		tk.get();

		this.#text = readEOL(tk).trim().replace(/ +#*$/, "");
	}

	toHTML(uid) {
		return tag(uid, `h${this.#level}`, parseInline(uid, this.#text));
	}
}

class FencedCodeBlock extends LeafBlock {
	#ticks;
	#char;
	#spaces;
	#info;

	constructor(tk, fcbChar) {
		super();

		const line = tk.get(),
		      noSpace = line.trimStart(),
		      info = noSpace.replace(new RegExp("^"+fcbChar+"+"), "");

		this.#spaces = line.length - noSpace.length;
		this.#ticks = noSpace.length - info.length;
		this.#info = info.trim();
		this.#char = fcbChar;
	}

	accept(tk) {
		let ticks = 0;

		while (tk.accept(this.#char)) {
			ticks++;
		}

		if (ticks >= this.#ticks) {
			const last = tk.acceptRun(whiteSpace);

			if (!last || last === nl) {
				tk.next();
				tk.get();

				this.open = false;

				return true;
			}
		}

		tk.reset();

		for (let i = 0; i < this.#spaces; i++) {
			tk.accept(" ");
		}

		tk.get();

		const line = readEOL(tk);

		if (line !== nl || this.lines.length) {
			this.lines.push(line);
		}

		return true;
	}

	toHTML(uid) {
		return tag(uid, "pre", setText(encoder, this.lines.join("")).innerHTML, {"type": this.#info});
	}
}

class TableBlock extends ContainerBlock {
	#firstLine;
	#title = [];
	#alignment;
	#body;
	#lastSet = false;

	constructor(tk) {
		super();

		tk.exceptRun(nl);
		tk.next();

		const ftk = new Tokeniser(this.#firstLine = tk.get());

		ftk.acceptRun(whiteSpace);
		ftk.accept("|");
		ftk.get();

		Loop:
		while (true) {
			switch (ftk.exceptRun("|\\\n")) {
			default:
				const title = ftk.get().trim();

				if (title) {
					this.#title.push(title);
				}

				break Loop;
			case '\\':
				ftk.next();
				ftk.next();

				break;
			case '|':
				this.#title.push(ftk.get().trim());

				ftk.next();
				ftk.get();
			}
		}
	}

	setLast(b) {
		this.children.push(b instanceof TableBlock ? b.children.at(-1) ?? b : b);

		this.#lastSet = true;
	}

	#notATable(tk) {
		parseBlock[3] = notTable;

		this.process(new Tokeniser(this.#firstLine));

		parseBlock[3] = parseTable;

		this.#alignment = [];

		if (tk) {
			tk.reset();

			const ret = this.process(tk);

			this.open = this.children.at(-1)?.open ?? false;

			return ret;
		}

		return false;
	}

	accept(tk) {
		if (!this.#alignment) {
			if (tk.accept(" ")) {
				return this.#notATable(tk);
			}

			tk.accept("|");

			this.#alignment = [];

			while (true) {
				tk.acceptRun(whiteSpace);

				const alignment = +tk.accept(":");

				if (!tk.accept("-")) {
					if (alignment) {
						return this.#notATable(tk);
					}

					break;
				}

				tk.acceptRun("-");

				this.#alignment.push(alignment + 2 * +tk.accept(":"));

				tk.acceptRun(whiteSpace);

				if (!tk.accept("|")) {
					break;
				}
			}

			tk.acceptRun(whiteSpace);

			if (this.#alignment.length < this.#title.length || !tk.accept(nl) && tk.peek()) {
				return this.#notATable(tk);
			}

			tk.get();

			return true;
		} else if (!this.#alignment.length) {
			return this.process(tk);
		}

		const hasRow = tk.accept("|"),
		      row = [],
		      ftk = subTokeniser(tk);

		if (!hasRow) {
			if (ftk.accept(whiteSpace)) {
				return this.open = false;
			}

			parseBlock[3] = notTable;

			if (!isLazyBlock(ftk)) {
				parseBlock[3] = parseTable;

				return this.open = false;
			}

			parseBlock[3] = parseTable;

			ftk.reset();
		}

		ftk.acceptRun(whiteSpace);

		if (ftk.accept(nl)) {
			tk.get();

			this.open = !hasRow;
			return true
		}

		ftk.reset();

		RowLoop:
		for (let i = 0; i < this.#alignment.length; i++) {
			ftk.acceptRun(whiteSpace);

			ColLoop:
			while (true) {
				switch (ftk.exceptRun("|\\\n")) {
				case '|':
					break ColLoop;
				default:
					const cell = ftk.get().trim();

					if (cell) {
						row.push(cell);
					}

					break RowLoop;
				case '\\':
					ftk.next();
					ftk.next();

				}
			}

			row.push(ftk.get().trim());
			ftk.next();
			ftk.get();
		}

		if (!hasRow && row.length === 0) {
			return this.open = false;
		}

		for (let i = row.length; i < this.#alignment.length; i++) {
			row.push("");
		}

		if (this.#body) {
			this.#body.push(row);
		} else {
			this.#body = [row];
		}

		tk.backup();

		tk.exceptRun(nl);
		tk.next();
		tk.get();

		return true;
	}

	setEOF() {
		if (!this.#alignment) {
			this.#notATable();
		}

		super.setTableEOF();
	}

	toHTML(uid) {
		if (!this.#alignment?.length) {
			return this.#lastSet ? "" : super.toHTML(uid);
		}

		for (const c of this.#body ?? []) {
			for (let i = 0; i < c.length; i++) {
				c[i] = fixEscapedPipesInCodeBlocks(c[i]);
			}
		}

		return tag(uid, "table", tag(uid, "thead", tag(uid, "tr", this.#title.reduce((h, t, n) => h + tag(uid, "th", parseInline(uid, t), alignment[this.#alignment[n]]), ""))) + (this.#body?.length ? tag(uid, "tbody", this.#body.reduce((h, r) => h + tag(uid, "tr", r.reduce((h, c, n) => h + tag(uid, "td", parseInline(uid, c), alignment[this.#alignment[n]]), "")), "")) : ""));
	}
}

class IndentedCodeBlock extends LeafBlock {
	constructor(tk) {
		super();

		this.#getLine(tk);
	}

	accept(tk) {
		if (!tk.accept(whiteSpace)) {
			if (this.#getBlankLine(tk)) {
				return true;
			}

			this.open = false;

			return false;
		}

		this.#getLine(tk);

		return true;
	}

	#getBlankLine(tk) {
		const last = tk.acceptRun(whiteSpace);

		if (!last || last === nl) {
			tk.next();

			tk.get();

			this.lines.push(nl);

			return true;
		}

		return false;
	}

	#getLine(tk) {
		tk.get();

		this.lines.push(readEOL(tk));

		return true;
	}

	toHTML(uid) {
		while (this.lines.at(0) === nl) {
			this.lines.shift();
		}

		while (this.lines.at(-1) === nl) {
			this.lines.pop();
		}

		return tag(uid, "pre", setText(encoder, this.lines.join("")).innerHTML);
	}
}

class ThematicBreakBlock extends LeafBlock {
	constructor(tk) {
		super();

		tk.get();

		this.open = false;
	}

	toHTML(uid) {
		return tag(uid, "hr");
	}
}

/**
 * The default export provides a markdown parser, that takes a markdown string, and an optional object that provides configuration; returns a DocumentFragment containing the result of the parsed code.
 *
 * @param {string} markdown         The markdown text to be parsed.
 * @param {Partial<UserTags>} [tgs] Optional configuration object that can be used to disable markdown extensions, and override how HTML nodes are generated.
 * @return DocumentFragment The parsed nodes.
 */
export default (markdown, tgs = {}) => {
	inlineStarts = "\\`*_![]()<" + (tgs.superscript !== null ? "^" : "") + (tgs.subscript !== null || tgs.strikethrough !== null ? "~" : "") + (tgs.highlight !== null ? "=" : "") + (tgs.insert !== null ? "+" : "");
	parseBlock[3] = tgs.table !== null ? parseTable : notTable;
	emphasisTags["~"][0] = tgs.subscript !== null ? "sub" : "";
	emphasisTags["~"][1] = tgs.strikethrough !== null ? "s" : "";
	emphasisTags["_"][0] = tgs.underline === null ? "em" : "u";
	taskListItems = tgs.checkbox !== null;

	return new Document(markdown).render(Object.assign(Object.assign({}, tags), tgs))
};
