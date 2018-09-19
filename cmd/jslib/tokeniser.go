package main

import (
	"io"
	"strings"
	"unicode"

	"vimagination.zapto.org/errors"
	"vimagination.zapto.org/parser"
)

const (
	whitespace      = "\t\v\f \xa0\ufeff" // Tab, Vertical Tab, Form Feed, Space, No-break space, ZeroWidth No-Break Space, https://www.ecma-international.org/ecma-262/8.0/index.html#table-32
	lineTerminators = "\n\r\u2028\u2029"  // Line Feed, Carriage Return, Line Separator, Paragraph Separator, https://www.ecma-international.org/ecma-262/8.0/index.html#table-33

	singleEscapeChar = "'\"\\bfnbrtv"
	binaryDigit      = "01"
	octalDigit       = "01234567"
	decimalDigit     = "0123456789"
	hexDigit         = "0123456789abcdefABCDEF"

	zwnj rune = 8204
	zwj  rune = 8205
)

var keywords = [...]string{"await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"}

const (
	TokenWhitespace parser.TokenType = iota
	TokenLineTerminator
	TokenSingleLineComment
	TokenMultiLineComment
	TokenIdentifier
	TokenBooleanLiteral
	TokenKeyword
	TokenPunctuator
	TokenNumericLiteral
	TokenStringLiteral
	TokenNoSubstitutionTemplate
	TokenTemplateHead
	TokenTemplateMiddle
	TokenTemplateTail
	TokenDivPunctuator
	TokenRightBracePunctuator
	TokenRegularExpressionLiteral
)

type jsParser struct {
	tokenDepth      []byte
	divisionAllowed bool
}

func (j *jsParser) inputElement(t *parser.Tokeniser) (parser.Token, parser.TokenFunc) {
	if t.Accept(whitespace) {
		t.AcceptRun(whitespace)
		return parser.Token{
			Type: TokenWhitespace,
			Data: t.Get(),
		}, j.inputElement
	}
	if t.Accept(lineTerminators) {
		t.AcceptRun(lineTerminators)
		return parser.Token{
			Type: TokenLineTerminator,
			Data: t.Get(),
		}, j.inputElement
	}
	allowDivision := j.divisionAllowed
	j.divisionAllowed = false
	c := t.Peek()
	switch c {
	case -1:
		if len(j.tokenDepth) == 0 {
			return t.Done()
		}
		t.Err = io.ErrUnexpectedEOF
		return t.Error()
	case '/':
		t.Except("")
		if t.Accept("/") {
			t.ExceptRun(lineTerminators)
			return parser.Token{
				Type: TokenSingleLineComment,
				Data: t.Get(),
			}, j.inputElement
		}
		if t.Accept("*") {
			t.ExceptRun("*")
			t.Accept("*")
			if t.Accept("/") {
				j.divisionAllowed = allowDivision
				return parser.Token{
					Type: TokenMultiLineComment,
					Data: t.Get(),
				}, j.inputElement
			}
			if t.Peek() == -1 {
				t.Err = io.ErrUnexpectedEOF
			} else {
				t.Except("")
				t.Err = errors.WithContext("error parsing comment: ", errors.Error(t.Get()))
			}
			return t.Error()
		}
		if allowDivision {
			t.Accept("=")
			return parser.Token{
				Type: TokenDivPunctuator,
				Data: t.Get(),
			}, j.inputElement
		}
		j.divisionAllowed = true
		return j.regexp(t)
	case '}':
		t.Except("")
		switch j.lastDepth() {
		case '{':
			j.tokenDepth = j.tokenDepth[:len(j.tokenDepth)-1]
			return parser.Token{
				Type: TokenRightBracePunctuator,
				Data: t.Get(),
			}, j.inputElement
		case '$':
			return j.template(t)
		}
		t.Err = errors.WithContext("invalid character: ", errors.Error(t.Get()))
		return t.Error()
	case '\'', '"':
		j.divisionAllowed = true
		return j.stringToken(t)
	case '`':
		t.Except("")
		return j.template(t)
	default:
		if strings.ContainsRune(decimalDigit, c) {
			j.divisionAllowed = true
			return j.number(t)
		}
		if unicode.Is(unicode.Other_ID_Start, c) || c == '$' || c == '_' || c == '\\' {
			tk, tf := j.identifier(t)
			if tk.Type == TokenIdentifier {
				if tk.Data == "true" || tk.Data == "false" {
					j.divisionAllowed = true
					tk.Type = TokenBooleanLiteral
				} else if tk.Data == "Infinity" {
					j.divisionAllowed = true
					tk.Type = TokenNumericLiteral
				} else {
					for _, kw := range keywords {
						if kw == tk.Data {
							tk.Type = TokenKeyword
							if tk.Data == "this" {
								j.divisionAllowed = true
							}
							break
						}
					}
					if tk.Type == TokenIdentifier {
						j.divisionAllowed = true
					}
				}
			}
			return tk, tf
		}
		t.Except("")
		switch c {
		case '{', '(', '[':
			j.tokenDepth = append(j.tokenDepth, byte(c))
		case ';', ',', '?', ':', '~':
		case ')', ']':
			if j.lastDepth() != c {
				t.Err = errors.WithContext("read invalid character: ", errors.Error(t.Get()))
				return t.Error()
			}
			j.divisionAllowed = true
			j.tokenDepth = j.tokenDepth[:len(j.tokenDepth)-1]
		case '.':
			if t.Accept(".") {
				if !t.Accept(".") { // ...
					if t.Peek() == -1 {
						t.Err = io.ErrUnexpectedEOF
					} else {
						t.Except("")
						t.Err = errors.WithContext("invalid character sequence: ", errors.Error(t.Get()))
					}
					return t.Error()
				}
			}
		case '<', '>':
			if !t.Accept("=") { //>=, <=
				if t.Peek() == c { // >>, <<
					t.Except("")
					if !t.Accept("=") && c == '>' { // >>=, <<=
						t.Accept(">") // >>>
					}
				}
			}
		case '=':
			if t.Accept("=") { // ==
				t.Accept("=") // ===
			} else {
				t.Accept(">") // =>
			}
		case '!':
			if t.Accept("=") { // !=
				t.Accept("=") // !==
			}
		case '+', '-':
			if t.Peek() == c {
				t.Except("") // ++, --
			} else {
				t.Accept("=") // +=, -=
			}
		case '*':
			t.Accept("*=") // **, *=
		case '&', '|':
			if t.Peek() == c {
				t.Except("") // &&, ||
			} else {
				t.Accept("=") // &=, |=
			}
		case '%', '^':
			t.Accept("=") // %=, ^=
		default:
			t.Err = errors.WithContext("read invalid character: ", errors.Error(t.Get()))
			return t.Error()
		}
		return parser.Token{
			Type: TokenPunctuator,
			Data: t.Get(),
		}, j.inputElement
	}
}

