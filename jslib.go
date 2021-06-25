package jslib

import (
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/javascript/scope"
	"vimagination.zapto.org/javascript/walk"
	"vimagination.zapto.org/parser"
)

type data struct {
	*config
	url                  string
	module               *javascript.Module
	scope                *scope.Scope
	requires, requiredBy map[string]*data
	exports              map[string]struct{}
	exportRenames        map[string]string
	exportFrom           map[string]*data
	prefix               string
}

type config struct {
	filesToDo    []*data
	filesDone    map[string]*data
	loader       func(string) (*javascript.Module, error)
	bare         bool
	parseDynamic bool
	currURL      string
	nextID       uint
	data
}

func (dep *data) addImport(url string) *data {
	c := dep.config
	d, ok := c.filesDone[url]
	if !ok {
		c.nextID++
		id := c.nextID
		var (
			p [15]byte
			n = 14
		)
		p[14] = '_'
		for id >= 0 {
			n--
			id--
			p[n] = 'a' + byte(id%26)
			id /= 26
		}
		d := &data{
			config:        c,
			url:           url,
			requires:      make(map[string]*data),
			requiredBy:    make(map[string]*data),
			exports:       make(map[string]struct{}),
			exportRenames: make(map[string]string),
			exportFrom:    make(map[string]*data),
			prefix:        string(p[n:]),
		}
		c.filesToDo = append(c.filesToDo, d)
	}
	d.requiredBy[dep.url] = dep
	dep.requires[url] = d
	return d
}

func OSLoad(url string) (*javascript.Module, error) {
	f, err := os.Open(filepath.FromSlash(url))
	if err != nil {
		return nil, err
	}
	m, err := javascript.ParseModule(parser.NewReaderTokeniser(f))
	f.Close()
	return m, err
}

func Package(os ...Option) (*javascript.Module, error) {
	c := config{
		loader: OSLoad,
	}
	c.data.config = &c
	for _, o := range os {
		o(&c)
	}
	var err error
	n := 1
	for len(c.filesToDo) > 0 {
		d := c.filesToDo[0]
		if _, ok := c.filesDone[d.url]; ok {
			continue
		}
		c.filesDone[d.url] = d
		c.filesToDo = c.filesToDo[1:]
		d.module, err = c.loader(d.url)
		if err != nil {
			return nil, err
		}
		d.scope, err = scope.ModuleScope(d.module, nil)
		if err != nil {
			return nil, err
		}
		n += len(d.module.ModuleListItems)
		for _, li := range d.module.ModuleListItems {
			if li.ImportDeclaration != nil {
				durl, _ := javascript.Unquote(li.ImportDeclaration.FromClause.ModuleSpecifier.Data)
				d.addImport(d.RelTo(durl))
			} else if li.StatementListItem != nil && c.parseDynamic {
				if err := walk.Walk(li.StatementListItem, d); err != nil {
					return nil, err
				}
			} else if li.ExportDeclaration != nil {
				ed := li.ExportDeclaration
				if ed.ExportClause != nil {
					var fc *data
					if ed.FromClause != nil {
						durl, _ := javascript.Unquote(ed.FromClause.ModuleSpecifier.Data)
						fc = d.addImport(d.RelTo(durl))
					}
					for _, e := range ed.ExportClause.ExportList {
						var name = e.IdentifierName.Data
						if e.EIdentifierName != nil && e.IdentifierName.Data != e.EIdentifierName.Data {
							name = e.EIdentifierName.Data
							d.exportRenames[e.EIdentifierName.Data] = e.IdentifierName.Data
						}
						if fc != nil {
							d.exportFrom[name] = fc
						}
						d.exports[name] = struct{}{}
					}
				} else if ed.VariableStatement != nil {
					li.StatementListItem = &javascript.StatementListItem{
						Statement: &javascript.Statement{
							VariableStatement: ed.VariableStatement,
						},
					}
				} else if ed.Declaration != nil {
					li.StatementListItem = &javascript.StatementListItem{
						Declaration: ed.Declaration,
					}
				} else {
					def := &javascript.Token{Token: parser.Token{Data: d.prefix + "default"}}
					if ed.DefaultFunction != nil {
						ed.DefaultFunction.BindingIdentifier = def
						li.StatementListItem = &javascript.StatementListItem{
							Declaration: &javascript.Declaration{
								FunctionDeclaration: ed.DefaultFunction,
							},
						}
					} else if ed.DefaultClass != nil {
						ed.DefaultClass.BindingIdentifier = def
						li.StatementListItem = &javascript.StatementListItem{
							Declaration: &javascript.Declaration{
								ClassDeclaration: ed.DefaultClass,
							},
						}
					} else if ed.DefaultAssignmentExpression != nil {
						li.StatementListItem = &javascript.StatementListItem{
							Statement: &javascript.Statement{
								ExpressionStatement: &javascript.Expression{
									Expressions: []javascript.AssignmentExpression{
										*ed.DefaultAssignmentExpression,
									},
								},
							},
						}
					}
				}
				li.ExportDeclaration = nil
			}
		}
	}
	slis := make([]javascript.ModuleItem, 1, n)
	dw := make(depWalker)
	dw.walkDeps(&c.data, func(d *data) {
		for _, li := range d.module.ModuleListItems {
			if li.ImportDeclaration != nil {
				durl, _ := javascript.Unquote(li.ImportDeclaration.FromClause.ModuleSpecifier.Data)
				iurl := d.RelTo(durl)
				e := d.addImport(iurl)
				if li.ImportDeclaration.ImportedDefaultBinding != nil {
					replaceBinding(d.scope, li.ImportDeclaration.ImportedDefaultBinding.Data, e)
				}
				if li.ImportDeclaration.NameSpaceImport != nil {
					replaceBinding(d.scope, li.ImportDeclaration.NameSpaceImport.Data, e)
					li.StatementListItem = &javascript.StatementListItem{
						Declaration: &javascript.Declaration{
							LexicalDeclaration: &javascript.LexicalDeclaration{
								LetOrConst: javascript.Const,
								BindingList: []javascript.LexicalBinding{
									{
										BindingIdentifier: li.ImportDeclaration.NameSpaceImport,
										Initializer: &javascript.AssignmentExpression{
											ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
												MemberExpression: &javascript.MemberExpression{
													PrimaryExpression: &javascript.PrimaryExpression{
														IdentifierReference: &javascript.Token{Token: parser.Token{Data: "include"}},
													},
												},
												Arguments: &javascript.Arguments{
													ArgumentList: []javascript.AssignmentExpression{
														{
															ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																Literal: &javascript.Token{Token: parser.Token{Data: strconv.Quote(iurl)}},
															}),
														},
														{
															ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																Literal: &javascript.Token{Token: parser.Token{Data: "true"}},
															}),
														},
													},
												},
											}),
										},
									},
								},
							},
						},
					}
				} else if li.ImportDeclaration.NamedImports != nil {
					for _, is := range li.ImportDeclaration.NamedImports.ImportList {
						tk := is.IdentifierName
						if is.ImportedBinding != nil {
							tk = is.ImportedBinding
						}
						replaceBinding(d.scope, tk.Data, e)
					}
				}
			} else if li.StatementListItem != nil {
				walk.Walk(li.StatementListItem, importReplacer)
				li.ImportDeclaration = nil
			}
			slis = append(slis, li)
		}
		processScope(d.scope, d.prefix)
	})
	return &javascript.Module{
		ModuleListItems: slis,
	}, nil
}

