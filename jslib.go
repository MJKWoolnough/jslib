package jslib

import (
	"os"
	"path/filepath"

	"vimagination.zapto.org/javascript"
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
		url := c.filesToDo[0]
		c.filesToDo = c.filesToDo[1:]
		m, err := c.loader(url)
		if err != nil {
			return nil, err
		}
		for _, li := range m.ModuleListItems {
			if li.ImportDeclaration != nil {

			} else if c.parseDynamic && li.StatementListItem != nil {

			} else if !c.bare && li.ExportDeclaration != nil {

			}
		}
	}
	return nil, nil
}
