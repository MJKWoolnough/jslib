package main

import (
	"bytes"
	"encoding/xml"
	"flag"
	"fmt"
	"io"
	"os"
	"path"
	"sort"
	"strconv"
	"strings"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

var (
	ch, base          string
	pe, lib, svg, mod bool
)

func run() error {
	var (
		input, output string
		f, o          *os.File
		err           error
	)
	flag.StringVar(&input, "i", "-", "input file")
	flag.StringVar(&output, "o", "-", "output file")
	flag.StringVar(&ch, "c", "", "createHTML/createSVG function name")
	flag.BoolVar(&pe, "e", false, "process on* attrs as javascript")
	flag.BoolVar(&svg, "s", false, "svg mode")
	flag.BoolVar(&lib, "l", false, "use svg/html.js lib")
	flag.BoolVar(&mod, "m", false, "add required module import")
	flag.StringVar(&base, "b", "lib/", "lib base")
	flag.Parse()
	rename := true
	if ch == "" {
		if svg {
			ch = "createSVG"
		} else {
			ch = "createHTML"
		}
		rename = false
	}
	if input == "-" {
		f = os.Stdin
	} else {
		f, err = os.Open(input)
		if err != nil {
			return err
		}
		defer f.Close()
	}

	d := xml.NewDecoder(f)
	d.Strict = false
	d.AutoClose = xml.HTMLAutoClose
	d.Entity = xml.HTMLEntity

	elements := make([]*element, 1, 1024)

	elements[0] = &element{
		name: "null",
	}
	tagNames := make(map[string]struct{})
	for {
		t, err := d.Token()
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		switch t := t.(type) {
		case xml.StartElement:
			tagNames[t.Name.Local] = struct{}{}
			elements = append(elements, &element{
				name:  t.Name.Local,
				attrs: make(map[string]string),
			})
			elements[len(elements)-2].children = append(elements[len(elements)-2].children, elements[len(elements)-1])
			for _, attr := range t.Attr {
				elements[len(elements)-1].attrs[attr.Name.Local] = attr.Value
			}
		case xml.EndElement:
			elements = elements[:len(elements)-1]
		case xml.CharData:
			tt := bytes.TrimSpace(t)
			if len(tt) > 0 {
				elements[len(elements)-1].children = append(elements[len(elements)-1].children, text(tt))
			}
		}
	}
	if output == "-" {
		o = os.Stdout
	} else {
		o, err = os.Create(output)
		if err != nil {
			return err
		}
	}
	if mod {
		m := "dom.js"
		if lib {
			if svg {
				m = "svg.js"
			} else {
				m = "html.js"
			}
			fmt.Fprint(o, "import {")
			elems := make([]string, 0, len(tagNames))
			for e := range tagNames {
				elems = append(elems, e)
			}
			sort.Strings(elems)
			for n, e := range elems {
				if n > 0 {
					fmt.Fprint(o, ", ")
				}
				fmt.Fprint(o, e)
			}
		} else {
			t := "HTML"
			if svg {
				t = "SVG"
			}
			fmt.Fprintf(o, "import {create%s", t)
			if rename {
				fmt.Fprintf(o, " as %s", ch)
			}
		}
		b := path.Join(base, m)
		if b[0] != '/' {
			b = "./" + b
		}
		fmt.Fprintf(o, "} from '%q';\n", b)
	}
	if len(elements[0].children) == 1 {
		_, err = elements[0].children[0].WriteTo(o)
	} else {
		_, err = elements[0].WriteTo(o)
	}
	if err != nil {
		return err
	}
	o.Write([]byte{';'})
	return nil
}

type element struct {
	name     string
	attrs    map[string]string
	children []io.WriterTo
}

func (e *element) WriteTo(w io.Writer) (int64, error) {
	if lib {
		fmt.Fprintf(w, "%s(", e.name)
	} else {
		fmt.Fprintf(w, "%s(%q", ch, e.name)
	}
	ip := indentPrinter{w}
	first := true
	if len(e.children) == 1 && isText(e.children[0]) {
		if lib {
			first = false
		} else {
			fmt.Fprint(w, ", ")
		}
		e.children[0].WriteTo(w)
	}
	if len(e.attrs) == 1 {
		for k, v := range e.attrs {
			if lib && first {
				fmt.Fprint(w, "{")
				first = false
			} else {
				fmt.Fprint(w, ", {")
			}
			if err := printAttr(w, k, v); err != nil {
				return 0, err
			}
			fmt.Fprint(w, "}")
		}
	} else if len(e.attrs) > 1 {
		if lib && first {
			fmt.Fprint(&ip, "{\n")
			first = false
		} else {
			fmt.Fprint(&ip, ", {\n")
		}
		var f bool
		for k, v := range e.attrs {
			if f {
				fmt.Fprint(&ip, ",\n")
			} else {
				f = true
			}
			if err := printAttr(&ip, k, v); err != nil {
				return 0, err
			}
		}
		fmt.Fprint(w, "\n}")
	}
	if len(e.children) == 1 && !isText(e.children[0]) {
		if !lib || !first {
			fmt.Fprint(w, ", ")
		}
		e.children[0].WriteTo(w)
	} else if len(e.children) > 1 {
		if lib && first {
			fmt.Fprint(&ip, "[\n")
		} else {
			fmt.Fprint(&ip, ", [\n")
		}
		var f bool
		for _, c := range e.children {
			if f {
				fmt.Fprint(&ip, ",\n")
			} else {
				f = true
			}
			c.WriteTo(&ip)
		}
		fmt.Fprint(w, "\n]")
	}
	fmt.Fprint(w, ")")
	return 0, sw.Err
}

func printAttr(w io.Writer, key, value string) error {
	if pe && strings.HasPrefix(key, "on") {
		s, err := javascript.ParseScript(parser.NewStringTokeniser("function handler(event){" + value + "}"))
		if err == nil {
			fmt.Fprintf(w, "%q: %s", key, s)
			return nil
		}
	}
	fmt.Fprintf(w, "%q: %q", key, value)
	return nil
}

type text string

func (t text) WriteTo(w io.Writer) (int64, error) {
	n, err := io.WriteString(w, strconv.Quote(string(t)))
	return int64(n), err
}

func isText(n io.WriterTo) bool {
	_, ok := n.(text)
	return ok
}

type indentPrinter struct {
	io.Writer
}

var (
	indent       = []byte{'	'}
	newLine      = []byte{'\n'}
	commaNewLine = []byte{',', '\n'}
)

func (i *indentPrinter) Write(p []byte) (int, error) {
	var (
		total int
		last  int
	)
	for n, c := range p {
		if c == '\n' {
			m, err := i.Writer.Write(p[last : n+1])
			total += m
			if err != nil {
				return total, err
			}
			_, err = i.Writer.Write(indent)
			if err != nil {
				return total, err
			}
			last = n + 1
		}
	}
	if last != len(p) {
		m, err := i.Writer.Write(p[last:])
		total += m
		if err != nil {
			return total, err
		}
	}
	return total, nil
}

func (i *indentPrinter) WriteString(s string) (int, error) {
	return i.Write([]byte(s))
}
