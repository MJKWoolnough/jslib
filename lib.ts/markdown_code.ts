import type {TokenFn, Tokeniser, TokenType} from './parser.js';
import {amendNode, createDocumentFragment} from './dom.js';
import {br, span} from './html.js';
import Parser, {TokenDone, TokenError} from './parser.js';

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
      lineSplit = new RegExp("[" + lineTerminators + "]"),
      error = (errText: string, override?: string) => (t: Tokeniser, text = override ?? t.get()) => t.error(errText + text),
      errUnexpectedEOF = error("unexpected EOF", ""),
      errInvalidCharacter = error("invalid character: "),
      errInvalidNumber = error("invalid number: "),
      unicodeGroups = (...groups: string[]) => new RegExp("^[" + groups.reduce((r, c) => r + "\\p{" + c + "}", "") + "]$", "u");

export const [TokenWhitespace, TokenLineTerminator, TokenSingleLineComment, TokenMultiLineComment, TokenIdentifier, TokenPrivateIdentifier, TokenBooleanLiteral, TokenKeyword, TokenPunctuator, TokenNumericLiteral, TokenStringLiteral, TokenNoSubstitutionTemplate, TokenTemplateHead, TokenTemplateMiddle, TokenTemplateTail, TokenRegularExpressionLiteral, TokenNullLiteral, TokenReservedWord] = Array.from({"length": 20}, (_, n) => n) as TokenType[],
javascript = (() => {
	const keywords = ["await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"],
	      idContinue = unicodeGroups("L", "Nl", "ID_Start", "Mn", "Mc", "Nd", "Pc", "ID_Continue"),
	      idStart = unicodeGroups("L", "Nl", "ID_Start"),
	      notID = unicodeGroups("Pattern_Syntax", "Pattern_White_Space"),
	      zwnj = String.fromCharCode(8204),
	      zwj = String.fromCharCode(8205),
	      isIDStart = (c: string) => c === '$' || c === '_' || c === '\\' || idStart.test(c) && !notID.test(c),
	      isIDContinue = (c: string) => c === '$' || c === '_' || c === '\\' || c === zwnj || c === zwj || idContinue.test(c) && !notID.test(c),
	      errInvalidRegexpSequence = error("invalid regexp sequence", ""),
	      errInvalidSequence = error("invalid sequence: "),
	      errInvalidRegexpCharacter = error("invalid regexp character"),
	      errInvalidUnicode = error("invalid unicode"),
	      errUnexpectedBackslash = error("unexpected backslash"),
	      errInvalidEscapeSequence = error("invalid escape sequence"),
	      errUnexpectedLineTerminator = error("unexpected line terminator"),
	      inputElement: TokenFn = (t: Tokeniser) => {
		if (t.accept(whitespace)) {
			t.acceptRun(whitespace);

			return t.return(TokenWhitespace, inputElement);
		}

		if (t.accept(lineTerminators)) {
			t.acceptRun(lineTerminators);

			return t.return(TokenLineTerminator, inputElement);
		}

		let allowDivision = divisionAllowed;

		divisionAllowed = false;

		const c = t.peek();

		switch (c) {
		case "":
			if (!tokenDepth.length) {
				return t.done();
			}

			return errUnexpectedEOF(t);
		case '/':
			t.except("");

			if (t.accept("/")) {
				t.exceptRun(lineTerminators);

				return t.return(TokenSingleLineComment, inputElement);
			}

			if (t.accept("*")) {
				while (true) {
					t.exceptRun("*");
					t.accept("*");

					if (t.accept("/")) {
						divisionAllowed = allowDivision;

						return t.return(TokenMultiLineComment, inputElement);
					}

					if (!t.peek()) {
						return errUnexpectedEOF(t);
					}
				}
			}

			if (allowDivision) {
				t.accept("=");

				return t.return(TokenPunctuator, inputElement);
			}

			divisionAllowed = true;

			return regexp(t);
		case '}':
			t.except("");

			switch (tokenDepth.at(-1)) {
			case '}':
				tokenDepth.pop();

				return t.return(TokenPunctuator, inputElement);
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
					tk.type = TokenReservedWord;
				} else if (tk.data === "Infinity") {
					divisionAllowed = true;
					tk.type = TokenNumericLiteral;
				} else {
					if (keywords.includes(tk.data))  {
						tk.type = TokenKeyword;

						if (tk.data === "this") {
							divisionAllowed = true;
						}
					} else {
						if (tk.data[0] === "\\") {
							let code = "";

							if (tk.data[2] === '{') {
								const pos = tk.data.indexOf("}");

								code = tk.data.slice(3, pos === -1 ? 0 : pos);
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
			tokenDepth.push(c === "(" ? ")" : c === "[" ? "]" : "}");

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
			if (tokenDepth.pop() !== c) {
				return errInvalidCharacter(t);
			}

			divisionAllowed = true;

			break;
		case '.':
			if (t.accept(".")) {
				if (!t.accept(".")) { // ...
					if (!t.peek()) {
						return errUnexpectedEOF(t);
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

				return t.return(TokenNumericLiteral, inputElement);
			}

			break;
		case '<':
		case '*':
			if (!t.accept("=") /* <=, *= */ && t.accept(c)) { // <<, **
				t.accept("="); // <<=, **=
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

		return t.return(TokenPunctuator, inputElement);
	      },
	      regexpBackslashSequence = (t: Tokeniser) => {
		t.except("");

		if (!t.except(lineTerminators)) {
			if (!t.peek()) {
				return errUnexpectedEOF(t);
			}

			t.except("");

			return errInvalidRegexpSequence(t);
		}

		return null;
	      },
	      regexpExpressionClass = (t: Tokeniser) => {
		t.except("");

		while (true) {
			switch (t.exceptRun("]\\")) {
			case ']':
				t.except("");

				return null;
			case '\\':
				const err = regexpBackslashSequence(t);
				if (err) {
					return err;
				}

				break;
			default:
				return errUnexpectedEOF(t);
			}
		}
	      },
	      regexp: TokenFn = (t: Tokeniser) => {
		const c = t.peek();

		switch (c) {
		case "":
			return errUnexpectedEOF(t);
		case '\\':
			const err = regexpBackslashSequence(t);
			if (err) {
				return err
			}

			break;
		case '[':
			const errr = regexpExpressionClass(t);
			if (errr) {
				return errr;
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
				return errUnexpectedEOF(t);
			case '\\':
				const err = regexpBackslashSequence(t);
				if (err) {
					return err;
				}

				break;
			case '[':
				const errr = regexpExpressionClass(t);
				if (errr) {
					return errr;
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

		return t.return(TokenRegularExpressionLiteral, inputElement);
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
				if (t.accept(".") && !numberRun(t, decimalDigit)) {
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
			}
		}

		return t.return(TokenNumericLiteral, inputElement);
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
			if (!isIDContinue(c)) {
				break;
			}

			t.except("");
		}

		return t.return(TokenIdentifier, inputElement);
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

				return errUnexpectedEOF(t);
			}
		}

		return t.return(TokenStringLiteral, inputElement);
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
				return errUnexpectedEOF(t);
			}
		}

		divisionAllowed = true;

		const v = t.get();

		return [{
			"type": v[0] === '`' ? TokenNoSubstitutionTemplate : TokenTemplateTail,
			"data": v
		}, inputElement];
	      },
	      tokenDepth: string[] = [];

	let divisionAllowed = false;

	return (tk: Tokeniser) => {
		divisionAllowed = false;
		tokenDepth.splice(0, tokenDepth.length);

		return inputElement(tk);
	};
})(),
python = (() => {
	const keywords = ["False", "await", "else", "import", "pass", "None", "break", "except", "in", "raise", "True", "class", "finally", "is", "return", "and", "continue", "for", "lambda", "try", "as", "def", "from", "nonlocal", "while", "assert", "del", "global", "not", "with", "async", "elif", "if", "or", "yield"],
	      idContinue = unicodeGroups("L", "Nl", "ID_Start", "Mn", "Mc", "Nd", "Pc", "ID_Continue"),
	      idStart = unicodeGroups("Lu", "Ll", "Lt", "Lm", "Lo", "Nl", "ID_Start"),
	      isIDStart = (c: string) => c === '_' || idStart.test(c),
	      isIDContinue = (c: string) => c === '_' || idContinue.test(c),
	      stringPrefix = "rRuUfFbB",
	      stringStart = `"'`,
	      stringOrIdentifier = (tk: Tokeniser) => {
		switch (tk.next()) {
		case "r":
		case "R":
			tk.accept("fFbB");

			break;
		case "b":
		case "B":
		case "f":
		case "F":
			tk.accept("rR");
		case "u":
		case "U":
			break;
		}

		if (stringStart.includes(tk.peek())) {
			return string(tk);
		}

		return identifier(tk);
	      },
	      string = (tk: Tokeniser) => {
		const m = tk.next();

		let triple = false;

		if (tk.accept(m)) {
			if (tk.accept(m)) {
				triple = true;
			} else {
				return tk.return(TokenStringLiteral, main);
			}
		}

		Loop:
		while (true) {
			const c = tk.exceptRun("\\\n" + m);

			switch (c) {
			default:
				return errUnexpectedEOF(tk);
			case "\\":
				tk.next();
				tk.next();

				break;
			case "\n":
				if (!triple) {
					return errInvalidCharacter(tk);
				}

				break;
			case m:
				tk.next();

				if (!triple || !tk.accept(m) || !tk.accept(m)) {
					break Loop;
				}
			}
		}

		return tk.return(TokenStringLiteral, main);
	      },
	      identifier = (tk: Tokeniser) => {
		while (isIDContinue(tk.peek())) {
			tk.next();
		}

		const ident = tk.get();

		return [{
			"type": keywords.includes(ident) ? ident === "True" || ident === "False" ? TokenBooleanLiteral : ident === "None" ? TokenNullLiteral : TokenKeyword : TokenIdentifier,
			"data": ident
		}, main]
	      },
	      numberWithGrouping = (tk: Tokeniser, digits: string) => {
		while (tk.accept("_")) {
			const pos = tk.length;

			tk.acceptRun(digits);

			if (pos === tk.length) {
				return errInvalidNumber(tk);
			}
		}

		return null;
	      },
	      imaginary = (tk: Tokeniser) => {
		tk.accept("jJ");

		return tk.return(TokenNumericLiteral, main);
	      },
	      floatOrImaginary = (tk: Tokeniser) => {
		if (tk.accept(".")) {
			return float(tk);
		}

		return imaginary(tk);
	      },
	      baseNumber = (tk: Tokeniser) => {
		const digits = tk.accept("xX") ? hexDigit : tk.accept("oO") ? octalDigit : tk.accept("bB") ? binaryDigit : "0",
		      err = numberWithGrouping(tk, digits);

		if (err) {
			return err;
		}

		if (digits === "0") {
			return floatOrImaginary(tk);
		}
		
		return tk.return(TokenNumericLiteral, main);
	      },
	      number = (tk: Tokeniser) => numberWithGrouping(tk, decimalDigit) ?? floatOrImaginary(tk),
	      exponential = (tk: Tokeniser) => {
		tk.accept("+-");

		if (!tk.accept(decimalDigit)) {
			return errInvalidNumber(tk);
		}

		return numberWithGrouping(tk, decimalDigit);
	      },
	      float = (tk: Tokeniser) => {
		if (!tk.accept(decimalDigit)) {
			return errInvalidNumber(tk);
		}

		return numberWithGrouping(tk, decimalDigit) ?? (tk.accept("eE") && exponential(tk)) ?? imaginary(tk);
	      },
	      floatOrDelimiter = (tk: Tokeniser) => {
		if (!tk.accept(decimalDigit)) {
			return tk.return(TokenPunctuator, main);
		}

		return imaginary(tk);
	      },
	      operatorOrDelimiter = (tk: Tokeniser) => {
		const c = tk.next();

		switch (c) {
		case "+":
		case "%":
		case "@":
		case "&":
		case "|":
		case "^":
		case ":":
		case "=":
			tk.accept("=");

			break;
		case "-":
			tk.accept("=>");

			break;
		case "*":
		case "/":
		case "<":
		case ">":
			tk.accept(c);
			tk.accept("=");

			break;
		case "!":
			if (!tk.accept("=")) {
				return errInvalidCharacter(tk);
			}
		case "~":
		case ",":
		case ".":
		case ";":
			break;
		case "(":
		case "[":
		case "{":
			tokenDepth.push(c === "(" ? ")" : c === "[" ? "]" : "}");

			break;
		case ")":
		case "}":
		case "]":
			if (tokenDepth.pop() !== c) {
				return errInvalidCharacter(tk);
			}

			break;
		default:
			return errUnexpectedEOF(tk);
		}

		return tk.return(TokenPunctuator, main);
	      },
	      main = (tk: Tokeniser) => {
		if (!tk.peek()) {
			if (tokenDepth.length) {
				return errUnexpectedEOF(tk);
			}

			return tk.done();
		}

		if (tk.accept("\n")) {
			tk.acceptRun("\n");

			return tk.return(TokenLineTerminator, main);
		}

		if (tk.accept(" \t")) {
			tk.acceptRun(" \t");

			return tk.return(TokenWhitespace, main);
		}

		if (tk.accept("#")) {
			tk.exceptRun("\n");

			return tk.return(TokenSingleLineComment, main);
		}

		if (stringPrefix.includes(tk.peek())) {
			return stringOrIdentifier(tk);
		}

		if (stringStart.includes(tk.peek())) {
			return string(tk);
		}

		if (isIDStart(tk.peek())) {
			return identifier(tk);
		}

		if (tk.accept("0")) {
			return baseNumber(tk);
		}

		if (tk.accept(decimalDigit)) {
			return number(tk);
		}

		if (tk.accept(".")) {
			return floatOrDelimiter(tk);
		}

		return operatorOrDelimiter(tk);
	      },
	      tokenDepth: string[] = [];

	return (tk: Tokeniser) => {
		tokenDepth.splice(0, tokenDepth.length);

		return main(tk);
	};
})(),
bash = (() => {
	const keywords = ["if", "then", "else", "elif", "fi", "case", "esac", "while", "for", "in", "do", "done", "time", "until", "coproc", "select", "function", "{", "}", "[[", "]]", "!"],
	      word: TokenFn = (tk: Tokeniser) => {
		tk.exceptRun(" \t\n|&;<>()={}");

		const data = tk.get();

		return [{
			"type": keywords.includes(data) ? TokenReservedWord : tk.peek() === "=" ? TokenIdentifier : TokenKeyword,
			data
		}, main];
	      },
	      identifier = (tk: Tokeniser) => {
		tk.next();

		if (tk.accept("(")) {
			tokenDepth.push(")");

			return tk.return(TokenPunctuator, word);
		}

		if (tk.accept("{")) {
			tokenDepth.push("}");

			return tk.return(TokenPunctuator, word);
		}

		tk.exceptRun("\"'`(){}- \t\n");

		return tk.return(TokenIdentifier, main);
	      },
	      backtick = (tk: Tokeniser) => {
		tokenDepth.push("`")

		return tk.return(TokenPunctuator, main);
	      },
	      string = (tk: Tokeniser) => {
		const c = tokenDepth.at(-1);

		while (true) {
			switch (tk.exceptRun("\\\n`$" + c)) {
			case '\\':
				tk.next();
				tk.next();

				break;
			case '\n':
				return errInvalidCharacter(tk);
			case '`':
				return tk.return(TokenSingleLineComment, backtick);
			case '$':
				return tk.return(TokenStringLiteral, identifier);
			case c:
				tk.next();

				tokenDepth.pop();

				return tk.return(TokenStringLiteral, main)
			default:
				return errUnexpectedEOF(tk);
			}
		}
	      },
	      operatorOrWord = (tk: Tokeniser) => {
		const c = tk.peek();

		switch (c) {
		case '<':
			tk.next();
			tk.accept("<&>");

			break;
		case '>':
			tk.next();
			tk.accept(">&|")

			break;
		case '|':
			tk.next();
			tk.accept("|&");

			break;
		case '&':
			tk.next();
			tk.accept("&");

			break;
		case ';':
			tk.next();
			tk.accept(";");
			tk.accept("&");

			break;
		case '"':
		case `'`:
			if (tokenDepth.at(-1) === c) {
				tokenDepth.pop();

				tk.next();

				return tk.return(TokenStringLiteral, main);
			}

			tokenDepth.push(tk.next());

			return string(tk);
		case '(':
			tokenDepth.push(c);
			tk.next();

			break;
		case '}':
		case ')':
			if (tokenDepth.pop() !== c) {
				return errUnexpectedEOF(tk);
			}

		case "=":
			tk.next();

			break;
		default:
			return word(tk);
		}

		return tk.return(TokenPunctuator, main);
	      },
	      main = (tk: Tokeniser) => {
		if (!tk.peek()) {
			if (tokenDepth.length) {
				return errUnexpectedEOF(tk);
			}

			return tk.done();
		}

		const td = tokenDepth.at(-1);

		if (td === "\"" || td === "'") {
			return string(tk);
		}

		if (tk.accept(" \t")) {
			tk.acceptRun(" \t");

			return tk.return(TokenWhitespace, main);
		}

		if (tk.accept("\n")) {
			tk.acceptRun("\n");

			return tk.return(TokenLineTerminator, main);
		}

		if (tk.accept("#")) {
			tk.exceptRun("\n");

			return tk.return(TokenSingleLineComment, main);
		}

		return operatorOrWord(tk);
	      },
	      tokenDepth: string[] = [];

	return (tk: Tokeniser) => {
		tokenDepth.splice(0, tokenDepth.length);

		return main(tk);
	};
})();

export default (contents: string, fn: TokenFn, colours: Map<TokenType, string>, noPre = true) => {
	const nodes: HTMLElement[] = [];

	let last: string | undefined,
	    pos = 0;

	for (const tk of Parser(contents, fn)) {
		if (tk.type === TokenDone) {
			break;
		}

		const colour = colours.get(tk.type),
		      data = tk.type === TokenError ? contents.slice(pos) : tk.data,
		      textContents = noPre ? data.replaceAll("\t", "\u2003").replaceAll(" ", "\u00a0").split(lineSplit).map((s, n) => n > 0 ? [br(), s] : s) : data;

		if (colour === last && nodes.length > 0) {
			amendNode(nodes.at(-1), textContents);
		} else {
			nodes.push(span(colour ? colour.startsWith(".") ? {"class": colour.slice(1)} : {"style": "color: " + colour} : {}, textContents));
		}

		last = colour;
		pos += tk.data.length;

		if (tk.type < 0) {
			amendNode(nodes.at(-1), {"data-error": tk.data});
			break;
		}
	}

	return createDocumentFragment(nodes);
};
