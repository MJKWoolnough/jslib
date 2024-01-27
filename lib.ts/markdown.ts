import type {Token, TokenFn} from './parser.js';
import CaseFold from './casefold.js';
import {TokenDone, Tokeniser} from './parser.js';
import Parser from './parser.js';

type Tags = {
	allowedHTML: null | [keyof HTMLElementTagNameMap, ...string[]][];
	blockquote: (c: DocumentFragment) => Element | DocumentFragment;
	code: (info: string, text: string) => Element | DocumentFragment;
	heading1: (c: DocumentFragment) => Element | DocumentFragment;
	heading2: (c: DocumentFragment) => Element | DocumentFragment;
	heading3: (c: DocumentFragment) => Element | DocumentFragment;
	heading4: (c: DocumentFragment) => Element | DocumentFragment;
	heading5: (c: DocumentFragment) => Element | DocumentFragment;
	heading6: (c: DocumentFragment) => Element | DocumentFragment;
	paragraphs: (c: DocumentFragment) => Element | DocumentFragment;
	unorderedList: (c: DocumentFragment) => Element | DocumentFragment;
	orderedList: (start: string, c: DocumentFragment) => Element | DocumentFragment;
	listItem: (c: DocumentFragment) => Element | DocumentFragment;
	thematicBreaks: () => Element | DocumentFragment;
	link: (href: string, title: string, c: DocumentFragment) => Element | DocumentFragment;
	image: (src: string, title: string, alt: string) => Element | DocumentFragment;
	inlineCode: (c: DocumentFragment) => Element | DocumentFragment;
	italic: (c: DocumentFragment) => Element | DocumentFragment;
	bold: (c: DocumentFragment) => Element | DocumentFragment;
	subscript: (c: DocumentFragment) => Element | DocumentFragment;
	superscript: (c: DocumentFragment) => Element | DocumentFragment;
	strikethrough: (c: DocumentFragment) => Element | DocumentFragment;
	table: (c: DocumentFragment) => Element | DocumentFragment;
	thead: (c: DocumentFragment) => Element | DocumentFragment;
	tbody: (c: DocumentFragment) => Element | DocumentFragment;
	tr: (c: DocumentFragment) => Element | DocumentFragment;
	th: (alignment: string, c: DocumentFragment) => Element | DocumentFragment;
	td: (alignment: string, c: DocumentFragment) => Element | DocumentFragment;
	break: () => Element | DocumentFragment;
}

