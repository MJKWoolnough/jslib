import {text as textSymbol, isOpenTag, process} from './bbcode.js';
import {span} from './html.js';

const simple = style => (n, t, p) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		process(n.appendChild(span({style})), t, p, tk.tagName);
	}
      };

export const b = simple("font-weight: bold;"),
i = simple("font-style: italic"),
u = simple("text-decoration: underline"),
text = (n, t) => n.appendChild(document.createTextNode(t)),
all = {
	b,
	i,
	u,
	[textSymbol]: text
};
