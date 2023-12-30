import type {Token, TokenFn} from './parser.js';
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
      tags: Tags = ([
	["blockquote", "blockquote"],
	["paragraphs", "p"],
	["unorderedList", "ul"],
	["listItem", "li"],
	["inlineCode", "code"],
	["italic", "em"],
	["bold", "strong"],
	...Array.from({"length": 6}, (_, n) => [`heading${n+1}`, `h${n+1}`] as [`heading${1 | 2 | 3 | 4 | 5 | 6}`, `h${1 | 2 | 3 | 4 | 5 | 6}`])
      ] as const).reduce((o, [key, tag]) => (o[key] = (c: DocumentFragment) => makeNode(tag, {}, c), o), {
	"code": (_info: string, text: string) => makeNode("pre", {}, text),
	"orderedList": (start: string, c: DocumentFragment) => makeNode("ol", start ? {start} : {}, c),
	"allowedHTML": null,
	"thematicBreaks": () => makeNode("hr"),
	"link": (href: string, title: string, c: DocumentFragment) => makeNode("a", {href, title}, c),
	"image": (src: string, title: string, alt: string) => makeNode("img", {src, title, alt}),
	"break": () => makeNode("br")
      } as any as Tags),
      whiteSpace = " \t",
      letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      number = "0123456789",
      htmlElements = ["pre", "script", "style", "textarea", "address", "article", "aside", "base", "basefont", "blockquote", "body", "caption", "center", "col", "colgroup", "dd", "details", "dialog", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "iframe", "legend", "li", "link", "main", "menu", "menuitem", "nav", "noframes", "ol", "optgroup", "option", "p", "param", "section", "source", "summary", "table", "tbody", "td", "tfoot", "th", "thead", "title", "tr", "track", "ul"],
      type1Elements = htmlElements.slice(0, 4),
      parseIndentedCodeBlockStart = (tk: Tokeniser, inParagraph: boolean) => {
	if (!inParagraph) {
		if (tk.accept(" ")) {
			return new IndentedCodeBlock(tk);
		}

		tk.reset();

		if (tk.accept("\t")) {
			return new IndentedCodeBlock(tk, true);
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
				if (tk.accept("\n") || !tk.peek()) {
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
		if (tk.accept(whiteSpace + (inParagraph ? "" : "\n"))) {
			tk.backup();

			return new ListBlock(tk);
		} else if (!inParagraph && tk.peek() === "") {
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
			if (tk.accept(whiteSpace + (inParagraph ? "" : "\n"))) {
				tk.backup();

				return new ListBlock(tk);
			} else if (!inParagraph && tk.peek() === "") {
				return new ListBlock(tk);
			}
		}
	}

	return null;
      },
      parseInOrder = (tk: Tokeniser, order: string) => {
	let parsed = 0;

	for (const c of order) {
		if (!tk.accept(c)) {
			break;
		}

		parsed++;
	}

	return parsed;
      },
      parseATXHeader = (tk: Tokeniser) => {
	const level = parseInOrder(tk, "######");

	if (level > 0 && (tk.accept(whiteSpace) || tk.peek() === "\n" || !tk.peek())) {
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

			if (tk.exceptRun("\n" + (fcbChar === '`' ? '`' : "")) !== fcbChar) {
				tk.accept("\n");

				return new FencedCodeBlock(tk, fcbChar);
			}
		}
	}

	return null;
      },
      parseHTML1 = (tk: Tokeniser) => {
	if (tk.accept("<")) {
		tk.accept("/");

		if (type1Elements.indexOf(tk.acceptWord(type1Elements, false).toLowerCase()) >= 0 && (tk.accept(whiteSpace + ">") || tk.peek() === "\n")) {
			return new HTMLBlock(tk, 1);
		}
	}

	return null;
      },
      parseHTML2 = (tk: Tokeniser) => {
	if (parseInOrder(tk, "<!--") === 4) {
		return new HTMLBlock(tk, 2);
	}

	return null;
      },
      parseHTML3 = (tk: Tokeniser) => {
	if (parseInOrder(tk, "<?") === 2) {
		return new HTMLBlock(tk, 3);
	}

	return null;
      },
      parseHTML4 = (tk: Tokeniser) => {
	if (parseInOrder(tk, "<!") === 2 && tk.accept(letter)) {
		return new HTMLBlock(tk, 4);
	}

	return null;
      },
      parseHTML5 = (tk: Tokeniser) => {
	if (parseInOrder(tk, "<![CDATA[") === 9) {
		return new HTMLBlock(tk, 5);
	}

	return null;
      },
      parseHTML6 = (tk: Tokeniser) => {
	if (tk.accept("<")) {
		tk.accept("/");

		if (htmlElements.indexOf(tk.acceptWord(htmlElements, false).toLowerCase()) >= 0 && (tk.accept(whiteSpace + ">") || (tk.accept("/") && tk.accept(">") || tk.peek() === "\n"))) {
			return new HTMLBlock(tk, 6);
		}
	}

	return null;
      },
      parseHTML7 = (tk: Tokeniser, inParagraph: boolean) => {
	if (!inParagraph && tk.accept("<")) {
		if (tk.accept("/") && tk.accept(letter)) {
			tk.acceptRun(letter + number + "-");
			tk.acceptRun(whiteSpace);

			if (tk.accept("\n")) {
				tk.acceptRun(whiteSpace);
			}

			if (tk.accept(">")) {
				return new HTMLBlock(tk, 7);
			}
		} else if (tk.accept(letter)) {
			tk.acceptRun(letter + number + "-");

			while (true) {
				tk.acceptRun(whiteSpace);
				tk.accept("\n");
				tk.acceptRun(whiteSpace);

				if (tk.accept("/")) {
					if (tk.accept(">")) {
						return new HTMLBlock(tk, 7);
					}

					return null;
				} else if (tk.accept(">")) {
					return new HTMLBlock(tk, 7);
				} else if (!tk.accept(letter + "_:")) {
					break;
				}

				tk.acceptRun(letter + number + "_.:-");
				tk.acceptRun(whiteSpace);
				tk.accept("\n");
				tk.acceptRun(whiteSpace);

				if (tk.accept("=")) {
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
					} else if (tk.accept(whiteSpace + "\"'=<>`")) {
						return null;
					} else {
						tk.exceptRun(whiteSpace + "\"'=<>`");
					}
				}
			}
		}
	}

	return null;
      },
      parseParagraph = (tk: Tokeniser, inParagraph: boolean) => {
	if (!inParagraph) {
		const last = tk.acceptRun(whiteSpace);

		if (last && last !== "\n") {
			return new ParagraphBlock(tk);
		}
	}

	return null;
      },
      acceptThreeSpaces = (tk: Tokeniser) => parseInOrder(tk, "   "),
      parseBlock: ((tk: Tokeniser, inParagraph: boolean) => Block | null)[] = [
	parseIndentedCodeBlockStart,
	parseBlockQuoteStart,
	parseThematicBreak,
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
	parseParagraph
      ],
      encoder = makeNode("div"),
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
      parseText: TokenFn = (tk: Tokeniser) => {
	while (true) {
		switch (tk.exceptRun("\\`*_![()")) {
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
      processLinkImage = (_uid: string, _tokens: Token[], _start: number, _end: number) => {
	return false;
      },
      processLinksAndImages = (uid: string, stack: Token[]) => {
	for (let i = 0; i < stack.length; i++) {
		const closeTK = stack[i];

		if (closeTK.type === tokenLinkClose) {
			let closeOpenLinks = false;
			for (let j = i; j >= 0; j--) {
				const openTK = stack[j];

				if (closeOpenLinks) {
					if (openTK.type === tokenLinkOpen) {
						openTK.type = tokenText;
					}
				} else if (openTK.type === tokenImageOpen || openTK.type === tokenLinkOpen) {
					if (!processLinkImage(uid, stack, j, i + 1)) {
						openTK.type = tokenText;
					}

					if (openTK.type == tokenImageOpen) {
						break;
					}

					closeOpenLinks = true;
				}
			}

			closeTK.type = tokenText;
		}
	}
      },
      isWhitespace = /\s/,
      isPunctuation = /\p{P}/u,
      isLeftFlanking = (stack: Token[], pos: number) => {
	const openTK = stack[pos];

	if (openTK.type === tokenEmphasis) {
		const lastChar = stack?.[pos - 1].data.at(-1) ?? "",
		      nextChar = stack?.[pos + 1].data.at(0) ?? " ";

		return !isWhitespace.test(nextChar) && (!isPunctuation.test(nextChar) || isWhitespace.test(lastChar) || isPunctuation.test(lastChar));
	}

	return false;
      },
      isRightFlanking = (stack: Token[], pos: number) => {
	const closeTk = stack[pos];

	if (closeTk.type === tokenEmphasis) {
		const lastChar = stack?.[pos - 1].data.at(-1) ?? "",
		      nextChar = stack?.[pos + 1].data.at(0) ?? " ";

		return !isWhitespace.test(lastChar) && (!isPunctuation.test(lastChar) || isWhitespace.test(nextChar) || isPunctuation.test(nextChar));
	}

	return false;
      },
      isEmphasisOpening = (stack: Token[], pos: number) => {
	if (isLeftFlanking(stack, pos)) {
		if (stack[pos].data.at(0) === "_" && (isRightFlanking(stack, pos) || !isPunctuation.test(stack?.[pos - 1].data.at(-1) ?? "_"))) {
			return false;
		}

		return true;
	}

	return false;
      },
      isEmphasisClosing = (stack: Token[], pos: number) => {
	if (isRightFlanking(stack, pos)) {
		if (stack[pos].data.at(0) === "_" && (isLeftFlanking(stack, pos) || !isPunctuation.test(stack?.[pos + 1].data.at(0) ?? "_"))) {
			return false;
		}

		return true;
	}

	return false;
      },
      processEmphasis = (uid: string, stack: Token[]) => {
	const levels = [0, 0, 0];

	Loop:
	for (let i = 1; i < stack.length; i++) {
		if (isEmphasisClosing(stack, i)) {
			const level = stack[i].data.length % 3;

			for (let j = i - 1; j >= levels[level]; j--) {
				if (isEmphasisOpening(stack, j)) {
					const isStrong = stack[i].data.length > 1 && stack[j].data.length > 1,
					      tag = isStrong ? "STRONG" : "EM",
					      chars = isStrong ? 2 : 1,
					      closingTag = {"type": tokenHTML, "data": closeTag(tag)},
					      openingTag = {"type": tokenHTML, "data": openTag(uid, tag)};

					for (let k = j + 1; k < i; k++) {
						switch (stack[k].type) {
						case tokenLinkOpen:
						case tokenImageOpen:
						case tokenEmphasis:
							stack[k].type = tokenText;
						}
					}

					stack[i].data = stack[i].data.slice(chars);
					stack[j].data = stack[j].data.slice(chars);

					if (stack[i].data) {
						stack.splice(i, 0, closingTag);
						i++;
					} else {
						stack[i] = closingTag;
					}

					if (stack[j].data) {
						stack.splice(j, 0, openingTag);
						i++;
					} else {
						stack[j] = openingTag;
					}

					continue Loop;
				}
			}

			levels[level] = i;

			if (!isEmphasisOpening(stack, i)) {
				stack[i].type = tokenText;
			}

		}
	}
      },
      parseInline = (uid: string, text: string) => {
	const stack = Parser(text, parseText, p => {
		p.exceptRun(TokenDone);

		return p.return(0);
	      }).next().value.data;

	processLinksAndImages(uid, stack);

	processEmphasis(uid, stack);

	let res = "";

	for (const tk of stack) {
		switch (tk.type) {
		case tokenCode:
			encoder.textContent = tk.data.replace(/^`+/, "").replace(/`+$/, "").replaceAll("\n", " ").replace(/^ (.+) $/, "$1");
			res += tag(uid, "CODE", encoder.innerHTML);

			break;
		case tokenHTML:
			res += tk.data;

			break;
		default:
			encoder.textContent = punctuation.split("").reduce((text, char) => text.replaceAll("\\"+char, char), tk.data);

			res += encoder.innerHTML;

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
	"STRONG": "bold"
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
      openTag = (uid: string, name: string, close = false, attr?: [string, string]) => `<${name} ${uid}="" ${attr ? ` ${attr[0]}=${JSON.stringify(attr[1])}` : ""}` + (close ? " />" : ">"),
      closeTag = (name: string) => `</${name}>`,
      tag = (uid: string, name: string, contents?: string, attr?: [string, string]) => {
		const close = contents === undefined;

		return openTag(uid, name, close, attr) + (close ? "" : contents + closeTag(name));
      },
      isOpenParagraph = (b?: Block): b is ParagraphBlock => b instanceof ParagraphBlock && b.open,
      isLastGrandChildOpenParagraph = (b?: Block): boolean => b instanceof ContainerBlock ? isLastGrandChildOpenParagraph(b.children.at(-1)) : b instanceof ParagraphBlock ? b.open : false,
      isLazyBlock = (tk: Tokeniser, inList = false) => {
	tk.reset();

	const ftk = new Tokeniser({"next": () => ({"value": tk.next(), "done": false})});

	for (const block of parseBlock) {
		acceptThreeSpaces(ftk);

		const b = block(ftk, !inList || block !== parseListBlockStart);

		if (b) {
			tk.reset();

			return false;
		}

		ftk.reset();
	}

	return true;
      },
      readEOL = (tk: Tokeniser) => {
	tk.exceptRun("\n");
	tk.next();

	return tk.get();
      },
      links = new Map<string, [string, string?]>();

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

	toHTML(uid: string) {
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
		const tmpl = makeNode("template");

		tmpl.innerHTML = this.toHTML(this.#uid);

		const ret = sanitise(tmpl.content.childNodes, tags, this.#uid);

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
			if (!tk.acceptRun(whiteSpace) || tk.accept("\n")) {
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
		return tag(uid, "BLOCKQUOTE", super.toHTML(uid));
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
			tk.accept("\n");
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

		return tag(uid, "LI", super.toHTML(uid));
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

		parseInOrder(tk, "    ");

		if (tk.peek() === " ") {
			tk.backup();
			tk.backup();
			tk.backup();
		}

		this.#spaces = tk.length();

		const marker = tk.get().trimEnd();

		tk.acceptRun(whiteSpace);

		if (tk.accept("\n")) {
			this.#spaces = marker.length + 1;
		}

		this.#lastSpaces = this.#spaces;

		tk.reset();

		this.#marker = marker.trimStart();

		this.children.push(new ListItemBlock(tk));
	}

	#newItem(tk: Tokeniser) {
		if (tk.length() > 3) {
			return false;
		}

		switch (this.#marker) {
		case "-":
		case "+":
		case "*":
			if (tk.accept(this.#marker) && (tk.accept(whiteSpace) || tk.peek() === "\n") || tk.peek() === "") {
				break;
			}

			return false;
		default:
			if (tk.accept(number)) {
				tk.acceptRun(number);

				if (tk.accept(this.#marker.at(-1)!) && (tk.accept(whiteSpace) || tk.peek() === "\n") || tk.peek() === "") {
					break;
				}
			}

			return false;
		}

		if (tk.peek() !== "\n" && tk.peek() !== "") {
			for (let i = tk.length(); i < this.#spaces; i++) {
				if (!tk.accept(" ")) {
					return false;
				}
			}
		}

		let lastSpaces = tk.length();

		if (tk.peek() === "\n") {
			lastSpaces++;
		}

		if (lastSpaces >= this.#spaces) {
			this.#lastSpaces = lastSpaces;
		}

		tk.get();

		return true;
	}

	accept(tk: Tokeniser, lazy: boolean) {
		tk.acceptRun(whiteSpace);

		const empty = tk.accept("\n") || tk.peek() === "";

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
				if (!tk.accept(" ")) {
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

		let attr: [string, string] | undefined = undefined,
		    type = "UL";

		switch (this.#marker) {
		case "-":
		case "+":
		case "*":
			break;
		default:
			const start = this.#marker.slice(0, -1).replace(/^0+(?!$)/, "");

			type = "OL";

			if (start !== "1") {
				attr = ["start", start];
			}
		}

		return tag(uid, type, super.toHTML(uid), attr);
	}
}

abstract class LeafBlock extends Block {
	lines: string[] = [];

	accept(_: Tokeniser) {
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
			this.open = tk.acceptRun(whiteSpace) !== "\n";

			break;
		}

		this.lines.push(readEOL(tk));

		return true;
	}

	toHTML() {
		return this.lines.join("");
	}
}

class ParagraphBlock extends LeafBlock {
	#settextLevel = 0;
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

			if (!tk.acceptRun(whiteSpace) || tk.accept("\n")) {
				this.#settextLevel = 1 + +(stChar === '-');
				this.open = false;

				tk.get();

				return true;
			}
		} else if (tk.acceptRun(whiteSpace) === "\n") {
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
			return this.loose || this.#settextLevel ? tag(uid, this.#settextLevel === 0 ? "P" : "H" + this.#settextLevel, text) : text;
		}

		return "";
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

		this.#text = readEOL(tk).trim().replace(/[ \t]+#*$/, "");
	}

	toHTML(uid: string) {
		return tag(uid, "H" + this.#level, parseInline(uid, this.#text));
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

			if (!last || last === "\n") {
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

		if (line !== "\n" || this.lines.length) {
			this.lines.push(line);
		}

		return true;
	}

	toHTML(uid: string) {
		return tag(uid, "TEXTAREA", this.lines.join(""), ["type", this.#info]);
	}
}

class IndentedCodeBlock extends LeafBlock {
	#isTab: boolean;

	constructor(tk: Tokeniser, isTab = false) {
		super();

		this.#isTab = isTab;

		this.#getLine(tk);
	}

	accept(tk: Tokeniser) {
		tk.reset();

		if (this.#isTab) {
			if (!tk.accept("\t")) {
				if (this.#getBlankLine(tk)) {
					return true;
				}

				this.open = false;

				return false;
			}
		} else {
			if (parseInOrder(tk, "    ") !== 4) {
				if (this.#getBlankLine(tk)) {
					return true;
				}

				this.open = false;

				return false;
			}
		}

		this.#getLine(tk);

		return true;
	}

	#getBlankLine(tk: Tokeniser) {
		const last = tk.acceptRun(whiteSpace);

		if (!last || last === "\n") {
			tk.next();

			tk.get();

			this.lines.push("\n");

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
		while (this.lines.at(0) === "\n") {
			this.lines.shift();
		}

		while (this.lines.at(-1) === "\n") {
			this.lines.pop();
		}

		return tag(uid, "TEXTAREA", this.lines.join(""));
	}
}

class ThematicBreakBlock extends LeafBlock {
	constructor(tk: Tokeniser) {
		super();

		tk.get();

		this.open = false;
	}

	toHTML(uid: string) {
		return tag(uid, "HR");
	}
}


export default (markdown: string, tgs: Partial<Tags> = {}) => new Document(markdown).render(Object.assign(Object.assign({}, tags), tgs));
