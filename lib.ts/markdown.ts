import type {Token, TokenFn} from './parser.js';
import {Tokeniser} from './parser.js';

type Tags = {
	allowedHTML: null | [string, ...string[]][];
	blockquote: (c: DocumentFragment) => Element | DocumentFragment;
	code: (info: string, text: string) => Element | DocumentFragment;
	heading1: (c: DocumentFragment) => Element | DocumentFragment;
	heading2: (c: DocumentFragment) => Element | DocumentFragment;
	heading3: (c: DocumentFragment) => Element | DocumentFragment;
	heading4: (c: DocumentFragment) => Element | DocumentFragment;
	heading5: (c: DocumentFragment) => Element | DocumentFragment;
	heading6: (c: DocumentFragment) => Element | DocumentFragment;
	paragraphs: (c: DocumentFragment) => Element | DocumentFragment;
	thematicBreaks: () => Element | DocumentFragment;
}

class Markdown {
	#uid: string;
	#processed = "";
	#text: string[] = [];
	#inHTML = -1;
	#indent = false;
	#blockQuote = 0;
	#fenced: [string, string, string] | null = null;
	#tags: Tags;
	#encoder = document.createElement("div");
	#line = "";

	constructor(tgs: Tags, source: string) {
		this.#tags = tgs;

		while (true) {
			this.#uid = "";

			while (this.#uid.length < 20) {
				this.#uid += String.fromCharCode(65 + Math.random() * 26);
			}

			if (!source.includes(this.#uid)) {
				break;
			}
		}

		this.#parseBlocks(source);
	}

	#pushBlock(block?: string) {
		if (this.#text.length || this.#fenced) {
			this.#processed += this.#inHTML >= 10 ? this.#text.join("\n") : this.#indent || this.#fenced ? this.#tag("TEXTAREA", this.#text.join("\n"), this.#fenced ? ["type", this.#fenced[2]] : undefined) : this.#tag("P", this.#text.join("\n"));

			this.#text.splice(0, this.#text.length);
		}

		if (block) {
			this.#processed += block;
		}
	}

	parseHTML() {
		if (this.#inHTML < 0) {
			for (const [n, open] of isHTMLOpen.entries()) {
				if (this.#line.match(open)) {
					this.#inHTML = n;

					break;
				}
			}

			if (this.#inHTML < 0) {
				return false;
			}

			if (!this.#text.length) {
				this.#inHTML += 10;
			}
		}

		this.#text.push(this.#line);

		if (this.#line.match(isHTMLClose[this.#inHTML % 10])) {
			if (this.#inHTML >= 10) {
				this.#pushBlock();
			}

			this.#inHTML = -1;
		}

		return true;
	}

	parseBlockQuote() {
		if (!this.#blockQuote && this.#fenced) {
			return false;
		}

		let bq = 0;

		while (this.#line.match(isBlockQuote)) {
			this.#line = this.#line.trimStart().slice(1);

			bq++;
		}

		if (bq && this.#line.startsWith(" ")) {
			this.#line = this.#line.slice(1);
		}

		if (this.#blockQuote && bq < this.#blockQuote && this.#line.match(isParagraphContinuation)) {
			const line = this.#line;

			if (this.#indent) {
				this.#line = "-";

				this.parseIndentedCodeBlock();
			} else if (this.#fenced) {
				this.#line = this.#fenced[0];

				this.parseFencedCodeBlock();
			} else if (this.#text.length && line) {
				if (this.#line.match(isSeText1) || this.#line.match(isSeText2)) {
					this.#line = "\t" + this.#line;
				}

				return false;
			}

			this.#line = line;
		}

		if (bq > this.#blockQuote) {
			this.#pushBlock();

			for (; bq > this.#blockQuote; this.#blockQuote++) {
				this.#processed += this.#openTag("BLOCKQUOTE");
			}
		} else if (bq < this.#blockQuote) {
			this.#pushBlock();

			for (; bq < this.#blockQuote; this.#blockQuote--) {
				this.#processed += this.#closeTag("BLOCKQUOTE");
			}
		}

		return false;
	}

