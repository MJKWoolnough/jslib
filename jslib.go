package jslib // import "vimagination.zapto.org/jslib"

import (
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"unsafe"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

type config struct {
	filesToDo []string
	files     map[string]*dep
	loader    func(string) (*javascript.Module, error)
	base      *dep
}

func (c *config) NewFile(url string) *dep {
	d, ok := c.files[url]
	if !ok {
		d = newDep(url)
		c.files[url] = d
		c.filesToDo = append(c.filesToDo, url)
	}
	return d
}

type Option func(c *config)

func File(url string) Option {
	return func(c *config) {
		c.NewFile(url)
	}
}

func LoadFromOS() Option {
	return Get(osLoad)
}

func osLoad(url string) (*javascript.Module, error) {
	f, err := os.Open(filepath.FromSlash(url))
	if err != nil {
		return nil, err
	}
	m, err := javascript.ParseModule(parser.NewReaderTokeniser(f))
	f.Close()
	return m, err
}

func Get(getter func(string) (*javascript.Module, error)) Option {
	return func(c *config) {
		c.loader = getter
	}
}

func Loader(os ...Option) (*javascript.Module, error) {
	c := config{
		files: make(map[string]*dep),
	}
	for _, o := range os {
		o(&c)
	}
	base := newDep("")
	for _, d := range c.files {
		base.Add(d)
	}
	for len(c.filesToDo) > 0 {
		file := c.filesToDo[0]
		c.filesToDo = c.filesToDo[1:]
		m, err := c.loader(file)
		if err == ErrNotNeeded {
			continue
		} else if err != nil {
			return nil, err
		}
		d, _ := c.files[file]
		for n := range m.ModuleListItems {
			var err error
			if m.ModuleListItems[n].ImportDeclaration != nil {
				err = c.processImport(d, m.ModuleListItems[n].ImportDeclaration)
			} else if m.ModuleListItems[n].ExportDeclaration != nil {
				err = c.processExport(d, m.ModuleListItems[n].ExportDeclaration)
			} else {
				err = c.processStatement(d, *m.ModuleListItems[n].StatementListItem)
			}
			if err != nil {
				return nil, err
			}
		}
	}
	m := makeLoader()
	base.Process(m.ModuleListItems[0].StatementListItem.Statement.ExpressionStatement.Expressions[0].ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.LeftHandSideExpression.CallExpression.MemberExpression.MemberExpression.PrimaryExpression.ArrayLiteral)
	return m, nil
}

func (c *config) processImport(d *dep, id *javascript.ImportDeclaration) error {
	url, _ := javascript.Unquote(id.FromClause.ModuleSpecifier.Data)
	e := c.NewFile(d.RelTo(url))
	if !d.Add(e) {
		return ErrCircular
	}
	url = e.URL
	obp := new(javascript.ObjectBindingPattern)
	if id.ImportClause == nil {
		return nil
	}
	if id.ImportedDefaultBinding != nil {
		obp.BindingPropertyList = append(obp.BindingPropertyList, javascript.BindingProperty{
			PropertyName: &javascript.PropertyName{
				LiteralPropertyName: &javascript.Token{
					Token: parser.Token{
						Type: javascript.TokenIdentifier,
						Data: "default",
					},
				},
			},
			BindingElement: &javascript.BindingElement{
				SingleNameBinding: id.ImportedDefaultBinding,
			},
		})
	}
	if id.NameSpaceImport != nil {
		obp.BindingRestProperty = id.NameSpaceImport
	} else if id.NamedImports != nil {
		for _, is := range id.NamedImports.ImportList {
			if is.IdentifierName != nil {
				obp.BindingPropertyList = append(obp.BindingPropertyList, javascript.BindingProperty{
					PropertyName: &javascript.PropertyName{
						LiteralPropertyName: is.IdentifierName,
					},
					BindingElement: &javascript.BindingElement{
						SingleNameBinding: is.ImportedBinding,
					},
				})
			} else {
				obp.BindingPropertyList = append(obp.BindingPropertyList, javascript.BindingProperty{
					SingleNameBinding: is.ImportedBinding,
				})
			}
		}
	}
	lb := javascript.LexicalBinding{
		ObjectBindingPattern: obp,
		Initializer: &javascript.AssignmentExpression{
			ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
				MemberExpression: &javascript.MemberExpression{
					PrimaryExpression: &javascript.PrimaryExpression{
						IdentifierReference: &javascript.Token{
							Token: parser.Token{
								Type: javascript.TokenIdentifier,
								Data: "include",
							},
						},
					},
				},
				Arguments: &javascript.Arguments{
					ArgumentList: []javascript.AssignmentExpression{
						{
							ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
								Literal: &javascript.Token{
									Token: parser.Token{
										Type: javascript.TokenStringLiteral,
										Data: strconv.Quote(url),
									},
								},
							}),
						},
						{
							ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
								Literal: &javascript.Token{
									Token: parser.Token{
										Type: javascript.TokenBooleanLiteral,
										Data: "true",
									},
								},
							}),
						},
					},
				},
			}),
		},
	}
	return c.processStatement(d, javascript.StatementListItem{
		Declaration: &javascript.Declaration{
			LexicalDeclaration: &javascript.LexicalDeclaration{
				LetOrConst:  javascript.Const,
				BindingList: []javascript.LexicalBinding{lb},
			},
		},
	})
}

