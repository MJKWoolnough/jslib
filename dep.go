package jslib

import (
	"path"
	"strconv"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/javascript/scope"
	"vimagination.zapto.org/javascript/walk"
	"vimagination.zapto.org/parser"
)

type importBinding struct {
	*dependency
	binding string
}

type dependency struct {
	config               *config
	url                  string
	module               *javascript.Module
	scope                *scope.Scope
	requires, requiredBy map[string]*dependency
	imports, exports     map[string]*importBinding
	prefix               string
}

func (d *dependency) addImport(url string) (*dependency, error) {
	c := d.config
	e, ok := c.filesDone[url]
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
		e = &dependency{
			config:     c,
			url:        url,
			requires:   make(map[string]*dependency),
			requiredBy: make(map[string]*dependency),
			imports:    make(map[string]*importBinding),
			exports:    make(map[string]*importBinding),
			prefix:     string(p[n:]),
		}
		c.filesDone[url] = e
		if err := e.process(); err != nil {
			return nil, err
		}
	}
	e.requiredBy[d.url] = d
	d.requires[url] = e
	return e, nil
}

func (d *dependency) process() error {
	var err error
	d.module, err = d.config.loader(d.url)
	if err != nil {
		return err
	}
	d.scope, err = scope.ModuleScope(d.module, nil)
	if err != nil {
		return err
	}
	for _, li := range d.module.ModuleListItems {
		if li.ImportDeclaration != nil {
			durl, _ := javascript.Unquote(li.ImportDeclaration.FromClause.ModuleSpecifier.Data)
			iurl := d.RelTo(durl)
			e, err := d.addImport(iurl)
			if err != nil {
				return err
			}
			if li.ImportDeclaration.ImportedDefaultBinding != nil {
				d.setImportBinding(li.ImportDeclaration.ImportedDefaultBinding.Data, e, "default")
			}
			if li.ImportDeclaration.NameSpaceImport != nil {
				d.setImportBinding(li.ImportDeclaration.NameSpaceImport.Data, e, "*")
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
					d.setImportBinding(tk.Data, e, is.IdentifierName.Data)
				}
			}
			li.ImportDeclaration = nil
		} else if li.StatementListItem != nil && d.config.parseDynamic {
			if err := walk.Walk(li.StatementListItem, d); err != nil {
				return err
			}
		} else if li.ExportDeclaration != nil {
			ed := li.ExportDeclaration
			if ed.FromClause != nil {
				durl, _ := javascript.Unquote(ed.FromClause.ModuleSpecifier.Data)
				_, err := d.addImport(d.RelTo(durl))
				if err != nil {
					return err
				}
				if ed.ExportClause != nil {
				} else if ed.ExportFromClause != nil {
				}
			} else if ed.ExportClause != nil {
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
	return nil
}

func (d *dependency) Handle(t javascript.Type) error {
	if ce, ok := t.(*javascript.CallExpression); ok && isConditionalExpression(ce.ImportCall) {
		if d.HandleImportConditional(ce.ImportCall.ConditionalExpression) {
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
		}
	}
	return walk.Walk(t, d)
}

func (d *dependency) HandleImportConditional(ce *javascript.ConditionalExpression) bool {
	if ce.True != nil && ce.False != nil {
		ret := false
		if isConditionalExpression(ce.True) {
			ret = d.HandleImportConditional(ce.True.ConditionalExpression)
		}
		if isConditionalExpression(ce.False) {
			if d.HandleImportConditional(ce.False.ConditionalExpression) {
				ret = true
			}
		}
		return ret
	} else if pe, ok := javascript.UnwrapConditional(ce).(*javascript.PrimaryExpression); ok && pe.Literal != nil && pe.Literal.Type == javascript.TokenStringLiteral {
		durl, _ := javascript.Unquote(pe.Literal.Data)
		iurl := d.RelTo(durl)
		pe.Literal.Data = strconv.Quote(iurl)
		d.addImport(iurl)
		d.config.bare = false
		return true
	}
	return false
}

func (d *dependency) RelTo(url string) string {
	if len(url) > 0 && url[0] == '/' {
		return url
	}
	return path.Join(path.Dir(d.url), url)
}

func (d *dependency) setImportBinding(binding string, e *dependency, importedBinding string) {
	d.imports[binding] = &importBinding{
		dependency: e,
		binding:    importedBinding,
	}
}

func (d *dependency) setExportBinding(binding string, e *dependency, exportedBinding string) {
	d.exports[binding] = &importBinding{
		dependency: e,
		binding:    exportedBinding,
	}
}

func isConditionalExpression(ae *javascript.AssignmentExpression) bool {
	return ae.ConditionalExpression != nil && ae.Yield == false && ae.Delegate == false && (ae.AssignmentOperator == javascript.AssignmentNone || ae.AssignmentOperator == javascript.AssignmentAssign)
}