	parseFencedCodeBlock() {
		if (this.#fenced) {
			if (this.#line.match(isEndFenced) && this.#line.trim().startsWith(this.#fenced[0])) {
				this.#text.push("");

				this.#pushBlock();

				this.#fenced = null;

				return true;
			}

			for (let toRemove = this.#fenced[1]; toRemove.length; toRemove = toRemove.slice(1)) {
				if (this.#line.startsWith(toRemove)) {
					this.#line = this.#line.slice(toRemove.length);

					break;
				}
			}

			this.#text.push(this.#line);

			return true;
		}

		if (this.#line.match(isFenced)) {
			this.#pushBlock();

			const spaces = this.#line.search(/\S/),
			      trimmed = this.#line.trim(),
			      markers = trimmed.search(/[^`~]|$/),
			      info = trimmed.replace(/^[`~]*/, "").trim();

			this.#fenced = [trimmed.slice(0, markers), this.#line.slice(0, spaces), info];

			return true;
		}

		return false;
	}

	parseIndentedCodeBlock() {
		if (!this.#text.length && this.#line.match(isIndent)) {
			this.#indent = true;
		}

		if (this.#indent) {
			if (this.#line.match(isIndent)) {
				this.#text.push(this.#line.replace(isIndent, ""));

				return true;
			} else if (this.#line.match(isIndentBlankContinue)) {
				this.#text.push("");

				return true;
			} else {
				this.#text.push("");

				this.#pushBlock();

				this.#indent = false;
			}
		}

		return false;
	}

	parseEmptyLine() {
		if (!this.#line.trim()) {
			this.#pushBlock();

			return true;
		}

		return false;
	}

	parseHeading() {
		if (this.#line.match(isHeading)) {
			const t = this.#line.trimStart(),
			      start = t.indexOf(" ") as -1 | 1 | 2 | 3 | 4 | 5 | 6;

			this.#pushBlock(this.#tag(`H${start === -1 ? t.length : start}`, this.#parseInline(start === -1 ? "" : t.slice(start).replace(/(\\#)?([ \t]#*[ \t]*)?$/, "$1").replace("\\#", "#").trim())));

			return true;
		}

		return false;
	}

	parseSetextHeading() {
		if (this.#text.length) {
			const heading: 0 | 1 | 2 = this.#line.match(isSeText1) ? 1 : this.#line.match(isSeText2) ? 2 : 0;

			if (heading !== 0) {
				const header = this.#text.join("\n");

				this.#text.splice(0, this.#text.length);

				this.#pushBlock(this.#tag(`H${heading}`, header));

				return true;
			}
		}

		return false;
	}

	parseThematicBreak() {
		for (const tb of isThematicBreak) {
			if (this.#line.match(tb)) {
				this.#pushBlock(this.#tag("HR"));

				return true;
			}
		}

		return false;
	}

	#parseBlocks(markdown: string) {
		Loop:
		for (this.#line of markdown.split("\n")) {
			for (const parser of parsers) {
				if (parser.call(this)) {
					continue Loop;
				}
			}

			this.#line = this.#line.trimStart();

			this.#pushText();
		}

