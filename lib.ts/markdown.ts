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
      parseIndentedCodeBlockStart = (tk: Tokeniser) => {
	if (tk.accept(" ")) {
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
      parseBlock = [
	parseIndentedCodeBlockStart,
	parseBlockQuoteStart,
	parseThematicBreak,
	parseListBlockStart,
	parseATXHeader,
	parseFencedCodeBlockStart
      ];

class Block {
	open = true;

	accept(_: Tokeniser) {
		return false;
	}
}

class ContainerBlock extends Block {
	children: Block[] = [];

	newBlock(tk: Tokeniser) {
		const nb = this.parseBlockStart(tk, false);

		if (nb) {
			this.children.push(nb);
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
	#info: string;
	#contents = "";

	constructor(tk: Tokeniser) {
		super();

		this.#info = tk.get().trim().replace(/^`+/, "");
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
}

class ThematicBreakBlock extends LeafBlock {
	constructor() {
		super();

		this.open = false;
	}
}


export default (markdown: string, tgs: Partial<Tags> = {}) => {
	return new Markdown(Object.assign(Object.assign({}, tags), tgs), markdown).content;
};
