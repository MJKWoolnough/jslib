package main

import (
	"bytes"
	"encoding/xml"
	"flag"
	"fmt"
	"io"
	"os"
	"strconv"

	"vimagination.zapto.org/rwcount"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

var ch string

func run() error {
	var (
		input string
		f     *os.File
		err   error
	)
	flag.StringVar(&input, "i", "-", "input file")
	flag.StringVar(&ch, "c", "createHTML", "createHTML function name")
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
	if len(elements[0].children) == 1 {
		elements[0].children[0].WriteTo(os.Stdout)
	} else {
		elements[0].WriteTo(os.Stdout)
	}
	fmt.Println(";")
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
			fmt.Fprintf(&sw, ", {%q: %q}", k, v)
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
			fmt.Fprintf(&ip, "%q: %q", k, v)
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