var importReplacer walk.HandlerFunc

func init() {
	importReplacer = func(t javascript.Type) error {
		if ce, ok := t.(*javascript.CallExpression); ok && ce.ImportCall != nil {
			ce.MemberExpression = &javascript.MemberExpression{
				PrimaryExpression: &javascript.PrimaryExpression{
					IdentifierReference: &javascript.Token{Token: parser.Token{Data: "include"}},
				},
				Arguments: &javascript.Arguments{
					ArgumentList: []javascript.AssignmentExpression{
						*ce.ImportCall,
					},
				},
			}
			ce.ImportCall = nil
			return walk.Walk(ce.Arguments.ArgumentList[0], importReplacer)
		}
		return walk.Walk(t, importReplacer)
	}
}

func (d *data) Handle(t javascript.Type) error {
	if ce, ok := t.(*javascript.CallExpression); ok && ce.ImportCall != nil && ce.ImportCall.ConditionalExpression != nil {
		if pe, ok := javascript.UnwrapConditional(ce.ImportCall.ConditionalExpression).(*javascript.PrimaryExpression); ok && pe.Literal != nil && pe.Literal.Type == javascript.TokenStringLiteral {
			durl, _ := javascript.Unquote(pe.Literal.Data)
			d.addImport(d.RelTo(durl))
		}
	}
	return walk.Walk(t, d)
}

func (d *data) RelTo(url string) string {
	if len(url) > 0 && url[0] == '/' {
		return url
	}
	return path.Join(path.Dir(d.url), url)
}

func replaceBinding(scope *scope.Scope, oldBinding string, dep *data) {
	newBinding := dep.prefix + oldBinding
	im := scope.Bindings[oldBinding]
	for _, imb := range im {
		imb.Data = newBinding
	}
}

func processScope(s *scope.Scope, prefix string) {
	for _, b := range s.Bindings {
		if len(b) == 0 || b[0].BindingType == scope.BindingImport || b[0].BindingType == scope.BindingBare {
			continue
		}
		for _, binding := range b {
			binding.Data = prefix + binding.Data
		}
	}
	for _, scope := range s.Scopes {
		processScope(scope, prefix)
	}
}

type depWalker map[string]struct{}

type deps []*data

func (d deps) Len() int {
	return len(d)
}

func (d deps) Less(i, j int) bool {
	if len(d[i].prefix) < len(d[j].prefix) {
		return true
	}
	if len(d[j].prefix) < len(d[i].prefix) {
		return false
	}
	return d[i].prefix < d[j].prefix
}

func (d deps) Swap(i, j int) {
	d[i], d[j] = d[j], d[i]
}

func (dw depWalker) walkDeps(d *data, fn func(*data)) {
	if _, ok := dw[d.url]; ok {
		return
	}
	dw[d.url] = struct{}{}
	urls := make(deps, 0, len(d.requires))
	for _, e := range d.requires {
		urls = append(urls, e)
	}
	sort.Sort(urls)
	for _, e := range urls {
		dw.walkDeps(e, fn)
	}
	if d.url != "" {
		fn(d)
	}
}