func (j *jsParser) regexpBackslashSequence(t *parser.Tokeniser) bool {
	t.Except("")
	if t.Except(lineTerminators) {
		if t.Peek() == -1 {
			t.Err = io.ErrUnexpectedEOF
		} else {
			t.Except("")
			t.Err = errors.WithContext("invalid regexp character: ", errors.Error(t.Get()))
		}
		return false
	}
	return true
}

func (j *jsParser) regexpExpressionClass(t *parser.Tokeniser) bool {
	t.Except("")
	for {
		switch t.ExceptRun("]\\") {
		case ']':
			t.Except("")
			return true
		case '\\':
			if !j.regexpBackslashSequence(t) {
				return false
			}
		default:
			t.Err = io.ErrUnexpectedEOF
			return false
		}
	}
}

func (j *jsParser) regexp(t *parser.Tokeniser) (parser.Token, parser.TokenFunc) {
	switch c := t.Peek(); c {
	case -1:
		t.Err = io.ErrUnexpectedEOF
		return t.Error()
	case '\\':
		if !j.regexpBackslashSequence(t) {
			return t.Error()
		}
	case '[':
		if !j.regexpExpressionClass(t) {
			return t.Error()
		}
	default:
		t.Except("")
		if strings.ContainsRune(lineTerminators, c) {
			t.Err = errors.WithContext("invalid regexp character: ", errors.Error(t.Get()))
			return t.Error()
		}
	}
Loop:
	for {
		switch c := t.ExceptRun(lineTerminators + "\\[/"); c {
		case -1:
			t.Err = io.ErrUnexpectedEOF
			return t.Error()
		case '\\':
			if !j.regexpBackslashSequence(t) {
				return t.Error()
			}
		case '[':
			if !j.regexpExpressionClass(t) {
				return t.Error()
			}
		case '/':
			t.Except("")
			break Loop
		default:
			t.Except("")
			if strings.ContainsRune(lineTerminators, c) {
				t.Err = errors.WithContext("invalid regexp character: ", errors.Error(t.Get()))
				return t.Error()
			}
		}
	}
	for {
		if c := t.Peek(); !unicode.Is(unicode.Other_ID_Continue, c) && c != '$' && c != '_' && c != '\\' && c != zwnj && c != zwj {
			break
		}
		t.Except("")
	}
	return parser.Token{
		Type: TokenRegularExpressionLiteral,
		Data: t.Get(),
	}, j.inputElement
}

func (j *jsParser) number(t *parser.Tokeniser) (parser.Token, parser.TokenFunc) {
	if t.Accept("0") {
		if t.Accept("bB") {
			if !t.Accept(binaryDigit) {
				t.Except("")
				t.Err = errors.WithContext("invalid binary number: ", errors.Error(t.Get()))
				return t.Error()
			}
			t.AcceptRun(binaryDigit)
		} else if t.Accept("oO") {
			if !t.Accept(octalDigit) {
				t.Except("")
				t.Err = errors.WithContext("invalid octal number: ", errors.Error(t.Get()))
				return t.Error()
			}
			t.AcceptRun(octalDigit)
		} else if t.Accept("xX") {
			if !t.Accept(hexDigit) {
				t.Except("")
				t.Err = errors.WithContext("invalid hex number: ", errors.Error(t.Get()))
				return t.Error()
			}
			t.AcceptRun(hexDigit)
		}
	} else {
		t.AcceptRun(decimalDigit)
		if t.Accept(".") {
			t.AcceptRun(decimalDigit)
		}
		if t.Accept("eE") {
			t.Accept("+-")
			t.AcceptRun(decimalDigit)
		}
	}
	return parser.Token{
		Type: TokenNumericLiteral,
		Data: t.Get(),
	}, j.inputElement
}