func (c *config) processExport(d *dep, ed *javascript.ExportDeclaration) error {
	if ed.FromClause != nil || ed.ExportClause != nil {
		var url string
		if ed.FromClause != nil {
			loc, _ := javascript.Unquote(ed.FromClause.ModuleSpecifier.Data)
			e := c.NewFile(d.RelTo(loc))
			if !d.Add(e) {
				return ErrCircular
			}
			url = e.URL
		}
		if ed.ExportClause != nil {
			mappings := make(map[string]string, len(ed.ExportClause.ExportList))
			for _, e := range ed.ExportClause.ExportList {
				if e.EIdentifierName != nil {
					mappings[e.IdentifierName.Data] = e.EIdentifierName.Data
				} else {
					mappings[e.IdentifierName.Data] = e.IdentifierName.Data
				}
			}
			if url != "" {
				c.processStatement(d, exportXFrom(url, mappings))
			} else {
				c.processStatement(d, exportVar(mappings))
			}
		} else {
			c.processStatement(d, exportFrom(url))
		}
	} else if ed.VariableStatement != nil || ed.Declaration != nil {
		if ed.VariableStatement != nil {
			c.processStatement(d, javascript.StatementListItem{
				Statement: &javascript.Statement{
					VariableStatement: ed.VariableStatement,
				},
			})
		} else {
			c.processStatement(d, javascript.StatementListItem{Declaration: ed.Declaration})
		}
		ex := exportConst
		mappings := make(map[string]string)
		if ed.Declaration.FunctionDeclaration != nil {
			mappings[ed.Declaration.FunctionDeclaration.BindingIdentifier.Data] = ed.Declaration.FunctionDeclaration.BindingIdentifier.Data
		} else if ed.Declaration.ClassDeclaration != nil {
			mappings[ed.Declaration.ClassDeclaration.BindingIdentifier.Data] = ed.Declaration.ClassDeclaration.BindingIdentifier.Data
		} else {
			var lb []javascript.LexicalBinding
			if ed.Declaration.LexicalDeclaration != nil {
				if ed.Declaration.LexicalDeclaration.LetOrConst == javascript.Let {
					ex = exportVar
				}
				lb = ed.Declaration.LexicalDeclaration.BindingList
			} else {
				ex = exportVar
				lb = *(*[]javascript.LexicalBinding)(unsafe.Pointer(&ed.VariableStatement.VariableDeclarationList))
			}
			for _, l := range lb {
				if l.BindingIdentifier != nil {
					mappings[l.BindingIdentifier.Data] = l.BindingIdentifier.Data
				} else if l.ArrayBindingPattern != nil {
					searchArrayBinding(l.ArrayBindingPattern, mappings)
				} else if l.ObjectBindingPattern != nil {
					searchObjectBinding(l.ObjectBindingPattern, mappings)
				}
			}
		}
		c.processStatement(d, ex(mappings))
	} else if ed.DefaultFunction != nil {
		c.processStatement(d, exportDefault(javascript.AssignmentExpression{
			ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
				FunctionExpression: ed.DefaultFunction,
			}),
		}))
	} else if ed.DefaultClass != nil {
		c.processStatement(d, exportDefault(javascript.AssignmentExpression{
			ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
				ClassExpression: ed.DefaultClass,
			}),
		}))
	} else if ed.DefaultAssignmentExpression != nil {
		c.processStatement(d, exportDefault(*ed.DefaultAssignmentExpression))
	}
	return nil
}

