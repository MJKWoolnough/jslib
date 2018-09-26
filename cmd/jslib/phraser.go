package main

import (
	"fmt"

	"vimagination.zapto.org/errors"
	"vimagination.zapto.org/parser"
)

const (
	PhraseNormal parser.PhraseType = iota
	PhraseUseStrict
	PhraseInclude
	PhraseOffer
	PhraseWhitespace
	PhraseEnd
)

func (j *jsParser) start(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.AcceptRun(TokenWhitespace, TokenLineTerminator, TokenSingleLineComment, TokenMultiLineComment)
	if p.Peek().Data == "\"use strict\"" {
		p.Except()
		if p.Peek().Data == ";" {
			p.Except()
			p.AcceptRun(TokenWhitespace, TokenLineTerminator, TokenSingleLineComment, TokenMultiLineComment)
			return parser.Phrase{
				Type: PhraseUseStrict,
				Data: p.Get(),
			}, j.needOffer
		}
		p.Err = ErrInvalidUseStrict
		return p.Error()
	}
	return parser.Phrase{
		Type: PhraseWhitespace,
		Data: p.Get(),
	}, j.needOffer
}

func (j *jsParser) needOffer(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	if t := p.Peek(); t.Type != TokenIdentifier || t.Data != "offer" {
		p.Err = ErrNeedOffer
		return p.Error()
	}
	p.Except()
	p.AcceptRun(TokenWhitespace, TokenLineTerminator)
	if p.Peek().Data != "(" {
		p.Err = ErrNeedOffer
		return p.Error()
	}
	p.Except()
	return parser.Phrase{
		Type: PhraseOffer,
		Data: p.Get(),
	}, j.base
}

func (j *jsParser) base(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	var pf = (*parser.Parser).Error
Loop:
	for {
		switch t := p.ExceptRun(TokenIdentifier, TokenPunctuator); t {
		case TokenPunctuator:
			switch p.Peek().Data {
			case ")":
				p.Except()
				if len(j.tokenDepth) == 0 {
					pf = j.end
					break Loop
				}
			default:
				p.Except()
			}
		case TokenIdentifier:
			switch p.Peek().Data {
			case "offer":
				p.Err = ErrNeedOffer
				break Loop
			case "include":
				pf = j.include
				break Loop
			}
			p.Except()
		default:
			if t == parser.TokenDone {
				pf = (*parser.Parser).Done
			}
			break Loop
		}
	}
	return parser.Phrase{
		Type: PhraseNormal,
		Data: p.Get(),
	}, pf
}

func (j *jsParser) include(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.Accept(TokenIdentifier)
	p.AcceptRun(TokenWhitespace, TokenLineTerminator, TokenSingleLineComment, TokenMultiLineComment)
	if p.Peek().Data != "(" {
		return j.base(p)
	}
	p.Accept(TokenPunctuator)
	p.AcceptRun(TokenWhitespace, TokenLineTerminator, TokenSingleLineComment, TokenMultiLineComment)
	if !p.Accept(TokenStringLiteral) {
		return j.base(p)
	}
	if p.Peek().Data != ")" {
		return j.base(p)
	}
	p.Accept(TokenPunctuator)
	return parser.Phrase{
		Type: PhraseInclude,
		Data: p.Get(),
	}, j.base
}

func (j *jsParser) end(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	for {
		switch p.AcceptRun(TokenWhitespace, TokenLineTerminator, TokenSingleLineComment, TokenMultiLineComment) {
		case parser.TokenDone:
			return parser.Phrase{
				Type: PhraseEnd,
				Data: p.Get(),
			}, (*parser.Parser).Done
		case TokenPunctuator:
			if p.Peek().Data != ";" {
				p.Err = ErrNeedOffer
				return p.Error()
			}
			p.Except()
		default:
			fmt.Println(p.Get())
			fmt.Println(p.Peek())
			p.Err = ErrNeedOffer
			return p.Error()
		}
	}
}

var (
	ErrNeedOffer        errors.Error = "need single offer in module"
	ErrInvalidUseStrict errors.Error = "invalid use strict"
)
