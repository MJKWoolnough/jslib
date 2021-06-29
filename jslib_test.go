package jslib

import (
	"fmt"
	"os"
	"testing"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

type loader map[string]string

func (l loader) load(url string) (*javascript.Module, error) {
	d, ok := l[url]
	if !ok {
		return nil, os.ErrNotExist
	}
	return javascript.ParseModule(parser.NewStringTokeniser(d))
}

func runTest(t *testing.T, expectedOutput string, opts ...Option) {
	t.Helper()
	s, err := Package(opts...)
	if err != nil {
		t.Fatalf("unexpected err: %s", err)
	}
	output := fmt.Sprintf("%s", s)
	if output != expectedOutput {
		t.Errorf("expecting output: %q\ngot: %q", expectedOutput, output)
	}
}
