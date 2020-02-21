package main

import (
	"flag"
	"fmt"
	"os"
	"path"
	"path/filepath"

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
		output, base string
		filesTodo    Inputs
		err          error
	)

	flag.Var(&filesTodo, "i", "input file")
	flag.StringVar(&output, "o", "-", "input file")
	flag.StringVar(&base, "b", "", "js base dir")
	flag.Parse()

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
		return fmt.Errorf("error getting absolute path for base: %w\n", err)
	}
	args := make([]jslib.Option, 1, len(filesTodo)+1)
	args[0] = jslib.Get(func(url string) (*javascript.Module, error) {
		f, err := os.Open(filepath.Join(base, filepath.FromSlash(url)))
		if err != nil {
			return nil, fmt.Errorf("error opening url: %w", err)
		}
		m, err := javascript.ParseModule(parser.NewReaderTokeniser(f))
		f.Close()
		if err != nil {
			return nil, fmt.Errorf("error parsing javascript module: %w", err)
		}
		return m, nil
	})
	for _, f := range filesTodo {
		fn, err := filepath.Abs(f)
		if err != nil {
			return fmt.Errorf("error getting absolute filename: %w", err)
		}
		fn, err = filepath.Rel(base, fn)
		if err != nil {
			return fmt.Errorf("error getting relative filename: %w", err)
		}
		args = append(args, jslib.File(filepath.ToSlash(fn)))
	}
	m, err := jslib.Loader(args...)
	if err != nil {
		return fmt.Errorf("error generating output: %w", err)
	}
	var of *os.File
	if output == "-" {
		of = os.Stdout
	} else {
		of, err = os.Create(output)
		if err != nil {
			return fmt.Errorf("error creating output file: %w", err)
		}
	}
	_, err = fmt.Fprintf(of, "%+s\n", m)
	if err != nil {
		return fmt.Errorf("error writing to output: %w", err)
	}
	if err := of.Close(); err != nil {
		return fmt.Errorf("error closing output: %w", err)
	}
	return nil
}
