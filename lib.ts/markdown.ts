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
	"code": (_info: string, text: string) => pre(code(text))
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
      punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

class Markdown {
	refs = new Map<string, [string, string]>();
	text: string[] = [];
	blocks: Element[] = [];
	indent = false;
	tags: Tags;

	constructor(tgs: Tags) {
		this.tags = tgs;
	}

	pushBlock(block?: Element) {
		if (this.text.length) {
			if (this.indent) {
				this.blocks.push(this.tags.code("", this.text.join("\n")));
			} else {
				this.blocks.push(this.tags.paragraphs(this.parseInline(this.text)));
			}

			this.text.splice(0, this.text.length);
		}

		if (block) {
			this.blocks.push(block);
		}
	}

	parseIndentedCodeBlock(line: string) {
		if (!this.text.length && line.match(isIndent)) {
			this.indent = true;
		}

		if (this.indent) {
			if (line.match(isIndent)) {
				this.text.push(line.replace(isIndent, ""));

				return true;;
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
			if (line.match(isSeText1)) {
				const header = this.parseInline(this.text);

				this.text.splice(0, this.text.length);

				this.pushBlock(this.tags["heading1"](header));

				return true;
			}

			if (line.match(isSeText2)) {
				const header = this.parseInline(this.text);

				this.text.splice(0, this.text.length);

				this.pushBlock(this.tags["heading2"](header));

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
		const parsers = [
			this.parseIndentedCodeBlock,
			this.parseEmptyLine,
			this.parseHeading,
			this.parseSetextHeading,
			this.parseThematicBreak
		] as const;

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

		return this.blocks;
	}

	parseInline(markdown: string[]) {
		let text = markdown.join("\n");

		for (let i = 0; i < punctuation.length; i++) {
			const char = punctuation.charAt(i);

			text = text.replaceAll("\\" + char, char);
		}

		return text;
	}
}

export default (markdown: string, tgs: Partial<Tags> = {}) => {
	const df = document.createDocumentFragment();
	
	df.append(...(new Markdown(Object.assign(Object.assign({}, tags), tgs))).parseBlocks(markdown));

	return df;
};
