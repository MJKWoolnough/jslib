package jslib

import (
	"errors"
	"os"
	"path/filepath"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

type config struct {
	filesToDo     []string
	filesDone     map[string]*dependency
	loader        func(string) (*javascript.Module, error)
	bare          bool
	parseDynamic  bool
	currURL       string
	nextID        uint
	exportAllFrom [][2]*dependency
	statementList []javascript.StatementListItem
	dependency
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

func Package(opts ...Option) (*javascript.Script, error) {
	c := config{
		loader:        OSLoad,
		statementList: make([]javascript.StatementListItem, 1),
	}
	c.config = &c
	var err error
	c.url, err = os.Getwd()
	if err != nil {
		return nil, err
	}
	for _, o := range opts {
		o(&c)
	}
	if len(c.filesToDo) == 0 {
		return nil, ErrNoFiles
	}
	for _, url := range c.filesToDo {
		if _, err := c.dependency.addImport(c.dependency.RelTo(url)); err != nil {
			return nil, err
		}
	}
	for changed := true; changed; {
		changed = false
		for _, eaf := range c.exportAllFrom {
			for export, binding := range eaf[1].exports {
				if export == "default" {
					continue
				}
				if _, ok := eaf[0].exports[export]; !ok {
					eaf[0].exports[export] = &importBinding{
						dependency: eaf[1],
						binding:    export,
					}
					changed = true
				}
			}
		}
	}
	return &javascript.Script{
		StatementList: c.statementList,
	}, nil
}

var (
	ErrNoFiles = errors.New("no files")
)
