import type {Token, TokenFn, TokenType} from './parser.js';
import {amendNode, createDocumentFragment} from './dom.js';
import {br, span} from './html.js';
import Parser, {TokenDone, TokenError, Tokeniser} from './parser.js';

const lineTerminators = "\n\r\u2028\u2029",
      whitespace = "\t\v\f \xa0\ufeff",
      binaryDigit = "01",
      octalDigit = "01234567",
      decimalDigit = "0123456789",
      hexDigit = "0123456789abcdefABCDEF",
      letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      lineSplit = new RegExp("[" + lineTerminators + "]"),
      error = (errText: string, override?: string) => (t: Tokeniser, text = override ?? t.get()) => t.error(errText + text),
      errUnexpectedEOF = error("unexpected EOF", ""),
      errInvalidCharacter = error("invalid character: "),
      errInvalidNumber = error("invalid number: "),
      unicodeGroups = (...groups: string[]) => new RegExp("^[" + groups.reduce((r, c) => r + "\\p{" + c + "}", "") + "]$", "u");

export const [TokenWhitespace, TokenLineTerminator, TokenSingleLineComment, TokenMultiLineComment, TokenIdentifier, TokenPrivateIdentifier, TokenBooleanLiteral, TokenKeyword, TokenPunctuator, TokenNumericLiteral, TokenStringLiteral, TokenNoSubstitutionTemplate, TokenTemplateHead, TokenTemplateMiddle, TokenTemplateTail, TokenRegularExpressionLiteral, TokenNullLiteral, TokenReservedWord] = Array.from({"length": 20}, (_, n) => n) as TokenType[],
javascript = (() => {
	const keywords = ["await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"],
	      stringChars = "'\\" + lineTerminators + "\"",
	      doubleStringChars = stringChars.slice(1),
	      singleStringChars = stringChars.slice(0, stringChars.length),
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
	      errUnexpectedLineTerminator = error("unexpected line terminator");

	return (tk: Tokeniser) => {
		const inputElement: TokenFn = (t: Tokeniser) => {
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
			default:
				return errInvalidCharacter(t);
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
				default:
					return errUnexpectedEOF(t);
				case ']':
					t.except("");

					return null;
				case '\\':
					const err = regexpBackslashSequence(t);
					if (err) {
						return err;
					}
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
				default:
					t.get();
					t.except("");

					return errInvalidRegexpCharacter(t);
				case "":
					return errUnexpectedEOF(t);
				case '\\':
					const err = regexpBackslashSequence(t);
					if (err) {
						return err;
					}

					break;
				case '/':
					t.except("");

					break Loop;
				case '[':
					const errr = regexpExpressionClass(t);
					if (errr) {
						return errr;
					}
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

			t.except(lineTerminators);

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
				default:
					return errUnexpectedEOF(t);
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
	      stringStart = `"'`;

	return (tk: Tokeniser) => {
		const stringOrIdentifier = (tk: Tokeniser) => {
			let raw = false;

			switch (tk.next()) {
			case "r":
			case "R":
				tk.accept("fFbB");
				raw = true;

				break;
			case "b":
			case "B":
			case "f":
			case "F":
				raw = tk.accept("rR");
			case "u":
			case "U":
			}

			if (stringStart.includes(tk.peek())) {
				return string(tk, raw);
			}

			return identifier(tk);
		      },
		      string = (tk: Tokeniser, raw = false) => {
			const m = tk.next(),
			      except = "\n" + m + (raw ? "" : "\\");

			let triple = false;

			if (tk.accept(m)) {
				if (!tk.accept(m)) {
					return tk.return(TokenStringLiteral, main);
				}

				triple = true;
			}


			Loop:
			while (true) {
				const c = tk.exceptRun(except);

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

					if (!triple || tk.accept(m) && tk.accept(m)) {
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
			}, main] as [Token, TokenFn];
		      },
		      numberWithGrouping = (tk: Tokeniser, digits: string) => {
			while (tk.accept("_")) {
				const pos = tk.length();

				tk.acceptRun(digits);

				if (pos === tk.length()) {
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

			return tk.accept("eE") && exponential(tk) || imaginary(tk);
		      },
		      baseNumber = (tk: Tokeniser) => {
			const digits = tk.accept("xX") ? hexDigit : tk.accept("oO") ? octalDigit : tk.accept("bB") ? binaryDigit : "0";

			tk.acceptRun(digits);

			const err = numberWithGrouping(tk, digits);
			if (err) {
				return err;
			}

			if (digits === "0") {
				return floatOrImaginary(tk);
			}

			if (tk.length() == 2) {
				return errInvalidNumber(tk);
			}

			return tk.return(TokenNumericLiteral, main);
		      },
		      number = (tk: Tokeniser) => {
			tk.acceptRun(decimalDigit);

			return numberWithGrouping(tk, decimalDigit) ?? floatOrImaginary(tk);
		      },
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

			return numberWithGrouping(tk, decimalDigit) ?? (tk.accept("eE") && exponential(tk) || imaginary(tk));
		      },
		      floatOrDelimiter = (tk: Tokeniser) => {
			if (!tk.accept(decimalDigit)) {
				return tk.return(TokenPunctuator, main);
			}

			tk.acceptRun(decimalDigit);

			return imaginary(tk);
		      },
		      operatorOrDelimiter = (tk: Tokeniser) => {
			const c = tk.next();

			switch (c) {
			default:
				return errUnexpectedEOF(tk);
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

			if (tk.accept("\\")) {
				if (!tk.accept("\n")) {
					return errInvalidCharacter(tk);
				}

				return tk.return(TokenWhitespace, main);
			}

			const ws = tokenDepth.length ? " \t\n" : " \t";

			if (tk.accept(ws)) {
				tk.acceptRun(ws);

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

		return main(tk);
	};
})(),
bash = (() => {
	const keywords = ["if", "then", "else", "elif", "fi", "case", "esac", "while", "for", "in", "do", "done", "time", "until", "coproc", "select", "function", "{", "}", "[[", "]]", "!"],
	      dotdot = [".."],
	      escapedNewline = ["\\\n"],
	      assignment = ["=", "+="],
	      whitespace = " \t",
	      newline = "\n",
	      metachars = whitespace + newline + "|&;()<>",
	      heredocsBreak = metachars + "\\\"'",
	      heredocStringBreak = newline + "$",
	      doubleStops = "\\`$\"",
	      singleStops = "'",
	      ansiStops = "'\\",
	      words = "\\\"'`(){}- \t\n",
	      wordNoBracket = "\\\"'`(){}- \t\n]",
	      wordBreak = " `\\\t\n$|&;<>(){",
	      wordBreakNoBracket = wordBreak + "]",
	      wordBreakNoBrace = wordBreak + "}",
	      wordBreakArithmetic = "\\\"'`(){} \t\n$+-!~*/%<=>&^|?:,",
	      braceWordBreak = " `\\\t\n|&;<>()={},",
	      identStart = letters + "_",
	      identCont = decimalDigit + identStart,
	      numberChars = identCont + "@",
	      errInvalidParameterExpansion = error("invalid parameter expansion"),
	      errIncorrectBacktick = error("incorrect backtick"),
	      subTokeniser = function* (t: Tokeniser) {
		while (true) {
			if (t.peek() === '`') {
				break;
			}

			let c = t.next();

			if (c === '') {
				break;
			} else if (c === '\\') {
				switch (t.peek()) {
				case '':
					break;
				case '\\':
				case '`':
				case '$':
					c = t.next();
				}
			}

			yield c;
		}
	      };

	return (tk: Tokeniser) => {
		const braceExpansionWord = (t: Tokeniser) => {
			let hasComma = false;

			while (true) {
				switch (t.exceptRun(braceWordBreak)) {
				case '}':
					if (hasComma) {
						t.next();

						return t.return(TokenStringLiteral, main)
					}
				default:
					return t.return(TokenKeyword, main);
				case '\\':
					t.next();
					t.next();

					break;
				case ',':
					t.next();

					hasComma = true;
				}
			}
		      },
		      braceExpansion = (t: Tokeniser) => {
			if (t.accept(letters)) {
				if (t.acceptWord(dotdot)) {
					if (!t.accept(letters)) {
						return t.return(TokenKeyword, main);
					}

					if (t.acceptWord(dotdot)) {
						t.accept("-");

						if (!t.accept(decimalDigit)) {
							return t.return(TokenKeyword, main);
						}

						t.acceptRun(decimalDigit);
					}

					if (!t.accept("}")) {
						return t.return(TokenKeyword, main);
					}

					return t.return(TokenStringLiteral, main);
				}
			} else {
				t.accept("-");

				if (t.accept(decimalDigit)) {
					switch (t.acceptRun(decimalDigit)) {
					default:
						return t.return(TokenKeyword, main);
					case ',':
						return braceExpansionWord(t);
					case '.':
						if (t.acceptWord(dotdot)) {
							t.accept("-");

							if (!t.accept(decimalDigit)) {
								return t.return(TokenKeyword, main);
							}

							t.acceptRun(decimalDigit);

							if (t.acceptWord(dotdot)) {
								t.accept("-");

								if (!t.accept(decimalDigit)) {
									return t.return(TokenKeyword, main);
								}

								t.acceptRun(decimalDigit);
							}

							if (!t.accept("}")) {
								return t.return(TokenKeyword, main);
							}

							return t.return(TokenStringLiteral, main);
						}
					}
				}
			}

			return braceExpansionWord(t);
		      },
		      startArrayAssign = (t: Tokeniser) => {
			t.accept("[");
			tokenDepth.push(']');

			return t.return(TokenPunctuator, main);
		      },
		      word = (t: Tokeniser) => {
			const tk = tokenDepth.at(-1),
			      wb = tk === '}' ? wordBreakNoBrace : tk === ']' || tk === '[' ? wordBreakNoBracket : tk === '>' ? wordBreakArithmetic : wordBreak;

			if (t.accept("\\")) {
				t.next();
			} else if (t.length() === 0 && t.accept(wb)) {
				return errInvalidCharacter(t);
			}

			while (true) {
				switch (t.exceptRun(wb)) {
				case '':
					if (!t.length()) {
						if (!tokenDepth.length) {
							return t.done();
						}

						return errUnexpectedEOF(t);
					}
				default:
					return t.return(TokenKeyword, main);
				case '{':
					t.next();

					if (t.accept(whitespace) || t.accept(newline)) {
						t.backup();
						t.backup();
					} else if (!t.peek()) {
						t.backup();
					} else {
						const pos = t.length() - 1,
						      [tk] = braceExpansion(new Tokeniser({"next": () => ({"value": t.next(), "done": false})}));

						while (pos < t.length()) {
							t.backup();
						}

						if (tk.type === TokenStringLiteral) {
							return t.return(TokenKeyword, main);
						}
					}

					t.next();

					break;
				case '\\':
					t.next();
					t.next();

					break;
				case '$':
					t.next();

					if (t.accept(decimalDigit) || t.accept(identStart) || t.accept("({")) {
						t.backup();
						t.backup();

						return t.return(TokenKeyword, main);
					}
				}
			}
		      },
		      keywordIdentOrWord = (t: Tokeniser) => {
			if (t.acceptWord(keywords)) {
				return t.return(TokenReservedWord, main);
			}

			if (t.accept(identStart)) {
				t.acceptRun(identCont);

				const read = t.acceptWord(assignment);

				if (read) {
					for (const _ of read) {
						t.backup();
					}

					return t.return(TokenIdentifier, main);
				} else if (t.peek() === tokenDepth.at(-1)) {
					return t.return(TokenKeyword, main);
				} else if (t.peek() === '[') {
					return t.return(TokenIdentifier, startArrayAssign);
				}
			}

			return word(t);
		      },
		      number = (t: Tokeniser) => {
			if (!t.accept(decimalDigit)) {
				return keywordIdentOrWord(t);
			}

			t.acceptRun(decimalDigit);

			if (t.accept("#")) {
				if (!t.accept(numberChars)) {
					return errInvalidNumber(t);
				}

				t.acceptRun(numberChars);
			}

			return t.return(TokenNumericLiteral, main);
		      },
		      zero = (t: Tokeniser) => {
			t.next();

			if (t.accept("xX")) {
				if (!t.accept(hexDigit)) {
					return errInvalidNumber(t);
				}

				t.acceptRun(hexDigit);
			} else {
				t.acceptRun(octalDigit);
			}

			return t.return(TokenNumericLiteral, main);
		      },
		      stringStart = (t: Tokeniser) => {
			if (t.peek() === tokenDepth.at(-1)) {
				tokenDepth.pop();
				t.next();

				return t.return(TokenStringLiteral, main);
			} else if (t.accept("$") && t.accept("'")) {
				tokenDepth.push('$');
			} else {
				tokenDepth.push(t.next());
			}

			return string(t);
		      },
		      startBacktick = (t: Tokeniser) => {
			t.next();

			child = Parser(subTokeniser(t), bash);

			return t.return(TokenPunctuator, backtick);
		      },
		      backtick = (t: Tokeniser): [Token, TokenFn] => {
			const tk = child.next().value;

			switch (tk.type) {
			case TokenDone:
				if (!t.accept("`")) {
					return errIncorrectBacktick(t);
				}

				return t.return(TokenPunctuator, main);
			case TokenError:
				return t.error(tk.data);
			}

			let pos = t.length();

			t.reset();

			for (const c of tk.data) {
				t.acceptRun("\\");
				t.accept(c);
			}

			pos -= t.length();
			tk.data = t.get();

			while (t.length() != pos) {
				t.next();
			}


			return [tk, backtick];
		      },
		      parameterExpansionOperator = (t: Tokeniser) => {
			if (t.accept("}")) {
				tokenDepth.pop();

				return t.return(TokenPunctuator, main);
			}

			if (!t.accept("UuLQEPAKak")) {
				return errInvalidParameterExpansion(t);
			}

			return t.return(TokenIdentifier, main);
		      },
		      parameterExpansionPatternEnd = (t: Tokeniser) => {
			t.accept("/");

			return t.return(TokenPunctuator, main);
		      },
		      parameterExpansionPattern = (t: Tokeniser) => {
			let parens = 0;

			while (true) {
				switch (t.exceptRun("\\()[/}")) {
				case '}':
					if (parens === 0) {
						return t.return(TokenRegularExpressionLiteral, main);
					}

					return errInvalidParameterExpansion(t);
				case '/':
					if (parens === 0) {
						return t.return(TokenRegularExpressionLiteral, parameterExpansionPatternEnd);
					}
				case '':
					return errInvalidParameterExpansion(t);
				case '\\':
					t.next();
					t.next();

					break;
				case '(':
					t.next();

					parens++;

					break;
				case ')':
					t.next();

					if (parens === 0) {
						return errInvalidParameterExpansion(t);
					}

					parens--

					break;
				case '[':
					while (!t.accept("]")) {
						switch (t.exceptRun("\\]")) {
						case '':
							return errInvalidParameterExpansion(t);
						case '\\':
							t.next();
							t.next();
						}
					}
				}
			}
		      },
		      parameterExpansionSubstringEnd = (t: Tokeniser) => {
			if (t.accept(whitespace)) {
				t.acceptRun(whitespace);

				return t.return(TokenWhitespace, parameterExpansionSubstringEnd);
			}

			t.accept("-");

			if (!t.accept(decimalDigit)) {
				return errInvalidParameterExpansion(t);
			}

			t.acceptRun(decimalDigit);

			return t.return(TokenNumericLiteral, main);
		      },
		      parameterExpansionSubstringMid = (t: Tokeniser) => {
			if (t.accept(whitespace)) {
				t.acceptRun(whitespace);

				return t.return(TokenWhitespace, parameterExpansionSubstringMid);
			}

			if (t.accept(":")) {
				return t.return(TokenPunctuator, parameterExpansionSubstringEnd);
			}
			
			return main(t);
		      },
		      parameterExpansionSubstringStart = (t: Tokeniser) => {
			if (t.accept(whitespace)) {
				t.acceptRun(whitespace);

				return t.return(TokenWhitespace, parameterExpansionSubstringStart);
			}

			t.accept("-");

			if (!t.accept(decimalDigit)) {
				return errInvalidParameterExpansion(t);
			}

			t.acceptRun(decimalDigit);

			return t.return(TokenNumericLiteral, parameterExpansionSubstringMid);
		      },
		      parameterExpansionOperation = (t: Tokeniser) => {
			if (t.accept(":")) {
				if (t.accept("-=#?+")) {
					return t.return(TokenPunctuator, main);
				}

				return t.return(TokenPunctuator, parameterExpansionSubstringStart);
			}

			if (t.accept("/")) {
				t.accept("/#%");

				return t.return(TokenPunctuator, parameterExpansionPattern);
			}

			if (t.accept("*")) {
				return t.return(TokenPunctuator, main);
			}

			if (t.accept("@")) {
				return t.return(TokenPunctuator, parameterExpansionOperator);
			}

			if (t.accept("}")) {
				tokenDepth.pop();

				return t.return(TokenPunctuator, main);
			}

			for (const c of "#%^,") {
				if (t.accept(c)) {
					t.accept(c);

					return t.return(TokenPunctuator, parameterExpansionPattern);
				}
			}

			return errInvalidParameterExpansion(t);
		      },
		      parameterExpansionArrayOrOperation = (t: Tokeniser) => {
			if (!t.accept("[")) {
				return parameterExpansionOperation(t);
			}

			tokenDepth.push('[');

			return t.return(TokenPunctuator, main);
		      },
		      parameterExpansionIdentifier = (t: Tokeniser) => {
			if (t.accept("@*")) {
				return t.return(TokenKeyword, parameterExpansionOperation);
			}

			if (t.accept(decimalDigit)) {
				t.acceptRun(decimalDigit);

				return t.return(TokenNumericLiteral, parameterExpansionOperation);
			}

			if (!t.accept(identStart)) {
				return errInvalidParameterExpansion(t);
			}

			t.acceptRun(identCont);

			return t.return(TokenIdentifier, parameterExpansionArrayOrOperation);
		      },
		      parameterExpansionIdentifierOrPreOperator = (t: Tokeniser) => {
			if (t.accept("!#")) {
				if (t.peek() != '}') {
					return t.return(TokenPunctuator, parameterExpansionIdentifier);
				}

				return t.return(TokenKeyword, main);
			}

			return parameterExpansionIdentifier(t);
		      },
		      identifier = (t: Tokeniser) => {
			t.next();

			if (t.accept(decimalDigit)) {
				return t.return(TokenIdentifier, main);
			}

			if (t.accept("(")) {
				if (t.accept("(")) {
					tokenDepth.push('>');

					return t.return(TokenPunctuator, main);
				}

				tokenDepth.push(')');

				return t.return(TokenPunctuator, main);
			}

			if (t.accept("{")) {
				tokenDepth.push('}');

				return t.return(TokenPunctuator, parameterExpansionIdentifierOrPreOperator);
			}

			const td = tokenDepth.at(-1);

			if (td !== '"' && td !== 'h' && t.accept("'\"")) {
				t.reset();

				return stringStart(t);
			}

			t.exceptRun(tokenDepth.at(-1) === ']' ? wordNoBracket : tokenDepth.at(-1) === '>' ? wordBreakArithmetic : words);

			return t.return(TokenIdentifier, main);
		      },
		      heredocEnd = (t: Tokeniser) => {
			t.acceptString(heredocs.at(-1)!.shift()!);

			if (!heredocs.at(-1)?.length) {
				heredocs.pop();
				tokenDepth.pop();
			}

			return t.return(TokenStringLiteral, main);
		      },
		      heredocString = (t: Tokeniser) => {
			const heredoc = heredocs.at(-1)![0];

			while (true) {
				const read = t.acceptString(heredoc);

				if (read === heredoc.length && (t.peek() === '\n' || t.peek() === '')) {
					for (let i = 0; i < read; i++) {
						t.backup();
					}

					return t.return(TokenStringLiteral, heredocEnd);
				}

				switch (t.exceptRun(heredocStringBreak)) {
				case '':
					return errUnexpectedEOF(t);
				case '$':
					t.next();

					if (t.accept(decimalDigit) || t.accept(identStart) || t.accept("({")) {
						t.backup();
						t.backup();

						tokenDepth.push('h');

						return t.return(TokenStringLiteral, identifier);
					}

					continue;
				}

				t.next();
			}
		      },
		      unstring = (str: string) => {
			let nextEscaped = false,
			    sb = "";

			for (const c of str) {
				if (nextEscaped) {
					switch (c) {
					case 'n':
						sb += "\n";

						break;
					case 't':
						sb += "\t";
					}

					nextEscaped = false;
				} else {
					switch (c) {
					case '\\':
						nextEscaped = true;
					case '"':
					case "'":
						continue;
					}

					sb += c;
				}
			}

			return sb;
		      },
		      startHeredoc = (t: Tokeniser): [Token, TokenFn] => {
			if (t.peek() === '' || t.accept(newline) || t.accept("#")) {
				return errUnexpectedEOF(t);
			}

			if (t.accept(whitespace) || t.acceptWord(escapedNewline)) {
				while (t.acceptRun(whitespace)) {
					if (!t.acceptWord(escapedNewline)) {
						break;
					}
				}

				return t.return(TokenWhitespace, startHeredoc);
			}

			let chars = heredocsBreak;

			Loop:
			while (true) {
				switch (t.exceptRun(chars)) {
				default:
					break Loop;
				case '':
					return errUnexpectedEOF(t);
				case '\\':
					t.next();
					t.next();

					break;
				case "'":
					t.next();

					if (chars === heredocsBreak) {
						chars = "'";
					} else {
						chars = heredocsBreak;
					}

					break;
				case '"':
					if (chars === heredocsBreak) {
						chars = "\\\"";
					} else {
						chars = heredocsBreak;
					}
				}
			}

			const tk = {"type": TokenKeyword, "data": t.get()};

			if (tokenDepth.at(-1) === 'H') {
				heredocs.at(-1)?.push(unstring(tk.data));
			} else {
				tokenDepth.push('H');
				heredocs.push([unstring(tk.data)]);
			}

			return [tk, main];
		      },
		      operatorOrWord = (t: Tokeniser) => {
			const c = t.peek();

			switch (c) {
			default:
				return keywordIdentOrWord(t);
			case '<':
				t.next();

				if (t.accept("<")) {
					if (!t.accept("<-")) {
						t.accept("-");

						return t.return(TokenPunctuator, startHeredoc);
					}
				} else {
					t.accept("&>");
				}

				break;
			case '>':
				t.next();
				t.accept(">&|");

				break;
			case '|':
				t.next();
				t.accept("&|");

				break;
			case '&':
				t.next();

				if (t.accept(">")) {
					t.accept(">");
				} else {
					t.accept("&");
				}

				break;
			case ';':
				t.next();
				t.accept(";");
				t.accept("&");

				break;
			case '"':
			case "'":
				return stringStart(t);
			case '(':
				t.next();
				tokenDepth.push(")");

				break;
			case '{':
				t.next();

				if (!words.includes(t.peek()) || t.peek() == '-') {
					return braceExpansion(t);
				}

				tokenDepth.push("}");

				break;
			case ']':
				if (tokenDepth.at(-1) === '[') {
					t.next();
					tokenDepth.pop();

					return t.return(TokenPunctuator, parameterExpansionOperation);
				}
			case '}':
			case ')':
				t.next();

				if (tokenDepth.pop() !== c) {
					return errInvalidCharacter(t);
				}

				break;
			case '+':
				t.next();

				if (!t.accept("=")) {
					return errInvalidCharacter(t);
				}

				break;
			case '=':
				t.next();

				break;
			case '$':
				return identifier(t);
			case '`':
				if (tokenDepth.at(-1) !== '`') {
					return startBacktick(t);
				}

				tokenDepth.pop();
				t.next();
			}

			return t.return(TokenPunctuator, main);
		      },
		      arithmeticExpansion = (t: Tokeniser) => {
			const c = t.peek();

			switch (c) {
			case '':
				return errUnexpectedEOF(t);
			case '"':
			case "'":
				return stringStart(t);
			case '$':
				return identifier(t);
			case '+':
			case '-':
			case '&':
			case '|':
				t.next();

				if (t.peek() === c) {
					t.next();
				} else {
					t.accept("=");
				}

				break;
			case '<':
			case '>':
				t.next();
				t.accept("=");

				break;
			case '=':
			case '!':
			case '/':
			case '%':
			case '^':
				t.next();
				t.accept("=");

				break;
			case '*':
				t.next();
				t.accept("*=");

				break;
			case '~':
			case ',':
				t.next();

				break;
			case '?':
				t.next();
				tokenDepth.push(":");

				break;
			case ':':
				t.next();

				if (tokenDepth.at(-1) !== ':') {
					return errInvalidCharacter(t);
				}

				tokenDepth.pop();

				break;
			case ')':
				t.next();

				const td = tokenDepth.at(-1);

				if ((td != '>' || !t.accept(")")) && td != '/') {
					return errInvalidCharacter(t);
				}

				tokenDepth.pop();

				break;
			case '(':
				t.next();
				tokenDepth.push("/");

				break;
			case '0':
				return zero(t);
			default:
				return number(t);
			}

			return t.return(TokenPunctuator, main);
		      },
		      string = (t: Tokeniser) => {
			const td = tokenDepth.at(-1),
			      stops = td === '"' ? doubleStops : td === '$' ? ansiStops : singleStops;

			while (true) {
				switch (t.exceptRun(stops)) {
				default:
					return errUnexpectedEOF(t);
				case '\n':
					return errInvalidCharacter(t);
				case '`':
					return t.return(TokenStringLiteral, startBacktick);
				case '$':
					return t.return(TokenStringLiteral, identifier);
				case '"':
				case "'":
					t.next();
					tokenDepth.pop();

					return t.return(TokenStringLiteral, main);
				case '\\':
					t.next();
					t.next();
				}
			}
		      },
		      main = (t: Tokeniser) => {
			const td = tokenDepth.at(-1);

			if (!t.peek()) {
				if (td) {
					return errUnexpectedEOF(t);
				}

				return t.done();
			}

			if (td === 'h') {
				tokenDepth.pop();

				return heredocString(t);
			}

			if (td === '"' || td === "'") {
				return string(t);
			}

			if (t.accept(whitespace) || t.acceptWord(escapedNewline) !== "") {
				while (t.acceptRun(whitespace)) {
					if (!t.acceptWord(escapedNewline)) {
						break;
					}
				}

				return t.return(TokenWhitespace, main);
			}

			if (t.accept(newline)) {
				if (td === 'H') {
					return t.return(TokenLineTerminator, heredocString);
				}

				t.acceptRun(newline);

				return t.return(TokenLineTerminator, main);
			}

			if (t.accept("#")) {
				t.exceptRun(newline);

				return t.return(TokenSingleLineComment, main);
			}

			if (td === '>' || td === '/' || td === ':') {
				return arithmeticExpansion(t);
			}

			return operatorOrWord(t);
		      },
		      tokenDepth: string[] = [],
		      heredocs: string[][] = [];

		let child: Generator<Token, Token>;

		return main(tk);
	};
})(),
r = (() => {
	const identCont = decimalDigit + letters + "_.",
	      printable = unicodeGroups("L", "Nl", "ID_Start", "Mn", "Mc", "Nd", "Pc", "ID_Continue", "P"),
	      errInvalidOperator = error("invalid operator");

	return (tk: Tokeniser) => {
		const operator = (tk: Tokeniser) => {
			if (tk.accept(";,")) {
				return tk.return(TokenPunctuator, expression);
			} else if (tk.accept("+*/^~$@?")) {
			} else if (tk.accept(">=!")) {
				tk.accept("=");
			} else if (tk.accept("-")) {
				tk.accept(">");
				tk.accept(">");
			} else if (tk.accept("<")) {
				if (tk.accept("<") && !tk.accept("-")) {
					return errInvalidOperator(tk);
				} else {
					tk.accept("=-");
				}
			} else if (tk.accept("%")) {
				while (tk.peek() != "%" && (tk.peek() === " " || printable.test(tk.peek()))) {
					tk.next();
				}

				if (!tk.accept("%")) {
					return errInvalidOperator(tk);
				}

				return tk.return(TokenReservedWord, expression);
			} else if (tk.accept(":")) {
				tk.accept(":");
			} else if (tk.accept("&")) {
				tk.accept("&");
			} else if (tk.accept("|")) {
				tk.accept("|>");
			} else if (tk.accept("[")) {
				if (tk.accept("[")) {
					tokenDepth.push("#");
				} else {
					tokenDepth.push("]");
				}
			} else if (tk.accept("(")) {
				tokenDepth.push(")");
			} else if (tk.accept("{")) {
				tokenDepth.push("}");
			} else if (tk.accept("]")) {
				const last = tokenDepth.pop();

				if (last === "#") {
					if (!tk.accept("]")) {
						return errInvalidOperator(tk);
					}
				} else if (last !== "]") {
					return errInvalidOperator(tk);
				}
			} else if (tk.accept(")")) {
				if (tokenDepth.pop() !== ")") {
					return errInvalidOperator(tk);
				}
			} else if (tk.accept("}")) {
				if (tokenDepth.pop() !== "}") {
					return errInvalidOperator(tk);
				}
			} else {
				return errInvalidOperator(tk);
			}

			return tk.return(TokenPunctuator, expression);
		      },
		      exponential = (tk: Tokeniser, digits = decimalDigit) => {
			const e = digits === hexDigit ? "pP" : "eE";

			if (tk.accept(e)) {
				tk.accept("+-");

				if (!tk.accept(digits)) {
					return errInvalidNumber(tk);
				}

				tk.acceptRun(digits);
			}

			tk.accept("Li");

			return tk.return(TokenNumericLiteral, expression);
		      },
		      float = (tk: Tokeniser, digits = decimalDigit) => {
			if (digits === hexDigit && !tk.accept(digits)) {
				return errInvalidNumber(tk);
			}

			tk.acceptRun(digits);

			if (tk.accept("Li")) {
				return tk.return(TokenNumericLiteral, expression);
			}

			return exponential(tk, digits)
		      },
		      ellipsisOrIdentifier = (tk: Tokeniser) => {
			if (tk.accept(".")) {
				if (tk.accept(".")) {
					if (!tk.accept(identCont)) {
						return tk.return(TokenReservedWord, expression);
					}
				} else if (tk.accept(decimalDigit)) {
					tk.acceptRun(decimalDigit);

					if (!tk.accept(identCont)) {
						return tk.return(TokenReservedWord, expression);
					}
				}
			}

			return identifier(tk);
		      },
		      number = (tk: Tokeniser) => {
			if (tk.accept(".")) {
				if (!tk.accept(decimalDigit)) {
					return ellipsisOrIdentifier(tk);
				}

				return float(tk);
			}

			let digits = decimalDigit;

			if (tk.accept("0")) {
				if (tk.accept("x")) {
					digits = hexDigit;

					if (!tk.accept(digits)) {
						return errInvalidNumber(tk);
					}
				}
			}

			tk.acceptRun(digits);

			if (tk.accept("Li")) {
				return tk.return(TokenNumericLiteral, expression);
			} else if (tk.accept(".")) {
				return float(tk, digits);
			}

			return exponential(tk, digits)
		      },
		      string = (tk: Tokeniser) => {
			const quote = tk.next(),
			      chars = quote + "\\";

			while (true) {
				switch (tk.exceptRun(chars)) {
				default:
					return errInvalidCharacter(tk);
				case quote:
					tk.next();

					return tk.return(TokenStringLiteral, expression);
				case "":
					return errInvalidCharacter(tk);
				case "\\":
					tk.next();

					switch (tk.peek()) {
					default:
						return errInvalidCharacter(tk);
					case "'":
					case '"':
					case 'n':
					case 'r':
					case 't':
					case 'b':
					case 'a':
					case 'f':
					case 'v':
					case '\\':
						tk.next();

						break;
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
					case '6':
					case '7':
						tk.next();

						if (!tk.accept(octalDigit) || !tk.accept(octalDigit)) {
							return errInvalidCharacter(tk);
						}

						break;
					case 'x':
						tk.next();

						if (!tk.accept(hexDigit) || !tk.accept(hexDigit)) {
							return errInvalidCharacter(tk);
						}

						break;
					case 'u':
						tk.next();

						const brace = tk.accept("{");

						if (!tk.accept(hexDigit)) {
							return errInvalidCharacter(tk);
						}

						if (brace) {
							tk.accept(hexDigit);
							tk.accept(hexDigit);
							tk.accept(hexDigit);

							if (!tk.accept("}")) {
								return errInvalidCharacter(tk);
							}
						} else if (!tk.accept(hexDigit) || !tk.accept(hexDigit) || !tk.accept(hexDigit)) {
							return errInvalidCharacter(tk);
						}

						break;
					case 'U':
						tk.next();

						const longBrace = tk.accept("{");

						if (!tk.accept(hexDigit)) {
							return errInvalidCharacter(tk);
						}

						if (longBrace) {
							tk.accept(hexDigit);
							tk.accept(hexDigit);
							tk.accept(hexDigit);
							tk.accept(hexDigit);
							tk.accept(hexDigit);
							tk.accept(hexDigit);
							tk.accept(hexDigit);

							if (!tk.accept("}")) {
								return errInvalidCharacter(tk);
							}
						} else if (!tk.accept(hexDigit) || !tk.accept(hexDigit) || !tk.accept(hexDigit) || !tk.accept(hexDigit) || !tk.accept(hexDigit) || !tk.accept(hexDigit) || !tk.accept(hexDigit)) {
							return errInvalidCharacter(tk);
						}
					}
				}
			}
		      },
		      identifier = (tk: Tokeniser) => {
			tk.acceptRun(identCont);

			const token = {"type": TokenIdentifier, "data": tk.get()} as Token;

			switch (token.data) {
			case "NA":
			case "NA_character_":
			case "NA_integer_":
			case "NA_real_":
			case "NA_complex_":
			case "NULL":
				token.type = TokenNullLiteral;

				break;
			case "TRUE":
			case "FALSE":
				token.type = TokenBooleanLiteral;

				break;
			case "Inf":
			case "NaN":
				token.type = TokenNumericLiteral;

				break;
			case "if":
			case "else":
			case "repeat":
			case "while":
			case "function":
			case "for":
			case "in":
			case "next":
			case "break":
				token.type = TokenKeyword;
			}

			return [token, expression] as [Token, TokenFn];
		      },
		      expression = (tk: Tokeniser) => {
			if (!tk.peek()) {
				if (tokenDepth.length) {
					return errUnexpectedEOF(tk);
				}

				return tk.done();
			}

			if (tk.accept(whitespace)) {
				tk.acceptRun(whitespace);

				return tk.return(TokenWhitespace, expression);
			}

			if (tk.accept(lineTerminators)) {
				return tk.return(TokenLineTerminator, expression);
			}

			if (tk.accept("#")) {
				tk.exceptRun(lineTerminators);

				return tk.return(TokenSingleLineComment, expression);
			}

			if (tk.accept(letters)) {
				return identifier(tk);
			}

			const c = tk.peek();

			if (c === `"` || c === `'`) {
				return string(tk);
			} else if (c === `.` || decimalDigit.includes(c)) {
				return number(tk);
			}

			return operator(tk);
		      },
		      tokenDepth: string[] = [];

		return expression(tk);
	};
})(),
css = (() => {
	const whitespace = "\n\t ",
	      isIdentStart = (tk: Tokeniser) => {
		if (tk.accept(letters) || tk.accept("_")) {
			return true;
		}

		if (tk.peek().charCodeAt(0) > 0x80) {
			tk.next();

			return true;
		}

		return false;
	      },
	      isIdentCont = (tk: Tokeniser) => isIdentStart(tk) || tk.accept(decimalDigit) || tk.accept("-"),
	      isValidEscape = (tk: Tokeniser) => {
		if (tk.accept("\\")) {
			if (tk.except("\n")) {
				return true;
			}

			tk.backup();
		}

		return false;
	      },
	      isIdentSequence = (tk: Tokeniser) => {
		if (tk.accept("-")) {
			if (tk.accept("-") || isIdentStart(tk) || isValidEscape(tk)) {
				return true;
			}

			tk.backup();
		}

		return isIdentStart(tk) || isValidEscape(tk);
	      };

	return (tk: Tokeniser) => {
		const commentOrPunctuator = (tk: Tokeniser) => {
			tk.next();

			if (!tk.accept("*")) {
				return tk.return(TokenPunctuator, main);
			}

			while (true) {
				switch (tk.exceptRun("*")) {
				default:
					return errUnexpectedEOF(tk);
				case '*':
					tk.next();

					if (tk.accept("/")) {
						return tk.return(TokenMultiLineComment, main);
					}
				}
			}
		      },
		      ident = (tk: Tokeniser) => {
			while (isIdentCont(tk) || isValidEscape(tk)) {}

			return tk.return(TokenIdentifier, main);
		      },
		      identOrDelim = (tk: Tokeniser) => {
			if (isValidEscape(tk)) {
				return ident(tk);
			}

			return tk.return(TokenReservedWord, main);
		      },
		      atOrDelim = (tk: Tokeniser) => {
			if (isIdentSequence(tk)) {
				return ident(tk);
			}

			return tk.return(TokenPunctuator, main);
		      },
		      cdoOrDelim = (tk: Tokeniser) => {
			tk.next();

			if (tk.accept("-")) {
				if (tk.accept("-")) {
					return tk.return(TokenSingleLineComment, main);
				}

				tk.backup();
			}

			return tk.return(TokenPunctuator, main);
		      },
		      hashOrDelim = (tk: Tokeniser) => {
			if (isIdentCont(tk) || isValidEscape(tk)) {
				return ident(tk);
			}

			return tk.return(TokenPunctuator, main);
		      },
		      string = (tk: Tokeniser) => {
			const close = tk.next(),
			      chars = close + "\\";

			while (true) {
				switch (tk.exceptRun(chars)) {
				default:
					return errUnexpectedEOF(tk);
				case close:
					tk.next();

					return tk.return(TokenStringLiteral, main);
				case '\\':
					tk.next();
					tk.next();
				}
			}
		      },
		      numberCDCIdentOrDelim = (tk: Tokeniser) => {
			tk.next();

			if (tk.accept(decimalDigit)) {
				tk.backup();

				return number(tk);
			}

			if (tk.accept("-")) {
				if (tk.accept(">")) {
					return tk.return(TokenSingleLineComment, main);
				}

				return ident(tk);
			}

			if (isValidEscape(tk)) {
				return ident(tk);
			}

			return tk.return(TokenPunctuator, main);
		      },
		      number = (tk: Tokeniser) => {
			if (tk.accept(decimalDigit)) {
				tk.acceptRun(decimalDigit);

				if (tk.accept(".") && !tk.accept(decimalDigit)) {
					return errInvalidNumber(tk);
				}

				tk.acceptRun(decimalDigit);
			} else if (tk.accept(".")) {
				if (!tk.accept(decimalDigit)) {
					return tk.return(TokenPunctuator, main);
				}

				tk.acceptRun(decimalDigit);
			}

			if (tk.accept("eE")) {
				tk.accept("+-");

				if (!tk.accept(decimalDigit)) {
					return errInvalidNumber(tk);
				}


				tk.acceptRun(decimalDigit);
			}

			return tk.return(TokenNumericLiteral, main);
		      },
		      main = (tk: Tokeniser) => {
			if (!tk.peek()) {
				if (tokenDepth.length) {
					return errUnexpectedEOF(tk);
				}

				return tk.done();
			}

			if (tk.accept(whitespace)) {
				tk.acceptRun(whitespace);

				return tk.return(TokenWhitespace, main);
			}

			if (isIdentStart(tk)) {
				return ident(tk);
			}

			if (tk.accept(decimalDigit)) {
				return number(tk);
			}

			const c = tk.peek();

			switch (c) {
			case '"':
			case "'":
				return string(tk);
			case '#':
				tk.next();

				return hashOrDelim(tk);
			case '(':
				tk.next();
				tokenDepth.push(')');

				return tk.return(TokenPunctuator, main);
			case '[':
				tk.next();
				tokenDepth.push(']');

				return tk.return(TokenPunctuator, main);
			case '{':
				tk.next();
				tokenDepth.push('}');

				return tk.return(TokenPunctuator, main);
			case ')':
			case ']':
			case '}':
				if (tokenDepth.pop() !== c) {
					return errInvalidCharacter(tk);
				}

				tk.next();

				return tk.return(TokenPunctuator, main);
			case '-':
				return numberCDCIdentOrDelim(tk);
			case '+':
				tk.next();

				if (!(decimalDigit + ".").includes(tk.peek())) {
					return tk.return(TokenPunctuator, main);
				}
			case '.':
				return number(tk);
			case ',':
			case ':':
			case ';':
			case '%':
				return tk.return(TokenPunctuator, main);
			case '<':
				return cdoOrDelim(tk);
			case '@':
				tk.next();

				return atOrDelim(tk);
			case '\\':
				return identOrDelim(tk);
			case '/':
				return commentOrPunctuator(tk);
			}

			tk.next();

			return tk.return(TokenPunctuator, main);
		      },
		      tokenDepth: string[] = [];

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