const makeNode = <NodeName extends keyof HTMLElementTagNameMap>(nodeName: NodeName, params: Record<string, string> = {}, children: string | DocumentFragment = "") => {
	const node = document.createElement(nodeName) as HTMLElementTagNameMap[NodeName];

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
      setHTML = <N extends Element>(node: N, html: string) => {
	node.innerHTML = html;

	return node;
      },
      setText = <N extends Element>(node: N, text: string) => {
	node.textContent = text;

	return node;
      },
      tags: Tags = ([
	["blockquote", "blockquote"],
	["paragraphs", "p"],
	["unorderedList", "ul"],
	["listItem", "li"],
	["inlineCode", "code"],
	["italic", "em"],
	["bold", "strong"],
	["subscript", "sub"],
	["superscript", "sup"],
	["strikethrough", "s"],
	["table", "table"],
	["thead", "thead"],
	["tbody", "tbody"],
	["tr", "tr"],
	...Array.from({"length": 6}, (_, n) => [`heading${n+1}`, `h${n+1}`] as [`heading${1 | 2 | 3 | 4 | 5 | 6}`, `h${1 | 2 | 3 | 4 | 5 | 6}`])
      ] as const).reduce((o, [key, tag]) => (o[key] = (c: DocumentFragment) => makeNode(tag, {}, c), o), {
	"code": (_info: string, text: string) => makeNode("pre", {}, text),
	"orderedList": (start: string, c: DocumentFragment) => makeNode("ol", start ? {start} : {}, c),
	"allowedHTML": null,
	"thematicBreaks": () => makeNode("hr"),
	"link": (href: string, title: string, c: DocumentFragment) => makeNode("a", title ? {href, title} : {href}, c),
	"image": (src: string, title: string, alt: string) => makeNode("img", title ? {src, alt, title} : {src, alt}),
	"th": (alignment: string, c: DocumentFragment) => makeNode("th", alignment ? {"style": "text-align:"+alignment} : {}, c),
	"td": (alignment: string, c: DocumentFragment) => makeNode("td", alignment ? {"style": "text-align:"+alignment} : {}, c),
	"break": () => makeNode("br")
      } as any as Tags),
      whiteSpace = " \t",
      nl = "\n",
      whiteSpaceNL = whiteSpace + nl,
      letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      number = "0123456789",
      scheme = letter + number + "+.-",
      control = Array.from({"length": 31}).reduce((t, _, n) => t + String.fromCharCode(n), String.fromCharCode(127)),
      emailStart = letter + number + "!#$&&'*+-/=?^_`{|}~.",
      emailLabelStr = letter + number + "-",
      htmlElements = ["pre", "script", "style", "textarea", "address", "article", "aside", "base", "basefont", "blockquote", "body", "caption", "center", "col", "colgroup", "dd", "details", "dialog", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "iframe", "legend", "li", "link", "main", "menu", "menuitem", "nav", "noframes", "ol", "optgroup", "option", "p", "param", "section", "source", "summary", "table", "tbody", "td", "tfoot", "th", "thead", "title", "tr", "track", "ul"],
      type1Elements = htmlElements.slice(0, 4),
      notTable = () => null,
      parseTable = (tk: Tokeniser) => {
	while (true) {
		switch (tk.exceptRun("|\\\n")) {
		case '|':
			tk.next();

			if (tk.acceptRun(whiteSpace) === "\n" || !tk.peek()) {
				return null;
			}

			return new TableBlock(tk);
		case '\\':
			tk.next();
			tk.next();

			break;
		default:
			return null;
		}
	}
      },
      parseIndentedCodeBlockStart = (tk: Tokeniser, inParagraph: boolean) => {
	if (!inParagraph) {
		if (tk.accept(" ") && tk.length() === 4 || tk.accept("\t")) {
			return new IndentedCodeBlock(tk);
		}
	}

	return null;
      },
      parseBlockQuoteStart = (tk: Tokeniser) => {
	if (tk.accept(">")) {
		return new BlockQuote(tk);
	}

	return null;
      },
      parseThematicBreak = (tk: Tokeniser) => {
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
      parseListBlockStart = (tk: Tokeniser, inParagraph: boolean) => {
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
      parseATXHeader = (tk: Tokeniser) => {
	const level = tk.acceptString("######") as 1 | 2 | 3 | 4 | 5 | 6;

	if (level > 0 && (tk.accept(whiteSpace) || tk.peek() === nl || !tk.peek())) {
		return new ATXHeadingBlock(tk, level);
	}

	return null;
      },
      parseFencedCodeBlockStart = (tk: Tokeniser) => {
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
      parseHTML1 = (tk: Tokeniser) => {
	if (tk.accept("<")) {
		tk.accept("/");

		if (type1Elements.indexOf(tk.acceptWord(type1Elements, false).toLowerCase()) >= 0 && (tk.accept(whiteSpace + ">") || tk.peek() === nl)) {
			return new HTMLBlock(tk, 1);
		}
	}

	return null;
      },
      parseHTML2 = (tk: Tokeniser) => {
	if (tk.acceptString("<!--") === 4) {
		return new HTMLBlock(tk, 2);
	}

	return null;
      },
      parseHTML3 = (tk: Tokeniser) => {
	if (tk.acceptString("<?") === 2) {
		return new HTMLBlock(tk, 3);
	}

	return null;
      },
      parseHTML4 = (tk: Tokeniser) => {
	if (tk.acceptString("<!") === 2 && tk.accept(letter)) {
		return new HTMLBlock(tk, 4);
	}

	return null;
      },
      parseHTML5 = (tk: Tokeniser) => {
	if (tk.acceptString("<![CDATA[") === 9) {
		return new HTMLBlock(tk, 5);
	}

	return null;
      },
      parseHTML6 = (tk: Tokeniser) => {
	if (tk.accept("<")) {
		tk.accept("/");

		if (htmlElements.indexOf(tk.acceptWord(htmlElements, false).toLowerCase()) >= 0 && (tk.accept(whiteSpace + ">") || (tk.accept("/") && tk.accept(">") || tk.peek() === nl))) {
			return new HTMLBlock(tk, 6);
		}
	}

	return null;
      },
      isTag = (tk: Tokeniser, multiline = false) => {
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
      parseHTML7 = (tk: Tokeniser, inParagraph: boolean) => {
	if (!inParagraph && tk.accept("<") && isTag(tk) && (!tk.acceptRun(whiteSpace) || tk.accept(nl))) {
		return new HTMLBlock(tk, 7);
	}

	return null;
      },
      parseLinkLabel = (tk: Tokeniser) => {
	if (tk.accept("[")) {
		tk.acceptRun(whiteSpace);

		if (tk.accept("\n")) {
			tk.acceptRun(whiteSpace);
		}

		if (!tk.accept("]") && !tk.accept(nl)) {
			Loop:
			while (true) {
				switch (tk.exceptRun("\\[]\n")) {
				case '\n':
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

					break;
				default:
					break Loop;
				}
			}
		}
	}

	return false;
      },
      processLinkRef = (ref: string) => CaseFold(ref).replaceAll(/\s+/g, " "),
      parseLinkReference = (tk: Tokeniser, inParagraph: boolean) => {
	if (!inParagraph && parseLinkLabel(tk) && tk.accept(":")) {
		const colon = tk.length(),
		      ftk = subTokeniser(tk);

		tk.acceptRun(whiteSpace);

		if (tk.accept(nl)) {
			tk.acceptRun(whiteSpace);
		}

		const h = parseLinkDestination(ftk),
		      p = tk.length();

		if (h) {
			if (ftk.accept(whiteSpace) || ftk.peek() === nl || !ftk.peek()) {
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
	}

	return null;
      },
      parseParagraph = (tk: Tokeniser, inParagraph: boolean) => {
	if (!inParagraph) {
		const last = tk.acceptRun(whiteSpace);

		if (last && last !== nl) {
			return new ParagraphBlock(tk);
		}
	}

	return null;
      },
      acceptThreeSpaces = (tk: Tokeniser) => tk.acceptString("   "),
      parseBlock: ((tk: Tokeniser, inParagraph: boolean) => Block | null)[] = [
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
      tokenTilde = 14,
      tokenCaret = 15,
      parseText: TokenFn = (tk: Tokeniser) => {
	while (true) {
		switch (tk.exceptRun("\\`*_![]()<^~")) {
		case '\\':
			tk.next();
			tk.next();
			break;
		case '`':
			return tk.return(tokenText, parseCode);
		case '*':
		case '_':
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
		case '~':
			return tk.return(tokenText, parseTilde);
		case '^':
			return tk.return(tokenText, parseCaret);
		default:
			return tk.return(tokenText);
		}
	}
      },
      parseCode = (tk: Tokeniser) => {
	tk.acceptRun("`");

	const numTicks = tk.length();

	while (true) {
		switch (tk.exceptRun("`")) {
		case '`':
			const l = tk.length();

			tk.acceptRun("`");

			if (tk.length() - l === numTicks) {
				return tk.return(tokenCode, parseText);
			}

			break;
		default:
			tk.reset();
			tk.acceptRun("`");

			return parseText(tk);
		}
	}
      },
      parseEmphasis = (tk: Tokeniser) => {
	tk.acceptRun(tk.next());
	
	return tk.return(tokenEmphasis, parseText);
      },
      parseTilde = (tk: Tokeniser) => {
	tk.acceptRun("~");

	return tk.return(tokenTilde, parseText);
      },
      parseCaret = (tk: Tokeniser) => {
	tk.next();

	if (tk.accept("^")) {
		tk.acceptRun("^");

		return parseText(tk);
	}

	return tk.return(tokenCaret, parseText);
      },
      parseImageOpen = (tk: Tokeniser) => {
	tk.next();
	if (tk.accept("[")) {
		return tk.return(tokenImageOpen, parseText);
	}

	return parseText(tk);
      },
      [parseLinkOpen, parseLinkClose, parseParenOpen, parseParenClose] = [tokenLinkOpen, tokenLinkClose, tokenParenOpen, tokenParenClose].map(t => (tk: Tokeniser) => {
	tk.next();

	return tk.return(t, parseText);
      }),
      parseHTML = (tk: Tokeniser) => {
	tk.next();

	if (tk.accept("!")) {
		if (tk.accept("-")) {
			if (tk.accept("-")) {
				tk.accept("-");

				if (!tk.accept(">")) {
					while (true) {
						if (!tk.exceptRun("-")) {
							break;
						}

						tk.next();

						if (tk.accept("-")) {
							if (tk.accept(">")) {
								return tk.return(tokenHTML, parseText);
							}

							break;
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
			while (true) {
				if (!tk.exceptRun("]")) {
					break;
				}

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
		while (true) {
			if (!tk.exceptRun("?")) {
				break;
			}

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
      parseAutoLink = (tk: Tokeniser) => {
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
      parseEmailAutolink = (tk: Tokeniser) => {
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
      parseLinkDestination = (tk: Tokeniser) => {
	if (tk.accept("<")) {
		tk.get();

		while (true) {
			switch (tk.exceptRun("\n\\<>")) {
			case '\\':
				tk.next();
				tk.next();

				break;
			case '>':
				const dest = tk.get();

				tk.next();

				tk.get();

				return dest || [];
			default:
				return "";
			}
		}
	}

	tk.get();

	let paren = 0;

	while (true) {
		switch (tk.exceptRun(control + " \\()")) {
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

			break;
		default:
			return tk.get();
		}
	}
      },
      parseLinkTitle = (tk: Tokeniser) => {
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
			case '\n':
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

				break;
			default:
				return "";
			}
		}
	}

	return "";
      },
      makeLink = (uid: string, stack: Token[], start: number, end: number, refLink: {href: string; title: string}) => {
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
      makeImage = (uid: string, stack: Token[], start: number, end: number, refLink: {href: string; title: string}) => {
	let alt = "";

	for (let i = start + 1; i < end; i++) {
		const tk = stack[i];

		if ("alt" in tk) {
			alt += tk.alt;
		} else {
			switch (tk.type) {
			case tokenHTML:
			case tokenHTMLMD:
			case tokenEmphasis:
				break;
			default:
				alt += tk.data;
			}
		}

		tk.type = tokenText;
		tk.data = "";
	}

	stack[start] = {
		"type": tokenHTMLMD,
		"data": openTag(uid, "img", true, {"src": refLink.href, "title": refLink.title, alt}),
		alt
	} as Token;

	stack[end].type = tokenText;
	stack[end].data = "";
      },
      processLinkAndImage = (uid: string, stack: Token[], start: number, end: number) => {
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
				if (stack[start].type === tokenLinkOpen) {
					makeLink(uid, stack, start, end, refLink);
				} else {
					makeImage(uid, stack, start, end, refLink);
				}

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
      processLinksAndImages = (uid: string, stack: Token[]) => {
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
							if (openTK.type === tokenLinkOpen) {
								makeLink(uid, stack, j, i, refLink);
							} else {
								makeImage(uid, stack, j, i, refLink);
							}

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
      isLeftFlanking = (stack: Token[], pos: number) => {
	const openTk = stack[pos],
	      allowEscapedWhitespace = openTk.type === tokenTilde || openTk.type === tokenCaret;

	if (openTk.type === tokenEmphasis || allowEscapedWhitespace) {
		const lastChar = stack[pos - 1]?.data.at(-1) ?? " ",
		      nextChar = stack[pos + 1]?.data.at(0) ?? " ",
		      nextNextChar = stack[pos + 1]?.data.at(1) ?? " ";

		return !isWhitespace.test(nextChar) && ((!isPunctuation.test(nextChar) || allowEscapedWhitespace && nextChar === "\\" && isWhitespace.test(nextNextChar)) || isWhitespace.test(lastChar) || isPunctuation.test(lastChar));
	}

	return false;
      },
      isRightFlanking = (stack: Token[], pos: number) => {
	const closeTk = stack[pos],
	      allowEscapedWhitespace = closeTk.type === tokenTilde || closeTk.type === tokenCaret;

	if (closeTk.type === tokenEmphasis || allowEscapedWhitespace) {
		const lastChar = stack[pos - 1]?.data.at(-1) ?? " ",
		      lastLastChar = stack[pos - 1]?.data.at(-2) ?? " ",
		      nextChar = stack[pos + 1]?.data.at(0) ?? " ";

		return (!isWhitespace.test(lastChar) || allowEscapedWhitespace && lastLastChar === "\\") && (!isPunctuation.test(lastChar) || isWhitespace.test(nextChar) || isPunctuation.test(nextChar));
	}

	return false;
      },
      isEmphasisOpening = (stack: Token[], pos: number) => {
	if (isLeftFlanking(stack, pos)) {
		if (stack[pos].data.at(0) === "_" && (isRightFlanking(stack, pos) && !isPunctuation.test(stack[pos - 1]?.data.at(-1) ?? "_"))) {
			return false;
		}

		return true;
	}

	return false;
      },
      isEmphasisClosing = (stack: Token[], pos: number) => {
	if (isRightFlanking(stack, pos)) {
		if (stack[pos].data.at(0) === "_" && (isLeftFlanking(stack, pos) && !isPunctuation.test(stack[pos + 1]?.data.at(0) ?? "_"))) {
			return false;
		}

		return true;
	}

	return false;
      },
      emphasisTags: Record<string, (keyof HTMLElementTagNameMap)[]> = {
	"*": ["em", "strong"],
	"_": ["em", "strong"],
	"~": ["sub", "s"],
	"^": ["sup"],
      },
      processEmphasis = (uid: string, stack: Token[], start = 0, end = stack.length) => {
	const levels = {
		"*": [start, start, start],
		"_": [start, start, start],
		"~": [start, start, start],
		"^": [start, start, start]
	      };

	Loop:
	for (let i = start + 1; i < end; i++) {
		if (isEmphasisClosing(stack, i)) {
			const close = stack[i],
			      closeLength = close.data.length,
			      level = (closeLength - 1) % 3,
			      isCloseOpen = isEmphasisOpening(stack, i),
			      char = close.data.at(0) as keyof typeof levels,
			      charLevel = levels[char];

			for (let j = i - 1; j >= charLevel[level]; j--) {
				const open = stack[j],
				      openLength = open.data.length,
				      isDouble = closeLength > 1 && openLength > 1,
				      escapedSpaces = !isDouble && (char === "~" || char === "^");

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
							case '\n':
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

				if (isEmphasisOpening(stack, j) && char === open.data.at(0) && (!isCloseOpen && !isEmphasisClosing(stack, j) || (closeLength + openLength) % 3 !== 0 || closeLength % 3 === 0 || openLength % 3 === 0)) {
					const tag = emphasisTags[char][+isDouble],
					      chars = isDouble ? 2 : 1,
					      closingTag = {"type": tokenHTMLMD, "data": closeTag(tag)},
					      openingTag = {"type": tokenHTMLMD, "data": openTag(uid, tag)};

					for (let k = j + 1; k < i; k++) {
						switch (stack[k].type) {
						case tokenTilde:
						case tokenEmphasis:
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
		if (stack[i].type === tokenEmphasis) {
			stack[i].type = tokenText;
		}
	}
      },
      processEscapedPunctuation = (text: string) => setHTML(encoder, punctuation.split("").reduce((text, char) => text.replaceAll("\\"+char, char), text)).innerText,
      parseInline = (uid: string, text: string) => {
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
			res += processEscapedPunctuation(tk.data).replaceAll(/\n +/g, nl).split(/ + \n|\\\n/g).map(t =>  setText(encoder, t.replaceAll(/ +\n/g, nl)).innerHTML).join(tag(uid, "br"));

			break;
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
	"SUB": "subscript",
	"SUP": "superscript",
	"S": "strikethrough",
	"TABLE": "table",
	"THEAD": "thead",
	"TBODY": "tbody",
	"TR": "tr"
      } as const,
      sanitise = (childNodes: NodeListOf<ChildNode>, tags: Tags, uid: string) => {
	const df = document.createDocumentFragment();

	Loop:
	for (const node of Array.from(childNodes)) {
		if (node instanceof Element) {
			if (node.hasAttribute(uid)) {
				switch (node.nodeName) {
				case "HR":
					df.append(tags.thematicBreaks());

					break;
				case "TEXTAREA":
					df.append(tags.code(node.getAttribute("type") ?? "", node.textContent ?? ""));

					break;
				case "OL":
					df.append(tags.orderedList(node.getAttribute("start") ?? "", sanitise(node.childNodes, tags, uid)));

					break;
				case "P":
				case "BLOCKQUOTE":
				case "UL":
				case "LI":
				case "CODE":
				case "EM":
				case "STRONG":
				case "SUB":
				case "SUP":
				case "S":
				case "TABLE":
				case "THEAD":
				case "TBODY":
				case "TR":
					df.append(tags[tagNameToTag[node.nodeName]](sanitise(node.childNodes, tags, uid)));

					break;
				case "BR":
					df.append(tags.break());

					break;
				case "A":
					df.append(tags.link(node.getAttribute("href") ?? "", node.getAttribute("title") ?? "", sanitise(node.childNodes, tags, uid)));

					break;
				case "IMG":
					df.append(tags.image(node.getAttribute("src") ?? "", node.getAttribute("title") ?? "", node.getAttribute("alt") ?? ""));

					break;

				case "TH":
					df.append(tags.th(node.getAttribute("align") ?? "", sanitise(node.childNodes, tags, uid)));

					break;
				case "TD":
					df.append(tags.td(node.getAttribute("align") ?? "", sanitise(node.childNodes, tags, uid)));

					break;
				default:
					df.append(tags[`heading${node.nodeName.charAt(1) as "1" | "2" | "3" | "4" | "5" | "6"}`](sanitise(node.childNodes, tags, uid)));

					break;
				}
			} else {
				if (tags.allowedHTML) {
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
			}
		} else {
			df.append(node);
		}
	}

	return df;
      },
      openTag = (uid: string, name: keyof HTMLElementTagNameMap, close = false, attrs: Record<string, string> = {}) => {
	const t = makeNode(name, attrs);

	t.toggleAttribute(uid);

	if (close) {
		return t.outerHTML;
	}

	return t.outerHTML.replace("</" + name + ">", "");
      },
      closeTag = (name: string) => `</${name}>`,
      tag = (uid: string, name: keyof HTMLElementTagNameMap, contents?: string, attrs: Record<string, string> = {}) => {
	const close = contents === undefined;

	return openTag(uid, name, close, attrs) + (close ? "" : contents + closeTag(name));
      },
      isOpenParagraph = (b?: Block): b is ParagraphBlock => b instanceof ParagraphBlock && b.open,
      isLastGrandChildOpenParagraph = (b?: Block): boolean => b instanceof ContainerBlock ? isLastGrandChildOpenParagraph(b.children.at(-1)) : b instanceof ParagraphBlock ? b.open : false,
      isLazyBlock = (tk: Tokeniser, inList = false) => {
	tk.reset();

	const ftk = subTokeniser(tk);

	for (const block of parseBlock) {
		acceptThreeSpaces(ftk);

		const b = block(ftk, !inList || block !== parseListBlockStart);

		if (b) {
			tk.reset();

			return false;
		}

		ftk.reset();
	}

	tk.reset();

	return true;
      },
      readEOL = (tk: Tokeniser) => {
	tk.exceptRun(nl);
	tk.next();

	return tk.get();
      },
      links = new Map<string, {href: string; title: string}>(),
      alignment = ["", "left", "right", "center"].map(align => (align ? {align}: {}) as Record<string, string>),
      subTokeniser = (tk: Tokeniser) => new Tokeniser({"next": () => ({"value": tk.next(), "done": false})}),
      fixEscapedPipesInCodeBlocks = (c: string) => {
	const tk = new Tokeniser(c);

	let ret = "";

	while (true) {
		switch (tk.exceptRun("\\")) {
		case '\\':
			tk.next();

			if (tk.peek() === "|") {
				tk.backup();

				ret += tk.get();

				tk.next();

				tk.get();
			}

			tk.next();

			break;
		default:
			return ret + tk.get();
		}
	}
      };

abstract class Block {
	open = true;

	abstract accept(tk: Tokeniser, lazy: boolean): boolean;

	abstract toHTML(uid: string): string;
}

abstract class ContainerBlock extends Block {
	children: Block[] = [];

	process(tk: Tokeniser, lazy = false) {
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

	toHTML(uid: string) {
		this.setTableEOF();

		return this.children.reduce((t, c) => t + c.toHTML(uid), "");
	}
}

class Document extends ContainerBlock {
	#uid: string;

	constructor(text: string) {
		super();

		while (true) {
			this.#uid = "";

			while (this.#uid.length < 20) {
				this.#uid += String.fromCharCode(65 + Math.random() * 26);
			}

			if (!text.includes(this.#uid)) {
				break;
			}
		}

		const tk = new Tokeniser(text);

		while(tk.peek()) {
			this.process(tk);
		}
	}

	accept(_: Tokeniser) {
		return false;
	}

	render(tags: Tags) {
		const ret = sanitise(setHTML(makeNode("template"), this.toHTML(this.#uid)).content.childNodes, tags, this.#uid);

		encoder.replaceChildren();
		links.clear();

		return ret;
	}
}

class BlockQuote extends ContainerBlock {
	constructor(tk: Tokeniser) {
		super();

		tk.accept(" ");
		tk.get();

		this.process(tk);
	}

	accept(tk: Tokeniser, lazy: boolean) {
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

	toHTML(uid: string) {
		return tag(uid, "blockquote", super.toHTML(uid));
	}
}

class ListItemBlock extends ContainerBlock {
	loose = false;
	hasEmpty = false;
	#lastEmpty = false;

	constructor(tk: Tokeniser) {
		super();

		this.process(tk);
	}

	accept(tk: Tokeniser, empty: boolean) {
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

	toHTML(uid: string) {
		if (!this.loose) {
			for (const c of this.children) {
				if (c instanceof ParagraphBlock) {
					c.loose = false;
				}
			}
		}

		return tag(uid, "li", super.toHTML(uid));
	}
}

class ListBlock extends ContainerBlock {
	#marker: string;
	#spaces: number;
	#lastSpaces: number;
	#loose = false;
	#lastEmpty = false;

	constructor(tk: Tokeniser) {
		super();

		tk.acceptString("    ");

		if (tk.peek() === " ") {
			tk.backup();
			tk.backup();
			tk.backup();
		}

		const spaces = tk.get(),
		      marker = spaces.trimEnd();

		this.#spaces = this.#countSpace(marker);

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

	#countSpace(s: string) {
		let count = 0;

		for (const c of s) {
			if (c === "\t") {
				count += 4 - (count % 4);
			} else {
				count++;
			}
		}

		return count;
	}

	#newItem(tk: Tokeniser) {
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

				if (tk.accept(this.#marker.at(-1)!) && (tk.accept(whiteSpace) || tk.peek() === nl) || tk.peek() === "") {
					break;
				}
			}

			return false;
		}

		if (tk.peek() !== nl && tk.peek() !== "") {
			for (let i = tk.length(); i < this.#spaces; i++) {
				if (tk.accept("\t")) {
					i += 4 - (i % 4);
				} else if (!tk.accept(" ")) {
					return false;
				}
			}
		}

		let lastSpaces = this.#countSpace(tk.get());

		if (tk.peek() === nl) {
			lastSpaces++;
		}

		if (lastSpaces >= this.#spaces) {
			this.#lastSpaces = lastSpaces;
		}


		return true;
	}

	accept(tk: Tokeniser, lazy: boolean) {
		tk.acceptRun(whiteSpace);

		const empty = tk.accept(nl) || tk.peek() === "";

		if (this.#hasSpaces(tk) && this.children.at(-1)?.open || empty) {
			this.#lastEmpty = empty;

			return this.children.at(-1)!.accept(tk, empty);
		} else if (this.#newItem(tk)) {
			this.#loose ||= (this.children.at(-1) as ListItemBlock).hasEmpty || this.#lastEmpty;

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

	#hasSpaces(tk: Tokeniser) {
		tk.reset();

		if (tk.peek() === " ") {
			for (let i = 0; i < this.#lastSpaces; i++) {
				if (tk.accept("\t")) {
					i += 4 - (i % 4);
				} else if (!tk.accept(" ")) {
					return false;
				}
			}

			tk.get();

			return true;
		}

		return false;
	}

	#lazyContinuation(tk: Tokeniser, lazy: boolean) {
		if (!lazy) {
			if (!isLazyBlock(tk, true)) {
				return false;
			}

			lazy = true;
		}

		if (lazy && isLastGrandChildOpenParagraph(this)) {
			if (this.children.at(-1)!.accept(tk, lazy)) {
				return true;
			}
		}

		return false;
	}

	toHTML(uid: string) {
		if (!this.#loose) {
			for (const c of this.children as ListItemBlock[]) {
				if (c.loose) {
					this.#loose = true;

					break;
				}
			}
		}

		if (this.#loose) {
			for (const c of this.children as ListItemBlock[]) {
				c.loose = true;
			}
		}

		const attr: Record<string, string> = {};

		let type: keyof HTMLElementTagNameMap = "ul";

		switch (this.#marker) {
		case "-":
		case "+":
		case "*":
			break;
		default:
			const start = this.#marker.slice(0, -1).replace(/^0+(?!$)/, "");

			type = "ol";

			if (start !== "1") {
				attr["start"] = start;
			}
		}

		return tag(uid, type, super.toHTML(uid), attr);
	}
}

abstract class LeafBlock extends Block {
	lines: string[] = [];

	accept(_tk: Tokeniser, _lazy: boolean) {
		return false;
	}
}

class HTMLBlock extends LeafBlock {
	#htmlKind: number;

	constructor(tk: Tokeniser, htmlKind: number) {
		super();

		this.#htmlKind = htmlKind;

		tk.reset();
		this.accept(tk);
	}

	accept(tk: Tokeniser) {
		S:
		switch (this.#htmlKind) {
		case 1:
			while (true) {
				switch (tk.exceptRun("<\n")) {
				case "<":
					tk.next();

					if (tk.accept("/")) {
						if (tk.acceptWord(type1Elements) && tk.accept(">")) {
							this.open = false;

							break S;
						}
					}

					break;
				default:
					break S;
				}
			}
		case 2:
			while (true) {
				switch (tk.exceptRun("-\n")) {
				case "-":
					tk.next();

					if (tk.accept("-") && tk.acceptRun("-") === ">") {
						this.open = false;

						break S;
					}

					break;
				default:
					break S;
				}
			}
		case 3:
			while (true) {
				switch (tk.exceptRun("?\n")) {
				case "?":
					tk.next();

					if (tk.accept(">")) {
						this.open = false;

						break S;
					}

					break;
				default:
					break S;
				}
			}
		case 4:
			this.open = tk.exceptRun(">\n") !== ">";

			break;
		case 5:
			while (true) {
				switch (tk.exceptRun("]\n")) {
				case "]":
					tk.next();

					if (tk.accept("]") && tk.accept(">")) {
						this.open = false;

						break S;
					}
				default:
					break S;
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
	#settextLevel: 0 | 1 | 2 = 0;
	loose = true;

	constructor(tk: Tokeniser) {
		super();

		this.add(tk);
	}

	add(tk: Tokeniser) {
		this.lines.push(readEOL(tk).trimStart());
	}

	accept(tk: Tokeniser, lazy = false) {
		if (!lazy && this.lines.length && (tk.peek() === "-" || tk.peek() === "=")) {
			const stChar = tk.next();

			tk.acceptRun(stChar);

			if (!tk.acceptRun(whiteSpace) || tk.accept(nl)) {
				this.#settextLevel = 1 + +(stChar === '-') as 1 | 2;
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

	toHTML(uid: string) {
		const text = parseInline(uid, this.lines.join("").trim());

		if (text) {
			return this.loose || this.#settextLevel ? tag(uid, this.#settextLevel === 0 ? "p" : `h${this.#settextLevel}`, text) : text;
		}

		return "";
	}
}

class ATXHeadingBlock extends LeafBlock {
	#level: 1 | 2 | 3 | 4 | 5 | 6;
	#text: string;

	constructor(tk: Tokeniser, level: 1 | 2 | 3 | 4 | 5 | 6) {
		super();

		this.#level = level;
		this.open = false;

		tk.get();

		this.#text = readEOL(tk).trim().replace(/[ \t]+#*$/, "");
	}

	toHTML(uid: string) {
		return tag(uid, `h${this.#level}`, parseInline(uid, this.#text));
	}
}

class FencedCodeBlock extends LeafBlock {
	#ticks: number;
	#char: string;
	#spaces: number;
	#info: string;

	constructor(tk: Tokeniser, fcbChar: string) {
		super();

		const line = tk.get(),
		      noSpace = line.trimStart(),
		      info = noSpace.replace(new RegExp("^"+fcbChar+"+"), "");

		this.#spaces = line.length - noSpace.length;
		this.#ticks = noSpace.length - info.length;
		this.#info = info.trim();
		this.#char = fcbChar;
	}

	accept(tk: Tokeniser) {
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

	toHTML(uid: string) {
		return tag(uid, "textarea", this.lines.join(""), {"type": this.#info});
	}
}

class TableBlock extends ContainerBlock {
	#firstLine: string;
	#title: string[] = [];
	#alignment?: number[];
	#body?: string[][];
	#lastSet = false;

	constructor(tk: Tokeniser) {
		super();

		tk.exceptRun("\n");
		tk.next();

		const ftk = new Tokeniser(this.#firstLine = tk.get());

		ftk.acceptRun(whiteSpace);
		ftk.accept("|");
		ftk.get();

		Loop:
		while (true) {
			switch (ftk.exceptRun("|\\\n")) {
			case '\\':
				ftk.next();
				ftk.next();

				break;
			case '|':
				this.#title.push(ftk.get().trim());

				ftk.next();
				ftk.get();

				break;
			default:
				const title = ftk.get().trim();

				if (title) {
					this.#title.push(title);
				}

				break Loop;
			}
		}
	}

	setLast(b: Block) {
		this.children.push(b instanceof TableBlock ? b.children.at(-1) ?? b : b);

		this.#lastSet = true;
	}

	#notATable(tk?: Tokeniser) {
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

	accept(tk: Tokeniser) {
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

			if (this.#alignment.length < this.#title.length || !tk.accept("\n") && tk.peek()) {
				return this.#notATable(tk);
			}

			tk.get();

			return true;
		} else if (!this.#alignment.length) {
			return this.process(tk);
		}

		const hasRow = tk.accept("|"),
		      row: string[] = [],
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

		if (ftk.accept("\n")) {
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
				case '\\':
					ftk.next();
					ftk.next();

					break;
				case '|':
					break ColLoop;
				default:
					const cell = ftk.get().trim();

					if (cell) {
						row.push(cell);
					}

					break RowLoop;
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

		tk.exceptRun("\n");
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

	toHTML(uid: string) {
		if (!this.#alignment?.length) {
			return this.#lastSet ? "" : super.toHTML(uid);
		}

		for (const c of this.#body ?? []) {
			for (let i = 0; i < c.length; i++) {
				c[i] = fixEscapedPipesInCodeBlocks(c[i]);
			}
		}

		return tag(uid, "table", tag(uid, "thead", tag(uid, "tr", this.#title.reduce((h, t, n) => h + tag(uid, "th", parseInline(uid, t), alignment[this.#alignment![n]]), ""))) + (this.#body?.length ? tag(uid, "tbody", this.#body.reduce((h, r) => h + tag(uid, "tr", r.reduce((h, c, n) => h + tag(uid, "td", parseInline(uid, c), alignment[this.#alignment![n]]), "")), "")) : ""));
	}
}

class IndentedCodeBlock extends LeafBlock {
	constructor(tk: Tokeniser) {
		super();

		this.#getLine(tk);
	}

	accept(tk: Tokeniser) {
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

	#getBlankLine(tk: Tokeniser) {
		const last = tk.acceptRun(whiteSpace);

		if (!last || last === nl) {
			tk.next();

			tk.get();

			this.lines.push(nl);

			return true;
		}

		return false;
	}

	#getLine(tk: Tokeniser) {
		tk.get();

		this.lines.push(readEOL(tk));

		return true;
	}

	toHTML(uid: string) {
		while (this.lines.at(0) === nl) {
			this.lines.shift();
		}

		while (this.lines.at(-1) === nl) {
			this.lines.pop();
		}

		return tag(uid, "textarea", this.lines.join(""));
	}
}

class ThematicBreakBlock extends LeafBlock {
	constructor(tk: Tokeniser) {
		super();

		tk.get();

		this.open = false;
	}

	toHTML(uid: string) {
		return tag(uid, "hr");
	}
}


export default (markdown: string, tgs: Partial<Tags> = {}) => new Document(markdown).render(Object.assign(Object.assign({}, tags), tgs));
