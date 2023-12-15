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
      whiteSpace = " \t",
      letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      number = "0123456789",
      htmlElements = ["pre", "script", "style", "textarea", "address", "article", "aside", "base", "basefont", "blockquote", "body", "caption", "center", "col", "colgroup", "dd", "details", "dialog", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "iframe", "legend", "li", "link", "main", "menu", "menuitem", "nav", "noframes", "ol", "optgroup", "option", "p", "param", "section", "source", "summary", "table", "tbody", "td", "tfoot", "th", "thead", "title", "tr", "track", "ul"],
      type1Elements = htmlElements.slice(0, 4),
      parseIndentedCodeBlockStart = (tk: Tokeniser, inParagraph: boolean) => {
	if (!inParagraph && tk.accept(" ")) {
		return new IndentedCodeBlock(tk);
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
					return new ThematicBreakBlock();
				}
			}
		}
	}

	return null;
      },
      parseListBlockStart = (tk: Tokeniser) => {
	const lbChar = tk.next();

	switch (lbChar) {
	case '*':
	case '-':
	case '+':
		if (tk.accept(whiteSpace)) {
			return new ListBlock(lbChar);
		}

		break;
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
		const l = tk.length();

		tk.acceptRun(number);

		if (tk.length() - l < 9 && tk.accept(".)") && tk.accept(whiteSpace)) {
			const n = tk.get().trim().slice(0, -1);

			return new ListBlock(n);
		}
	}

	return null;
      },
      parseATXHeader = (tk: Tokeniser) => {
	const level = +tk.accept("#") + +tk.accept("#") + +tk.accept("#") + +tk.accept("#") + +tk.accept("#") + +tk.accept("#");

	if (level > 0 && tk.accept(whiteSpace) || tk.peek() === "\n" || !tk.peek()) {
		return new ATXHeadingBlock(tk, level);
	}

	return null;
      },
      parseFencedCodeBlockStart = (tk: Tokeniser) => {
	const fcbChar = tk.next();

	switch (fcbChar) {
	case '`':
	case '~':
		if (tk.accept(fcbChar) && tk.accept(fcbChar) && tk.exceptRun("\n" + (fcbChar === '`' ? '`' : "")) !== fcbChar) {
			return new FencedCodeBlock(tk);
		}
	}

	return null;
      },
      parseHTML = (tk: Tokeniser, inParagraph: boolean) => {
	if (!tk.accept("<")) {
		return null;
	}

	const close = tk.accept("/"),
	      tag = tk.acceptWord(htmlElements, false),
	      i = htmlElements.indexOf(tag.toLowerCase());

	let htmlKind = 0;

	if (close) {
		if (i === -1) {
			if (!inParagraph && tk.accept(letter)) {
				tk.acceptRun(letter + number + "-");
				tk.acceptRun(whiteSpace);
				tk.acceptRun("\n");
				tk.acceptRun(whiteSpace);
				if (tk.accept(">")) {
					htmlKind = 7;
				}
			}
		} else if (tk.accept(whiteSpace) || tk.peek() === "\n" || (tk.accept("/") && tk.accept(">"))) {
			htmlKind = 6;
		}
	} else if (i === -1) {
		if (tag) {
			if (!inParagraph) {
				while (true) {
					tk.acceptRun(whiteSpace);
					tk.accept("\n");
					tk.acceptRun(whiteSpace);

					if (tk.accept("/")) {
						if (tk.accept(">")) {
							htmlKind = 7;

							break;
						}

						return null;
					} else if (tk.accept(">")) {
						htmlKind = 7;

						break;
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
		} else if (tk.accept("!")) {
			if (tk.accept("-")) {
				if (tk.accept("-")) {
					htmlKind = 2;
				}
			} else if (tk.accept(letter)) {
				htmlKind = 4;
			} else if (tk.accept("[") && tk.accept("C") && tk.accept("D") && tk.accept("A") && tk.accept("T") && tk.accept("A") && tk.accept("[")) {
				htmlKind = 5;
			}
		} else if (tk.accept("?")) {
			htmlKind = 3;
		}
	} else if (i < 4) {
		if (tk.accept(whiteSpace) || tk.peek() === "\n") {
			htmlKind = 1;
		}
	} else {
		if (tk.accept(whiteSpace) || tk.peek() === "\n" || (tk.accept("/") && tk.accept(">"))) {
			htmlKind = 6;
		}
	}

	tk.exceptRun("\n");

	return new HTMLBlock(tk, htmlKind);
      },
      parseParagraph = (tk: Tokeniser, inParagraph: boolean) => {
	if (!inParagraph) {
		return new ParagraphBlock(tk);
	}

	return null;
      },
      parseBlock: ((tk: Tokeniser, inParagraph: boolean) => Block | null)[] = [
	parseIndentedCodeBlockStart,
	parseBlockQuoteStart,
	parseThematicBreak,
	parseListBlockStart,
	parseATXHeader,
	parseFencedCodeBlockStart,
	parseHTML,
	parseParagraph
      ],
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
      };

abstract class Block {
	open = true;

	abstract accept(tk: Tokeniser): boolean;

	abstract toHTML(uid: string): string;
}

abstract class ContainerBlock extends Block {
	children: Block[] = [];

	newBlock(tk: Tokeniser) {
		const nb = this.parseBlockStart(tk, false);

		if (nb) {
			this.children.push(nb);
		}
	}

	process(tk: Tokeniser) {
		const lastChild = this.children.at(-1),
		      inParagraph = lastChild instanceof ParagraphBlock

		if (lastChild?.open) {
			tk.accept(" ");
			tk.accept(" ");
			tk.accept(" ");

			if (lastChild.accept(tk)) {
				return true;
			}

			tk.reset();
		}

		for (const block of parseBlock) {
			tk.accept(" ");
			tk.accept(" ");
			tk.accept(" ");

			const b = block(tk, inParagraph);

			if (b) {
				this.children.push(b);

				return true;
			} else {
				tk.reset();
			}
		}

		return false;
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
			if (!this.accept(tk)) {
				this.newBlock(tk);
			}
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
	}

	accept(tk: Tokeniser) {
		if (tk.accept(">")) {
			tk.accept(" ");
			tk.get();

			this.process(tk);

			return true;
		}

		return false;
	}

	toHTML(uid: string) {
		return tag(uid, "BLOCKQUOTE", super.toHTML(uid));
	}
}


class ListBlock extends ContainerBlock {
	#marker: string;

	constructor(marker: string) {
		super();

		this.#marker = marker;
	}

	newItem(tk: Tokeniser) {
		switch (this.#marker) {
		case "-":
		case "+":
		case "*":
			if (tk.accept(this.#marker) && tk.accept(whiteSpace)) {
				tk.get();

				return true;
			}

			break;
		default:
			if (tk.accept(number)) {
				tk.acceptRun(number);

				if (tk.accept(".)")) {
					tk.get();
					this.process(tk);

					return true;
				}
			}
		}

		return false;
	}

	accept(_: Tokeniser) {
		return false;
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

		this.lines.push(tk.get());

		this.#htmlKind = htmlKind;
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
					tk.except("?");

					if (tk.accept(">")) {
						this.open = false;

						break S;
					}
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

		return false;
	}

	toHTML() {
		return this.lines.join();
	}
}

class ParagraphBlock extends LeafBlock {
	#settextLevel = 0;

	constructor(tk: Tokeniser) {
		super();

		this.add(tk);
	}

	add(tk: Tokeniser) {
		tk.acceptRun("\n");
		tk.accept("\n");

		this.lines.push(tk.get());
	}

	accept(tk: Tokeniser) {
		if (tk.acceptRun(whiteSpace) === "\n") {
			this.open = false;
		} else {
			tk.exceptRun("\n");
			tk.except("");

			this.lines.push(tk.get());
		}

		return false;
	}

	toHTML(uid: string) {
		return tag(uid, this.#settextLevel === 0 ? "P" : "H" + this.#settextLevel, this.lines.join());
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

	toHTML(uid: string) {
		return tag(uid, "H" + this.#level, this.#text);
	}
}

class FencedCodeBlock extends LeafBlock {
	#info: string;

	constructor(tk: Tokeniser) {
		super();

		this.#info = tk.get().trim().replace(/^`+/, "");
	}

	accept(tk: Tokeniser) {
		tk.exceptRun("\n");
		tk.except("");

		this.lines.push(tk.get());

		return false;
	}

	toHTML(uid: string) {
		return tag(uid, "TEXTAREA", this.lines.join(), ["type", this.#info]);
	}
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

	accept(tk: Tokeniser) {
		if (this.#isTab) {
			if (!tk.accept("\t")) {
				this.open = false;

				return false;
			}
		} else {
			if (!tk.accept(" ") || !tk.accept(" ") || !tk.accept(" ") || !tk.accept(" ")) {
				this.open = false;

				return false;
			}
		}

		tk.exceptRun("\n");
		tk.except("");

		this.lines.push(tk.get());

		return false;
	}

	toHTML(uid: string) {
		return tag(uid, "TEXTAREA", this.lines.join());
	}
}

class ThematicBreakBlock extends LeafBlock {
	constructor() {
		super();

		this.open = false;
	}

	toHTML(uid: string) {
		return tag(uid, "HR");
	}
}


export default (markdown: string, tgs: Partial<Tags> = {}) => new Document(markdown).render(Object.assign(Object.assign({}, tags), tgs));
