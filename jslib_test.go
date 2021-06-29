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
	runTest(t, "Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"a.js\"]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\n1;", Loader(l.load), File("a.js"))
}

func Test2(t *testing.T) {
	cwd, _ := os.Getwd()
	l := loader{path.Join(cwd, "a.js"): "1"}
	runTest(t, "Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: url => import(url)}});\n\n1;", Loader(l.load), File("a.js"), NoExports)
}

func Test3(t *testing.T) {
	cwd, _ := os.Getwd()
	l := loader{
		path.Join(cwd, "a.js"): "import {c} from './b.js'; console.log(c)",
		path.Join(cwd, "b.js"): "export const c = 1",
	}
	runTest(t, "Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"a.js\"], [\"b.js\", [\"c\", () => b_c]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst b_c = 1;\n\nconsole.log(b_c);", Loader(l.load), File("a.js"))
}
