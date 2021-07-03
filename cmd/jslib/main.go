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
		plugin       bool
		err          error
	)

	flag.Var(&filesTodo, "i", "input file")
	flag.StringVar(&output, "o", "-", "input file")
	flag.StringVar(&base, "b", "", "js base dir")
	flag.BoolVar(&plugin, "p", false, "export file(s) as plugin(s)")
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
		return fmt.Errorf("error getting absolute path for base: %w", err)
	}
	var s *javascript.Script
	if plugin && len(filesTodo) == 1 {
		f, err := os.Open(filepath.Join(base, filepath.FromSlash(filesTodo[0])))
		if err != nil {
			return fmt.Errorf("error opening url: %w", err)
		}
		m, err := javascript.ParseModule(parser.NewReaderTokeniser(f))
		f.Close()
		if err != nil {
			return fmt.Errorf("error parsing javascript module: %w", err)
		}
		if s, err = jslib.Plugin(m, filesTodo[0]); err != nil {
			return fmt.Errorf("error processing javascript plugin: %w", err)
		}
	} else {
		args := make([]jslib.Option, 0, len(filesTodo)+1)
		if base != "" {
			args = append(args, jslib.Loader(jslib.OSLoad(base)))
		}
		for _, f := range filesTodo {
			args = append(args, jslib.File(f))
		}
		s, err = jslib.Package(args...)
		if err != nil {
			return fmt.Errorf("error generating output: %w", err)
		}
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
	_, err = fmt.Fprintf(of, "%+s\n", s)
	if err != nil {
		return fmt.Errorf("error writing to output: %w", err)
	}
	if err := of.Close(); err != nil {
		return fmt.Errorf("error closing output: %w", err)
	}
	return nil
}
