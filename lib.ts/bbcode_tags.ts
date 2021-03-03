import type {Parsers, Tokeniser} from './bbcode.js';
import {text as textSymbol, isOpenTag, process} from './bbcode.js';
import {span} from './html.js';

const simple = (style: string) => (n: Node, t: Tokeniser, p: Parsers) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		process(n.appendChild(span({style})), t, p, tk.tagName);
	}
      };

export const b = simple("font-weight: bold;"),
i = simple("font-style: italic"),
u = simple("text-decoration: underline"),
text = (n: Node, t: string) => n.appendChild(document.createTextNode(t)),
all = {
	b,
	i,
	u,
	[textSymbol]: text
};
