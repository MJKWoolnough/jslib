import type {Parsers, Tokeniser} from './bbcode.js';
import type {DOMBind} from './dom.js';
import {text as textSymbol, isOpenTag, process} from './bbcode.js';
import {div, h1 as ah1, h2 as ah2, h3 as ah3, h4 as ah4, h5 as ah5, h6 as ah6, span} from './html.js';

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
