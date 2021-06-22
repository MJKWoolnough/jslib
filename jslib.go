package jslib

import (
	"os"
	"path/filepath"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/javascript/walk"
	"vimagination.zapto.org/parser"
)

type data struct {
	url    string
	module *javascript.Module
}

type config struct {
	filesToDo    []string
	filesDone    map[string]struct{}
	files        []data
	loader       func(string) (*javascript.Module, error)
	bare         bool
	parseDynamic bool
	currURL      string
}

func OSLoad(url string) (*javascript.Module, error) {
	f, err := os.Open(filepath.FromSlash(url))
	if err != nil {
		return nil, err
	}
	m, err := javascript.ParseModule(parser.NewReaderTokeniser(f))
	f.Close()
	return m, err
}

func Package(os ...Option) (*javascript.Module, error) {
	c := config{
		loader: OSLoad,
	}
	for _, o := range os {
		o(&c)
	}
	for len(c.filesToDo) > 0 {
		c.currURL = c.filesToDo[0]
		c.filesToDo = c.filesToDo[1:]
		m, err := c.loader(c.currURL)
		if err != nil {
			return nil, err
		}
		for _, li := range m.ModuleListItems {
			if li.ImportDeclaration != nil {

			} else if li.StatementListItem != nil {
				if err := walk.Walk(li.StatementListItem, &c); err != nil {
					return nil, err
				}
			} else if !c.bare && li.ExportDeclaration != nil {

			}
		}
	}
	return nil, nil
}

func (c *config) Handle(t javascript.Type) error {
	if ce, ok := t.(*javascript.CallExpression); ok && ce.ImportCall != nil {
		ce.MemberExpression = &javascript.MemberExpression{
			PrimaryExpression: &javascript.PrimaryExpression{
				IdentifierReference: &javascript.Token{Token: parser.Token{Data: "include"}},
			},
			Arguments: &javascript.Arguments{
				ArgumentList: []javascript.AssignmentExpression{
					*ce.ImportCall,
				},
			},
		}
		ce.ImportCall = nil
		return nil
	}
	return walk.Walk(t, c)
}
