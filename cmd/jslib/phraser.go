package main

import (
	"vimagination.zapto.org/errors"
	"vimagination.zapto.org/javascript"
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

type jsPhraser uint

func (j *jsPhraser) start(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator, javascript.TokenSingleLineComment, javascript.TokenMultiLineComment)
	if p.Peek().Data == "\"use strict\"" {
		p.Except()
		if p.Peek().Data == ";" {
			p.Except()
			p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator, javascript.TokenSingleLineComment, javascript.TokenMultiLineComment)
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

func (j *jsPhraser) needOffer(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	if t := p.Peek(); t.Type != javascript.TokenIdentifier || t.Data != "offer" {
		p.Err = ErrNeedOffer
		return p.Error()
	}
	p.Except()
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator)
	if p.Peek().Data != "(" {
		p.Err = ErrNeedOffer
		return p.Error()
	}
	(*j)++
	p.Except()
	return parser.Phrase{
		Type: PhraseOffer,
		Data: p.Get(),
	}, j.base
}

func (j *jsPhraser) base(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	var pf = (*parser.Parser).Error
Loop:
	for {
		switch t := p.ExceptRun(javascript.TokenIdentifier, javascript.TokenPunctuator); t {
		case javascript.TokenPunctuator:
			switch p.Peek().Data {
			case ")":
				p.Except()
				(*j)--
				if *j == 0 {
					pf = j.end
					break Loop
				}
			case "(":
				p.Except()
				(*j)++
			default:
				p.Except()
			}
		case javascript.TokenIdentifier:
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

func (j *jsPhraser) include(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.Accept(javascript.TokenIdentifier)
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator, javascript.TokenSingleLineComment, javascript.TokenMultiLineComment)
	if p.Peek().Data != "(" {
		return j.base(p)
	}
	(*j)++
	p.Accept(javascript.TokenPunctuator)
	p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator, javascript.TokenSingleLineComment, javascript.TokenMultiLineComment)
	if !p.Accept(javascript.TokenStringLiteral) {
		return j.base(p)
	}
	if p.Peek().Data != ")" {
		return j.base(p)
	}
	(*j)--
	p.Accept(javascript.TokenPunctuator)
	return parser.Phrase{
		Type: PhraseInclude,
		Data: p.Get(),
	}, j.base
}

func (j *jsPhraser) end(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	for {
		switch p.AcceptRun(javascript.TokenWhitespace, javascript.TokenLineTerminator, javascript.TokenSingleLineComment, javascript.TokenMultiLineComment) {
		case parser.TokenDone:
			return parser.Phrase{
				Type: PhraseEnd,
				Data: p.Get(),
			}, (*parser.Parser).Done
		case javascript.TokenPunctuator:
			if p.Peek().Data != ";" {
				p.Err = ErrNeedOffer
				return p.Error()
			}
			p.Except()
		default:
			p.Err = ErrNeedOffer
			return p.Error()
		}
	}
}

var (
	ErrNeedOffer        errors.Error = "need single offer in module"
	ErrInvalidUseStrict errors.Error = "invalid use strict"
)
