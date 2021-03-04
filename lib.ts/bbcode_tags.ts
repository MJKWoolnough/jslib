import type {Parsers, Tokeniser} from './bbcode.js';
import type {DOMBind} from './dom.js';
import {text as textSymbol, isOpenTag, isString, isCloseTag, process} from './bbcode.js';
import {a, div, h1 as ah1, h2 as ah2, h3 as ah3, h4 as ah4, h5 as ah5, h6 as ah6, img as aimg, span} from './html.js';

const simple = (fn: DOMBind<Node>, style: string | undefined) => (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		process(n.appendChild(fn({style})), t, p, tk.tagName);
	}
      };

export const b = simple(span, "font-weight: bold;"),
i = simple(span, "font-style: italic"),
u = simple(span, "text-decoration: underline"),
left = simple(div, "text-align: left"),
centre = simple(div, "text-align: center"),
center = centre,
right = simple(div, "text-align: right"),
justify = simple(div, "text-align: justify"),
full = justify,
colour = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		if (tk.attr && !tk.attr.includes(';')) {
			process(n.appendChild(span({"style": `color: ${tk.attr}`})), t, p, tk.tagName);
		} else {
			p[textSymbol](n, tk.fullText);
		}
	}
},
color = colour,
size = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		const size = tk.attr ? parseInt(tk.attr) : 0;
		if (size > 0 && size < 100) {
			process(n.appendChild(span({"style": `font-size: ${tk.attr}`})), t, p, tk.tagName);
		} else {
			p[textSymbol](n, tk.fullText);
		}
	}
},
h1 = simple(ah1, undefined),
h2 = simple(ah2, undefined),
h3 = simple(ah3, undefined),
h4 = simple(ah4, undefined),
h5 = simple(ah5, undefined),
h6 = simple(ah6, undefined),
url = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		if (tk.attr) {
			try {
				process(n.appendChild(a({"href": (new URL(tk.attr, window.location.href)).href})), t, p, tk.tagName);
				return;
			} catch{}
		}
		p[textSymbol](n, tk.fullText);
	}
},
img = (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		let src = "";
		while (true) {
			const end = t.next().value;
			if (!end) {
				p[textSymbol](n, tk.fullText);
				p[textSymbol](n, src);
				return;
			}
			if(isCloseTag(end) && end.tagName === tk.tagName) {
				break;
			}
			src += isString(end) ? end : end.fullText;
		}
		if (!src) {
			p[textSymbol](n, tk.fullText);
			return;
		}
		try {
			const u = new URL(src, window.location.href);
			src = u.href;
		} catch {
			p[textSymbol](n, tk.fullText);
			p[textSymbol](n, src);
			return;
		}
		const params: Record<string, string> = {src};
		if (tk.attr) {
			const [strWidth, strHeight] = tk.attr.split('x');
			if (strWidth) {
				const percent = strWidth.endsWith('%') ? '%' : '',
				      width = parseInt(percent ? strWidth.slice(-1) : strWidth);
				if (!isNaN(width)) {
					params["width"] = width + percent;
				}
			}
			if (strHeight) {
				const percent = strHeight.endsWith('%') ? '%' : '',
				      height = parseInt(percent ? strHeight.slice(-1) : strHeight);
				if (!isNaN(height)) {
					params["height"] = height + percent;
				}
			}
		}
		n.appendChild(aimg(params));
	}
},
text = (n: Node, t: string) => n.appendChild(document.createTextNode(t)),
all = {
	b,
	i,
	u,
	left,
	centre,
	center,
	right,
	justify,
	full,
	colour,
	color,
	size,
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	[textSymbol]: text
};
