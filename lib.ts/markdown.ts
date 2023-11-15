import type {Children} from './dom.js';
import {code, h1, h2, h3, h4, h5, h6, hr, p, pre} from './html.js';

type Tags = {
	paragraphs: (c: Children) => Element;
	thematicBreaks: () => Element;
	heading1: (c: Children) => Element;
	heading2: (c: Children) => Element;
	heading3: (c: Children) => Element;
	heading4: (c: Children) => Element;
	heading5: (c: Children) => Element;
	heading6: (c: Children) => Element;
	code: (info: string, text: string) => Element;
	allowedHTML: null | [string, string[]][];
}

class Markdown {
	refs = new Map<string, [string, string]>();
	text: string[] = [];
	base: Element | DocumentFragment;
	inHTML = -1;
	indent = false;
	fenced: [string, string, string] | null = null;
	tags: Tags;
	parser = document.createElement("template");

	constructor(base: Element | DocumentFragment, tgs: Tags) {
		this.base = base;
		this.tags = tgs;
	}

	pushBlock(block?: Element | DocumentFragment) {
		if (this.text.length) {
			this.base.append(this.indent || this.fenced ? this.tags.code(this.fenced?.[2] ?? "", this.text.join("\n")) : this.tags.paragraphs(this.parseInline(this.text)));

			this.text.splice(0, this.text.length);
		}

		if (block) {
			this.base.append(block);
		}
	}

	parseHTML(line: string) {
		if (this.inHTML < 0) {
			for (const [n, open] of isHTMLOpen.entries()) {
				if (line.match(open)) {
					this.inHTML = n;

					break;
				}
			}

			if (this.inHTML < 0) {
				return false;
			}
		}

		this.text.push(line);

		if (line.match(isHTMLClose[this.inHTML])) {
			this.inHTML = -1;

			this.parser.innerHTML =  this.text.join("\n");

			this.text.splice(0, this.text.length);

			this.pushBlock(this.parser.content);
		}

		return true;
	}

	parseFencedCodeBlock(line: string) {
		if (this.fenced) {
			if (line.match(isEndFenced) && line.trim().startsWith(this.fenced[0])) {
				this.text.push("");

				this.pushBlock();

				this.fenced = null;

				return true;
			}

			for (let toRemove = this.fenced[1]; toRemove.length; toRemove = toRemove.slice(1)) {
				if (line.startsWith(toRemove)) {
					line = line.slice(toRemove.length);

					break;
				}
			}

			this.text.push(line);

			return true;
		}

		if (line.match(isFenced)) {
			const spaces = line.search(/\S/),
			      trimmed = line.trim(),
			      markers = trimmed.search(/[^`~]|$/),
			      info = trimmed.replace(/^[`~]*/, "").trim();

			this.fenced = [trimmed.slice(0, markers), line.slice(0, spaces), info];

			return true;
		}

		return false;
	}

	parseIndentedCodeBlock(line: string) {
		if (!this.text.length && line.match(isIndent)) {
			this.indent = true;
		}

		if (this.indent) {
			if (line.match(isIndent)) {
				this.text.push(line.replace(isIndent, ""));

				return true;
			} else if (line.match(isIndentBlankContinue)) {
				this.text.push("");

				return true;
			} else {
				this.text.push("");

				this.pushBlock();

				this.indent = false;
			}
		}

		return false;
	}

	parseEmptyLine(line: string) {
		if (!line.trim()) {
			this.pushBlock();

			return true;
		}

		return false;
	}

	parseHeading(line: string) {
		if (line.match(isHeading)) {
			const t = line.trimStart(),
			      start = t.indexOf(" ") as -1 | 1 | 2 | 3 | 4 | 5 | 6;

			this.pushBlock(this.tags[`heading${start === -1 ? t.length as 1 | 2 | 3 | 4 | 5 | 6 : start}`](this.parseInline([start === -1 ? "" : t.slice(start).replace(/(\\#)?#*$/, "$1").replace("\\#", "#").trim()])));

			return true;
		}

		return false;
	}

	parseSetextHeading(line: string) {
		if (this.text.length) {
			const heading: 0 | 1 | 2 = line.match(isSeText1) ? 1 : line.match(isSeText2) ? 2 : 0;

			if (heading !== 0) {
				const header = this.parseInline(this.text);

				this.text.splice(0, this.text.length);

				this.pushBlock(this.tags[`heading${heading}`](header));

				return true;
			}
		}

		return false;
	}

	parseThematicBreak(line: string) {
		for (const tb of isThematicBreak) {
			if (line.match(tb)) {
				this.pushBlock(this.tags.thematicBreaks());

				return true;
			}
		}

		return false;
	}

	parseBlocks(markdown: string) {
		Loop:
		for (const line of markdown.split("\n")) {
			for (const parser of parsers) {
				if (parser.call(this, line)) {
					continue Loop;
				}
			}

			this.text.push(line);
		}

		this.pushBlock();
	}

	parseInline(markdown: string[]) {
		return punctuation.split("").reduce((text, char) => text.replaceAll("\\"+char, char), markdown.join("\n"))
	}
}

const tags: Tags = {
	"paragraphs": p,
	"thematicBreaks": hr,
	"heading1": h1,
	"heading2": h2,
	"heading3": h3,
	"heading4": h4,
	"heading5": h5,
	"heading6": h6,
	"code": (_info: string, text: string) => pre(code(text)),
	"allowedHTML": null
      },
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
      isFenced = /^ {0,3}(````*|~~~~*)([^`][^`]*)?[ \t]*$/,
      isEndFenced = /^ {0,3}(````*|~~~~*)[ \t]*$/,
      punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
      isHTMLOpen = [
	      /^ {0,3}<(pre|script|style|textarea)([ \t>]|$)/i,
	      /^ {0,3}<!--/,
	      /^ {0,3}<\?/,
	      /^ {0,3}<![A-Za-z]/,
	      /^ {0,3}<!\[CDATA\[/
      ],
      isHTMLClose = [
	      /<\/(pre|script|style|textarea)>/i,
	      /-->/,
	      /\?>/,
	      />/,
	      /]]>/
      ],
      parsers = ([
	"parseHTML",
	"parseFencedCodeBlock",
	"parseIndentedCodeBlock",
	"parseEmptyLine",
	"parseHeading",
	"parseSetextHeading",
	"parseThematicBreak"
      ] as const).map(k => Markdown.prototype[k]);

export default (markdown: string, tgs: Partial<Tags> = {}) => {
	const df = document.createDocumentFragment();
	
	new Markdown(df, Object.assign(Object.assign({}, tags), tgs)).parseBlocks(markdown);

	return df;
};
