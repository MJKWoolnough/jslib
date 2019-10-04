package main

import (
	"flag"
	"fmt"
	"os"
	"path"
	"path/filepath"

	"vimagination.zapto.org/errors"
	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/jslib"
	"vimagination.zapto.org/parser"
)

type Inputs []string

func (i *Inputs) Set(v string) error {
	*i = append(*i, v)
	return nil
}

func (i *Inputs) String() string {
	return ""
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	var (
		inputName, output, base string
		filesTodo               Inputs
		err                     error
	)

	flag.Var(&filesTodo, "i", "input file")
	flag.StringVar(&inputName, "n", "-", "input file name when using stdin")
	flag.StringVar(&output, "o", "-", "input file")
	flag.StringVar(&base, "b", "", "js base dir")
	flag.Parse()

	if len(filesTodo) == 0 {
		filesTodo = append(filesTodo, "-")
	}
	if output == "" {
		output = "-"
	}
	if base == "" {
		if output == "-" {
			base = "./"
		} else {
			base = path.Dir(output)
		}
	}
	base, err = filepath.Abs(base)
	if err != nil {
		return errors.WithContext("error getting absolute path for base: %s\n", err)
	}
	args := make([]jslib.Option, 1, len(filesTodo)+1)
	args[0] = jslib.Get(func(url string) (*javascript.Module, error) {
		f, err := os.Open(filepath.Join(base, filepath.FromSlash(url)))
		if err != nil {
			return nil, errors.WithContext("error opening url: ", err)
		}
		m, err := javascript.ParseModule(parser.NewReaderTokeniser(f))
		f.Close()
		if err != nil {
			return nil, errors.WithContext("error parsing javascript module: ", err)
		}
		return m, nil
	})
	for _, f := range filesTodo {
		fn, err := filepath.Abs(f)
		if err != nil {
			return errors.WithContext("error getting absolute filename: ", err)
		}
		fn, err = filepath.Rel(base, fn)
		if err != nil {
			return errors.WithContext("error getting relative filename: ", err)
		}
		args = append(args, jslib.File(filepath.ToSlash(fn)))
	}
	m, err := jslib.Loader(args...)
	if err != nil {
		return errors.WithContext("error generating output: ", err)
	}
	var of *os.File
	if output == "-" {
		of = os.Stdout
	} else {
		of, err = os.Create(output)
		if err != nil {
			return errors.WithContext("error creating output file: ", err)
		}
	}
	_, err = fmt.Fprintf(of, "%+s\n", m)
	if err != nil {
		return errors.WithContext("error writing to output: ", err)
	}
	return errors.WithContext("error closing output: ", of.Close())
}