func (j *jsParser) identifier(t *parser.Tokeniser) (parser.Token, parser.TokenFunc) {
	c := t.Peek()
	t.Except("")
	if c == '\\' {
		if !t.Accept("u") {
			t.Except("")
			t.Err = errors.WithContext("unexpected backslash: ", errors.Error(t.Get()))
			return t.Error()
		}
		if !j.unicodeEscapeSequence(t) {
			t.Except("")
			return t.Error()
		}
	}
	for {
		c = t.Peek()
		if unicode.Is(unicode.Other_ID_Continue, c) || c == '$' || c == '_' || c == '\\' || c == zwnj || c == zwj {
			t.Except("")
			continue
		}
		break
	}
	return parser.Token{
		Type: TokenIdentifier,
		Data: t.Get(),
	}, j.inputElement
}

func (j *jsParser) unicodeEscapeSequence(t *parser.Tokeniser) bool {
	if t.Accept("{") {
		if !t.Accept(hexDigit) {
			t.Except("")
			t.Err = errors.WithContext("expecting hex digit: ", errors.Error(t.Get()))
			return false
		}
		t.AcceptRun(hexDigit)
		if !t.Accept("}") {
			t.Err = errors.WithContext("expecting ending unicode brace: ", errors.Error(t.Get()))
			return false
		}
	} else if !t.Accept(hexDigit) || !t.Accept(hexDigit) || !t.Accept(hexDigit) || !t.Accept(hexDigit) {
		return false
	}
	return true
}

func (j *jsParser) lastDepth() rune {
	if len(j.tokenDepth) == 0 {
		return -1
	}
	return rune(j.tokenDepth[len(j.tokenDepth)-1])
}

func (j *jsParser) escapeSequence(t *parser.Tokeniser) bool {
	t.Accept("\\")
	if t.Accept("x") {
		return t.Accept(hexDigit) && t.Accept(hexDigit)
	} else if t.Accept("u") {
		return j.unicodeEscapeSequence(t)
	} else if t.Accept("0") {
		return !t.Accept(decimalDigit)
	}
	return t.Accept(singleEscapeChar)
}

func (j *jsParser) stringToken(t *parser.Tokeniser) (parser.Token, parser.TokenFunc) {
	const (
		singleStringChars = "'\\" + lineTerminators
		doubleStringChars = "\"\\" + lineTerminators
	)
	var chars string
	if t.Peek() == '"' {
		chars = doubleStringChars
	} else {
		chars = singleStringChars
	}
	t.Except("")
Loop:
	for {
		switch c := t.ExceptRun(chars); c {
		case '"', '\'':
			t.Except("")
			break Loop
		case '\\':
			if j.escapeSequence(t) {
				continue
			}
			if t.Err == nil {
				t.Err = errors.WithContext("invalid escape sequence: ", errors.Error(t.Get()))
			}
		default:
			t.Err = io.ErrUnexpectedEOF
			if strings.ContainsRune(lineTerminators, c) {
				t.Except("")
				t.Err = errors.WithContext("line terminator in string: ", errors.Error(t.Get()))
			}
		}
		return t.Error()
	}
	return parser.Token{
		Type: TokenStringLiteral,
		Data: t.Get(),
	}, j.inputElement
}

func (j *jsParser) template(t *parser.Tokeniser) (parser.Token, parser.TokenFunc) {
	for {
		switch t.ExceptRun("`\\$") {
		case '`':
			t.Except("")
			break
		case '\\':
			if j.escapeSequence(t) {
				continue
			}
			if t.Err == nil {
				t.Err = errors.WithContext("invalid escape sequence: ", errors.Error(t.Get()))
			}
			return t.Error()
		case '$':
			t.Except("")
			if t.Accept("{") {
				j.tokenDepth = append(j.tokenDepth, '$')
				v := t.Get()
				var typ parser.TokenType
				if v[0] == '`' {
					typ = TokenTemplateHead
				} else {
					typ = TokenTemplateMiddle
				}
				return parser.Token{
					Type: typ,
					Data: v,
				}, j.inputElement
			}
		default:
			t.Err = io.ErrUnexpectedEOF
			return t.Error()
		}
	}
	j.divisionAllowed = true
	v := t.Get()
	var typ parser.TokenType
	if v[0] == '`' {
		typ = TokenNoSubstitutionTemplate
	} else {
		typ = TokenTemplateTail
	}
	return parser.Token{
		Type: typ,
		Data: v,
	}, j.inputElement
}
