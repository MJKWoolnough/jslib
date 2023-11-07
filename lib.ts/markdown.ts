import {h1, h2, h3, h4, h5, h6, hr, p} from './html.js';

const tags = {
	"paragraphs": p,
	"thematicBreaks": hr,
	"heading1": h1,
	"heading2": h2,
	"heading3": h3,
	"heading4": h4,
	"heading5": h5,
	"heading6": h6
      } as const,
      isHeading = /^ {0,3}#{1,6}( .*)?$/,
      isSeText1 = /^ {0,3}=+[ \t]*$/,
      isSeText2 = /^ {0,3}\-+[ \t]*$/,
      isThematicBreak = [
	/^ {0,3}(\-[ \t]*){3,}[ \t]*$/,
	/^ {0,3}(\*[ \t]*){3,}[ \t]*$/,
	/^ {0,3}(_[ \t]*){3,}[ \t]*$/
      ],
      punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

class Markdown {
	refs = new Map<string, [string, string]>();

	parseBlocks(markdown: string) {
		const text: string[] = [],
		      blocks: HTMLElement[] = [],
		      pushBlock = (block?: HTMLElement) => {
			if (text.length) {
				blocks.push(tags.paragraphs(this.parseInline(text)));

				text.splice(0, text.length);
			}

			if (block) {
				blocks.push(block);
			}
		      };

		Loop:
		for (const line of markdown.split("\n")) {
			if (!line.trim()) {
				pushBlock();

				continue;
			}

			if (line.match(isHeading)) {
				const t = line.trimStart(),
				      start = t.indexOf(" ") as -1 | 1 | 2 | 3 | 4 | 5 | 6;

				pushBlock(tags[`heading${start === -1 ? t.length as 1 | 2 | 3 | 4 | 5 | 6 : start}`](this.parseInline([start === -1 ? "" : t.slice(start).replace(/(\\#)?#*$/, "$1").replace("\\#", "#").trim()])));

				continue Loop;
			}

			if (text.length) {
				if (line.match(isSeText1)) {
					const header = this.parseInline(text);

					text.splice(0, text.length);

					pushBlock(tags["heading1"](header));

					continue;
				}

				if (line.match(isSeText2)) {
					const header = this.parseInline(text);

					text.splice(0, text.length);

					pushBlock(tags["heading2"](header));

					continue;
				}
			}

			for (const tb of isThematicBreak) {
				if (line.match(tb)) {
					pushBlock(tags.thematicBreaks());

					continue Loop;
				}
			}

			text.push(line);
		}

		pushBlock();

		return blocks;
	}

	parseInline(markdown: string[]) {
		let text = markdown.join(" ");

		for (let i = 0; i < punctuation.length; i++) {
			const char = punctuation.charAt(i);

			text = text.replaceAll("\\" + char, char);
		}

		return text;
	}
}

export default (markdown: string) => {
	const df = document.createDocumentFragment();
	
	df.append(...(new Markdown()).parseBlocks(markdown));

	return df;
};