func (c *config) processStatement(d *dep, sl javascript.StatementListItem) error {
	c.searchReplace(d, reflect.ValueOf(&sl))
	if len(d.Structure) > 0 {
		last := d.Structure[len(d.Structure)-1]
		if sl.Declaration != nil && last.Declaration != nil && sl.Declaration.LexicalDeclaration != nil && last.Declaration.LexicalDeclaration != nil && sl.Declaration.LexicalDeclaration.LetOrConst == last.Declaration.LexicalDeclaration.LetOrConst {
			last.Declaration.LexicalDeclaration.BindingList = append(last.Declaration.LexicalDeclaration.BindingList, sl.Declaration.LexicalDeclaration.BindingList...)
			return nil
		} else if sl.Statement != nil && last.Statement != nil {
			if sl.Statement.VariableStatement != nil && last.Statement.VariableStatement != nil {
				last.Statement.VariableStatement.VariableDeclarationList = append(last.Statement.VariableStatement.VariableDeclarationList, sl.Statement.VariableStatement.VariableDeclarationList...)
				return nil
			} else if sl.Statement.ExpressionStatement != nil && last.Statement.ExpressionStatement != nil {
				sle := len(sl.Statement.ExpressionStatement.Expressions) - 1
				le := len(last.Statement.ExpressionStatement.Expressions) - 1
				if sl.Statement.ExpressionStatement.Expressions[sle].Yield == true && last.Statement.ExpressionStatement.Expressions[le].Yield == true {
					var arr *javascript.ArrayLiteral
					if !last.Statement.ExpressionStatement.Expressions[le].Delegate {
						last.Statement.ExpressionStatement.Expressions[le].Delegate = true
						arr = &javascript.ArrayLiteral{
							ElementList: []javascript.AssignmentExpression{
								*last.Statement.ExpressionStatement.Expressions[le].AssignmentExpression,
							},
						}
						last.Statement.ExpressionStatement.Expressions[le].AssignmentExpression = &javascript.AssignmentExpression{
							ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
								ArrayLiteral: arr,
							}),
						}
					} else {
						arr = javascript.UnwrapConditional(last.Statement.ExpressionStatement.Expressions[le].AssignmentExpression.ConditionalExpression).(*javascript.PrimaryExpression).ArrayLiteral
					}
					if sl.Statement.ExpressionStatement.Expressions[sle].Delegate {
						arr.ElementList = append(arr.ElementList, javascript.UnwrapConditional(sl.Statement.ExpressionStatement.Expressions[sle].AssignmentExpression.ConditionalExpression).(*javascript.PrimaryExpression).ArrayLiteral.ElementList...)
					} else {
						arr.ElementList = append(arr.ElementList, *sl.Statement.ExpressionStatement.Expressions[sle].AssignmentExpression)
					}
					return nil
				}
			}
		}
	}
	d.Structure = append(d.Structure, sl)
	return nil
}

var callExpression = reflect.TypeOf(&javascript.CallExpression{})

