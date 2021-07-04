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

func TestPackage(t *testing.T) {
	for n, test := range [...]struct {
		Input   loader
		Output  string
		Options []Option
	}{
		{ // 1
			loader{"/a.js": "1"},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"/a.js\"]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\n1;",
			[]Option{File("/a.js")},
		},
		{ // 2
			loader{"/a.js": "1"},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: url => import(url)}});\n\n1;",
			[]Option{File("/a.js"), NoExports},
		},
		{ // 3
			loader{
				"/a.js": "import {c} from './b.js'; console.log(c)",
				"/b.js": "export const c = 1",
			},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"/a.js\"], [\"/b.js\", [\"c\", () => b_c]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst b_c = 1;\n\nconsole.log(b_c);",
			[]Option{File("/a.js")},
		},
		{ // 4
			loader{
				"/a.js": "import {d} from './b.js'; console.log(d)",
				"/b.js": "export {d} from './c.js'",
				"/c.js": "export const d = 1",
			},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"/a.js\"], [\"/b.js\", [\"d\", () => c_d]], [\"/c.js\", [\"d\", () => c_d]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst c_d = 1;\n\nconsole.log(c_d);",
			[]Option{File("/a.js")},
		},
		{ // 5
			loader{
				"/a.js": "import {c as d} from './b.js'; console.log(d)",
				"/b.js": "export const c = 1",
			},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"/a.js\"], [\"/b.js\", [\"c\", () => b_c]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst b_c = 1;\n\nconsole.log(b_c);",
			[]Option{File("/a.js")},
		},
		{ // 6
			loader{
				"/a.js": "import {f as g} from './b.js'; console.log(g)",
				"/b.js": "export {e as f} from './c.js'",
				"/c.js": "const d = 1;export {d as e}",
			},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"/a.js\"], [\"/b.js\", [\"f\", () => c_d]], [\"/c.js\", [\"e\", () => c_d]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst c_d = 1;\n\nconsole.log(c_d);",
			[]Option{File("/a.js")},
		},
		{ // 7
			loader{
				"/a.js": "import c from './b.js'; console.log(c)",
				"/b.js": "export default 1",
			},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"/a.js\"], [\"/b.js\", [\"default\", () => b_default]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst b_default = 1;\n\nconsole.log(b_default);",
			[]Option{File("/a.js")},
		},
		{ // 8
			loader{
				"/a.js": "import c from './b.js'; console.log(c)",
				"/b.js": "export {default} from './c.js'",
				"/c.js": "export default 1",
			},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"/a.js\"], [\"/b.js\", [\"default\", () => c_default]], [\"/c.js\", [\"default\", () => c_default]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst c_default = 1;\n\nconsole.log(c_default);",
			[]Option{File("/a.js")},
		},
		{ // 9
			loader{
				"/a.js":   "import {d} from './b/b.js'; console.log(d)",
				"/b/b.js": "export {d} from '../c/c.js'",
				"/c/c.js": "export const d = 1",
			},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"/a.js\"], [\"/b/b.js\", [\"d\", () => c_d]], [\"/c/c.js\", [\"d\", () => c_d]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst c_d = 1;\n\nconsole.log(c_d);",
			[]Option{File("/a.js")},
		},
		{ // 10
			loader{
				"/a.js":   "import * as e from './b/b.js'; console.log(e.d)",
				"/b/b.js": "export * from '../c/c.js'",
				"/c/c.js": "export const d = 1",
			},
			"Object.defineProperties(globalThis, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => globalThis.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (() => {\n\tconst imports = new Map([[\"/a.js\"], [\"/b/b.js\", [\"d\", () => c_d]], [\"/c/c.js\", [\"d\", () => c_d]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))]));\n\treturn url => Promise.resolve(imports.get(url) ?? import(url));\n})()}});\n\nconst c_d = 1;\n\nconst e = await include(\"/b/b.js\", true);\n\nconsole.log(e.d);",
			[]Option{File("/a.js")},
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
