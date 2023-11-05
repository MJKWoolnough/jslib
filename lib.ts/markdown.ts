import {p, h1, h2, h3, h4, h5, h6, hr} from './html.js';

const tags = {
	"paragraphs": p,
	"thematicBreaks": hr,
	"heading1": h1,
	"heading2": h2,
	"heading3": h3,
	"heading4": h4,
	"heading5": h5,
	"heading6": h6,
      } as const,
      isHeading = /^ {0,3}#{1,6}( .*)?$/,
      isThematicBreak = [
	      /^ {0,3}(\-[ 	]*){3,}[ 	]*$/,
	      /^ {0,3}(\*[ 	]*){3,}[ 	]*$/,
	      /^ {0,3}(_[ 	]*){3,}[ 	]*$/
      ];

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
			if (line.match(isHeading)) {
				const t = line.trimStart(),
				      start = t.indexOf(" ") as -1 | 1 | 2 | 3 | 4 | 5 | 6;

				pushBlock(tags[`heading${start === -1 ? t.length as 1 | 2 | 3 | 4 | 5 | 6 : start}`](this.parseInline([start === -1 ? "" : t.slice(start).replace(/(\\#)?#*$/, "$1").replace("\\#", "#").trim()])));

				continue Loop;
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
		return markdown.join(" ").replace("\\#", "#");
	}
}

export default (markdown: string) => {
	const df = document.createDocumentFragment();
	
	df.append(...(new Markdown()).parseBlocks(markdown));

	return df;
};
