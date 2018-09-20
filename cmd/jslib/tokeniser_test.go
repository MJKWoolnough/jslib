package main

import (
	"testing"

	"vimagination.zapto.org/parser"
)

func TestTokeniser(t *testing.T) {
	for n, test := range [...]struct {
		Input  string
		Output []parser.Token
	}{
		{
			"",
			[]parser.Token{
				{parser.TokenDone, ""},
			},
		},
		{
			" ",
			[]parser.Token{
				{TokenWhitespace, " "},
				{parser.TokenDone, ""},
			},
		},
		{
			" 	",
			[]parser.Token{
				{TokenWhitespace, " 	"},
				{parser.TokenDone, ""},
			},
		},
		{
			" \n ",
			[]parser.Token{
				{TokenWhitespace, " "},
				{TokenLineTerminator, "\n"},
				{TokenWhitespace, " "},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"\"",
			[]parser.Token{
				{TokenStringLiteral, "\"\""},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"\\\"\"",
			[]parser.Token{
				{TokenStringLiteral, "\"\\\"\""},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"\n\"",
			[]parser.Token{
				{parser.TokenError, "line terminator in string: \"\n"},
			},
		},
		{
			"\"\\n\"",
			[]parser.Token{
				{TokenStringLiteral, "\"\\n\""},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"\\0\"",
			[]parser.Token{
				{TokenStringLiteral, "\"\\0\""},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"\\x20\"",
			[]parser.Token{
				{TokenStringLiteral, "\"\\x20\""},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"\\u2020\"",
			[]parser.Token{
				{TokenStringLiteral, "\"\\u2020\""},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"\\u\"",
			[]parser.Token{
				{parser.TokenError, "invalid escape sequence: \"\\u\""},
			},
		},
		{
			"\"\\up\"",
			[]parser.Token{
				{parser.TokenError, "invalid escape sequence: \"\\up"},
			},
		},
		{
			"\"\\u{20}\"",
			[]parser.Token{
				{TokenStringLiteral, "\"\\u{20}\""},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"use strict\"",
			[]parser.Token{
				{TokenStringLiteral, "\"use strict\""},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"use\\u{20}strict\\x65!\\0\"",
			[]parser.Token{
				{TokenStringLiteral, "\"use\\u{20}strict\\x65!\\0\""},
				{parser.TokenDone, ""},
			},
		},
		{
			"\"use strict\";",
			[]parser.Token{
				{TokenStringLiteral, "\"use strict\""},
				{TokenPunctuator, ";"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0",
			[]parser.Token{
				{TokenNumericLiteral, "0"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0b0",
			[]parser.Token{
				{TokenNumericLiteral, "0b0"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0b1",
			[]parser.Token{
				{TokenNumericLiteral, "0b1"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0b1001010101",
			[]parser.Token{
				{TokenNumericLiteral, "0b1001010101"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0",
			[]parser.Token{
				{TokenNumericLiteral, "0"},
				{parser.TokenDone, ""},
			},
		},
		{
			"1",
			[]parser.Token{
				{TokenNumericLiteral, "1"},
				{parser.TokenDone, ""},
			},
		},
		{
			"9",
			[]parser.Token{
				{TokenNumericLiteral, "9"},
				{parser.TokenDone, ""},
			},
		},
		{
			"12345678901",
			[]parser.Token{
				{TokenNumericLiteral, "12345678901"},
				{parser.TokenDone, ""},
			},
		},
		{
			"12345678.901",
			[]parser.Token{
				{TokenNumericLiteral, "12345678.901"},
				{parser.TokenDone, ""},
			},
		},
		{
			"12345678901E123",
			[]parser.Token{
				{TokenNumericLiteral, "12345678901E123"},
				{parser.TokenDone, ""},
			},
		},
		{
			"12345678901e+123",
			[]parser.Token{
				{TokenNumericLiteral, "12345678901e+123"},
				{parser.TokenDone, ""},
			},
		},
		{
			"12345678.901E-123",
			[]parser.Token{
				{TokenNumericLiteral, "12345678.901E-123"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0x0",
			[]parser.Token{
				{TokenNumericLiteral, "0x0"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0xa",
			[]parser.Token{
				{TokenNumericLiteral, "0xa"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0xf",
			[]parser.Token{
				{TokenNumericLiteral, "0xf"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0x0f",
			[]parser.Token{
				{TokenNumericLiteral, "0x0f"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0xaf",
			[]parser.Token{
				{TokenNumericLiteral, "0xaf"},
				{parser.TokenDone, ""},
			},
		},
		{
			"0xDeAdBeEf",
			[]parser.Token{
				{TokenNumericLiteral, "0xDeAdBeEf"},
				{parser.TokenDone, ""},
			},
		},
		{
			"Infinity",
			[]parser.Token{
				{TokenNumericLiteral, "Infinity"},
				{parser.TokenDone, ""},
			},
		},
		{
			"true",
			[]parser.Token{
				{TokenBooleanLiteral, "true"},
				{parser.TokenDone, ""},
			},
		},
		{
			"false",
			[]parser.Token{
				{TokenBooleanLiteral, "false"},
				{parser.TokenDone, ""},
			},
		},
		{
			"hello",
			[]parser.Token{
				{TokenIdentifier, "hello"},
				{parser.TokenDone, ""},
			},
		},
		{
			"this",
			[]parser.Token{
				{TokenKeyword, "this"},
				{parser.TokenDone, ""},
			},
		},
		{
			"function",
			[]parser.Token{
				{TokenKeyword, "function"},
				{parser.TokenDone, ""},
			},
		},
		{
			"/[a-z]+/g",
			[]parser.Token{
				{TokenRegularExpressionLiteral, "/[a-z]+/g"},
				{parser.TokenDone, ""},
			},
		},
		{
			"var a =	 /^ab[cd]*$/ig;",
			[]parser.Token{
				{TokenKeyword, "var"},
				{TokenWhitespace, " "},
				{TokenIdentifier, "a"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "="},
				{TokenWhitespace, "	 "},
				{TokenRegularExpressionLiteral, "/^ab[cd]*$/ig"},
				{TokenPunctuator, ";"},
				{parser.TokenDone, ""},
			},
		},
		{
			"num /= 4",
			[]parser.Token{
				{TokenIdentifier, "num"},
				{TokenWhitespace, " "},
				{TokenDivPunctuator, "/="},
				{TokenWhitespace, " "},
				{TokenNumericLiteral, "4"},
				{parser.TokenDone, ""},
			},
		},
		{
			"const num = 8 / 4;",
			[]parser.Token{
				{TokenKeyword, "const"},
				{TokenWhitespace, " "},
				{TokenIdentifier, "num"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "="},
				{TokenWhitespace, " "},
				{TokenNumericLiteral, "8"},
				{TokenWhitespace, " "},
				{TokenDivPunctuator, "/"},
				{TokenWhitespace, " "},
				{TokenNumericLiteral, "4"},
				{TokenPunctuator, ";"},
				{parser.TokenDone, ""},
			},
		},
		{
			"``",
			[]parser.Token{
				{TokenNoSubstitutionTemplate, "``"},
				{parser.TokenDone, ""},
			},
		},
		{
			"`abc`",
			[]parser.Token{
				{TokenNoSubstitutionTemplate, "`abc`"},
				{parser.TokenDone, ""},
			},
		},
		{
			"`ab${ (val.a / 2) + 1 }c${str}`",
			[]parser.Token{
				{TokenTemplateHead, "`ab${"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "("},
				{TokenIdentifier, "val"},
				{TokenPunctuator, "."},
				{TokenIdentifier, "a"},
				{TokenWhitespace, " "},
				{TokenDivPunctuator, "/"},
				{TokenWhitespace, " "},
				{TokenNumericLiteral, "2"},
				{TokenPunctuator, ")"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "+"},
				{TokenWhitespace, " "},
				{TokenNumericLiteral, "1"},
				{TokenWhitespace, " "},
				{TokenTemplateMiddle, "}c${"},
				{TokenIdentifier, "str"},
				{TokenTemplateTail, "}`"},
				{parser.TokenDone, ""},
			},
		},
		{
			"const myFunc = function(aye, bee, cea) {\n	const num = [123, 4, lastNum(aye, \"beep\", () => window, val => val * 2, (myVar) => {myVar /= 2;return myVar;})], elm = document.getElementByID();\n	console.log(bee, num, elm);}",
			[]parser.Token{
				{TokenKeyword, "const"},
				{TokenWhitespace, " "},
				{TokenIdentifier, "myFunc"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "="},
				{TokenWhitespace, " "},
				{TokenKeyword, "function"},
				{TokenPunctuator, "("},
				{TokenIdentifier, "aye"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenIdentifier, "bee"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenIdentifier, "cea"},
				{TokenPunctuator, ")"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "{"},
				{TokenLineTerminator, "\n"},
				{TokenWhitespace, "	"},
				{TokenKeyword, "const"},
				{TokenWhitespace, " "},
				{TokenIdentifier, "num"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "="},
				{TokenWhitespace, " "},
				{TokenPunctuator, "["},
				{TokenNumericLiteral, "123"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenNumericLiteral, "4"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenIdentifier, "lastNum"},
				{TokenPunctuator, "("},
				{TokenIdentifier, "aye"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenStringLiteral, "\"beep\""},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenPunctuator, "("},
				{TokenPunctuator, ")"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "=>"},
				{TokenWhitespace, " "},
				{TokenIdentifier, "window"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenIdentifier, "val"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "=>"},
				{TokenWhitespace, " "},
				{TokenIdentifier, "val"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "*"},
				{TokenWhitespace, " "},
				{TokenNumericLiteral, "2"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenPunctuator, "("},
				{TokenIdentifier, "myVar"},
				{TokenPunctuator, ")"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "=>"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "{"},
				{TokenIdentifier, "myVar"},
				{TokenWhitespace, " "},
				{TokenDivPunctuator, "/="},
				{TokenWhitespace, " "},
				{TokenNumericLiteral, "2"},
				{TokenPunctuator, ";"},
				{TokenKeyword, "return"},
				{TokenWhitespace, " "},
				{TokenIdentifier, "myVar"},
				{TokenPunctuator, ";"},
				{TokenRightBracePunctuator, "}"},
				{TokenPunctuator, ")"},
				{TokenPunctuator, "]"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenIdentifier, "elm"},
				{TokenWhitespace, " "},
				{TokenPunctuator, "="},
				{TokenWhitespace, " "},
				{TokenIdentifier, "document"},
				{TokenPunctuator, "."},
				{TokenIdentifier, "getElementByID"},
				{TokenPunctuator, "("},
				{TokenPunctuator, ")"},
				{TokenPunctuator, ";"},
				{TokenLineTerminator, "\n"},
				{TokenWhitespace, "	"},
				{TokenIdentifier, "console"},
				{TokenPunctuator, "."},
				{TokenIdentifier, "log"},
				{TokenPunctuator, "("},
				{TokenIdentifier, "bee"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenIdentifier, "num"},
				{TokenPunctuator, ","},
				{TokenWhitespace, " "},
				{TokenIdentifier, "elm"},
				{TokenPunctuator, ")"},
				{TokenPunctuator, ";"},
				{TokenRightBracePunctuator, "}"},
				{parser.TokenDone, ""},
			},
		},
	} {
		p := parser.NewStringTokeniser(test.Input)
		var j jsParser
		p.TokeniserState(j.inputElement)
		for m, tkn := range test.Output {
			tk, _ := p.GetToken()
			if tk.Type != tkn.Type {
				if tk.Type == parser.TokenError {
					t.Errorf("test %d.%d: unexpected error: %s", n+1, m+1, tk.Data)
				} else {
					t.Errorf("test %d.%d: Incorrect type, expecting %d, got %d", n+1, m+1, tkn.Type, tk.Type)
				}
				break
			} else if tk.Data != tkn.Data {
				t.Errorf("test %d.%d: Incorrect data, expecting %q, got %q", n+1, m+1, tkn.Data, tk.Data)
				break
			}
		}
	}
}
