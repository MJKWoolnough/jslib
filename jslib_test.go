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

func TestPackage(t *testing.T) {
	cwd, _ := os.Getwd()
	for n, test := range [...]struct {
		Input   loader
		Output  string
		Options []Option
	}{
		{
			loader{path.Join(cwd, "a.js"): "1"},
			"Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"a.js\"]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\n1;",
			[]Option{File("a.js")},
		},
		{
			loader{path.Join(cwd, "a.js"): "1"},
			"Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: url => import(url)}});\n\n1;",
			[]Option{File("a.js"), NoExports},
		},
		{
			loader{
				path.Join(cwd, "a.js"): "import {c} from './b.js'; console.log(c)",
				path.Join(cwd, "b.js"): "export const c = 1",
			},
			"Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"a.js\"], [\"b.js\", [\"c\", () => b_c]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst b_c = 1;\n\nconsole.log(b_c);",
			[]Option{File("a.js")},
		},
		{
			loader{
				path.Join(cwd, "a.js"): "import {d} from './b.js'; console.log(d)",
				path.Join(cwd, "b.js"): "export {d} from './c.js'",
				path.Join(cwd, "c.js"): "export const d = 1",
			},
			"Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"a.js\"], [\"b.js\", [\"d\", () => c_d]], [\"c.js\", [\"d\", () => c_d]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst c_d = 1;\n\nconsole.log(c_d);",
			[]Option{File("a.js")},
		},
		{
			loader{
				path.Join(cwd, "a.js"): "import {c as d} from './b.js'; console.log(d)",
				path.Join(cwd, "b.js"): "export const c = 1",
			},
			"Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"a.js\"], [\"b.js\", [\"c\", () => b_c]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst b_c = 1;\n\nconsole.log(b_c);",
			[]Option{File("a.js")},
		},
		{
			loader{
				path.Join(cwd, "a.js"): "import {f as g} from './b.js'; console.log(g)",
				path.Join(cwd, "b.js"): "export {e as f} from './c.js'",
				path.Join(cwd, "c.js"): "const d = 1;export {d as e}",
			},
			"Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"a.js\"], [\"b.js\", [\"f\", () => c_d]], [\"c.js\", [\"e\", () => c_d]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst c_d = 1;\n\nconsole.log(c_d);",
			[]Option{File("a.js")},
		},
	} {
		s, err := Package(append(test.Options, Loader(test.Input.load))...)
		if err != nil {
			t.Fatalf("test %d: unexpected err: %s", n+1, err)
		}
		output := fmt.Sprintf("%s", s)
		if output != test.Output {
			t.Errorf("test %d: expecting output: %q\ngot: %q", n+1, test.Output, output)
		}
	}
}
