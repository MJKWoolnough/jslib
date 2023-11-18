type Tags = {
	allowedHTML: null | [string, ...string[]][];
	code: (info: string, text: string) => Element;
	heading1: (c: DocumentFragment) => Element;
	heading2: (c: DocumentFragment) => Element;
	heading3: (c: DocumentFragment) => Element;
	heading4: (c: DocumentFragment) => Element;
	heading5: (c: DocumentFragment) => Element;
	heading6: (c: DocumentFragment) => Element;
	paragraphs: (c: DocumentFragment) => Element;
	thematicBreaks: () => Element;
}

class Markdown {
	refs = new Map<string, [string, string]>();
	uid: string;
	processed = "";
	text: string[] = [];
	inHTML = -1;
	indent = false;
	blockQuote = 0;
	fenced: [string, string, string] | null = null;
	tags: Tags;
	encoder = document.createElement("div");
	line = "";

	constructor(tgs: Tags, source: string) {
		this.tags = tgs;

		while (true) {
			this.uid = "";

			while (this.uid.length < 20) {
				this.uid += String.fromCharCode(65 + Math.random() * 26);
			}

			if (!source.includes(this.uid)) {
				break;
			}
		}

		this.parseBlocks(source);
	}

	pushBlock(block?: string) {
		if (this.text.length || this.fenced) {
			this.processed += this.inHTML >= 10 ? this.text.join("\n") : this.indent || this.fenced ? this.tag("TEXTAREA", this.text.join("\n"), this.fenced ? ["type", this.fenced[2]] : undefined) : this.tag("P", this.text.join("\n"));

			this.text.splice(0, this.text.length);
		}

		if (block) {
			this.processed += block;
		}
	}

	parseHTML() {
		if (this.inHTML < 0) {
			for (const [n, open] of isHTMLOpen.entries()) {
				if (this.line.match(open)) {
					this.inHTML = n;

					break;
				}
			}

			if (this.inHTML < 0) {
				return false;
			}

			if (!this.text.length) {
				this.inHTML += 10;
			}
		}

		this.text.push(this.line);

		if (this.line.match(isHTMLClose[this.inHTML % 10])) {
			if (this.inHTML >= 10) {
				this.pushBlock();
			}

			this.inHTML = -1;
		}

		return true;
	}

	parseBlockQuote() {
		let bq = 0;

		while (this.line.match(isBlockQuote)) {
			this.line = this.line.trimStart().slice(1);

			bq++;
		}

		if (bq && this.line.startsWith(" ")) {
			this.line = this.line.slice(1);
		}

		if (this.blockQuote && !bq && this.line.match(isParagraphContinuation)) {
			const line = this.line;

			if (this.indent) {
				this.line = "-";

				this.parseIndentedCodeBlock();
			} else if (this.fenced) {
				this.line = this.fenced[0];

				this.parseFencedCodeBlock();
				console.log(1, line);
			} else {
				return false;
			}

			this.line = line;
		}

		if (bq > this.blockQuote) {
			this.pushBlock();

			for (; bq > this.blockQuote; this.blockQuote++) {
				this.processed += "<blockquote>";
			}
		} else if (bq < this.blockQuote) {
			this.pushBlock();

			for (; bq < this.blockQuote; this.blockQuote--) {
				this.processed += "</blockquote>";
			}
		}

		return false;
	}

	parseFencedCodeBlock() {
		if (this.fenced) {
			if (this.line.match(isEndFenced) && this.line.trim().startsWith(this.fenced[0])) {
				this.text.push("");

				this.pushBlock();

				this.fenced = null;

				return true;
			}

			for (let toRemove = this.fenced[1]; toRemove.length; toRemove = toRemove.slice(1)) {
				if (this.line.startsWith(toRemove)) {
					this.line = this.line.slice(toRemove.length);

					break;
				}
			}

			this.text.push(this.line);

			return true;
		}

		if (this.line.match(isFenced)) {
			this.pushBlock();

			const spaces = this.line.search(/\S/),
			      trimmed = this.line.trim(),
			      markers = trimmed.search(/[^`~]|$/),
			      info = trimmed.replace(/^[`~]*/, "").trim();

			this.fenced = [trimmed.slice(0, markers), this.line.slice(0, spaces), info];

			return true;
		}

		return false;
	}

