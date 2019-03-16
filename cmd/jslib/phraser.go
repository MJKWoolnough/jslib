package main

import (
	"vimagination.zapto.org/errors"
	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

const (
	PhraseNormal parser.PhraseType = iota
	PhraseInclude
	PhraseImport
	PhraseImportSideEffect
	PhraseImportDefault
	PhraseImportDefaultPlus
	PhraseImportDefaultPlusAll
	PhraseImportAll
	PhraseDynamicImport
	PhraseExport
	PhraseExportDefine
	PhraseExportFrom
	PhraseExportAllFrom
	PhraseExportDefault
	PhraseExportDefaultNamed
	PhraseExportFunction
	PhraseExportClass
	PhraseEnd
)

type jsPhraser uint

func SetPhraser(p *parser.Parser) *parser.Parser {
	javascript.SetTokeniser(&p.Tokeniser)
	p.PhraserState(new(jsPhraser).start)
	return p
}

func (j *jsPhraser) start(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	for {
		switch p.ExceptRun(javascript.TokenPunctuator, javascript.TokenRightBracePunctuator, javascript.Keyword, javascript.Identifier, javascript.TokenPunctuator) {
		case javascript.TokenPunctuator:
			switch p.Peek().Data {
			case "(", "[", "{":
				(*j)++
			case ")", "]":
				(*j)--
			}
		case javascript.TokenRightBracePunctuator:
			(*j)--
		case javascript.Keyword:
			if *j == 0 {
				switch p.Peek().Data {
				case "import":
					return j.normal(), j.importKeyword
				case "export":
					return j.normal(), j.exportKeyword
				}
			}
		case javascript.Identifier:
			switch p.Peek().Data {
			case "include": // include()
				return j.normal(), j.includeIdent
			case "window": // window.include()
				p.Except()
				p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
				if tk := p.Peek(); tk.Type == javascript.TokenPunctuator && tk.Data == "." {
					p.Except()
					p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
					if tk = p.Peek(); tk.Type == javascript.Identifier && tk.Data == "include" {
						return j.normal(), j.includeIdent
					}
				}
			}
		case javascript.TokenPunctuator:
			if p.Peek().Data == "." {
				p.Except() // ignore next identifier (incase it is ref'ing a field named 'include'
			}
		case parser.TokenDone:
			return j.normal(), (*parser.Parser).Done
		case parser.TokenError:
			return p.Error()
		}
		p.Except()
	}
}

func (j *jsPhraser) normal() parser.Phrase {
	return parser.Phrase{
		Type: PhraseNormal,
		Data: p.Get(),
	}
}

func (j *jsPhraser) importKeyword(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.Accept(javascript.TokenKeyword)
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
	tk := p.Peek()
	typ := PhraseImport
	if tk.Type == javascript.TokenPunctuator && tk.Data == "(" { // import()
		return j.importDynamic(p)
	} else if tk.Type == javascript.TokenStringLiteral { // import "module-name"
		p.Except()
		return parser.Phrase{
			Type: PhraseImportSideEffect,
			Data: p.Get(),
		}, j.start
	} else if tk.Type == javascript.Identifier { // import defaultExport
		p.Except()
		p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
		tk = p.Peek()
		if tk.Type == javascript.TokenPunctuator && tk.Data == "," { // import defaultExport, ...
			typ = PhraseImportDefaultPlus
			p.Except()
			p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
			tk = p.Peek()
		} else { // import defaultExport from "module-name"
			typ = PhraseImportDefault
		}
	}
	if tk.Type != javascript.TokenPunctuator {
		if typ != PhraseImportDefault {
			p.Err = ErrMalformedImport
			return p.Error()
		}
	} else if tk.Data == "*" {
		if typ == PhraseImportDefaultPlus {
			typ = PhraseImportDefaultPlusAll
		} else {
			typ = PhraseImportAll
		}
		p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
		tk = p.Peek()
		if tk.Type != javascript.TokenIdentifier || tk.Data != "as" {
			p.Err = ErrMalformedImport
			return p.Error()
		}
		p.Except()
		if p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator) != javascript.TokenIdentifier {
			p.Err = ErrMalformedImport
			return p.Error()
		}
		p.Except()
	} else if tk.Data == "{" {
		for {
			if p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator) != javascript.TokenIdentifier {
				p.Err = ErrMalformedImport
				return p.Error()
			}
			p.Except()
			p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
			tk = p.Peek()
			if tk.Type == javascript.Identifier && tk.Type == "as" {
				p.Except()
				if p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator) != javascript.TokenIdentifier {
					p.Err = ErrMalformedImport
					return p.Error()
				}
				p.Except()
				p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
				tk = p.Peek()
			}
			if tk.Type == javascript.TokenPunctuator && tk.Data == "," {
				p.Except()
				continue
			} else if tk.Type == javascript.TokenRightBracePunctuator {
				p.Except()
				break
			}
			p.Err = ErrMalformedImport
			return p.Error()
		}
	} else {
		p.Err = ErrMalformedImport
		return p.Error()
	}
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
	tk = p.Peek()
	if tk.Type != javascript.TokenIdentifier || tk.Data != "from" {
		p.Err = ErrMalformedImport
		return p.Error()
	}
	p.Except()
	if p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator) != javascript.TokenStringLiteral {
		p.Err = ErrMalformedImport
		return p.Error()
	}
	p.Except()
	return parser.Phrase{
		Type: typ,
		Data: p.Get(),
	}, j.start
}

