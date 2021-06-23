package jslib

import (
	"os"
	"path"
	"path/filepath"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/javascript/scope"
	"vimagination.zapto.org/javascript/walk"
	"vimagination.zapto.org/parser"
)

type data struct {
	*config
	url                  string
	scope                *scope.Scope
	module               *javascript.Module
	requires, requiredBy map[string]*data
	imports              map[string]string
	exports              map[string]string
}

type config struct {
	filesToDo    []*data
	filesDone    map[string]*data
	files        []*data
	loader       func(string) (*javascript.Module, error)
	bare         bool
	parseDynamic bool
	currURL      string
}

func (c *config) addURL(url string) *data {
	if d, ok := c.filesDone[url]; ok {
		return d
	}
	d := &data{
		config:     c,
		url:        string,
		requires:   make(map[string]*data),
		requiredBy: make(map[string]*data),
		imports:    make(map[string]string),
		exports:    make(map[string]string),
	}
	c.filesToDo = append(c.filesToDo, d)
	return d
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
	var err error
	for len(c.filesToDo) > 0 {
		d := c.filesToDo[0]
		if _, ok := c.filesDone[d.url]; ok {
			continue
		}
		c.filesDone[d.url] = struct{}{}
		c.filesToDo = c.filesToDo[1:]
		d.module, err = c.loader(d.url)
		if err != nil {
			return nil, err
		}
		d.scope, err = scope.ModuleScope(d.module, nil)
		if err != nil {
			return nil, err
		}
		for _, li := range d.module.ModuleListItems {
			if li.ImportDeclaration != nil {

			} else if li.StatementListItem != nil {
				if err := walk.Walk(li.StatementListItem, &d); err != nil {
					return nil, err
				}
			} else if !c.bare && li.ExportDeclaration != nil {

			}
		}
		c.files = append(c.files, d)
	}
	return nil, nil
}

func (d *data) Handle(t javascript.Type) error {
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
	return walk.Walk(t, d)
}

func (d *data) RelTo(url string) string {
	if len(url) > 0 && url[0] == '/' {
		return url
	}
	return path.Join(path.Dir(d.url), url)
}
