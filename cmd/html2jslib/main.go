package main

import (
	"bytes"
	"encoding/xml"
	"flag"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
	"vimagination.zapto.org/rwcount"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

var (
	ch string
	pe bool
)

func run() error {
	var (
		input, output string
		f, o          *os.File
		err           error
	)
	flag.StringVar(&input, "i", "-", "input file")
	flag.StringVar(&output, "o", "-", "output file")
	flag.StringVar(&ch, "c", "createHTML", "createHTML function name")
	flag.BoolVar(&pe, "e", false, "process on* attrs as javascript")
	flag.Parse()
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
			elements = append(elements, &element{
				name:  strconv.Quote(t.Name.Local),
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
	sw := rwcount.Writer{Writer: w}
	fmt.Fprintf(&sw, "%s(%s", ch, e.name)
	ip := indentPrinter{&sw}
	if len(e.children) == 1 && isText(e.children[0]) {
		fmt.Fprint(&sw, ", ")
		e.children[0].WriteTo(&sw)
	}
	if len(e.attrs) == 1 {
		for k, v := range e.attrs {
			fmt.Fprint(&sw, ", {")
			if err := printAttr(&sw, k, v); err != nil {
				return sw.Count, err
			}
			fmt.Fprint(&sw, "}")
		}
	} else if len(e.attrs) > 1 {
		fmt.Fprint(&ip, ", {\n")
		var f bool
		for k, v := range e.attrs {
			if f {
				fmt.Fprint(&ip, ",\n")
			} else {
				f = true
			}
			if err := printAttr(&ip, k, v); err != nil {
				return sw.Count, err
			}
		}
		fmt.Fprint(&sw, "\n}")
	}
	if len(e.children) == 1 && !isText(e.children[0]) {
		fmt.Fprint(&sw, ", ")
		e.children[0].WriteTo(&sw)
	} else if len(e.children) > 1 {
		fmt.Fprint(&ip, ", [\n")
		var f bool
		for _, c := range e.children {
			if f {
				fmt.Fprint(&ip, ",\n")
			} else {
				f = true
			}
			c.WriteTo(&ip)
		}
		fmt.Fprint(&sw, "\n]")
	}
	fmt.Fprint(&sw, ")")
	return sw.Count, sw.Err
}

func printAttr(w io.Writer, key, value string) error {
	if pe && strings.HasPrefix(key, "on") {
		s, err := javascript.ParseScript(parser.NewStringTokeniser("function handler(event){" + value + "}"))
		if err == nil {
			fmt.Fprintf(w, "%q: %s", key, s)
		}
	} else {
		fmt.Fprintf(w, "%q: %q", key, value)
	}
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