func (c *config) searchReplace(d *dep, v reflect.Value) error {
	if v.Type() == callExpression {
		ce := v.Interface().(*javascript.CallExpression)
		var ae *javascript.AssignmentExpression
		if ce != nil {
			if ce.MemberExpression != nil && ce.Arguments != nil && len(ce.Arguments.ArgumentList) == 1 && ce.Arguments.SpreadArgument == nil {
				if ce.MemberExpression.PrimaryExpression != nil && ce.MemberExpression.PrimaryExpression.IdentifierReference != nil && ce.MemberExpression.PrimaryExpression.IdentifierReference.Data == "include" || ce.MemberExpression.MemberExpression != nil && ce.MemberExpression.MemberExpression.PrimaryExpression != nil && ce.MemberExpression.MemberExpression.PrimaryExpression.IdentifierReference != nil && ce.MemberExpression.MemberExpression.PrimaryExpression.IdentifierReference.Data == "window" && (ce.MemberExpression.IdentifierName != nil && ce.MemberExpression.IdentifierName.Data == "include" || ce.MemberExpression.Expression != nil && ce.MemberExpression.Expression.Expressions[len(ce.MemberExpression.Expression.Expressions)-1].AssignmentExpression != nil && *aeAsString(ce.MemberExpression.Expression.Expressions[len(ce.MemberExpression.Expression.Expressions)-1].AssignmentExpression) == "\"include\"") {
					ae = ce.Arguments.ArgumentList[0].AssignmentExpression
				}
			} else if ce.ImportCall != nil {
				ae = ce.ImportCall
				*ce = javascript.CallExpression{
					MemberExpression: &javascript.MemberExpression{
						MemberExpression: &javascript.MemberExpression{
							PrimaryExpression: &javascript.PrimaryExpression{
								IdentifierReference: &javascript.Token{
									Token: parser.Token{
										Type: javascript.TokenIdentifier,
										Data: "window",
									},
								},
							},
						},
						IdentifierName: &javascript.Token{
							Token: parser.Token{
								Type: javascript.TokenIdentifier,
								Data: "include",
							},
						},
					},
					Arguments: &javascript.Arguments{
						ArgumentList: []javascript.AssignmentExpression{
							*ae,
						},
					},
				}
			}
		}
		if ae != nil {
			if str := aeAsString(ae); str != nil {
				url, _ := javascript.Unquote(*str)
				e := c.NewFile(d.RelTo(url))
				if !d.Add(e) {
					return ErrCircular
				}
				*str = strconv.Quote(e.URL)
				return nil
			}
		}
	}
	switch v.Kind() {
	case reflect.Ptr:
		if !v.IsZero() {
			return c.searchReplace(d, v.Elem())
		}
	case reflect.Slice:
		for i := 0; i < v.Len(); i++ {
			if err := c.searchReplace(d, v.Index(i)); err != nil {
				return err
			}
		}
	case reflect.Struct:
		for i := 0; i < v.NumField()-1; i++ {
			if err := c.searchReplace(d, v.Field(i)); err != nil {
				return err
			}
		}
	}
	return nil
}

func aeAsString(ae *javascript.AssignmentExpression) *string {
	if ae != nil && ae.ConditionalExpression != nil {
		if pe, ok := javascript.UnwrapConditional(ae.ConditionalExpression).(*javascript.PrimaryExpression); ok && pe.Literal != nil && pe.Literal.Type == javascript.TokenStringLiteral {
			return &pe.Literal.Data
		}
	}
	return nil
}

func searchArrayBinding(ab *javascript.ArrayBindingPattern, mappings map[string]string) {
	for _, a := range ab.BindingElementList {
		if a.SingleNameBinding != nil {
			mappings[a.SingleNameBinding.Data] = a.SingleNameBinding.Data
		} else if a.ArrayBindingPattern != nil {
			searchArrayBinding(a.ArrayBindingPattern, mappings)
		} else if a.ObjectBindingPattern != nil {
			searchObjectBinding(a.ObjectBindingPattern, mappings)
		}
	}
	if ab.BindingRestElement != nil {
		if ab.BindingRestElement.SingleNameBinding != nil {
			mappings[ab.BindingRestElement.SingleNameBinding.Data] = ab.BindingRestElement.SingleNameBinding.Data
		} else if ab.BindingRestElement.ArrayBindingPattern != nil {
			searchArrayBinding(ab.BindingRestElement.ArrayBindingPattern, mappings)
		} else if ab.BindingRestElement.ObjectBindingPattern != nil {
			searchObjectBinding(ab.BindingRestElement.ObjectBindingPattern, mappings)
		}
	}
}

func searchObjectBinding(ob *javascript.ObjectBindingPattern, mappings map[string]string) {
	for _, o := range ob.BindingPropertyList {
		if o.SingleNameBinding != nil {
			mappings[o.SingleNameBinding.Data] = o.SingleNameBinding.Data
		} else if o.BindingElement != nil {
			if o.BindingElement.SingleNameBinding != nil {
				mappings[o.BindingElement.SingleNameBinding.Data] = o.BindingElement.SingleNameBinding.Data
			} else if o.BindingElement.ArrayBindingPattern != nil {
				searchArrayBinding(o.BindingElement.ArrayBindingPattern, mappings)
			} else if o.BindingElement.ObjectBindingPattern != nil {
				searchObjectBinding(o.BindingElement.ObjectBindingPattern, mappings)
			}
		}
	}
	if ob.BindingRestProperty != nil {
		mappings[ob.BindingRestProperty.Data] = ob.BindingRestProperty.Data
	}
}

// Errors
var (
	ErrNotNeeded = errors.New("not needed")
	ErrCircular  = errors.New("circular import")
)