func (j *jsPhraser) importDynamic(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.Accept(javascript.TokenPunctuator)
	(*j)++
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
	if !p.Accept(javascript.TokenStringLiteral) {
		return j.start(p)
	}
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
	tk = p.Peek()
	if tk.Type != javascript.TokenPunctuator || tk.Data != ")" {
		return j.start(p)
	}
	p.Accept(javascript.TokenPunctuator)
	(*j)--
	return parser.Phrase{
		Type: PhraseDynamicImport,
		Data: p.Get(),
	}, j.start
}

func (j *jsPhraser) exportKeyword(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.Accept(javascript.TokenKeyword)
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
	switch tk := p.Peek(); tk.Type {
	case javascript.TokenPunctuator:
		typ := PhraseExport
		switch tk.Data {
		case "{":
			for {
				if p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator) != javascript.TokenIdentifier {
					p.Err = ErrMalformedExport
					return p.Error()
				}
				p.Except()
				p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
				tk = p.Peek()
				if tk.Type == javascript.Identifier && tk.Type == "as" {
					p.Except()
					if p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator) != javascript.TokenIdentifier {
						p.Err = ErrMalformedExport
						return p.Error()
					}
					p.Except()
					p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
					tk = p.Peek()
				}
				if tk.Type == javascript.TokenPunctuator && tk.Data == "," {
					p.Except()
					continue
				} else if tk.Type == javascript.TokenRightBracePunctuator {
					p.Except()
					break
				}
				p.Err = ErrMalformedExport
				return p.Error()
			}
		case "*":
			typ = PhraseExportAllFrom
			p.Except()
		}
		p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
		tk = p.Peek()
		if tk.Type == javascript.TokenIdentifier && tk.Data == "from" {
			if typ == PhraseExport {
				typ = PhraseExportFrom
			}
			p.Except()
			p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
			if !p.Accept(javascript.TokenStringLiteral) {
				p.Err = ErrMalformedExport
				return p.Error()
			}
		} else if typ == PhraseExportAllFrom {
			p.Err = ErrMalformedExport
			return p.Error()
		}
		return parser.Phrase{
			Type: typ,
			Data: p.Get(),
		}, j.start
	case javascript.Keyword:
		switch tk.Data {
		case "const", "var":
			return parser.Phrase{
				Type: PhraseExportDefine,
				Data: p.Get(),
			}, j.defines
		case "function", "class":
			return parser.Phrase{
				Type: PhraseExportNamed,
				Data: p.Get(),
			}, j.expression
		}
	case javascript.Identifier:
		switch tk.Data {
		case "let":
			return parser.Phrase{
				Type: PhraseExportDefine,
				Data: p.Get(),
			}, j.defines
		case "default":
			p.Except()
			return parser.Phrase{
				Type: PhraseExportDefault,
				Data: p.Get(),
			}, j.expression
		}
	}
	p.Err = ErrMalformedExport
	return p.Error()
}

func (j *jsPhraser) includeIdent(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.Accept(javascript.TokenIdentifier)
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
	tk := p.Peek()
	if tk.Type != javascript.TokenPunctuator || tk.Data != "(" {
		return j.start(p)
	}
	p.Accept(javascript.TokenPunctuator)
	(*j)++
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
	if !p.Accept(javascript.TokenStringLiteral) {
		return j.start(p)
	}
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
	tk = p.Peek()
	if tk.Type != javascript.TokenPunctuator || tk.Data != ")" {
		return j.start(p)
	}
	p.Accept(javascript.TokenPunctuator)
	(*j)--
	return parser.Phrase{
		Type: PhraseInclude,
		Data: p.Get(),
	}, j.start
}

func (j *jsPhraser) expression(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	return parser.Phrase{}, nil
}

func (j *jsPhraser) defines(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	return parser.Phrase{}, nil
}

var (
	ErrInvalidImport   errors.Error = "import needs to be at the top level"
	ErrMalformedImport errors.Error = "malformed import"
	ErrMalformedExport errors.Error = "malformed export"
)
