package main

import (
	"flag"
	"fmt"
	"io"
	"os"
	"strconv"

	"vimagination.zapto.org/memio"
	"vimagination.zapto.org/parser"
)

func main() {

	var input, output string

	flag.StringVar(&input, "i", "-", "input file")
	flag.StringVar(&output, "o", "-", "input file")
	flag.Parse()

	if input == "" {
		input = "-"
	}
	if output == "" {
		output = "-"
	}

	files := make(map[string]memio.Buffer, len(os.Args))
	filesTodo := make([]string, 1, len(os.Args))
	filesDone := make([]string, 0, len(os.Args))
	filesTodo[0] = input
	files[input] = nil
	for len(filesTodo) > 0 {
		name := filesTodo[0]
		filesTodo = filesTodo[1:]
		filesDone = append(filesDone, name)
		var f *os.File
		if name == "-" {
			f = os.Stdin
		} else {
			var err error
			f, err = os.Open(name)
			if err != nil {
				fmt.Fprintf(os.Stderr, "error opening file %q: %s\n", name, err)
				os.Exit(1)
			}
		}
		p := parser.New(parser.NewReaderTokeniser(f))
		var j jsParser
		p.TokeniserState(j.inputElement)
		p.PhraserState(base)
		var buf memio.Buffer
		buf.WriteString("\n")
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
				for n, t := range ph.Data {
					switch t.Type {
					case TokenIdentifier:
						ph.Data[n].Data = "includeNow"
					case TokenStringLiteral:
						str := unescape(t.Data)
						if _, ok := files[str]; !ok {
							files[str] = nil
							filesTodo = append(filesTodo, str)
						}
					}
				}
			case PhraseOffer:
				ph.Data[0].Data = "offerNow"
				ph.Data = append(ph.Data, parser.Token{TokenStringLiteral, escape(name)}, parser.Token{TokenPunctuator, ","}, parser.Token{TokenWhitespace, " "})
			}
			for _, t := range ph.Data {
				buf.WriteString(t.Data)
			}
		}
		f.Close()
		files[name] = buf
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
	_, err := f.WriteString(loader)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error writing to file: %s\n", err)
		os.Exit(1)
	}
	for len(filesDone) > 0 {
		buf := files[filesDone[len(filesDone)-1]]
		filesDone = filesDone[:len(filesDone)-1]
		if _, err = f.Write(buf); err != nil {
			fmt.Fprintf(os.Stderr, "error writing to file: %s\n", err)
			os.Exit(1)
		}
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
