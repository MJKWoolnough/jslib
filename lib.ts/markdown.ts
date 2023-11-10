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
	tags: Tags;

	constructor(tgs: Tags) {
		this.tags = tgs;
	}

	parseBlocks(markdown: string) {
		let indent = false;

		const text: string[] = [],
		      blocks: Element[] = [],
		      pushBlock = (block?: Element) => {
			if (text.length) {
				if (indent) {
					blocks.push(this.tags.code("", text.join("\n")));
				} else {
					blocks.push(this.tags.paragraphs(this.parseInline(text)));
				}

				text.splice(0, text.length);
			}

			if (block) {
				blocks.push(block);
			}
		      };

		Loop:
		for (const line of markdown.split("\n")) {
			if (!text.length && line.match(isIndent)) {
				indent = true;
			}

			if (indent) {
				if (line.match(isIndent)) {
					text.push(line.replace(isIndent, ""));

					continue;
				} else if (line.match(isIndentBlankContinue)) {
					text.push("");

					continue;
				} else {
					text.push("");

					pushBlock();

					indent = false;
				}
			}

			if (!line.trim()) {
				pushBlock();

				continue;
			}

			if (line.match(isHeading)) {
				const t = line.trimStart(),
				      start = t.indexOf(" ") as -1 | 1 | 2 | 3 | 4 | 5 | 6;

				pushBlock(this.tags[`heading${start === -1 ? t.length as 1 | 2 | 3 | 4 | 5 | 6 : start}`](this.parseInline([start === -1 ? "" : t.slice(start).replace(/(\\#)?#*$/, "$1").replace("\\#", "#").trim()])));

				continue Loop;
			}

			if (text.length) {
				if (line.match(isSeText1)) {
					const header = this.parseInline(text);

					text.splice(0, text.length);

					pushBlock(this.tags["heading1"](header));

					continue;
				}

				if (line.match(isSeText2)) {
					const header = this.parseInline(text);

					text.splice(0, text.length);

					pushBlock(this.tags["heading2"](header));

					continue;
				}
			}

			for (const tb of isThematicBreak) {
				if (line.match(tb)) {
					pushBlock(this.tags.thematicBreaks());

					continue Loop;
				}
			}

			text.push(line);
		}

		pushBlock();

		return blocks;
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
