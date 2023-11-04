import {p, hr} from './html.js';

const tags = {
	"paragraphs": p,
	"thematicBreaks": hr,
      } as const,
      isThematicBreak = [
	      /^ {0,3}(\-[ 	]*){3,}[ 	]*$/,
	      /^ {0,3}(\*[ 	]*){3,}[ 	]*$/,
	      /^ {0,3}(_[ 	]*){3,}[ 	]*$/
      ];

class Markdown {
	refs = new Map<string, [string, string]>();

	parseBlocks(markdown: string) {
		const blocks: HTMLElement[] = [],
		      pushBlock = (block?: HTMLElement) => {
			if (text) {
				blocks.push(tags.paragraphs(this.parseInline(text)));
			}

			if (block) {
				blocks.push(block);
			}
		      };

		let text = "";

		Loop:
		for (const line of markdown.split("\n")) {
			for (const tb of isThematicBreak) {
				if (line.match(tb)) {
					pushBlock(tags.thematicBreaks());

					continue Loop;
				}
			}
		}

		pushBlock();

		return blocks;
	}

	parseInline(markdown: string) {
		return markdown;
	}
}

export default (markdown: string) => {
	const df = document.createDocumentFragment();
	
	df.append(...(new Markdown()).parseBlocks(markdown));

	return df;
};
