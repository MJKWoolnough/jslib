package jslib

import (
	"fmt"
	"testing"
)

func TestLoader(t *testing.T) {
	for n, test := range []struct {
		input  exportsMap
		output string
	}{
		{
			nil,
			"Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: url => import(url)}});",
		},
		{
			exportsMap{
				"a.js": exportMap{
					"default": export{"a_default", false},
					"export1": export{"exported", true},
				},
				"b.js": exportMap{
					"default": export{"b_default", true},
					"dfjgf":   export{"nmhfgfk", false},
				},
			},
			"Object.defineProperties(window, {pageLoad: {value: document.readyState == \"complete\" ? Promise.resolve() : new Promise(successFn => window.addEventListener(\"load\", successFn, {once: true}))}, include: {value: (imports => (url, now = false) => imports.has(url) ? (a => now ? a : Promise.resolve(a))(imports.get(url)) : import(url))(new Map([[\"a.js\", [\"default\", () => a_default], [\"export1\", () => exported, a => exported = a]], [\"b.js\", [\"default\", () => b_default, a => b_default = a], [\"dfjgf\", () => nmhfgfk]]].map(([url, ...props]) => [url, Object.freeze(Object.defineProperties({}, Object.fromEntries(props.map(([prop, get, set]) => [prop, {enumerable: true, get, set}]))))])))}});",
		},
	} {
		if output := fmt.Sprintf("%s", loader(test.input)); output != test.output {
			t.Errorf("test %d: expecting output: %s\ngot: %s", n+1, test.output, output)
		}
	}
}
