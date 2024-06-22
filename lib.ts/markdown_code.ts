import type {TokenFn, Tokeniser, TokenType} from './parser.js';
import {amendNode, createDocumentFragment} from './dom.js';
import {br, span} from './html.js';
import Parser, {processToEnd} from './parser.js';

const whitespace = "\t\v\f \xa0\ufeff",
      lineTerminators = "\n\r\u2028\u2029",
      singleEscapeChar = "'\"\\bfnrtv",
      binaryDigit = "01",
      octalDigit = "01234567",
      decimalDigit = "0123456789",
      hexDigit = "0123456789abcdefABCDEF",
      stringChars = "'\\" + lineTerminators + "\"",
      doubleStringChars = stringChars.slice(1),
      singleStringChars = stringChars.slice(0, stringChars.length),
      lineSplit = new RegExp("[" + lineTerminators + "]");

export const [TokenWhitespace, TokenLineTerminator, TokenSingleLineComment, TokenMultiLineComment, TokenIdentifier, TokenPrivateIdentifier, TokenBooleanLiteral, TokenKeyword, TokenPunctuator, TokenNumericLiteral, TokenStringLiteral, TokenNoSubstitutionTemplate, TokenTemplateHead, TokenTemplateMiddle, TokenTemplateTail, TokenDivPunctuator, TokenRightBracePunctuator, TokenRegularExpressionLiteral, TokenNullLiteral, TokenFutureReservedWord] = Array.from({"length": 20}, n => n) as TokenType[],
javascript = (() => {
	let divisionAllowed = false;

	const keywords = ["await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"],
	      unicodeGroups = (groups: string[]) => new RegExp("^[" + groups.reduce((r, c) => r + `\p{${c}}`, "") + "]$"),
	      idContinue = unicodeGroups(["L", "Nl", "Other_ID_Start", "Mn", "Mc", "Nd", "Pc", "Other_ID_Continue"]),
	      idStart = unicodeGroups(["L", "Nl", "Other_ID_Start"]),
	      notID = unicodeGroups(["Pattern_Syntax", "Pattern_White_Space"]),
	      zwnj = String.fromCharCode(8204),
	      zwj = String.fromCharCode(8205),
	      isIDStart = (c: string) => {
		if (c === '$' || c === '_' || c === '\\') {
			return true;
		}

		return idStart.test(c) && !notID.test(c);
	      },
	      isIDContinue = (c: string) => {
		if (c === '$' || c === '_' || c === '\\' || c === zwnj || c === zwj) {
			return true;
		}

		return idContinue.test(c) && !notID.test(c);
	      },
	      tokenDepth: string[] = [],
	      errUnexpectedEOF = "unexpected EOF",
	      errInvalidRegexpSequence = "invalid regexp sequence",
	      error = (errText: string) => (t: Tokeniser, text = t.get()) => t.error(errText + text),
	      errInvalidCharacter = error("invalid character: "),
	      errInvalidSequence = error("invalid sequence: "),
	      errInvalidNumber = error("invalid number: "),
	      errInvalidRegexpCharacter = error("invalid regexp character"),
	      errInvalidUnicode = error("invalid unicode"),
	      errUnexpectedBackslash = error("unexpected backslash"),
	      errInvalidEscapeSequence = error("invalid escape sequence"),
	      errUnexpectedLineTerminator = error("unexpected line terminator"),
	      inputElement: TokenFn = (t: Tokeniser) => {
		if (t.accept(whitespace)) {
			t.acceptRun(whitespace);

			return [{
				"type": TokenWhitespace,
				"data": t.get()
			}, inputElement];
		}

		if (t.accept(lineTerminators)) {
			t.acceptRun(lineTerminators);

			return [{
				"type": TokenLineTerminator,
				"data": t.get()
			}, inputElement];
		}

		let allowDivision = divisionAllowed;

		divisionAllowed = false;

		const c = t.peek();

		switch (c) {
		case "":
			if (tokenDepth.length === 0) {
				return t.done();
			}

			return t.error(errUnexpectedEOF);
		case '/':
			t.except("");
			if (t.accept("/")) {
				t.exceptRun(lineTerminators);

				return [{
					"type": TokenSingleLineComment,
					"data": t.get()
				}, inputElement];
			}

			if (t.accept("*")) {
				while (true) {
					t.exceptRun("*");
					t.accept("*");
					if (t.accept("/")) {
						divisionAllowed = allowDivision;

						return [{
							"type": TokenMultiLineComment,
							"data": t.get()
						}, inputElement];
					}

					if (t.peek() === "") {
						return t.error(errUnexpectedEOF);
					}
				}
			}

			if (allowDivision) {
				t.accept("=");

				return [{
					"type": TokenDivPunctuator,
					"data": t.get()
				}, inputElement];
			}

			divisionAllowed = true;

			return regexp(t);
		case '}':
			t.except("");
			switch (tokenDepth.at(-1)) {
			case '{':
				tokenDepth.pop();

				return [{
					"type": TokenRightBracePunctuator,
					"data": t.get()
				}, inputElement];
			case '$':
				tokenDepth.pop();

				return template(t);
			}

			return errInvalidCharacter(t);
		case "'":
		case '"':
			divisionAllowed = true;

			return stringToken(t);
		case '`':
			t.except("");

			return template(t);
		case '#':
			t.except("");

			if (!isIDStart(t.peek())) {
				t.except("");

				return errInvalidSequence(t);
			}

			const [tk, tf] = identifier(t);

			if (tk.type === TokenIdentifier) {
				tk.type = TokenPrivateIdentifier;

				divisionAllowed = true;
			}

			return [tk, tf];
		}

		if (decimalDigit.includes(c)) {
			divisionAllowed = true;

			return number(t);
		}

		if (isIDStart(c)) {
			const [tk, tf] = identifier(t);

			if (tk.type === TokenIdentifier) {
				if (tk.data === "true" || tk.data === "false") {
					divisionAllowed = true;

					tk.type = TokenBooleanLiteral;
				} else if (tk.data === "null") {
					divisionAllowed = true;
					tk.type = TokenNullLiteral;
				} else if (tk.data === "enum") {
					divisionAllowed = true;
					tk.type = TokenFutureReservedWord;
				} else if (tk.data === "Infinity") {
					divisionAllowed = true;
					tk.type = TokenNumericLiteral;
				} else {
					for (const kw of keywords) {
						if (kw === tk.data) {
							tk.type = TokenKeyword;

							if (tk.data === "this") {
								divisionAllowed = true
							}

							break;
						}
					}

					if (tk.type === TokenIdentifier) {
						if (tk.data[0] === "\\") {
							let code = "";

							if (tk.data[2] === '{') {
								let n = 3;

								for (; tk.data[n] != '}'; n++) { }

								code = tk.data.slice(3, n);
							} else {
								code = tk.data.slice(2, 6);
							}

							const r = parseInt(code, 16);

							if (isNaN(r) || r === 92 || !isIDStart(String.fromCharCode(r))) {
								return errInvalidUnicode(t, tk.data);
							}
						}

						divisionAllowed = true;
					}
				}
			}

			return [tk, tf];
		}

		t.except("");

		switch (c) {
		case '{':
		case '(':
		case '[':
			tokenDepth.push(c);

			break;
		case '?':
			if (t.accept("?")) {
				t.accept("=");
			} else {
				t.accept(".");
			}
		case ';':
		case ',':
		case ':':
		case '~':
		case '>':
			break;
		case ')':
		case ']':
			const ld = tokenDepth.at(-1);
			if (!(ld === '(' && c === ')') && !(ld === '[' && c === ']')) {
				return errInvalidCharacter(t);
			}

			divisionAllowed = true;
			tokenDepth.pop();

			break;
		case '.':
			if (t.accept(".")) {
				if (!t.accept(".")) { // ...
					if (t.peek() === "") {
						return t.error(errUnexpectedEOF);
					}

					t.except("");

					return errInvalidSequence(t);
				}
			} else if (t.accept(decimalDigit)) {
				numberRun(t, decimalDigit);

				if (t.accept("eE")) {
					t.accept("+-");

					numberRun(t, decimalDigit);
				}

				divisionAllowed = true;

				return [{
					"type": TokenNumericLiteral,
					"data": t.get()
				}, inputElement];
			}

			break;
		case '<':
		case '*':
			if (!t.accept("=")) { // <=, *=
				if (t.peek() === c) { // <<, **
					t.except("");
					t.accept("="); // <<=, **=
				}
			}

			break;
		case '=':
			if (t.accept("=")) { // ==
				t.accept("="); // ===
			} else {
				t.accept(">"); // =>
			}

			break;
		case '!':
			if (t.accept("=")) { // !=
				t.accept("="); // !==
			}

			break;
		case '+':
		case '-':
		case '&':
		case '|':
			if (t.peek() === c) {
				t.except(""); // ++, --, &&, ||

				if (c === '&' || c === '|') {
					t.accept("=");
				}
			} else {
				t.accept("="); // +=, -=, &=, |=
			}

			break;
		case '%':
		case '^':
			t.accept("="); // %=, ^=

			break;
		default:
			return errInvalidCharacter(t);
		}

		return [{
			"type": TokenPunctuator,
			"data": t.get()
		}, inputElement];
	      },
	      regexpBackslashSequence = (t: Tokeniser) => {
		t.except("");

		if (!t.except(lineTerminators)) {
			if (t.peek() === "") {
				return errUnexpectedEOF;
			}

			t.except("");

			return errInvalidRegexpSequence + t.get();
		}

		return "";
	      },
	      regexpExpressionClass = (t: Tokeniser) => {
		t.except("");

		while (true) {
			switch (t.exceptRun("]\\")) {
			case ']':
				t.except("");

				return true;
			case '\\':
				if (!regexpBackslashSequence(t)) {
					return false;
				}
			default:
				return false;
			}
		}
	      },
	      regexp: TokenFn = (t: Tokeniser) => {
		const c = t.peek();

		switch (c) {
		case "":
			return t.error(errUnexpectedEOF);
		case '\\':
			const err = regexpBackslashSequence(t);

			if (err) {
				return t.error(err)
			}

			break;
		case '[':
			if (!regexpExpressionClass(t)) {
				return t.error(errUnexpectedEOF);
			}

			break;
		default:

			if (lineTerminators.includes(c)) {
				t.get();
				t.except("");

				return errInvalidRegexpCharacter(t);
			}

			t.except("");
		}

		Loop:
		while (true) {
			const c = t.exceptRun(lineTerminators + "\\[/");

			switch (c) {
			case "":
				return t.error(errUnexpectedEOF);
			case '\\':
				const err = regexpBackslashSequence(t);

				if (err) {
					return t.error(err);
				}

				break;
			case '[':
				if (!regexpExpressionClass(t)) {
					return t.error(errUnexpectedEOF);
				}

				break;
			case '/':
				t.except("");

				break Loop;
			default:
				t.get();
				t.except("");

				return errInvalidRegexpCharacter(t);
			}
		}

		while (true) {
			const c = t.peek();

			if (!isIDContinue(c) || c === '\\') {
				break;
			}

			t.except("");
		}

		return [{
			"type": TokenRegularExpressionLiteral,
			"data": t.get()
		}, inputElement];
	      },
	      numberRun = (t: Tokeniser, digits: string) => {
		while (true) {
			if (!t.accept(digits)) {
				return false;
			}

			t.acceptRun(digits);

			if (!t.accept("_")) {
				break;
			}
		}

		return true;
	      },
	      number: TokenFn = (t: Tokeniser) => {
		if (t.accept("0")) {
			if (t.accept("bB")) {
				if (!numberRun(t, binaryDigit)) {
					t.except("");

					return errInvalidNumber(t);
				}

				t.accept("n");
			} else if (t.accept("oO")) {
				if (!numberRun(t, octalDigit)) {
					t.except("");

					return errInvalidNumber(t);
				}

				t.accept("n");
			} else if (t.accept("xX")) {
				if (!numberRun(t, hexDigit)) {
					t.except("");

					return errInvalidNumber(t);
				}

				t.accept("n");
			} else if (t.accept(".")) {
				if (!numberRun(t, decimalDigit)) {
					t.except("");

					return errInvalidNumber(t);
				}

				if (t.accept("eE")) {
					t.accept("+-");

					if (!numberRun(t, decimalDigit)) {
						t.except("");

						return errInvalidNumber(t);
					}
				}
			} else {
				t.accept("n");
			}
		} else {
			if (!numberRun(t, decimalDigit)) {
				t.except("");

				return errInvalidNumber(t);
			}

			if (!t.accept("n")) {
				if (t.accept(".")) {
					if (!numberRun(t, decimalDigit)) {
						t.except("");

						return errInvalidNumber(t);
					}
				}

				if (t.accept("eE")) {
					t.accept("+-");

					if (!numberRun(t, decimalDigit)) {
						t.except("");

						return errInvalidNumber(t);
					}
				}
			}
		}

		return [{
			"type": TokenNumericLiteral,
			"data": t.get()
		}, inputElement];
	      },
	      identifier: TokenFn = (t: Tokeniser) => {
		const c = t.peek();

		t.except("");

		if (c === '\\') {
			if (!t.accept("u")) {
				t.except("");

				return errUnexpectedBackslash(t);
			}
			if (!unicodeEscapeSequence(t)) {
				return errInvalidUnicode(t);
			}
		}

		while(true) {
			const c = t.peek();
			if (isIDContinue(c)) {
				t.except("");

				continue;
			}

			break;
		}

		return [{
			"type": TokenIdentifier,
			"data": t.get()
		}, inputElement];
	      },
	      unicodeEscapeSequence = (t: Tokeniser) => {
		if (t.accept("{")) {
			if (!t.accept(hexDigit)) {
				t.except("");

				return false;
			}

			t.acceptRun(hexDigit);

			if (!t.accept("}")) {
				return false;
			}
		} else if (!t.accept(hexDigit) || !t.accept(hexDigit) || !t.accept(hexDigit) || !t.accept(hexDigit)) {
			t.except("");

			return false;
		}

		return true;
	      },
	      escapeSequence = (t: Tokeniser) => {
		t.accept("\\");

		if (t.accept("x")) {
			return t.accept(hexDigit) && t.accept(hexDigit);
		} else if (t.accept("u")) {
			return unicodeEscapeSequence(t);
		} else if (t.accept("0")) {
			return !t.accept(decimalDigit);
		}

		t.accept(singleEscapeChar);

		return true;
	      },
	      stringToken: TokenFn = (t: Tokeniser) => {
		const chars = t.peek() === '"' ? doubleStringChars : singleStringChars;

		t.except("");

		Loop:
		while (true) {
			const c = t.exceptRun(chars);

			switch (c) {
			case '"':
			case '\'':
				t.except("");

				break Loop;
			case '\\':
				if (escapeSequence(t)) {
					continue;
				}

				return errInvalidEscapeSequence(t);
			default:
				if (lineTerminators.includes(c)) {
					t.except("");

					return errUnexpectedLineTerminator(t);
				}

				return t.error(errUnexpectedEOF);
			}
		}

		return [{
			"type": TokenStringLiteral,
			"data": t.get()
		}, inputElement];
	      },
	      template: TokenFn = (t: Tokeniser)  => {
		Loop:
		while (true) {
			switch (t.exceptRun("`\\$")) {
			case '`':
				t.except("");

				break Loop;
			case '\\':
				if (escapeSequence(t)) {
					continue;
				}

				t.except("");

				return errInvalidEscapeSequence(t);
			case '$':
				t.except("");
				if (t.accept("{")) {
					tokenDepth.push('$');

					const v = t.get();

					return [{
						"type": v[0] === '`' ?  TokenTemplateHead : TokenTemplateMiddle,
						"data": v
					}, inputElement];
				}
			default:
				return t.error(errUnexpectedEOF);
			}
		}

		divisionAllowed = true;

		const v = t.get();

		return [{
			"type": v[0] === '`' ? TokenNoSubstitutionTemplate : TokenTemplateTail,
			"data": v
		}, inputElement];
	      };

	return (tk: Tokeniser) => {
		divisionAllowed = false;
		tokenDepth.splice(0, tokenDepth.length);

		return inputElement(tk);
	};
})();

export default (contents: string, fn: TokenFn, colours: Map<TokenType, string>, noPre = true) => {
	const nodes: HTMLElement[] = [];

	let last: string | undefined;

	for (const tk of processToEnd(Parser(contents, fn))) {
		const colour = colours.get(tk.type),
		      contents = noPre ? tk.data.split(lineSplit).map((s, n) => n > 0 ? [br(), s] : s) : tk.data;

		if (colour === last && nodes.length > 0) {
			amendNode(nodes.at(-1), contents);
		} else {
			nodes.push(span(colour ? colour.startsWith(".") ? {"class": colour.slice(1)} : {"style": "color: " + colour} : {}, contents));
		}

		last = colour;
	}

	return createDocumentFragment(nodes);
};
