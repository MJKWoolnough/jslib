package main

import (
	"vimagination.zapto.org/parser"
)

const (
	PhraseNormal parser.PhraseType = iota
	PhraseInclude
	PhraseOffer
)

func base(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	var pf = (*parser.Parser).Error
Loop:
	for {
		switch t := p.ExceptRun(TokenKeyword, TokenIdentifier); t {
		case TokenKeyword:
			if p.Peek().Data == "await" {
				pf = await
				break Loop
			}
			p.Except()
		case TokenIdentifier:
			if p.Peek().Data == "offer" {
				pf = offer
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

func await(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.Accept(TokenKeyword)
	p.AcceptRun(TokenWhitespace, TokenLineTerminator)
	if p.Peek().Data != "include" {
		return base(p)
	}
	p.Accept(TokenIdentifier)
	p.AcceptRun(TokenWhitespace, TokenLineTerminator)
	if p.Peek().Data != "(" {
		return base(p)
	}
	p.Accept(TokenPunctuator)
	p.AcceptRun(TokenWhitespace, TokenLineTerminator)
	if !p.Accept(TokenStringLiteral) {
		return base(p)
	}
	if p.Peek().Data != ")" {
		return base(p)
	}
	p.Accept(TokenPunctuator)
	p.AcceptRun(TokenWhitespace, TokenLineTerminator)
	if p.Peek().Data == "." {
		return base(p)
	}
	return parser.Phrase{
		Type: PhraseInclude,
		Data: p.Get(),
	}, base
}

func offer(p *parser.Parser) (parser.Phrase, parser.PhraseFunc) {
	p.Accept(TokenIdentifier)
	p.AcceptRun(TokenWhitespace, TokenLineTerminator)
	if p.Peek().Data != "(" {
		return base(p)
	}
	p.Accept(TokenPunctuator)
	return parser.Phrase{
		Type: PhraseOffer,
		Data: p.Get(),
	}, base
}
