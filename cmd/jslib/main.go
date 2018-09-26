package main

import (
	"flag"
	"fmt"
	"io"
	"os"
	"path"
	"strconv"

	"vimagination.zapto.org/memio"
	"vimagination.zapto.org/parser"
)

type fileDep struct {
	buf        memio.Buffer
	Requires   []*fileDep
	RequiredBy []*fileDep
	written    bool
}

func (f *fileDep) AddDependency(g *fileDep) bool {
	if !f.checkDependency(g) {
		return false
	}
	f.Requires = append(f.Requires, g)
	g.RequiredBy = append(g.RequiredBy, f)
	return true
}

func (f *fileDep) checkDependency(g *fileDep) bool {
	for _, h := range f.RequiredBy {
		if h == g || !h.checkDependency(g) {
			return false
		}
	}
	return true
}

func (f *fileDep) WriteTo(w io.Writer) (int64, error) {
	if f.written {
		return 0, nil
	}
	f.written = true
	var n int64
	for _, r := range f.Requires {
		m, err := r.WriteTo(w)
		n += m
		if err != nil {
			return n, err
		}
	}
	if f.buf == nil {
		return n, nil
	}
	m, err := io.WriteString(w, "\n		.then(includeNow(toURL(")
	n += int64(m)
	if err != nil {
		return n, err
	}
	m, err = w.Write(f.buf)
	n += int64(m)
	if err != nil {
		return n, err
	}
	m, err = io.WriteString(w, ")")
	n += int64(m)
	if err != nil {
		return n, err
	}
	return n, err
}

type Inputs []string

func (i *Inputs) Set(v string) error {
	*i = append(*i, v)
	return nil
}

func (i *Inputs) String() string {
	return ""
}

func main() {
	var (
		inputName, output string
		filesTodo         Inputs
	)

	flag.Var(&filesTodo, "i", "input file")
	flag.StringVar(&inputName, "n", "-", "input file name when using stdin")
	flag.StringVar(&output, "o", "-", "input file")
	flag.Parse()

	if len(filesTodo) == 0 {
		filesTodo = append(filesTodo, "-")
	}
	if output == "" {
		output = "-"
	}
	var main fileDep
	files := make(map[string]*fileDep, len(os.Args))
	for _, i := range filesTodo {
		if i == "-" {
			i = inputName
		}
		if _, ok := files[i]; ok {
			fmt.Fprintln(os.Stderr, "duplicate file")
			os.Exit(1)
		}
		fd := new(fileDep)
		files[i] = fd
		main.AddDependency(fd)
	}
	for len(filesTodo) > 0 {
		name := filesTodo[0]
		filesTodo = filesTodo[1:]
		var f *os.File
		if name == "-" {
			f = os.Stdin
			name = inputName
		} else {
			var err error
			f, err = os.Open(name)
			if err != nil {
				fmt.Fprintf(os.Stderr, "error opening file %q: %s\n", name, err)
				os.Exit(1)
			}
		}
		fd, ok := files[name]
		if !ok {
			fd = new(fileDep)
			files[name] = fd
		}
		p := parser.New(parser.NewReaderTokeniser(f))
		var j jsParser
		p.TokeniserState(j.inputElement)
		p.PhraserState(j.start)
	Loop:
		for {
			ph, err := p.GetPhrase()
			if err == io.EOF {
				break
			} else if err != nil {
				fmt.Fprintf(os.Stderr, "error parsing file %q: %s\n", name, err)
				os.Exit(1)
			}
			switch ph.Type {
			case parser.PhraseDone:
				break Loop
			case PhraseInclude:
				for _, t := range ph.Data {
					switch t.Type {
					case TokenStringLiteral:
						str := path.Join(path.Dir(name), unescape(t.Data))
						gd, ok := files[str]
						if !ok {
							gd = new(fileDep)
							files[str] = gd
							filesTodo = append(filesTodo, str)
						}
						if !fd.AddDependency(gd) {
							fmt.Fprintf(os.Stderr, "circular reference with %s and %s\n", name, str)
							os.Exit(1)
						}
					}
				}
			case PhraseOffer:
				ph.Data = []parser.Token{{Data: escape(name) + "), () => "}}
			case PhraseNormal:
			default:
				continue Loop
			}
			for _, t := range ph.Data {
				fd.buf.WriteString(t.Data)
				if t.Type == TokenLineTerminator {
					fd.buf.WriteString("		")
				}
			}
		}
		f.Close()
	}

	var f *os.File

	if output == "-" {
		f = os.Stdout
	} else {
		var err error
		f, err = os.Create(output)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error creating file %q: %s\n", output, err)
			os.Exit(1)
		}
	}
	_, err := f.WriteString(loaderHead)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error writing to file: %s\n", err)
		os.Exit(1)
	}
	if _, err = main.WriteTo(f); err != nil {
		fmt.Fprintf(os.Stderr, "error writing to file: %s\n", err)
		os.Exit(1)
	}
	if _, err = f.WriteString(loaderFoot); err != nil {
		fmt.Fprintf(os.Stderr, "error writing to file: %s\n", err)
		os.Exit(1)
	}
	if err = f.Close(); err != nil {
		fmt.Fprintf(os.Stderr, "error closing file: %s\n", err)
		os.Exit(1)
	}
}

func escape(str string) string {
	return strconv.Quote(str)
}

func unescape(str string) string {
	str, _ = strconv.Unquote(str)
	return str
}
