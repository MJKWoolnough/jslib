package jslib

import (
	"fmt"
	"os"
	"path"
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

func Test1(t *testing.T) {
	cwd, _ := os.Getwd()
	l := loader{path.Join(cwd, "a.js"): "1"}
	runTest(t, "Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (imports => (url, now = false) => imports.has(url) ? (a => now ? a : Promise.resolve(a))(imports.get(url)) : import(url))(new Map([[\"a.js\"]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))])))}});\n\n1;", Loader(l.load), File("a.js"))
}
