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
	unorderedList: (c: DocumentFragment) => Element | DocumentFragment;
	orderedList: (start: string, c: DocumentFragment) => Element | DocumentFragment;
	listItem: (c: DocumentFragment) => Element | DocumentFragment;
	thematicBreaks: () => Element | DocumentFragment;
}

const tags: Tags = Object.assign({
	"code": (_info: string, text: string) => {
		const pre = document.createElement("pre"),
		      code = pre.appendChild(document.createElement("code"));

		code.textContent = text;

		return pre;
	},
	"orderedList": (start: string, c: DocumentFragment) => {
		const ol = document.createElement("ol");

		if (start) {
			ol.setAttribute("start", start);
		}

		ol.append(c);

		return ol;
	},
	"allowedHTML": null,
	"thematicBreaks": () => document.createElement("hr")
      }, ([
	["blockquote", "blockquote"],
	["paragraphs", "p"],
	["unorderedList", "ul"],
	["listItem", "li"],
	...Array.from({"length": 6}, (_, n) => [`heading${n+1}`, `h${n+1}`] as [`heading${1 | 2 | 3 | 4 | 5 | 6}`, string])
      ] as const).reduce((o, [key, tag]) => (o[key] = (c: DocumentFragment) => {
	      const t = document.createElement(tag);

	      t.append(c);

	      return t;
      }, o), {} as Record<keyof Tags, (c: DocumentFragment) => Element>), {}),
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
		if (tk.accept(whiteSpace)) {
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

		if (tk.length() - l < 9 && tk.accept(".)") && tk.accept(whiteSpace)) {
			return new ListBlock(tk);
		}
	}

	return null;
      },
      parseATXHeader = (tk: Tokeniser) => {
	const level = +tk.accept("#") + +tk.accept("#") + +tk.accept("#") + +tk.accept("#") + +tk.accept("#") + +tk.accept("#");

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
	if (tk.accept("<") && tk.accept("!") && tk.accept("-") && tk.accept("-")) {
		return new HTMLBlock(tk, 2);
	}

	return null;
      },
      parseHTML3 = (tk: Tokeniser) => {
	if (tk.accept("<") && tk.accept("?")) {
		return new HTMLBlock(tk, 3);
	}

	return null;
      },
      parseHTML4 = (tk: Tokeniser) => {
	if (tk.accept("<") && tk.accept("!") && tk.accept(letter)) {
		return new HTMLBlock(tk, 4);
	}

	return null;
      },
      parseHTML5 = (tk: Tokeniser) => {
	if (tk.accept("<") && tk.accept("!") && tk.accept("[") && tk.accept("C") && tk.accept("D") && tk.accept("A") && tk.accept("T") && tk.accept("A") && tk.accept("[")) {
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
      acceptThreeSpaces = (tk: Tokeniser) => {
	tk.accept(" ");
	tk.accept(" ");
	tk.accept(" ");
      },
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
      encoder = document.createElement("div"),
      punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
      parseInline = (text: string) => {
	encoder.textContent = punctuation.split("").reduce((text, char) => text.replaceAll("\\"+char, char), text);

	return encoder.innerHTML;
      },
      sanitise = (childNodes: NodeListOf<ChildNode>, tags: Tags, uid: string) => {
	const df = document.createDocumentFragment();

	Loop:
	for (const node of Array.from(childNodes)) {
		if (node instanceof Element) {
			if (node.hasAttribute(uid)) {
				switch (node.nodeName) {
				case "P":
					df.append(tags.paragraphs(sanitise(node.childNodes, tags, uid)));

					break;
				case "HR":
					df.append(tags.thematicBreaks());

					break;
				case "TEXTAREA":
					df.append(tags.code(node.getAttribute("type") ?? "", node.textContent ?? ""));

					break;
				case "BLOCKQUOTE":
					df.append(tags.blockquote(sanitise(node.childNodes, tags, uid)));

					break;
				case "UL":
					df.append(tags.unorderedList(sanitise(node.childNodes, tags, uid)));

					break;
				case "OL":
					df.append(tags.orderedList(node.getAttribute("start") ?? "", sanitise(node.childNodes, tags, uid)));

					break;
				case "LI":
					df.append(tags.listItem(sanitise(node.childNodes, tags, uid)));

					break;
				default:
					df.append(tags[`heading${node.nodeName.charAt(1) as "1" | "2" | "3" | "4" | "5" | "6"}`](sanitise(node.childNodes, tags, uid)));

					break;
				}
			} else {
				if (tags.allowedHTML) {
					for (const [name, ...attrs] of tags.allowedHTML) {
						if (node.nodeName === name) {
							const tag = document.createElement(node.nodeName);

							for (const attr of attrs) {
								const a = node.getAttributeNode(attr);

								if (a) {
									tag.setAttributeNode(a);
								}
							}

							tag.append(sanitise(node.childNodes, tags, uid));

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
      isLastGrandChildOpenParagraph = (b?: Block): boolean => b instanceof ContainerBlock ? isLastGrandChildOpenParagraph(b.children.at(-1)) : b instanceof ParagraphBlock ? b.open : false;

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
			tk.exceptRun("\n");
			tk.accept("\n");
			tk.get();

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
		const tmpl = document.createElement("template");

		tmpl.innerHTML = this.toHTML(this.#uid);

		return sanitise(tmpl.content.childNodes, tags, this.#uid);
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

			tk.reset();

			const ftk = new Tokeniser({"next": () => ({"value": tk.next(), "done": false})});

			for (const block of parseBlock) {
				acceptThreeSpaces(ftk);

				const b = block(ftk, true);

				if (b) {
					tk.reset();

					this.open = false;

					return false;
				}

				ftk.reset();
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

	constructor(tk: Tokeniser) {
		super();

		this.process(tk);
	}
	accept(tk: Tokeniser) {
		return this.process(tk);
	}

	toHTML(uid: string) {
		return tag(uid, "LI", !this.loose && this.children.length === 1 && this.children[0] instanceof ParagraphBlock && !this.children[0].isHeader() ? parseInline(this.children[0].lines.join("\n").trim()) : super.toHTML(uid));
	}
}

class ListBlock extends ContainerBlock {
	#marker: string;
	#spaces: number;
	#lastEmpty = false;
	#loose = false;

	constructor(tk: Tokeniser) {
		super();


		for (let i = 1; i < 4; i++) {
			tk.accept(" ");
		}

		if (tk.peek() === " ") {
			tk.backup();
			tk.backup();
			tk.backup();
		}

		this.#spaces = tk.length();
		this.#marker = tk.get().trim();

		this.children.push(new ListItemBlock(tk));
	}

	newItem(tk: Tokeniser) {
		switch (this.#marker) {
		case "-":
		case "+":
		case "*":
			if (tk.accept(this.#marker) && tk.accept(whiteSpace)) {
				break;
			}

			return false;
		default:
			if (tk.accept(number)) {
				tk.acceptRun(number);

				if (tk.accept(this.#marker.at(-1)!) && tk.accept(whiteSpace)) {
					break;
				}
			}

			return false;
		}

		for (let i = tk.length(); i < this.#spaces; i++) {
			if (!tk.accept(" ")) {
				return false;
			}
		}

		return true;
	}

	accept(tk: Tokeniser, lazy: boolean) {
		tk.reset();

		if (tk.peek() === " ") {
			for (let i = 0; i < this.#spaces; i++) {
				if (!tk.accept(" ")) {
					if (tk.peek() === "\n") {
						this.#lastEmpty = true;

						return this.children.at(-1)!.accept(tk, lazy);
					}

					return false;
				}
			}

			tk.get();
			tk.acceptRun(whiteSpace);

			this.#lastEmpty = tk.peek() === "\n";

			tk.reset();

			return this.children.at(-1)!.accept(tk, lazy);
		} else if (tk.peek() === "\n") {
			this.#lastEmpty = true;

			return this.children.at(-1)!.accept(tk, lazy);
		} else if (this.newItem(tk)) {
			if (this.#lastEmpty) {
				this.#loose = true;
			}

			this.children.push(new ListItemBlock(tk));

			return true;
		} else {
			this.open = false;

			return false;
		}
	}

	toHTML(uid: string) {
		if (!this.#loose) {
			for (const c of this.children as ListItemBlock[]) {
				if (c.children.length > 1) {
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
					tk.except("");

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
					tk.except("");

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
					tk.except("");

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
					tk.except("");

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

		tk.exceptRun("\n");
		tk.except("");

		this.lines.push(tk.get());

		return true;
	}

	toHTML() {
		return this.lines.join("");
	}
}

class ParagraphBlock extends LeafBlock {
	#settextLevel = 0;

	constructor(tk: Tokeniser) {
		super();

		this.add(tk);
	}

	add(tk: Tokeniser) {
		tk.exceptRun("\n");
		tk.accept("\n");

		this.lines.push(tk.get().trim());
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
			tk.except("");
			tk.get();

			this.open = false;

			return true;
		}

		return false;
	}

	toHTML(uid: string) {
		const text = this.lines.join("\n").trim();

		if (text) {
			return tag(uid, this.#settextLevel === 0 ? "P" : "H" + this.#settextLevel, parseInline(text));
		}

		return "";
	}

	isHeader() {
		return !!this.#settextLevel;
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

		this.#text = tk.get().trim().replace(/[ \t]+#*$/, "");
	}

	toHTML(uid: string) {
		return tag(uid, "H" + this.#level, parseInline(this.#text));
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
				tk.accept("\n");
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

		tk.exceptRun("\n");
		tk.except("");

		const line = tk.get();

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
			if (!tk.accept(" ") || !tk.accept(" ") || !tk.accept(" ") || !tk.accept(" ")) {
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
			tk.accept("\n");

			tk.get();

			this.lines.push("\n");

			return true;
		}

		return false;
	}

	#getLine(tk: Tokeniser) {
		tk.get();

		tk.exceptRun("\n");
		tk.except("");

		this.lines.push(tk.get());

		return true;
	}

	toHTML(uid: string) {
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
