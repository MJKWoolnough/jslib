package jslib

import (
	"path"

	"vimagination.zapto.org/javascript"
)

type dep struct {
	URL        string
	Structure  []javascript.StatementListItem
	requires   map[string]*dep
	requiredBy map[string]*dep
	written    bool
}

func (d *dep) RelTo(url string) string {
	if len(url) > 0 && url[0] == '/' {
		return url
	}
	return path.Join(path.Dir(d.URL), url)
}

func (d *dep) Add(e *dep) bool {
	if _, ok := d.requires[e.URL]; ok {
		return false
	}
	d.requires[e.URL] = e
	e.requiredBy[d.URL] = d
	return true
}

func (d *dep) Process(al *javascript.ArrayLiteral) {
	if d.written {
		return
	}
	d.written = true
	for _, e := range d.requires {
		e.Process(al)
	}
	if d.Structure != nil {
		al.ElementList = append(al.ElementList, offer(d.URL, d.Structure))
	}
}

func newDep(url string) *dep {
	return &dep{
		URL:        url,
		requires:   make(map[string]*dep),
		requiredBy: make(map[string]*dep),
	}
}
