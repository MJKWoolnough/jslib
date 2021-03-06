import {text as textSymbol, isOpenTag, isString, isCloseTag, process} from './bbcode.js';
import {formatText} from './dom.js';
import {a, audio as aaudio, div, blockquote, fieldset, h1 as ah1, h2 as ah2, h3 as ah3, h4 as ah4, h5 as ah5, h6 as ah6, hr as ahr, img as aimg, legend, li, ol, pre, span, table as atable, tbody, td, tfoot, thead, th, tr, ul} from './html.js';

const simple = (fn, style) => (n, t, p) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		process(n.appendChild(fn({style})), t, p, tk.tagName);
	}
      },
      textContents = (t, endTag) => {
		let contents = "";
		while (true) {
			const end = t.next().value;
			if (!end || isCloseTag(end) && end.tagName === endTag) {
				return contents;
			}
			contents += isString(end) ? end : end.fullText;
		}
      };

export const b = simple(span, "font-weight: bold;"),
i = simple(span, "font-style: italic"),
u = simple(span, "text-decoration: underline"),
s = simple(span, "text-decoration: line-through"),
left = simple(div, "text-align: left"),
centre = simple(div, "text-align: center"),
center = centre,
right = simple(div, "text-align: right"),
justify = simple(div, "text-align: justify"),
full = justify,
colour = (n, t, p) => {
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
size = (n, t, p) => {
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
font = (n, t, p) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		process(!tk.attr || tk.attr.includes(';') ? n : n.appendChild(span({"style": `font-family: ${tk.attr}`})), t, p, tk.tagName);
	}
},
h1 = simple(ah1),
h2 = simple(ah2),
h3 = simple(ah3),
h4 = simple(ah4),
h5 = simple(ah5),
h6 = simple(ah6),
hr = simple(ahr),
url = (n, t, p) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		if (tk.attr) {
			try {
				process(n.appendChild(a({"href": (new URL(tk.attr, window.location.href)).href})), t, p, tk.tagName);
			} catch{
				p[textSymbol](n, tk.fullText);
			}
		} else {
			const u = textContents(t, tk.tagName);
			try {
				const url = new URL(u, window.location.href);
				n.appendChild(a({"href": url.href}, u));
			} catch {
				p[textSymbol](n, tk.fullText);
				p[textSymbol](n, u);
				const endTag = t.next(true).value;
				if (endTag && isCloseTag(endTag)) {
					p[textSymbol](n, endTag.fullText);
				}
			}
		}
	}
},
audio = (n, t, p) => {
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
				const u = new URL(src, window.location.href);
				n.appendChild(aaudio({"src": u.href, "controls": true}));
			} catch {
				p[textSymbol](n, tk.fullText);
				p[textSymbol](n, src);
				p[textSymbol](n, endTag.fullText);
			}
		}
	}
},
img = (n, t, p) => {
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
			const u = new URL(src, window.location.href);
			src = u.href;
		} catch {
			p[textSymbol](n, tk.fullText);
			p[textSymbol](n, src);
			p[textSymbol](n, endTag.fullText);
			return;
		}
		const params = {src};
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
		n.appendChild(aimg(params));
	}
},
code = (n, t) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		n.appendChild(pre(textContents(t, tk.tagName)));
	}
},
table = (n, t, p) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		const tableHeader = [],
		      tableBody = [],
		      tableFooter = [];
		let state = 0, // 1 - tr, 2 - thead, 4 -> tbody, 8 -> tfoot
		    hasHeader = false,
		    hasBody = false,
		    hasFooter = false,
		    currRow = null;
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
						state = 2
					}
					break;
				case "tbody":
					if (!hasBody) {
						hasBody = true;
						state = 4;
					}
					break;
				case "tfoot":
					if (hasFooter) {
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
						process(currRow.appendChild(tk.tagName === "th" ? th() : td()), t, p, tk.tagName);
					}
				}
			} else if (isCloseTag(tk)) {
				if (tk.tagName === "table") {
					n.appendChild(atable([
						tableHeader.length > 0 ? thead(tableHeader) : [],
						tableBody.length > 0 ? tbody(tableBody) : [],
						tableFooter.length > 0 ? tfoot(tableFooter) : []
					]));
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
quote = (n, t, p) => {
	const tk = t.next(true).value;
	if (tk && isOpenTag(tk)) {
		const f = n.appendChild(fieldset());
		if (tk.attr) {
			f.appendChild(legend(tk.attr));
		}
		process(f.appendChild(blockquote()), t, p, tk.tagName);
	}
},
list = (n, t, p) => {
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
		const l = n.appendChild(type === "" ? ul() : ol({type})),
		      lname = tk.tagName;
		let currItem = null;
		while (true) {
			const tk = t.next().value;
			if (!tk) {
				return;
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
						currItem = l.appendChild(li());
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
			} else if (isCloseTag(tk) && tk.tagName === lname) {
				return;
			} else if (currItem) {
				if (isOpenTag(tk) && p[tk.tagName]) {
					p[tk.tagName](currItem, t, p);
				} else {
					p[textSymbol](currItem, tk.fullText);
				}
			}
		}
	}
},
text = (n, t) => n.appendChild(formatText(t)),
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
	hr,
	url,
	audio,
	img,
	code,
	table,
	quote,
	list,
	[textSymbol]: text
});
