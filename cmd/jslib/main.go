package main

import (
	"flag"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"sort"

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
		output, base               string
		filesTodo                  Inputs
		plugin, noExports, reorder bool
		err                        error
	)

	flag.Var(&filesTodo, "i", "input file")
	flag.StringVar(&output, "o", "-", "input file")
	flag.StringVar(&base, "b", "", "js base dir")
	flag.BoolVar(&plugin, "p", false, "export file(s) as plugin(s)")
	flag.BoolVar(&noExports, "n", false, "no exports")
	flag.BoolVar(&reorder, "x", false, "experimental script re-ordering to enable better minification (BE CAREFUL)")
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
		args := make([]jslib.Option, 1, len(filesTodo)+3)
		args[0] = jslib.ParseDynamic
		if base != "" {
			args = append(args, jslib.Loader(jslib.OSLoad(base)))
		}
		if noExports {
			args = append(args, jslib.NoExports)
		}
		for _, f := range filesTodo {
			args = append(args, jslib.File(f))
		}
		s, err = jslib.Package(args...)
		if err != nil {
			return fmt.Errorf("error generating output: %w", err)
		}
	}
	if reorder {
		sort.Stable(statementSorter(s.StatementList[1:]))
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

type statementSorter []javascript.StatementListItem

func (s statementSorter) Len() int {
	return len(s)
}

func (s statementSorter) Less(i, j int) bool {
	a := s[i]
	b := s[j]
	if a.Declaration != nil {
		if b.Declaration == nil {
			return true
		}
		if a.Declaration.ClassDeclaration != nil && b.Declaration.ClassDeclaration == nil {
			return true
		} else if b.Declaration.ClassDeclaration != nil {
			return false
		}
		if a.Declaration.FunctionDeclaration != nil && b.Declaration.FunctionDeclaration == nil {
			return true
		} else if b.Declaration.FunctionDeclaration != nil {
			return false
		}
		if a.Declaration.LexicalDeclaration.LetOrConst == javascript.Let && b.Declaration.LexicalDeclaration.LetOrConst == javascript.Const {
			return true
		} else if b.Declaration.LexicalDeclaration.LetOrConst == javascript.Let {
			return false
		}
	} else if b.Declaration != nil {
		return false
	}
	return i < j
}

func (s statementSorter) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}
