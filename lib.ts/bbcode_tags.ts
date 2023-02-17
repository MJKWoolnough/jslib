import type {Parsers, Tokeniser} from './bbcode.js';
import type {DOMBind} from './dom.js';
import {isCloseTag, isOpenTag, isString, process, text as textSymbol} from './bbcode.js';
import {amendNode} from './dom.js';
import {a, audio as aaudio, blockquote, br, div, fieldset, h1 as ah1, h2 as ah2, h3 as ah3, h4 as ah4, h5 as ah5, h6 as ah6, hr as ahr, img as aimg, legend, li, mark, ol, pre, span, table as atable, tbody, td, tfoot, th, thead, tr, ul} from './html.js';

/**
 * This module contains many standard {@link https://en.wikipedia.org/wiki/BBCode | BBCode} tags parsers, and a default text processor.
 *
 * This module directly imports the {@link module:bbcode}, {@link module:dom}, and {@link module:html} modules.
 *
 * @module bbcode_tags
 * @requires module:bbcode
 */
/** */

const simple = (fn: DOMBind<Node>, style?: string) => (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		amendNode(n, process(fn({style}), t, p, tk.tagName));
	}
      },
      textContents = (t: Tokeniser, endTag: string) => {
	let contents = "";
	while (true) {
		const end = t.next().value;
		if (!end || isCloseTag(end) && end.tagName === endTag) {
			return contents;
		}
		contents += isString(end) ? end : end.fullText;
	}
      };

export const
/** Bold Tag */
b = simple(span, "font-weight: bold"),
/** Italic Tag */
i = simple(span, "font-style: italic"),
/** Underline Tag */
u = simple(span, "text-decoration: underline"),
/** Strikethrough Tag */
s = simple(span, "text-decoration: line-through"),
/** Left Align Tag */
left = simple(div, "text-align: left"),
/** Centre Align Tag */
centre = simple(div, "text-align: center"),
/** Center (US) Align Tag */
center = centre,
/** Right Align Tag */
right = simple(div, "text-align: right"),
/** Full Justify Tag */
justify = simple(div, "text-align: justify"),
/** Full Justify Tag */
full = justify,
/** Highlight Tag */
highlight = simple(mark),
/**
 * Colour Tag, accepts any {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value | CSS Colour Value}
 */
colour = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		if (tk.attr) {
			amendNode(n, process(span({"style": {"color": tk.attr}}), t, p, tk.tagName));
		} else {
			p[textSymbol](n, tk.fullText);
		}
	}
},
/**
 * Color Tag, accepts any {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value | CSS Colour Value}
 */
color = colour,
/** Font Size Tag, accepts an integer between 1 and 100 (inclusive) as a font size. */
size = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		const size = tk.attr ? parseInt(tk.attr) : 0;
		if (size > 0 && size <= 100) {
			amendNode(n, process(span({"style": {"font-size": (size/10) + "em"}}), t, p, tk.tagName));
		} else {
			p[textSymbol](n, tk.fullText);
		}
	}
},
/*
 * Font Tag, accepts any value that can be accepted by the {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font-family | font-family} CSS property.
 */
font = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		if (tk.attr) {
			amendNode(n, process(span({"style": {"font-family": tk.attr}}), t, p, tk.tagName));
		} else {
			p[textSymbol](n, tk.fullText);
		}
	}
},
/** H1 Header Tag */
h1 = simple(ah1),
/** H2 Header Tag */
h2 = simple(ah2),
/** H3 Header Tag */
h3 = simple(ah3),
/** H4 Header Tag */
h4 = simple(ah4),
/** H5 Header Tag */
h5 = simple(ah5),
/** H6 Header Tag */
h6 = simple(ah6),
/** Horizontal Rule Tag */
hr = (n: Node) => amendNode(n, ahr()),
/** Link Tag, will accepts a URL as an attribute. If no attribute is specified, it will attempt to parse the contents as a URL. */
url = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		if (tk.attr) {
			try {
				amendNode(n, process(a({"href": (new URL(tk.attr, window.location.href)).href}), t, p, tk.tagName));
			} catch{
				p[textSymbol](n, tk.fullText);
			}
		} else {
			const u = textContents(t, tk.tagName),
			      endTag = t.next(true).value;
			if (u && endTag && isCloseTag(endTag)) {
				try {
					amendNode(n, a({"href": (new URL(u, window.location.href)).href}, u));
					return;
				} catch {}
			}
			p[textSymbol](n, tk.fullText);
			p[textSymbol](n, u);
			if (endTag && isCloseTag(endTag)) {
				p[textSymbol](n, endTag.fullText);
			}
		}
	}
},
/** Audio Tag, will attempt to process the contents as a URL. */
audio = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		const src = textContents(t, tk.tagName),
		      endTag = t.next(true).value;
		if (!endTag || !isCloseTag(endTag)) {
			p[textSymbol](n, tk.fullText);
			p[textSymbol](n, src);
		} else if (!src) {
			p[textSymbol](n, tk.fullText);
			if (endTag && isCloseTag(endTag)) {
				p[textSymbol](n, endTag.fullText);
			}
		} else {
			try {
				amendNode(n, aaudio({"src": (new URL(src, window.location.href)).href, "controls": true}));
			} catch {
				p[textSymbol](n, tk.fullText);
				p[textSymbol](n, src);
				p[textSymbol](n, endTag.fullText);
			}
		}
	}
},
/**
 * Image Tag, can accept dimensions as an attribute.
 *
 * Dimensions can be specified as either absolute pixels, or as a percentage of the containing element.
 *
 * Width and Height are separated by an `x` character. Either value can be omitted.
 *
 * Will attempt to process the contents as a URL for the image.
 */
img = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		let src = textContents(t, tk.tagName);
		const endTag = t.next(true).value;
		if (!endTag || !isCloseTag(endTag)) {
			p[textSymbol](n, tk.fullText);
			p[textSymbol](n, src);
			return;
		}
		if (!src) {
			p[textSymbol](n, tk.fullText);
			if (endTag && isCloseTag(endTag)) {
				p[textSymbol](n, endTag.fullText);
			}
			return;
		}
		try {
			src = (new URL(src, window.location.href)).href;
		} catch {
			p[textSymbol](n, tk.fullText);
			p[textSymbol](n, src);
			p[textSymbol](n, endTag.fullText);
			return;
		}
		const params: Record<string, string> = {src};
		if (tk.attr) {
			const [strWidth, strHeight] = tk.attr.split('x');
			if (strWidth) {
				const percent = strWidth.endsWith('%') ? '%' : '',
				      width = parseInt(percent ? strWidth.slice(0, -1) : strWidth);
				if (!isNaN(width)) {
					params["width"] = width + percent;
				}
			}
			if (strHeight) {
				const percent = strHeight.endsWith('%') ? '%' : '',
				      height = parseInt(percent ? strHeight.slice(0, -1) : strHeight);
				if (!isNaN(height)) {
					params["height"] = height + percent;
				}
			}
		}
		amendNode(n, aimg(params));
	}
},
/** Pre-formatted Code Tag */
code = (n: Node, t: Tokeniser) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		amendNode(n, pre(textContents(t, tk.tagName)));
	}
},
/**
 * Table Tag.
 *
 * Has the following sub tags:
 *
 * thead - Table Header
 * tbody - Table Body
 * tfoot - Table Footer
 * tr    - Table Row
 * th    - Table Header Cell
 * td    - Table Cell
 *
 * These tags follow the same rules as the same-named HTML counterparts.
 */
table = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		const tableHeader: HTMLTableRowElement[] = [],
		      tableBody: HTMLTableRowElement[] = [],
		      tableFooter: HTMLTableRowElement[] = [],
		      {tagName} = tk;
		let state = 0, // 1 - tr, 2 - thead, 4 -> tbody, 8 -> tfoot
		    hasHeader = false,
		    hasBody = false,
		    hasFooter = false,
		    currRow: HTMLTableRowElement | null = null;
		while (true) {
			const tk = t.next().value;
			if (!tk) {
				break;
			}
			if (isOpenTag(tk)) {
				switch (tk.tagName) {
				case "thead":
					if (!hasHeader) {
						hasHeader = true;
						state = 2;
					}
					break;
				case "tbody":
					if (!hasBody) {
						hasBody = true;
						state = 4;
					}
					break;
				case "tfoot":
					if (!hasFooter) {
						hasFooter = true;
						state = 8;
					}
					break;
				case "tr":
					if ((state&1) === 1) {
						break;
					}
					if (state === 0) {
						hasBody = true;
						state = 4;
					}
					currRow = tr();
					switch (state) {
					case 2:
						tableHeader.push(currRow);
						break;
					case 4:
						tableBody.push(currRow);
						break;
					case 8:
						tableFooter.push(currRow);
					}
					break;
				case "th":
				case "td":
					if (currRow) {
						amendNode(currRow, process(tk.tagName === "th" ? th() : td(), t, p, tk.tagName));
					}
				}
			} else if (isCloseTag(tk)) {
				if (tk.tagName === tagName) {
					if (hasHeader || hasBody || hasFooter) {
						amendNode(n, atable([
							hasHeader ? thead(tableHeader) : [],
							hasBody ? tbody(tableBody) : [],
							hasFooter ? tfoot(tableFooter) : []
						]));
					}
					return;
				} else if ((state&1) === 1 && tk.tagName === "tr") {
					state ^= 1;
					currRow = null;
				} else {
					switch (state&~1) {
					case 2:
						if (tk.tagName === "thead") {
							state = 0;
						}
						break;
					case 4:
						if (tk.tagName === "tbody") {
							state = 0;
						}
						break;
					case 8:
						if (tk.tagName === "tfoot") {
							state = 0;
						}
					}
				}
			}
		}
	}
},
/** Quotation Tag, will accept attribution as a param. */
quote = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(1).value;
	if (tk && isOpenTag(tk)) {
		amendNode(n, fieldset([
			tk.attr ? legend(tk.attr) : [],
			process(blockquote(), t, p, tk.tagName)
		]));
		t.next(1);
	}
},
/** The *list* tag creates a new list. The attribute determines what type of list, with no attribute resulting in an HTMLUListElement, and any of `a`, `A`, `i`, `I`, and `1` resulting in an HTMLOListElement with the type set to the specified value. Any children of the list should be wrapped in `[*] [/*]` tags, though the closing tag can be omitted. */
list = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		let type = "";
		switch (tk.attr) {
		case 'a':
		case 'A':
		case 'i':
		case 'I':
		case '1':
			type = tk.attr;
		}
		const l = type === "" ? ul() : ol({type}),
			{tagName} = tk;
		let currItem: HTMLLIElement | null = null;
		while (true) {
			const tk = t.next().value;
			if (!tk || (isCloseTag(tk) && tk.tagName === tagName)) {
				break;
			}
			if (isString(tk)) {
				let pos = 0;
				while (pos < tk.length) {
					const open = tk.indexOf("[*]", pos),
					      close = tk.indexOf("[/*]", pos);
					if (open < close && open !== -1 || close === -1 && open !== -1) {
						if (currItem) {
							p[textSymbol](currItem, tk.slice(pos, open));
						}
						amendNode(l, currItem = li());
						pos = open + 3;
					} else if (close < open && close !== -1 || open === -1 && close !== -1) {
						if (currItem) {
							p[textSymbol](currItem, tk.slice(pos, close));
							currItem = null;
						}
						pos = close + 4;
					} else {
						if (currItem) {
							p[textSymbol](currItem, tk.slice(pos));
						}
						break;
					}
				}
			} else if (currItem) {
				if (isOpenTag(tk) && p[tk.tagName]) {
					p[tk.tagName](currItem, t, p);
				} else {
					p[textSymbol](currItem, tk.fullText);
				}
			}
		}
		amendNode(n, l);
	}
},
/** Basic Text processor that converts all line breaks into HTMLBRElement's. */
text = (n: Node, t: string) => amendNode(n, t.split("\n").map((s, n) => [n > 0 ? br() : [], s])),
/** An object which contains all of the tag processors and the text processor. */
all = Object.freeze({
	b,
	i,
	u,
	s,
	left,
	centre,
	center,
	right,
	justify,
	full,
	colour,
	color,
	size,
	font,
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	highlight,
	hr,
	url,
	audio,
	img,
	code,
	table,
	quote,
	list,
	[textSymbol]: text
}),
/** A special tag processor that ignores the tag and continues processing the inner text. */
none = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		process(n, t, p, tk.tagName);
	}
};