		this.#pushBlock();
	}

	get content() {
		const t = document.createElement("template");

		t.innerHTML = this.#processed;

		return this.#sanitise(t.content.childNodes);
	}

	#sanitise(childNodes: NodeListOf<ChildNode>) {
		const df = document.createDocumentFragment();

		Loop:
		for (const node of Array.from(childNodes)) {
			if (node instanceof Element) {
				if (node.hasAttribute(this.#uid)) {
					switch (node.nodeName) {
					case "P":
						df.append(this.#tags.paragraphs(this.#sanitise(node.childNodes)));

						break;
					case "HR":
						df.append(this.#tags.thematicBreaks());

						break;
					case "TEXTAREA":
						df.append(this.#tags.code(node.getAttribute("type") ?? "", node.textContent ?? ""));

						break;
					case "BLOCKQUOTE":
						df.append(this.#tags.blockquote(this.#sanitise(node.childNodes)));

						break;
					default:
						df.append(this.#tags[`heading${node.nodeName.charAt(1) as "1" | "2" | "3" | "4" | "5" | "6"}`](this.#sanitise(node.childNodes)));

						break;
					}
				} else {
					if (this.#tags.allowedHTML) {
						for (const [name, ...attrs] of this.#tags.allowedHTML) {
							if (node.nodeName === name) {
								const tag = document.createElement(node.nodeName);

								for (const attr of attrs) {
									const a = node.getAttributeNode(attr);

									if (a) {
										tag.setAttributeNode(a);
									}
								}

								tag.append(this.#sanitise(node.childNodes));

								df.append(tag);

								continue Loop;
							}
						}

						df.append(this.#sanitise(node.childNodes));
					} else {
						node.replaceChildren(this.#sanitise(node.childNodes));

						df.append(node);
					}
				}
			} else {
				df.append(node);
			}
		}

		return df;
	}

	#parseInline(text: string) {
		this.#encoder.textContent = punctuation.split("").reduce((text, char) => text.replaceAll("\\"+char, char), text);

		return this.#encoder.innerHTML;
	}

	#pushText() {
		this.#text.push(this.#parseInline(this.#line));
	}

	#openTag(name: string, close = false, attr?: [string, string]) {
		return `<${name} ${this.#uid}="" ${attr ? ` ${attr[0]}=${JSON.stringify(attr[1])}` : ""}` + (close ? " />" : ">");
	}

	#closeTag(name: string) {
		return `</${name}>`;
	}

	#tag(name: string, contents?: string, attr?: [string, string]) {
		const close = contents === undefined;

		return this.#openTag(name, close, attr) + (close ? "" : contents + this.#closeTag(name));
	}
}

const tags: Tags = Object.assign({
	"code": (_info: string, text: string) => {
		const pre = document.createElement("pre"),
		      code = pre.appendChild(document.createElement("code"));

		code.textContent = text;

		return pre;
	},
	"allowedHTML": null,
	"thematicBreaks": () => document.createElement("hr")
      }, ([
	["blockquote", "blockquote"],
	["paragraphs", "p"],
	...Array.from({"length": 6}, (_, n) => [`heading${n+1}`, `h${n+1}`] as [`heading${1 | 2 | 3 | 4 | 5 | 6}`, string])
      ] as const).reduce((o, [key, tag]) => (o[key] = (c: DocumentFragment) => {
	      const t = document.createElement(tag);

	      t.append(c);

	      return t;
      }, o), {} as Record<keyof Tags, (c: DocumentFragment) => Element>), {}),
      isHeading = /^ {0,3}#{1,6}( .*)?$/,
      isSeText1 = /^ {0,3}=+[ \t]*$/,
      isSeText2 = /^ {0,3}\-+[ \t]*$/,
      isThematicBreak = [
	/^ {0,3}(\-[ \t]*){3,}[ \t]*$/,
	/^ {0,3}(\*[ \t]*){3,}[ \t]*$/,
	/^ {0,3}(_[ \t]*){3,}[ \t]*$/
      ],
      isIndent = /^(\t|    )/,
      isIndentBlankContinue = /^ {0,3}$/,
      isFenced = /^ {0,3}(````*[^`]*|~~~~*.*)[ \t]*$/,
      isEndFenced = /^ {0,3}(````*|~~~~*)[ \t]*$/,
      punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
      isHTMLOpen = [
	      /^ {0,3}<(pre|script|style|textarea)([ \t>]|$)/i,
	      /^ {0,3}<!--/,
	      /^ {0,3}<\?/,
	      /^ {0,3}<![A-Za-z]/,
	      /^ {0,3}<!\[CDATA\[/,
	      /^ {0,3}<\/?(address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)([ \t>]|\/>|$)/i,
	      /^ {0,3}(<\/[0-9A-Za-z][0-9A-Za-z\-]*>|<[0-9A-Za-z][0-9A-Za-z\-]*([ \t\r]+[^\x00"'>\/=\t\r]+(="([^\\"]?(\\.)*)*"|='([^']?(\\')*)')?)*[ \t]*\/?>)[ \t]*$/
      ],
      isHTMLClose = [
	      /<\/(pre|script|style|textarea)>/i,
	      /-->/,
	      /\?>/,
	      />/,
	      /]]>/,
	      /^[ \t]*$/,
	      /^[ \t]*$/
      ],
      isBlockQuote = /^ {0,3}>/,
      isParagraphContinuation = /^ {0,3}([^-*]|$)/,
      parsers = ([
	"parseBlockQuote",
	"parseFencedCodeBlock",
	"parseIndentedCodeBlock",
	"parseHTML",
	"parseEmptyLine",
	"parseHeading",
	"parseSetextHeading",
	"parseThematicBreak"
      ] as const).map(k => Markdown.prototype[k]);

class Block {
	open = true;

	accept(_: Tokeniser) {
		return false;
	}
}

class ContainerBlock extends Block {
	children: Block[] = [];

	newBlock(tk: Tokeniser) {
		this.children.push(this.parseBlockStart(tk));
	}

	parseBlockStart(tk: Tokeniser) {
		if (tk.accept("\t")) {
			return new IndentedCodeBlock(tk, true);
		}

		tk.accept(" ");
		tk.accept(" ");
		tk.accept(" ");

		switch (tk.peek()) {
		case " ":
			return new IndentedCodeBlock(tk);
		case ">":
			return new BlockQuote(tk);
		case '*':
		case '-':
		case '_':
			const tbChar = tk.next();

			tk.acceptRun(whiteSpace);
			if (tk.accept(tbChar)) {
				tk.acceptRun(whiteSpace);
				if (tk.accept(tbChar)) {

					tk.acceptRun(whiteSpace + tbChar);
					if (tk.accept("\n") || !tk.peek()) {
						return new ThematicBreakBlock();
					}
				}
			}

			if (tbChar === "_") {
				break;
			}

			tk.reset();
			tk.acceptRun(" ");
		case '+':
			const blChar = tk.next();

			if (tk.accept(whiteSpace)) {
				return new ListBlock(blChar);
			}
		case '#':
			const level = +tk.accept("#") + +tk.accept("#") + +tk.accept("#") + +tk.accept("#") + +tk.accept("#") + +tk.accept("#");

			if (tk.accept(whiteSpace) || tk.peek() === "\n" || !tk.peek()) {
				return new ATXHeadingBlock(tk, level);
			}
		case '`':
		case '~':
			return parseFencedCodeBlock(tk);
		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
		case '9':
		}
	}
}

class Document extends ContainerBlock {
	constructor(text: string) {
		super();

		const tk = new Tokeniser(text[Symbol.iterator]());

		while(tk.peek()) {
			if (!this.accept(tk)) {
				this.newBlock(tk);
			}
		}
	}
}

class BlockQuote extends ContainerBlock {
	constructor(tk: Tokeniser) {
		super();

		tk.accept(" ");
		tk.get();
	}
}


class ListBlock extends ContainerBlock {
	#marker: string;

	constructor(marker: string) {
		super();

		this.#marker = marker;
	}
}

class LeafBlock extends Block {
	lines: string[] = [];
}

class HTMLBlock extends LeafBlock {
}

class ParagraphBlock extends LeafBlock {
	constructor(tk: Tokeniser) {
		super();

		this.add(tk);
	}

	add(tk: Tokeniser) {
		tk.acceptRun("\n");
		tk.accept("\n");

		this.lines.push(tk.get());
	}
}

class SetextHeadingBlock extends LeafBlock {
	constructor(tk: Tokeniser, p: ParagraphBlock) {
		super();

		this.lines = p.lines;

		tk.get();
	}
}

class ATXHeadingBlock extends LeafBlock {
	#level: number;
	#text: string;

	constructor(tk: Tokeniser, level: number) {
		super();

		this.#level = level;
		this.open = false;

		tk.get();

		tk.exceptRun("\n");
		tk.accept("\n");

		this.#text = tk.get().trim().replace(/( \t)+#+$/, "");
	}
}

class FencedCodeBlock extends LeafBlock {
}

class IndentedCodeBlock extends LeafBlock {
	#isTab: boolean;

	constructor(tk: Tokeniser, isTab = false) {
		super();

		if (!(this.#isTab = isTab)) {
			tk.accept(" ");
		}

		tk.get();
	}
}

class ThematicBreakBlock extends LeafBlock {
	constructor() {
		super();

		this.open = false;
	}
}

const tokenIndentedCodeBlock = 1,
      tokenThematicBreak = 2,
      tokenATXHeading = 3,
      tokenSetextHeading = 4,
      tokenFencedCodeBlock = 5,
      tokenHTMLKind1 = 6,
      tokenHTMLKind2 = 7,
      tokenHTMLKind3 = 8,
      tokenHTMLKind4 = 9,
      tokenHTMLKind5 = 10,
      tokenHTMLKind6 = 11,
      tokenHTMLKind7 = 12,
      tokenBlockQuote = 13,
      tokenBulletListMarker = 14,
      tokenOrderedListMarker = 15,
      tokenText = 16,
      whiteSpace = " \t",
      letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      number = "0123456789",
      parseBlock = (t: Tokeniser): [Token, TokenFn] => {
	const char = t.acceptRun(" ");

	if (t.length() >= 4) {
		return t.return(tokenIndentedCodeBlock, parseBlock);
	}

	switch (char) {
	case '<':
		return parseHTML(t);
	case '>':
		return parseBlockQuote(t);
	case '*':
	case '_':
		return parseThematicBreak(t);
	case '=':
		return parseSetextHeading(t);
	case '#':
		return parseATXHeading(t);
	case '`':
	case '~':
		return parseFencedCodeBlock(t);
	case '-':
	case '+':
		return parseBulletListMarker(t);
	case '0':
	case '1':
	case '2':
	case '3':
	case '4':
	case '5':
	case '6':
	case '7':
	case '8':
	case '9':
		return parseOrderedListMarker(t);
	case '':
		return t.return(tokenText);
	default:
		return parseText(t);
	}
      },
      parseBlockQuote = (t: Tokeniser): [Token, TokenFn] => {
	t.accept(">");
	t.accept(" ");

	return t.return(tokenBlockQuote, parseBlock);
      },
      parseThematicBreak = (t: Tokeniser, firstParsed = false): [Token, TokenFn] => {
	const char = t.peek();

	if (!firstParsed) {
		t.accept(char);
	}

	t.acceptRun(whiteSpace);

	if (!t.accept(char)) {
		return parseText(t);
	}

	t.acceptRun(whiteSpace);

	if (!t.accept(char)) {
		return parseText(t);
	}

	t.acceptRun(char + whiteSpace);
	t.accept("\n");

	return t.return(tokenThematicBreak, parseBlock);
      },
      parseSetextHeading = (t: Tokeniser): [Token, TokenFn] => {
	const char = t.next();

	t.acceptRun(char);

	if (!t.acceptRun(whiteSpace)) {
		return t.return(tokenSetextHeading);
	} else if (!t.accept("\n")) {
		return parseText(t);
	}

	return t.return(tokenSetextHeading, parseBlock);
      },
      parseATXHeading = (t: Tokeniser): [Token, TokenFn] => {
	t.acceptRun("#");

	t.exceptRun("\n");

	return t.return(tokenATXHeading, parseBlock);
      },
      parseFencedCodeBlock = (t: Tokeniser): [Token, TokenFn] => {
	const fcbChar = t.next();

	if (!t.accept(fcbChar) || !t.accept(fcbChar)) {
		return parseText(t);
	}

	t.acceptRun(fcbChar);

	t.exceptRun("\n");
	t.accept("\n");

	return t.return(tokenFencedCodeBlock, parseBlock);
      },
      parseWord = (t: Tokeniser, words: string[], caseSensitive = false) => {
	let read = "";

	while (true) {
		const char = caseSensitive ? t.peek() : t.peek().toLowerCase();

		words = words.filter(w => caseSensitive ? w.startsWith(char) : w.toLowerCase().startsWith(char)).map(w => w.slice(1));

		if (!words.length) {
			break;
		}

		read += t.next();
	}

	return read;
      },
      htmlElements = ["pre", "script", "style", "textarea", "address", "article", "aside", "base", "basefont", "blockquote", "body", "caption", "center", "col", "colgroup", "dd", "details", "dialog", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "iframe", "legend", "li", "link", "main", "menu", "menuitem", "nav", "noframes", "ol", "optgroup", "option", "p", "param", "section", "source", "summary", "table", "tbody", "td", "tfoot", "th", "thead", "title", "tr", "track", "ul"],
      type1Elements = htmlElements.slice(0, 4),
      parseHTML = (t: Tokeniser): [Token, TokenFn] => {
	t.accept("<");

	const close = t.accept("/"),
	      tag = parseWord(t, htmlElements),
	      i = htmlElements.indexOf(tag.toLowerCase());

	let tokenType = tokenText;

	if (close) {
		if (i === -1) {
			if (t.accept(letter)) {
				t.acceptRun(letter + number + "-");
				t.acceptRun(whiteSpace);
				t.acceptRun("\n");
				t.acceptRun(whiteSpace);
				if (t.accept(">")) {
					tokenType = tokenHTMLKind7;
				}
			}
		} else if (t.accept(whiteSpace) || t.peek() === "\n" || (t.accept("/") && t.accept(">"))) {
			tokenType = tokenHTMLKind6;
		}
	} else if (i === -1) {
		if (tag) {
			while (true) {
				t.acceptRun(whiteSpace);
				t.accept("\n");
				t.acceptRun(whiteSpace);

				if (t.accept("/")) {
					if (t.accept(">")) {
						tokenType = tokenHTMLKind7;

						break;
					}

					return parseText(t);
				} else if (t.accept(">")) {
					tokenType = tokenHTMLKind7;

					break;
				} else if (!t.accept(letter + "_:")) {
					break;
				}

				t.acceptRun(letter + number + "_.:-");
				t.acceptRun(whiteSpace);
				t.accept("\n");
				t.acceptRun(whiteSpace);

				if (t.accept("=")) {
					if (t.accept("'")) {
						t.exceptRun("'");
						if (!t.accept("'")) {
							break;
						}
					} else if (t.accept('"')) {
						t.exceptRun('"');
						if (!t.accept('"')) {
							break;
						}
					} else if (t.accept(whiteSpace + "\"'=<>`")) {
						return parseText(t);
					} else {
						t.exceptRun(whiteSpace + "\"'=<>`");
					}
				}
			}
		} else if (t.accept("!")) {
			if (t.accept("-")) {
				if (t.accept("-")) {
					tokenType = tokenHTMLKind2;
				}
			} else if (t.accept(letter)) {
				tokenType = tokenHTMLKind4;
			} else if (t.accept("[") && t.accept("C") && t.accept("D") && t.accept("A") && t.accept("T") && t.accept("A") && t.accept("[")) {
				tokenType = tokenHTMLKind5;
			}
		} else if (t.accept("?")) {
			tokenType = tokenHTMLKind3;
		}
	} else if (i < 4) {
		if (t.accept(whiteSpace) || t.peek() === "\n") {
			tokenType = tokenHTMLKind1;
		}
	} else {
		if (t.accept(whiteSpace) || t.peek() === "\n" || (t.accept("/") && t.accept(">"))) {
			tokenType = tokenHTMLKind6;
		}
	}

	t.exceptRun("\n");

	if (t.accept("\n")) {
		return t.return(tokenType, parseBlock);
	}

	return t.return(tokenType);
      },
      parseBulletListMarker = (t: Tokeniser): [Token, TokenFn] => {
	const char = t.next();

	if (!t.accept(whiteSpace)) {
		if (char === "-") {
			return parseThematicBreak(t, true);
		}

		return parseText(t);
	}

	return t.return(tokenBulletListMarker, parseBlock);
      },
      parseOrderedListMarker = (t: Tokeniser): [Token, TokenFn] => {
	const l = t.length();

	t.acceptRun("0123456789");

	if (t.length() - l > 9 || !t.accept(".)")) {
		return parseText(t);
	}

	return t.return(tokenOrderedListMarker, parseBlock);
      },
      parseText = (t: Tokeniser): [Token, TokenFn] => {
	t.exceptRun("\n");

	if (t.accept("\n")) {
		return t.return(tokenText, parseBlock);
	}

	return t.return(tokenText);
      };

export default (markdown: string, tgs: Partial<Tags> = {}) => {
	return new Markdown(Object.assign(Object.assign({}, tags), tgs), markdown).content;
};