	parseIndentedCodeBlock() {
		if (!this.text.length && this.line.match(isIndent)) {
			this.indent = true;
		}

		if (this.indent) {
			if (this.line.match(isIndent)) {
				this.text.push(this.line.replace(isIndent, ""));

				return true;
			} else if (this.line.match(isIndentBlankContinue)) {
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

	parseEmptyLine() {
		if (!this.line.trim()) {
			this.pushBlock();

			return true;
		}

		return false;
	}

	parseHeading() {
		if (this.line.match(isHeading)) {
			const t = this.line.trimStart(),
			      start = t.indexOf(" ") as -1 | 1 | 2 | 3 | 4 | 5 | 6;

			this.pushBlock(this.tag(`H${start === -1 ? t.length : start}`, this.parseInline(start === -1 ? "" : t.slice(start).replace(/(\\#)?#*$/, "$1").replace("\\#", "#").trim())));

			return true;
		}

		return false;
	}

	parseSetextHeading() {
		if (this.text.length) {
			const heading: 0 | 1 | 2 = this.line.match(isSeText1) ? 1 : this.line.match(isSeText2) ? 2 : 0;

			if (heading !== 0) {
				const header = this.text.join("\n");

				this.text.splice(0, this.text.length);

				this.pushBlock(this.tag(`H${heading}`, header));

				return true;
			}
		}

		return false;
	}

	parseThematicBreak() {
		for (const tb of isThematicBreak) {
			if (this.line.match(tb)) {
				this.pushBlock(this.tag("HR"));

				return true;
			}
		}

		return false;
	}

	parseBlocks(markdown: string) {
		Loop:
		for (this.line of markdown.split("\n")) {
			for (const parser of parsers) {
				if (parser.call(this)) {
					continue Loop;
				}
			}

			this.line = this.line.trimStart();

			this.pushText();
		}

		this.pushBlock();
	}

	get content() {
		const t = document.createElement("template");

		t.innerHTML = this.processed;

		return this.sanitise(t.content.childNodes);
	}

	sanitise(childNodes: NodeListOf<ChildNode>) {
		const df = document.createDocumentFragment();

		Loop:
		for (const node of Array.from(childNodes)) {
			if (node instanceof Element) {
				if (node.hasAttribute(this.uid)) {
					switch (node.nodeName) {
					case "P":
						df.append(this.tags.paragraphs(this.sanitise(node.childNodes)));

						break;
					case "HR":
						df.append(this.tags.thematicBreaks());

						break;
					case "TEXTAREA":
						df.append(this.tags.code(node.getAttribute("type") ?? "", node.textContent ?? ""));

						break;
					default:
						df.append(this.tags[`heading${node.nodeName.charAt(1) as "1" | "2" | "3" | "4" | "5" | "6"}`](this.sanitise(node.childNodes)));

						break;
					}
				} else {
					if (this.tags.allowedHTML) {
						for (const [name, ...attrs] of this.tags.allowedHTML) {
							if (node.nodeName === name) {
								const tag = document.createElement(node.nodeName);

								for (const attr of attrs) {
									const a = node.getAttributeNode(attr);

									if (a) {
										tag.setAttributeNode(a);
									}
								}

								tag.append(this.sanitise(node.childNodes));

								df.append(tag);

								continue Loop;
							}
						}

						df.append(this.sanitise(node.childNodes));
					} else {
						node.replaceChildren(this.sanitise(node.childNodes));

						df.append(node);
					}
				}
			} else {
				df.append(node);
			}
		}

		return df;
	}

	parseInline(text: string) {
		this.encoder.textContent = punctuation.split("").reduce((text, char) => text.replaceAll("\\"+char, char), text);

		return this.encoder.innerHTML;
	}

	pushText() {
		this.text.push(this.parseInline(this.line));
	}

	tag(name: string, contents?: string, attr?: [string, string]) {
		const open = `<${name} ${this.uid}="" ${attr ? ` ${attr[0]}=${JSON.stringify(attr[1])}` : ""}`;

		if (contents === undefined) {
			return open + " />";
		}

		return open + `>${contents}</${name}>`;
	}
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
	["paragraphs", "p"],
	...Array.from({"length": 6}, (_, n) => [`heading${n+1}`, `h${n+1}`] as [`heading${1 | 2 | 3 | 4 | 5 | 6}`, string])
      ] as const).reduce((o, [key, tag]) => (o[key] = (c: DocumentFragment) => {
	      const t = document.createElement(tag);

	      t.append(c);

	      return t;
      }, o), {} as Record<`heading${1 | 2 | 3 | 4 | 5 | 6}` | "paragraphs", (c: DocumentFragment) => Element>), {}),
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
	      /^ {0,3}<!\[CDATA\[/,
	      /^ {0,3}<\/?(address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)([ \t>]|\/>|$)/i,
	      /^ {0,3}(<\/[0-9A-Za-z][0-9A-Za-z\-]*>|<[0-9A-Za-z][0-9A-Za-z\-]*([ \t\r]+[^\x00"'>\/=\t\r]+(="([^\\"]?(\\.)*)*"|='([^']?(\\')*)')?)*[ \t]*\/?>)[ \t]*$/
      ],
      isHTMLClose = [
	      /<\/(pre|script|style|textarea)>/i,
	      /-->/,
	      /\?>/,
	      />/,
	      /]]>/,
	      /^[ \t]*$/,
	      /^[ \t]*$/
      ],
      isBlockQuote = /^ {0,3}>/,
      isParagraphContinuation = /^ {0,3}[^-]/,
      parsers = ([
	"parseBlockQuote",
	"parseFencedCodeBlock",
	"parseIndentedCodeBlock",
	"parseHTML",
	"parseEmptyLine",
	"parseHeading",
	"parseSetextHeading",
	"parseThematicBreak"
      ] as const).map(k => Markdown.prototype[k]);

export default (markdown: string, tgs: Partial<Tags> = {}) => {
	return new Markdown(Object.assign(Object.assign({}, tags), tgs), markdown).content;
};
