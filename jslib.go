package jslib

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

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

func OSLoad(base string) func(url string) (*javascript.Module, error) {
	return func(url string) (*javascript.Module, error) {
		f, err := os.Open(filepath.Join(base, filepath.FromSlash(url)))
		if err != nil {
			return nil, err
		}
		m, err := javascript.ParseModule(parser.NewReaderTokeniser(f))
		f.Close()
		return m, err
	}
}

func Package(opts ...Option) (*javascript.Script, error) {
	base, err := os.Getwd()
	l := OSLoad(base)
	c := config{
		loader:        l,
		statementList: make([]javascript.StatementListItem, 1),
		filesDone:     make(map[string]*dependency),
		dependency: dependency{
			requires: make(map[string]*dependency),
		},
	}
	if c.loader == l && err != nil {
		return nil, err
	}
	c.config = &c
	for _, o := range opts {
		o(&c)
	}
	if len(c.filesToDo) == 0 {
		return nil, ErrNoFiles
	}
	for _, url := range c.filesToDo {
		if !strings.HasPrefix(url, "/") {
			return nil, ErrInvalidURL
		}
		if _, err := c.dependency.addImport(c.dependency.RelTo(url)); err != nil {
			return nil, err
		}
	}
	for changed := true; changed; {
		changed = false
		for _, eaf := range c.exportAllFrom {
			for export := range eaf[1].exports {
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
	c.dependency.resolveImports()
	if err := c.makeLoader(); err != nil {
		return nil, err
	}
	return &javascript.Script{
		StatementList: c.statementList,
	}, nil
}

var (
	ErrNoFiles    = errors.New("no files")
	ErrInvalidURL = errors.New("added files must be absolute URLs")
)
