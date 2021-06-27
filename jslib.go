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

func Package(opts ...Option) (*javascript.Module, error) {
	c := config{
		loader: OSLoad,
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
	return nil, nil
}

var (
	ErrNoFiles = errors.New("no files")
)
