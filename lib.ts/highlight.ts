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
				if (!state.length) {
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

				switch (state.at(-1)) {
				case '}':
					state.pop();

					return t.return(TokenPunctuator, inputElement);
				case '$':
					state.pop();

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
				state.push(c === "(" ? ")" : c === "[" ? "]" : "}");

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
				if (state.pop() !== c) {
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
						state.push('$');

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
		      state: string[] = [];

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
				state.push(c === "(" ? ")" : c === "[" ? "]" : "}");

				break;
			case ")":
			case "}":
			case "]":
				if (state.pop() !== c) {
					return errInvalidCharacter(tk);
				}
			}

			return tk.return(TokenPunctuator, main);
		      },
		      main = (tk: Tokeniser) => {
			if (!tk.peek()) {
				if (state.length) {
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

			const ws = state.length ? " \t\n" : " \t";

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
		      state: string[] = [];

		return main(tk);
	};
})(),
bash = (() => {
	type heredocType = {
		stripped: boolean;
		expand: boolean;
		delim: string;
	}

	const keywords = ["if", "then", "else", "elif", "fi", "case", "esac", "while", "for", "in", "do", "done", "time", "until", "coproc", "select", "function", "{", "}", "[[", "]]", "!", "break", "continue"],
	      compoundStart = ["if", "while", "until", "for", "select", "{", "("],
	      builtins = ["export", "readonly", "declare", "typeset", "local", "let"],
	      dotdot = [".."],
	      escapedNewline = ["\\\n"],
	      assignment = ["=", "+="],
	      expansionOperators = ["#", "%", "^", ","],
	      declareParams = "IAapfnxutrligF",
	      typesetParams = declareParams.substring(2),
	      exportParams = declareParams.substring(3, 6),
	      readonlyParams = declareParams.substring(1, 5),
	      whitespace = " \t",
	      newline = "\n",
	      whitespaceNewline = whitespace + newline,
	      heredocsBreak = whitespace + newline + "|&;()<>\\\"'",
	      heredocStringBreak = newline + "$",
	      doubleStops = "\\`$\"",
	      singleStops = "'",
	      ansiStops = "'\\",
	      wordBreak = "\\\"'`() \t\n$|&;<>{",
	      wordBreakBrace = "\\\"'`() \t\n$|&;,<>}",
	      wordBreakArithmetic = "\\\"'`(){} \t\n$+-!~/*%<=>&^|?:,;",
	      wordBreakNoBrace = wordBreak + "#}]",
	      wordBreakSubstring    = wordBreakNoBrace + ":",
	      wordBreakIndex = wordBreakArithmetic + "]",
	      wordBreakCommandIndex = "\\\"'`(){} \t\n$+-!~/*%<=>&^|?:,]",
	      testWordBreak = " `\\\t\n\"'$|&;<>(){}!,",
	      hexDigit = "0123456789ABCDEFabcdef",
	      octalDigit = "012345678",
	      decimalDigit = "0123456789",
	      letters = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz",
	      identStart = letters + "_",
	      identCont = decimalDigit + identStart,
	      numberChars = identCont + "@",
	      [stateArithmeticExpansion, stateArithmeticParens, stateArrayIndex, stateBrace, stateBraceExpansion, stateBraceExpansionWord, stateBraceExpansionArrayIndex, stateBuiltinDeclare, stateBuiltinExport, stateBuiltinLet, stateBuiltinLetExpression, stateBuiltinLetParens, stateBuiltinLetTernary, stateBuiltinReadonly, stateBuiltinTypeset, stateCaseBody, stateCaseEnd, stateCaseParam, stateCommandIndex, stateForArithmetic, stateFunctionBody, stateHeredoc, stateHeredocIdentifier, stateIfBody, stateIfTest, stateInCommand, stateLoopBody, stateLoopCondition, stateParameterExpansionSubString, stateParens, stateParensGroup, stateStringDouble, stateStringSingle, stateStringSpecial, stateTernary, stateTest, stateTestBinary, stateTestPattern, stateValue] = Array.from({"length": 39}, (_, n) => n),
	      errInvalidParameterExpansion = error("invalid parameter expansion"),
	      errIncorrectBacktick = error("incorrect backtick"),
	      errInvalidKeyword = error("invalid keyword"),
	      errInvalidIdentifier = error("invalid identifier"),
	      errMissingClosingParen = error("missing closing paren"),
	      errInvalidOperator = error("invalid operator"),
	      parseWhitespace = (t: Tokeniser) => {
		if (t.accept(whitespace) || t.acceptWord(escapedNewline, false) !== "") {
			while (t.acceptRun(whitespace) !== '') {
				if (t.acceptWord(escapedNewline, false) === "") {
					break;
				}
			}

			return true;
		}

		return false;
	      },
	      unstring = (str: string) => {
		let sb = "",
		    nextEscaped = false;

		for (let c of str) {
			if (nextEscaped) {
				switch (c) {
				case 'n':
					c = '\n';

					break;
				case 't':
					c = '\t';
				}

				nextEscaped = false
			} else {
				switch (c) {
				case '"':
				case '\'':
					continue;
				case '\\':
					nextEscaped = true;

					continue;
				}
			}

			sb += c;
		}

		return sb;
	      },
	      isWhitespace = (t: Tokeniser) => {
		switch (t.peek()) {
		case ' ':
		case '\t':
		case '\n':
		case '':
			return true;
		}

		return false;
	      },
	      isWordSeperator = (t: Tokeniser) => isWhitespace(t) || t.peek() === ';',
	      subTokeniser = function* (t: Tokeniser) {
		while (true) {
			if (t.peek() === '`') {
				return;
			}

			let c = t.next();

			if (c === '') {
				return;
			} else if (c === '\\') {
				switch (t.peek()) {
				case '':
					return;
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
		const state: number[] = [],
		      isBraceExpansionWord = (t: Tokeniser) => {
			state.push(stateBraceExpansionWord);

			const savedState = state.slice(),
			      savedHeredocs = JSON.parse(JSON.stringify(heredoc)),
			      savedChild = child,
			      sub = Parser({"next": () => ({"value": t.next(), "done": false})}, main);

			let hasComma = false,
			    isBEW = false;

			while (true) {
				const tk = sub.next().value;

				if (tk.type === TokenError) {
					break;
				}

				if (state.length <= savedState.length) {
					if (tk.type === TokenPunctuator && tk.data === "}") {
						isBEW = hasComma;

						break;
					} else if (tk.type === TokenPunctuator && tk.data == ",") {
						hasComma = true
					} else if (tk.type === TokenPunctuator && tk.data == ";") {
						break;
					} else if (tk.type === TokenWhitespace || tk.type == TokenLineTerminator) {
						break;
					}
				} else if (tk.type === TokenDone) {
					break;
				}
			}

			child = savedChild;
			heredoc.splice(0, heredoc.length, ...savedHeredocs);
			state.splice(0, state.length, ...savedState);
			state.pop();

			return isBEW;
		      },
		      braceExpansion = (t: Tokeniser) => {
			const tstate = t.state();

			if ((t.accept("-") && t.accept(decimalDigit) || t.accept(decimalDigit)) && t.acceptRun(decimalDigit) == '.' && t.acceptWord(dotdot, false) != "" && (t.accept("-") && t.accept(decimalDigit) || t.accept(decimalDigit)) && (t.acceptRun(decimalDigit) == '}' || (t.acceptWord(dotdot, false) != "" && t.accept("-") && t.accept(decimalDigit) || t.accept(decimalDigit) && t.acceptRun(decimalDigit) == '}'))) {
				t.next();

				return t.return(TokenIdentifier, main);
			}

			tstate();

			if (t.accept(letters) && t.acceptRun(letters) == '.' && t.acceptWord(dotdot, false) != "" && t.accept(letters) && (t.acceptRun(letters) == '}' || t.acceptWord(dotdot, false) != "" && (t.accept("-") && t.accept(decimalDigit) || t.accept(decimalDigit)) && t.acceptRun(decimalDigit) == '}')) {
				t.next();

				return t.return(TokenIdentifier, main);
			}

			tstate();

			const bew = isBraceExpansionWord(t);

			tstate();

			if (bew) {
				state.push(stateBraceExpansionWord);

				return t.return(TokenPunctuator, main)
			} else if (state.at(-1) == stateBuiltinLetExpression) {
				return errInvalidCharacter(t)
			}

			return word(t)
		      },
		      value = (t: Tokeniser) => {
			const isArray = state.at(-1) === stateArrayIndex;

			if (isArray) {
				state.pop();
			}

			switch (t.peek()) {
			case '(':
				t.next();

				if (isArray || t.accept("(")) {
					return errInvalidCharacter(t);
				}

				state.push(stateParens);

				return t.return(TokenPunctuator, main);
			case '$':
				return identifier(t);
			}

			state.push(stateValue);

			return main(t);
		      },
		      startAssign = (t: Tokeniser) => {
			t.accept("+");
			t.accept("=");

			if (state.at(-1) === stateBuiltinLetExpression) {
				return t.return(TokenPunctuator, main);
			}

			return t.return(TokenPunctuator, value);
		      },
		      startArrayAssign = (t: Tokeniser) => {
			t.accept("[");
			state.push(stateArrayIndex);

			return t.return(TokenPunctuator, main);
		      },
		      word = (t: Tokeniser) => {
			let wb: string;

			const td = state.at(-1);

			switch (td) {
			case stateBraceExpansion:
				wb = wordBreakNoBrace;

				break;
			case stateParameterExpansionSubString:
				wb = wordBreakSubstring

				break;
			case stateBraceExpansionWord:
				wb = wordBreakBrace;

				break;
			case stateArrayIndex:
			case stateBraceExpansionArrayIndex:
				wb = wordBreakIndex;

				break;
			case stateCommandIndex:
				wb = wordBreakCommandIndex;

				break;
			case stateArithmeticExpansion:
			case stateArithmeticParens:
			case stateTernary:
			case stateForArithmetic:
			case stateBuiltinLetExpression:
			case stateBuiltinLetParens:
			case stateBuiltinLetTernary:
				wb = wordBreakArithmetic;

				break;
			case stateTest:
			case stateTestBinary:
				wb = testWordBreak;

				break;
			default:
				wb = wordBreak;
			}

			setInCommand();

			if (t.accept("\\") && t.next() === '') {
				return errUnexpectedEOF(t);
			}

			if (t.length() === 0 && t.accept(wb)) {
				return errInvalidCharacter(t);
			}

			while (true) {
				switch (t.exceptRun(wb)) {
				default:
					return t.return(TokenKeyword, main);
				case '{':
					if (td === stateArrayIndex || td === stateBraceExpansionArrayIndex) {
						return t.return(TokenKeyword, main);
					}

					const tstate = t.state();

					t.next();

					if (t.accept(whitespace) || t.accept(newline) || t.peek() === '') {
						tstate();
					} else {
						const [tk] = braceExpansion(new Tokeniser({"next": () => ({"value": t.next(), "done": false})}));

						tstate();

						switch (tk.type) {
						case TokenPunctuator:
							state.pop();
						case TokenIdentifier:
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
					const stateb = t.state();

					t.next();

					if (t.accept(decimalDigit) || t.accept(identStart) || t.accept("({")) {
						stateb();

						return t.return(TokenKeyword, main);
					}
				}
			}
		      },
		      builtinArgs = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, builtinArgs);
			} else if (!t.accept("-")) {
				state.pop();

				return main(t);
			}

			let params = declareParams;

			switch (state.at(-1)) {
			case stateBuiltinExport:
				params = exportParams;

				break;
			case stateBuiltinReadonly:
				params = readonlyParams;

				break;
			case stateBuiltinTypeset:
				params = typesetParams;

				break;
			}

			if (!t.accept(params)) {
				return errInvalidCharacter(t);
			}

			t.acceptRun(params);

			return t.return(TokenKeyword, builtinArgs);
		      },
		      builtin = (t: Tokeniser, bn: string) => {
			switch (bn) {
			case "export":
				state.push(stateBuiltinExport);

				break;
			case "readonly":
				state.push(stateBuiltinReadonly);

				break;
			case "typeset":
				state.push(stateBuiltinTypeset);

				break;
			default:
				state.push(stateBuiltinDeclare);
			}

			return t.return(TokenReservedWord, builtinArgs);
		      },
		      letExpressionOrWord = (t: Tokeniser) => {
			const ret = operatorOrWord(t);

			if (ret[0].type === TokenIdentifier) {
				state.push(stateBuiltinLetExpression);
			}

			return ret;
		      },
		      testPattern = (t: Tokeniser) => {
			Loop:
			while (true) {
				switch (t.exceptRun("\\\"' \t\n$()")) {
				default:
					break Loop;
				case '':
					return errUnexpectedEOF(t);
				case '\\':
					t.next();
					t.next();

					break;
				case '"':
				case '\'':
					state.push(stateTestPattern);

					if (t.length() > 0) {
						return t.return(TokenRegularExpressionLiteral, stringStart);
					}

					return stringStart(t);
				case '$':
					state.push(stateTestPattern);

					if (t.length() > 0) {
						return t.return(TokenRegularExpressionLiteral, identifier);
					}

					return identifier(t);
				}
			}

			if (t.length() > 0) {
				return t.return(TokenRegularExpressionLiteral, test);
			}

			return test(t)
		      },
		      testPatternStart = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, testPatternStart);
			} else if (t.accept(newline)) {
				t.acceptRun(newline);

				return t.return(TokenLineTerminator, testPatternStart);
			} else if (t.accept("#")) {
				return errInvalidCharacter(t);
			}

			return testPattern(t);
		      },
		      testWord = (t: Tokeniser) => {
			const c = t.peek();

			if (c === '$') {
				return identifier(t);
			} else if (c === '"' || c === '\'') {
				return stringStart(t);
			} else if (c === ' ' || c === '\n') {
				return test(t);
			} else if (c === '`') {
				return startBacktick(t);
			}

			return keywordIdentOrWord(t);
		      },
		      testWordStart = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, testWordStart);
			} else if (t.accept(newline)) {
				t.acceptRun(newline);

				return t.return(TokenLineTerminator, testWordStart);
			} else if (t.accept("#")) {
				return errInvalidCharacter(t);
			}

			return testWordOrPunctuator(t)
		      },
		      testBinaryOperator = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, testBinaryOperator);
			} else if (t.accept(newline)) {
				t.acceptRun(newline);

				return t.return(TokenLineTerminator, testBinaryOperator);
			} else if (t.accept("#")) {
				t.exceptRun(newline);

				return t.return(TokenSingleLineComment, testBinaryOperator);
			}

			state.pop();

			switch (t.peek()) {
			case '':
				return test(t);
			case '=':
				t.next();
				t.accept("=~");

				break;
			case '!':
				t.next();

				if (!t.accept("=")) {
					return errInvalidCharacter(t);
				}

				break;
			case '<':
			case '>':
				t.next();

				break;
			case '-':
				t.next();

				if (t.accept("e")) {
					if (!t.accept("qf")) {
						return errInvalidCharacter(t);
					}
				} else if (t.accept("n")) {
					if (!t.accept("et")) {
						return errInvalidCharacter(t);
					}
				} else if (t.accept("gl")) {
					if (!t.accept("et")) {
						return errInvalidCharacter(t);
					}
				} else if (t.accept("o")) {
					if (!t.accept("t")) {
						return errInvalidCharacter(t);
					}
				} else {
					return errInvalidCharacter(t);
				}

				if (!isWhitespace(t)) {
					return errInvalidOperator(t);
				}

				return t.return(TokenKeyword, testWordStart);
			default:
				return test(t);
			}

			return t.return(TokenKeyword, testPatternStart);
		      },
		      testWordOrPunctuator = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, testWordOrPunctuator);
			} else if (t.accept(newline)) {
				t.acceptRun(newline);

				return t.return(TokenLineTerminator, testWordOrPunctuator);
			} else if (t.accept("#")) {
				t.exceptRun("\n");

				return t.return(TokenSingleLineComment, testWordOrPunctuator);
			}

			const c = t.peek();

			switch (c) {
			case '':
				return errUnexpectedEOF(t);
			case '(':
				t.next();
				state.push(stateTest);

				break;
			case ')':
				t.next();
				state.pop();

				if (state.at(-1) !== stateTest) {
					return errInvalidCharacter(t);
				}

				return t.return(TokenPunctuator, testWordOrPunctuator);
			case '|':
				t.next();

				if (!t.accept("|")) {
					return errInvalidCharacter(t);
				}

				break;
			case '&':
				t.next();

				if (!t.accept("&")) {
					return errInvalidCharacter(t);
				}
			case '$':
				state.push(stateTestBinary);

				return identifier(t);
			case '"':
			case '\'':
				state.push(stateTestBinary);

				return stringStart(t);
			case ']':
				t.next();

				if (t.accept("]") && isWordSeperator(t)) {
					state.pop();

					if (state.at(-1) === stateTest) {
						return errInvalidCharacter(t);
					}

					return t.return(TokenReservedWord, main);
				}

				t.reset();
			default:
				state.push(stateTestBinary);

				return keywordIdentOrWord(t);
			}

			return t.return(TokenPunctuator, test);
		      },
		      test = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, test);
			} else if (t.accept(newline)) {
				t.acceptRun(newline);

				return t.return(TokenLineTerminator, test);
			} else if (t.accept("#")) {
				t.exceptRun("\n");

				return t.return(TokenSingleLineComment, test);
			} else if (t.accept("!")) {
				return t.return(TokenPunctuator, test);
			}

			if (t.accept("-") && t.accept("abcdefghknoprstuvwxzGLNORS") && isWhitespace(t)) {
				return t.return(TokenKeyword, testWordStart)
			}

			t.reset();

			return testWordOrPunctuator(t);
		      },
		      functionCloseParen = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, functionCloseParen);
			}

			if (!t.accept(")")) {
				return errMissingClosingParen(t);
			}

			return t.return(TokenPunctuator, main);
		      },
		      functionOpenParen = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, functionOpenParen);
			}

			state.push(stateFunctionBody);

			if (t.accept("(")) {
				return t.return(TokenPunctuator, functionCloseParen);
			}

			return main(t);
		      },
		      functionK = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, functionK);
			}

			if (!t.accept(identStart)) {
				return errInvalidIdentifier(t);
			}

			t.acceptRun(identCont);

			return t.return(TokenIdentifier, functionOpenParen);
		      },
		      coproc = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, coproc);
			}

			if (t.acceptWord(keywords, false) !== "") {
				if (isWordSeperator(t)) {
					t.reset();

					return main(t);
				}

				t.reset();
			}

			if (t.accept(identStart)) {
				t.acceptRun(identCont);

				const state = t.state();

				if (t.accept(whitespace)) {
					t.acceptRun(whitespace);

					if (t.acceptWord(compoundStart, false) !== "" && isWordSeperator(t)) {
						state();

						return t.return(TokenIdentifier, main)
					}
				}
			}

			t.reset();

			return main(t);
		      },
		      forInDo = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, forInDo);
			} else if (t.accept(newline)) {
				t.acceptRun(newline);

				return t.return(TokenLineTerminator, forInDo);
			} else if (t.accept("#")) {
				t.exceptRun("\n");

				return t.return(TokenSingleLineComment, forInDo);
			}

			state.push(stateLoopCondition);

			if (t.acceptString("in", false) === 2 && isWordSeperator(t)) {
				setInCommand();

				return t.return(TokenKeyword, main);
			}

			t.reset();

			return main(t)
		      },
		      selectStart = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, selectStart);
			}

			if (!t.accept(identStart)) {
				return errInvalidIdentifier(t);
			}

			t.acceptRun(identCont);

			return t.return(TokenIdentifier, forInDo);
		      },
		      forStart = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, forStart);
			}

			if (t.accept("(")) {
				if (!t.accept("(")) {
					return errInvalidCharacter(t);
				}

				state.push(stateLoopCondition);
				state.push(stateForArithmetic);
				setInCommand();

				return t.return(TokenPunctuator, main)
			}

			if (!t.accept(identStart)) {
				return errInvalidIdentifier(t);
			}

			t.acceptRun(identCont);

			return t.return(TokenIdentifier, forInDo)
		      },
		      loopDo = (t: Tokeniser) => middleCompound(t, loopDo, "do", stateLoopBody, "missing do"),
		      loopStart = (t: Tokeniser) => startCompound(t, loopStart, stateLoopCondition),
		      caseIn = (t: Tokeniser) => middleCompound(t, caseIn, "in", stateCaseEnd, "missing in"),
		      caseStart = (t: Tokeniser) => startCompound(t, caseStart, stateCaseParam),
		      ifThen = (t: Tokeniser) => middleCompound(t, ifThen, "then", stateIfBody, "missing then"),
		      ifStart = (t: Tokeniser) => startCompound(t, ifStart, stateIfTest),
		      middleCompound = (t: Tokeniser, fn: TokenFn, kw: string, td: number, missing: string) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, fn);
			} else if (t.accept(newline)) {
				t.acceptRun(newline);

				return t.return(TokenLineTerminator, fn);
			} else if (t.accept("#")) {
				t.exceptRun("\n");

				return t.return(TokenSingleLineComment, fn);
			}

			state.pop();

			if (t.acceptString(kw, false) === kw.length && isWhitespace(t)) {
				state.push(td);

				return t.return(TokenReservedWord, main)
			}

			return t.error(missing)
		      },
		      startCompound = (t: Tokeniser, fn: TokenFn, td: number) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, fn);
			} else if (t.accept(newline)) {
				t.acceptRun(newline);

				return t.return(TokenLineTerminator, fn);
			}

			state.push(td);

			return main(t)
		      },
		      time = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, time);
			}

			if (t.acceptString("-p", false) === 2 && isWordSeperator(t)) {
				return t.return(TokenKeyword, main)
			}

			t.reset();

			return main(t);
		      },
		      endCompound = (t: Tokeniser, td: number) => {
			if (state.at(-1) !== td) {
				return errInvalidKeyword(t);
			}

			state.pop();

			return t.return(TokenReservedWord, main);
		      },
		      keyword = (t: Tokeniser, kw: string) => {
			switch (kw) {
			case "time":
				if (state.at(-1) === stateFunctionBody) {
					return errInvalidKeyword(t);
				}

				return t.return(TokenReservedWord, time);
			case "if":
				return t.return(TokenReservedWord, ifStart);
			case "then":
			case "in":
				return errInvalidKeyword(t);
			case "do":
				if (state.at(-1) !== stateLoopCondition) {
					return errInvalidKeyword(t);
				}

				state.pop();
				state.push(stateLoopBody);

				return t.return(TokenReservedWord, main);
			case "elif":
				if (state.at(-1) !== stateIfBody) {
					return errInvalidKeyword(t);
				}

				state.pop();

				return t.return(TokenReservedWord, ifStart);
			case "else":
				if (state.at(-1) !== stateIfBody) {
					return errInvalidKeyword(t);
				}

				return t.return(TokenReservedWord, main);
			case "fi":
				return endCompound(t, stateIfBody);
			case "case":
				return t.return(TokenReservedWord, caseStart);
			case "esac":
				const td = state.at(-1);

				if (td !== stateCaseBody && td !== stateCaseEnd) {
					return errInvalidKeyword(t);
				}

				state.pop();

				return t.return(TokenReservedWord, main);
			case "while":
			case "until":
				return t.return(TokenReservedWord, loopStart);
			case "done":
				return endCompound(t, stateLoopBody);
			case "for":
				return t.return(TokenReservedWord, forStart);
			case "select":
				return t.return(TokenReservedWord, selectStart);
			case "coproc":
				if (state.at(-1) === stateFunctionBody) {
					return errInvalidKeyword(t);
				}

				return t.return(TokenReservedWord, coproc);
			case "function":
				if (state.at(-1) === stateFunctionBody) {
					return errInvalidKeyword(t);
				}

				return t.return(TokenReservedWord, functionK);
			case "[[":
				setInCommand();
				state.push(stateTest);

				return t.return(TokenReservedWord, test);
			case "continue":
			case "break":
				let inLoop = false;

				Loop:
				for (const s of state.toReversed()) {
					switch (s) {
					case stateIfBody:
					case stateCaseBody:
						continue;
					case stateLoopBody:
						inLoop = true;
					default:
						break Loop
					}
				}

				if (!inLoop) {
					return errInvalidKeyword(t);
				}
			default:
				setInCommand();

				return t.return(TokenReservedWord, main);
			}
		      },
		      endCommandIndex = (t: Tokeniser) => {
			state.pop();
			setInCommand();

			return main(t);
		      },
		      startCommandIndex = (t: Tokeniser) => {
			t.next();

			return t.return(TokenPunctuator, main);
		      },
		      hasCompleteBracket = (t: Tokeniser, s: number) => {
			state.push(s);

			const savedState = state.slice(),
			      savedHeredocs = JSON.parse(JSON.stringify(heredoc)),
			      savedChild = child,
			      sub = Parser({"next": () => ({"value": t.next(), "done": false})}, main);

			let hcb = false;

			while (true) {
				const tk = sub.next().value;

				if (tk.type === TokenError) {
					break;
				}

				if (state.length === savedState.length && tk.type === TokenPunctuator && tk.data === "]") {
					hcb = true;

					break;
				} else if (state.length < savedState.length) {
					break;
				}
			}

			child = savedChild;
			heredoc.splice(0, heredoc.length, ...savedHeredocs);
			state.splice(0, state.length, ...savedState);
			state.pop();

			return hcb;
		      },
		      isArrayStart = (t: Tokeniser) => {
			const state = t.state(),
			      ici = t.accept("[") && !t.accept("]") && hasCompleteBracket(t, stateArrayIndex) && t.acceptWord(assignment, false) !== "";

			state();

			return ici;
		      },
		      isCommandIndex = (t: Tokeniser) => {
			const state = t.state(),
			      ici = t.accept("[") && hasCompleteBracket(t, stateCommandIndex) && t.acceptWord(assignment, false) === "";

			state();

			return ici;
		      },
		      identOrWord = (t: Tokeniser) => {
			const td = state.at(-1);

			if (td !== stateTest && td !== stateTestBinary) {
				if (t.accept(identStart)) {
					t.acceptRun(identCont);

					const stateb = t.state();

					if (t.acceptWord(assignment, false) !== "") {
						stateb();

						return t.return(TokenIdentifier, startAssign);
					} else if (!isInCommand() && isCommandIndex(t)) {
						state.push(stateCommandIndex);

						return t.return(TokenKeyword, startCommandIndex);
					} else {
						const c = t.peek();

						if (!isInCommand() && c === '[' || isArrayStart(t)) {
							return t.return(TokenIdentifier, startArrayAssign);
						} else if (c === '}' && td === stateBrace || c === ')' && td === stateParens || td === stateBraceExpansion) {
							return t.return(TokenKeyword, main);
						} else if (!isInCommand()) {
							t.acceptRun(whitespace);

							const isFunc = t.accept("(");

							stateb();

							if (isFunc) {
								return t.return(TokenIdentifier, functionOpenParen);
							}
						}
					}
				} else if (t.accept(decimalDigit)) {
					t.acceptRun(decimalDigit);

					switch (t.peek()) {
					case '<':
					case '>':
						return t.return(TokenNumericLiteral, main);
					}
				}
			}

			return word(t)
		      },
		      keywordIdentOrWord = (t: Tokeniser) => {
			if (!isInCommand()) {
				const td = state.at(-1);

				if (td !== stateTest && td !== stateTestBinary) {
					const kw = t.acceptWord(keywords, false);

					if (!isWordSeperator(t)) {
						if (state.at(-1) === stateFunctionBody) {
							return errInvalidKeyword(t);
						}

						t.reset();
					} else if (kw !== "") {
						return keyword(t, kw);
					}

					const bn = t.acceptWord(builtins, false);

					if (!isWordSeperator(t)) {
						t.reset();
					} else if (bn === "let") {
						state.push(stateBuiltinLet);

						return t.return(TokenReservedWord, main);
					} else if (bn !== "") {
						return builtin(t, bn);
					}
				}
			}

			return identOrWord(t);
		      },
		      number = (t: Tokeniser) => {
			if (!t.accept(decimalDigit)) {
				return word(t);
			}

			t.acceptRun(decimalDigit);

			if (t.accept("#")) {
				if (!t.accept(numberChars)) {
					return identOrWord(t);
				}

				t.acceptRun(numberChars);
			}

			return t.return(TokenNumericLiteral, main);
		      },
		      zero = (t: Tokeniser) => {
			t.next();

			if (t.accept("xX")) {
				if (!t.accept(hexDigit)) {
					return word(t);
				}

				t.acceptRun(hexDigit);
			} else {
				t.acceptRun(octalDigit);
			}

			return t.return(TokenNumericLiteral, main);
		      },
		      stringStart = (t: Tokeniser): [Token, TokenFn] => {
			if (t.accept("$") && t.accept("'")) {
				state.push(stateStringSpecial);
			} else if (t.accept("'")) {
				state.push(stateStringSingle);
			} else {
				t.next();

				state.push(stateStringDouble);
			}

			return string(t);
		      },
		      parameterExpansionOperator = (t: Tokeniser) => {
			if (t.accept("}")) {
				state.pop();

				return t.return(TokenPunctuator, main);
			}

			if (!t.accept("UuLQEPAKak")) {
				return errInvalidParameterExpansion(t);
			}

			return t.return(TokenKeyword, main);
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

					return errInvalidCharacter(t);
				case '/':
					if (parens === 0) {
						return t.return(TokenRegularExpressionLiteral, parameterExpansionPatternEnd);
					}

					return errInvalidCharacter(t);
				case '':
					return errUnexpectedEOF(t);
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
						return errInvalidCharacter(t);
					}

					parens--;

					break;
				case '[':
					while (!t.accept("]")) {
						switch (t.exceptRun("\\]")) {
						case '':
							return errUnexpectedEOF(t);
						case '\\':
							t.next();
							t.next();
						}
					}
				}
			}
		      },
		      parameterExpansionSubstringStart = (t: Tokeniser) => {
			if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, parameterExpansionSubstringStart);
			}

			state.push(stateParameterExpansionSubString);

			return main(t)
		      },
		      parameterExpansionOperation = (t: Tokeniser) => {
			if (t.accept(":")) {
				if (t.accept("-=?+")) {
					return t.return(TokenPunctuator, main);
				}

				return t.return(TokenPunctuator, parameterExpansionSubstringStart);
			} else if (t.accept("-=?+")) {
				return t.return(TokenPunctuator, main);
			} else if (t.accept("/")) {
				t.accept("/#%");

				return t.return(TokenPunctuator, parameterExpansionPattern)
			} else if (t.accept("*")) {
				return t.return(TokenPunctuator, main);
			} else if (t.accept("@")) {
				return t.return(TokenPunctuator, parameterExpansionOperator);
			} else if (t.accept("}")) {
				state.pop();

				return t.return(TokenPunctuator, main);
			}

			for (const c of expansionOperators) {
				if (t.accept(c)) {
					t.accept(c);

					return t.return(TokenPunctuator, parameterExpansionPattern);
				}
			}

			return errInvalidParameterExpansion(t);
		      },
		      parameterExpansionArrayEnd = (t: Tokeniser) => {
			if (!t.accept("]")) {
				return errInvalidCharacter(t);
			}

			return t.return(TokenPunctuator, parameterExpansionOperation);
		      },
		      parameterExpansionArraySpecial = (t: Tokeniser): [Token, TokenFn] => {
			if (t.accept("*@")) {
				return t.return(TokenKeyword, parameterExpansionArrayEnd);
			}

			state.push(stateBraceExpansionArrayIndex);

			return main(t);
		      },
		      parameterExpansionArrayOrOperation = (t: Tokeniser) => {
			if (!t.accept("[")) {
				return parameterExpansionOperation(t);
			}

			return t.return(TokenPunctuator, parameterExpansionArraySpecial);
		      },
		      parameterExpansionIdentifier = (t: Tokeniser) => {
			if (t.accept("@*")) {
				return t.return(TokenReservedWord, parameterExpansionOperation);
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
				if (t.peek() !== '}') {
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
			} else if (t.accept("(")) {
				if (t.accept("(")) {
					state.push(stateArithmeticExpansion);

					return t.return(TokenPunctuator, main);
				}

				state.push(stateParens);

				return t.return(TokenPunctuator, main);
			} else if (t.accept("{")) {
				state.push(stateBraceExpansion);

				return t.return(TokenPunctuator, parameterExpansionIdentifierOrPreOperator);
			} else if (t.accept("$?!@*")) {
				return t.return(TokenIdentifier, main);
			} else {
				const td = state.at(-1);

				if (td !== stateStringDouble && td !== stateHeredocIdentifier && t.accept("'\"")) {
					t.reset();

					return stringStart(t);
				}
			}

			let wb = "";

			switch (state.at(-1)) {
			case stateBraceExpansion:
				wb = wordBreakNoBrace;

				break;
			case stateParameterExpansionSubString:
				wb = wordBreakSubstring

				break;
			case stateArrayIndex:
			case stateBraceExpansionArrayIndex:
				wb = wordBreakIndex;

				break;
			case stateCommandIndex:
				wb = wordBreakCommandIndex;

				break;
			case stateArithmeticExpansion:
			case stateArithmeticParens:
			case stateTernary:
			case stateForArithmetic:
				wb = wordBreakArithmetic;

				break;
			case stateTest:
			case stateTestBinary:
				wb = testWordBreak;

				break;
			default:
				wb = wordBreak;
			}

			t.exceptRun(wb);

			return t.return(TokenIdentifier, main);
		      },
		      heredocEnd = (t: Tokeniser) => {
			const h = heredoc.at(-1)![0];

			heredoc.at(-1)!.shift();

			t.acceptString(h.delim, false);

			if (heredoc.at(-1)!.length === 0) {
				heredoc.pop();
				state.pop();
			}

			return t.return(TokenStringLiteral, main);
		      },
		      heredocString = (t: Tokeniser): [Token, TokenFn] => {
			const h = heredoc.at(-1)![0];

			if (h.stripped && t.accept("\t")) {
				t.acceptRun("\t");

				return t.return(TokenWhitespace, heredocString);
			}

			let charBreak = newline;

			if (h.expand) {
				charBreak = heredocStringBreak;
			}

			while (true) {
				const stateb = t.state();

				if (t.acceptString(h.delim, false) === h.delim.length && (t.peek() === '\n' || t.peek() === '')) {
					stateb();

					const str = t.get();

					if (str.length === 0) {
						return heredocEnd(t);
					}

					return [{"type": TokenStringLiteral, "data": str}, heredocEnd]
				}

				switch (t.exceptRun(charBreak)) {
				case '':
					return errUnexpectedEOF(t);
				case '$':
					const stateb = t.state();;

					t.next();

					if (t.accept(decimalDigit) || t.accept(identStart) || t.accept("({$!?")) {
						stateb();

						state.push(stateHeredocIdentifier);

						const str = t.get();

						if (str.length === 0) {
							return identifier(t);
						}

						return [{"type": TokenStringLiteral, "data": str}, identifier];
					}

					continue;
				case '\n':
					t.next();

					if (h.stripped && t.peek() === '\t') {
						return t.return(TokenStringLiteral, heredocString);
					}
				}
			}
		      },
		      startHeredoc = (t: Tokeniser): [Token, TokenFn] => {
			if (t.peek() === "" || t.accept(newline) || t.accept("#")) {
				return errUnexpectedEOF(t);
			} else if (parseWhitespace(t)) {
				return t.return(TokenWhitespace, startHeredoc);
			}

			let chars = heredocsBreak;

			Loop:
			while (true) {
				switch (t.exceptRun(chars)) {
				case "":
					return errUnexpectedEOF(t);
				case '\\':
					t.next();
					t.next();

					break;
				case '\'':
					t.next();

					if (chars === heredocsBreak) {
						chars = "'";
					} else {
						chars = heredocsBreak;
					}

					break;
				case '"':
					t.next();

					if (chars === heredocsBreak) {
						chars = "\\\"";
					} else {
						chars = heredocsBreak;
					}

					break;
				default:
					break Loop;
				}
			}

			const tk: Token = {type: TokenKeyword, data: t.get()},
			      hdt: heredocType = {stripped: nextHeredocIsStripped, delim: unstring(tk.data), expand: false},
			      inCommand = isInCommand();

			hdt.expand = hdt.delim === tk.data;

			endCommand();

			if (state.at(-1) === stateHeredoc) {
				heredoc.at(-1)!.push(hdt);
			} else {
				state.push(stateHeredoc);

				heredoc.push([hdt])
			}

			if (inCommand) {
				setInCommand();
			}

			return [tk, main];
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

			while (t.length() !== pos) {
				t.next();
			}

			return [tk, backtick];
		      },
		      startBacktick = (t: Tokeniser) => {
			t.next();

			child = Parser(subTokeniser(t), bash);

			return t.return(TokenPunctuator, backtick);
		      },
		      endGroup = (t: Tokeniser) => {
			const cstate = t.state();

			let next = main;

			t.acceptRun(whitespace);

			switch (state.at(-1)) {
			case stateIfTest:
				if (t.acceptString("then") === 4 && isWordSeperator(t)) {
					next = ifThen;
				}

				break;
			case stateLoopCondition:
				if (t.acceptString("do") === 2 && isWordSeperator(t)) {
					next = loopDo;
				}
			}

			cstate();

			return t.return(TokenPunctuator, next);
		      },
		      operatorOrWord = (t: Tokeniser) => {
			const c = t.peek();

			switch (c) {
			case '<':
				t.next();

				if (t.accept("(")) {
					state.push(stateParens);
				} else if (t.accept("<")) {
					if (!t.accept("<")) {
						nextHeredocIsStripped = t.accept("-");

						return t.return(TokenPunctuator, startHeredoc);
					}
				} else {
					t.accept("&>");
				}

				break;
			case '>':
				t.next();

				if (t.accept("(")) {
					state.push(stateParens);
				} else {
					t.accept(">&|");
				}

				break;
			case '|':
				t.next();
				t.accept("&|");
				endCommand();

				break;
			case '&':
				t.next();

				if (t.accept(">")) {
					t.accept(">");
				} else {
					endCommand();

					if (!t.accept("&")) {
						const td = state.at(-1);

						if (td === stateIfTest) {
							return t.return(TokenPunctuator, ifThen);
						} else if (td === stateLoopCondition) {
							return t.return(TokenPunctuator, loopDo)
						}
					}
				}

				break;
			case ';':
				t.next();

				let l = t.accept(";");

				if (t.accept("&")) {
					l = true;
				}

				endCommand();

				if (l) {
					if (state.at(-1) !== stateCaseBody) {
						return errInvalidCharacter(t);
					} else {
						state.pop();
						state.push(stateCaseEnd);
					}
				}

				const td = state.at(-1);

				if (td === stateIfTest) {
					return t.return(TokenPunctuator, ifThen);
				} else if (td === stateLoopCondition) {
					return t.return(TokenPunctuator, loopDo);
				}

				break;
			case '"':
			case '\'':
				setInCommand();

				return stringStart(t);
			case '(':
				if (isInCommand()) {
					return errInvalidCharacter(t);
				}

				t.next();
				setInCommand();

				state.push(t.accept("(") ? stateArithmeticExpansion : stateParensGroup);

				break;
			case '{':
				t.next();

				const tk = t.peek();

				if (whitespaceNewline.includes(tk) && !isInCommand()) {
					setInCommand();
					state.push(stateBrace);
				} else {
					setInCommand();

					return braceExpansion(t);
				}

				break;
			case ')':
				endCommand();
				t.next();

				const tda = state.at(-1);

				if (tda === stateParensGroup) {
					state.pop();
					endCommand();

					return endGroup(t);
				} else if (tda === stateParens) {
					state.pop();
				} else if (tda === stateCaseEnd) {
					state.pop();
					state.push(stateCaseBody);
				} else {
					return errInvalidCharacter(t);
				}

				break;
			case '}':
				t.next();

				const tdb = state.at(-1);

				if (tdb === stateBrace) {
					state.pop();
					endCommand();

					return endGroup(t);
				} else if (tdb === stateBraceExpansion) {
					state.pop();
					endCommand();
				} else if (tdb == stateBraceExpansionWord) {
					state.pop();
				} else if (tdb == stateParameterExpansionSubString) {
					state.pop();
					state.pop();
				}

				break;
			case ':':
				const tdc = state.at(-1);

				if (tdc != stateParameterExpansionSubString) {
					return keywordIdentOrWord(t);
				}

				state.pop();
				t.next();

				break;
			case '$':
				setInCommand();

				return identifier(t);
			case ',':
				if (state.at(-1) != stateBraceExpansionWord) {
					return keywordIdentOrWord(t);
				}

				t.next();

				break;
			case '`':
				setInCommand();

				return startBacktick(t);
			case ']':
				if (state.at(-1) === stateBraceExpansionArrayIndex) {
					t.next();
					state.pop();

					return t.return(TokenPunctuator, parameterExpansionOperation);
				}
			default:
				return keywordIdentOrWord(t);
			}

			return t.return(TokenPunctuator, main);
		      },
		      arithmeticExpansion = (t: Tokeniser) => {
			const c = t.peek();

			switch (c) {
			case '"':
			case '\'':
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

				const tdb = state.at(-1);

				if (tdb === stateBuiltinLetExpression || tdb == stateBuiltinLetParens || tdb === stateBuiltinLetTernary) {
					state.push(stateBuiltinLetTernary);
				} else {
					state.push(stateTernary);
				}

				break;
			case ':':
				t.next();

				const tdc = state.at(-1);

				if (tdc !== stateTernary && tdc !== stateBuiltinLetTernary ) {
					return errInvalidCharacter(t);
				}

				state.pop();

				break;
			case ']':
				t.next();

				const td = state.at(-1);
				
				if (td === stateCommandIndex) {
					return t.return(TokenPunctuator, endCommandIndex);
				} else if (td === stateArrayIndex) {
					return t.return(TokenPunctuator, startAssign);
				}

				return errInvalidCharacter(t);
			case ')':
				t.next();

				const tda = state.at(-1);

				if ((tda !== stateArithmeticExpansion && tda !== stateForArithmetic || !t.accept(")")) && tda !== stateArithmeticParens && tda !== stateBuiltinLetParens) {
					return errInvalidCharacter(t);
				}

				state.pop();

				break;
			case '(':
				t.next();

				const tdd = state.at(-1);

				if (tdd === stateBuiltinLetExpression || tdd === stateBuiltinLetParens || tdd === stateBuiltinLetTernary) {
					state.push(stateBuiltinLetParens);
				} else {
					state.push(stateArithmeticParens);
				}

				break;
			case '0':
				return zero(t);
			case ';':
				const tdf = state.at(-1);

				if (tdf === stateBuiltinLetExpression) {
					endCommand();
				} else if (tdf !== stateForArithmetic) {
					return errInvalidCharacter(t);
				}

				t.next();

				break;
			case '{':
				const tde = state.at(-1);

				if (tde === stateBuiltinLetExpression || tde === stateBuiltinLetParens || tde === stateBuiltinLetTernary) {
					t.next();

					return braceExpansion(t);
				}
			case '}':
				if (state.at(-1) === stateCommandIndex) {
					t.next();

					return t.return(TokenPunctuator, main);
				}

				return errInvalidCharacter(t);
			default:
				return number(t)
			}

			return t.return(TokenPunctuator, main);
		      },
		      string = (t: Tokeniser) => {
			const td = state.at(-1),
			      stops = td === stateStringDouble ? doubleStops : td === stateStringSpecial ? ansiStops : singleStops;

			while (true) {
				switch (t.exceptRun(stops)) {
				default:
					return errUnexpectedEOF(t);
				case '`':
					return t.return(TokenStringLiteral, startBacktick);
				case '$':
					return t.return(TokenStringLiteral, identifier);
				case '"':
				case'\'':
					t.next();
					state.pop();

					return t.return(TokenStringLiteral, main);
				case '\\':
					t.next();
					t.next();
				}
			}
		      },
		      main = (t: Tokeniser) => {
			let td = state.at(-1);

			if (td === stateValue && (isWhitespace(t) || t.peek() === ';')) {
				state.pop();

				td = state.at(-1);
			}

			if (isWhitespace(t) && td === stateCaseParam) {
				return caseIn(t);
			} else if (td === stateTestPattern) {
				state.pop();

				return testPattern(t);
			} else if (t.peek() === '') {
				endCommand();

				td = state.at(-1);

				if (td === undefined) {
					return t.done();
				}

				return errUnexpectedEOF(t);
			} else if (td === stateHeredocIdentifier) {
				state.pop();

				return heredocString(t);
			} else if (td === stateStringDouble || td === stateStringSingle) {
				return string(t);
			} else if (td === stateTest) {
				return testWord(t);
			} else if (td === stateTestBinary) {
				return testBinaryOperator(t);
			} else if (parseWhitespace(t)) {
				if (td === stateArrayIndex || td === stateBraceExpansionArrayIndex) {
					state.pop();

					if (!isInCommand()) {
						state.push(td);
					}
				} else if (td === stateBuiltinLetExpression) {
					state.pop();
				}

				if (td === stateCommandIndex) {
					return t.return(TokenKeyword, main);
				}

				return t.return(TokenWhitespace, main);
			} else if (t.accept(newline)) {
				endCommand();

				td = state.at(-1);
				if (td === stateHeredoc) {
					return t.return(TokenLineTerminator, heredocString);
				}

				endCommand();
				t.acceptRun(newline);

				if (td === stateIfTest) {
					return t.return(TokenLineTerminator, ifThen);
				} else if (td === stateLoopCondition) {
					return t.return(TokenLineTerminator, loopDo);
				}

				if (td === stateCommandIndex) {
					return t.return(TokenKeyword, main);
				}

				return t.return(TokenLineTerminator, main);
			} else if (t.accept("#")) {
				if (td === stateBraceExpansion || td === stateCommandIndex) {
					return word(t);
				} else if (td === stateArithmeticExpansion || td === stateArithmeticParens || td === stateTernary || td === stateForArithmetic || td === stateArrayIndex || td === stateBuiltinLetExpression || td === stateBuiltinLetParens || td === stateBuiltinLetTernary) {
					return errInvalidCharacter(t);
				}

				t.exceptRun(newline);

				return t.return(TokenSingleLineComment, main);
			} else if (td === stateArithmeticExpansion || td === stateArithmeticParens || td === stateTernary || td === stateForArithmetic || td === stateArrayIndex || td === stateCommandIndex || td === stateBuiltinLetExpression || td === stateBuiltinLetParens || td === stateBuiltinLetTernary) {
				return arithmeticExpansion(t);
			} else if (td === stateBuiltinLet) {
				return letExpressionOrWord(t);
			}

			return operatorOrWord(t);
		      },
		      isInCommand = () => state.at(-1) === stateInCommand,
		      endCommand = () => {
			let td = state.at(-1);

			if (td === stateBuiltinLetExpression) {
				state.pop();

				td = state.at(-1);
			}

			if (td === stateBuiltinLet) {
				state.pop();
			}

			if (isInCommand()) {
				state.pop();

				if (state.at(-1) === stateFunctionBody) {
					state.pop();
				}
			}
		      },
		      setInCommand = () => {
			switch (state.at(-1)) {
			default:
				state.push(stateInCommand);
			case stateArrayIndex:
			case stateBraceExpansionWord:
			case stateBraceExpansionArrayIndex:
			case stateInCommand:
			case stateHeredocIdentifier:
			case stateStringDouble:
			case stateArithmeticExpansion:
			case stateArithmeticParens:
			case stateBraceExpansion:
			case stateCaseParam:
			case stateForArithmetic:
			case stateTest:
			case stateTestBinary:
			case stateValue:
			case stateCommandIndex:
			case stateBuiltinLet:
			case stateBuiltinLetExpression:
			case stateBuiltinLetParens:
			case stateBuiltinLetTernary:
			case stateParameterExpansionSubString:
			}
		      },
		      heredoc: heredocType[][] = [];

		let nextHeredocIsStripped = false,
		    child: Generator<Token, Token>;

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
					state.push("#");
				} else {
					state.push("]");
				}
			} else if (tk.accept("(")) {
				state.push(")");
			} else if (tk.accept("{")) {
				state.push("}");
			} else if (tk.accept("]")) {
				const last = state.pop();

				if (last === "#") {
					if (!tk.accept("]")) {
						return errInvalidOperator(tk);
					}
				} else if (last !== "]") {
					return errInvalidOperator(tk);
				}
			} else if (tk.accept(")")) {
				if (state.pop() !== ")") {
					return errInvalidOperator(tk);
				}
			} else if (tk.accept("}")) {
				if (state.pop() !== "}") {
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
				if (state.length) {
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
		      state: string[] = [];

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
				if (state.length) {
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
				state.push(')');

				return tk.return(TokenPunctuator, main);
			case '[':
				tk.next();
				state.push(']');

				return tk.return(TokenPunctuator, main);
			case '{':
				tk.next();
				state.push('}');

				return tk.return(TokenPunctuator, main);
			case ')':
			case ']':
			case '}':
				if (state.pop() !== c) {
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
		      state: string[] = [];

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
