package checker

import "vimagination.zapto.org/parser"

func IsValid(p *parser.Parser) bool {
	SetPhraser(p)
	for {
		if ph, err := p.GetPhrase(); err != nil {
			return false
		} else if ph.Type == parser.PhraseDone {
			return true
		}
	}
}
