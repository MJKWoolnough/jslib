import {text as textSymbol, isOpenTag, process} from './bbcode.js';
import {div, span} from './html.js';

const simple = (fn, style) => (n, t, p) => {
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
text = (n, t) => n.appendChild(document.createTextNode(t)),
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
	[textSymbol]: text
};
