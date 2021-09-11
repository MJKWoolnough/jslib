package jslib

import (
	"errors"
	"fmt"
	"path"
	"strconv"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/javascript/scope"
	"vimagination.zapto.org/javascript/walk"
)

type importBinding struct {
	*dependency
	binding string
}

type dependency struct {
	config             *config
	url                string
	scope              *scope.Scope
	requires           map[string]*dependency
	imports, exports   map[string]*importBinding
	prefix             string
	dynamicRequirement bool
	needsMeta          bool
	done               bool
}

func id2String(id uint) string {
	var (
		p [15]byte
		n = 14
	)
	p[14] = '_'
	for id > 0 {
		n--
		id--
		p[n] = 'a' + byte(id%26)
		id /= 26
	}
	return string(p[n:])
}

func (d *dependency) addImport(url string) (*dependency, error) {
	c := d.config
	e, ok := c.filesDone[url]
	if !ok {
		c.nextID++
		id := c.nextID
		e = &dependency{
			config:   c,
			url:      url,
			requires: make(map[string]*dependency),
			imports:  make(map[string]*importBinding),
			exports:  make(map[string]*importBinding),
			prefix:   id2String(id),
		}
		c.filesDone[url] = e
		if err := e.process(); err != nil {
			return nil, err
		}
	}
	d.requires[url] = e
	return e, nil
}

func (d *dependency) process() error {
	module, err := d.config.loader(d.url)
	if err != nil {
		return err
	}
	d.scope, err = scope.ModuleScope(module, nil)
	if err != nil {
		if derr, ok := err.(scope.ErrDuplicateDeclaration); ok {
			return fmt.Errorf("error processing scope in file %s: %w: %v", d.url, err, derr.Duplicate)
		}
		return fmt.Errorf("error processing scope in file %s: %w", d.url, err)
	}
	for _, li := range module.ModuleListItems {
		if li.ImportDeclaration != nil {
			durl, _ := javascript.Unquote(li.ImportDeclaration.FromClause.ModuleSpecifier.Data)
			iurl := d.RelTo(durl)
			e, err := d.addImport(iurl)
			if err != nil {
				return err
			}
			if li.ImportDeclaration.ImportClause == nil {
				continue
			}
			if li.ImportDeclaration.ImportedDefaultBinding != nil {
				d.setImportBinding(li.ImportDeclaration.ImportedDefaultBinding.Data, e, "default")
			}
			if li.ImportDeclaration.NameSpaceImport != nil {
				d.setImportBinding(li.ImportDeclaration.NameSpaceImport.Data, e, "*")
				d.config.statementList = append(d.config.statementList, javascript.StatementListItem{
					Declaration: &javascript.Declaration{
						LexicalDeclaration: &javascript.LexicalDeclaration{
							LetOrConst: javascript.Const,
							BindingList: []javascript.LexicalBinding{
								{
									BindingIdentifier: li.ImportDeclaration.NameSpaceImport,
									Initializer: &javascript.AssignmentExpression{
										ConditionalExpression: javascript.WrapConditional(javascript.UnaryExpression{
											UnaryOperators: []javascript.UnaryOperator{javascript.UnaryAwait},
											UpdateExpression: javascript.UpdateExpression{
												LeftHandSideExpression: &javascript.LeftHandSideExpression{
													CallExpression: &javascript.CallExpression{
														MemberExpression: &javascript.MemberExpression{
															PrimaryExpression: &javascript.PrimaryExpression{
																IdentifierReference: jToken("include"),
															},
														},
														Arguments: &javascript.Arguments{
															ArgumentList: []javascript.AssignmentExpression{
																{
																	ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																		Literal: jToken(strconv.Quote(iurl)),
																	}),
																},
																{
																	ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																		Literal: jToken("true"),
																	}),
																},
															},
														},
													},
												},
											},
										}),
									},
								},
							},
						},
					},
				})
			} else if li.ImportDeclaration.NamedImports != nil {
				for _, is := range li.ImportDeclaration.NamedImports.ImportList {
					tk := is.ImportedBinding
					if is.IdentifierName != nil {
						tk = is.IdentifierName
					}
					d.setImportBinding(is.ImportedBinding.Data, e, tk.Data)
				}
			}
		} else if li.StatementListItem != nil {
			d.config.statementList = append(d.config.statementList, *li.StatementListItem)
		} else if li.ExportDeclaration != nil {
			ed := li.ExportDeclaration
			if ed.FromClause != nil {
				durl, _ := javascript.Unquote(ed.FromClause.ModuleSpecifier.Data)
				e, err := d.addImport(d.RelTo(durl))
				if err != nil {
					return err
				}
				if ed.ExportClause != nil {
					for _, es := range ed.ExportClause.ExportList {
						tk := es.IdentifierName.Data
						if es.EIdentifierName != nil {
							tk = es.EIdentifierName.Data
						}
						d.setExportBinding(tk, e, es.IdentifierName.Data)
					}
				} else if ed.ExportFromClause != nil {
					d.setExportBinding(ed.ExportFromClause.Data, e, "")
				} else {
					d.config.exportAllFrom = append(d.config.exportAllFrom, [2]*dependency{d, e})
				}
			} else if ed.ExportClause != nil {
				for _, es := range ed.ExportClause.ExportList {
					tk := es.IdentifierName.Data
					if es.EIdentifierName != nil {
						tk = es.EIdentifierName.Data
					}
					d.setExportBinding(tk, nil, es.IdentifierName.Data)
				}
			} else if ed.VariableStatement != nil {
				for _, vd := range ed.VariableStatement.VariableDeclarationList {
					d.processBindingElement(vd.BindingIdentifier, vd.ArrayBindingPattern, vd.ObjectBindingPattern)
				}
				d.config.statementList = append(d.config.statementList, javascript.StatementListItem{
					Statement: &javascript.Statement{
						VariableStatement: ed.VariableStatement,
					},
				})
			} else if ed.Declaration != nil {
				if ed.Declaration.FunctionDeclaration != nil {
					d.setExportBinding(ed.Declaration.FunctionDeclaration.BindingIdentifier.Data, nil, ed.Declaration.FunctionDeclaration.BindingIdentifier.Data)
				} else if ed.Declaration.ClassDeclaration != nil {
					d.setExportBinding(ed.Declaration.ClassDeclaration.BindingIdentifier.Data, nil, ed.Declaration.ClassDeclaration.BindingIdentifier.Data)
				} else if ed.Declaration.LexicalDeclaration != nil {
					for _, lb := range ed.Declaration.LexicalDeclaration.BindingList {
						d.processBindingElement(lb.BindingIdentifier, lb.ArrayBindingPattern, lb.ObjectBindingPattern)
					}
				}
				d.config.statementList = append(d.config.statementList, javascript.StatementListItem{
					Declaration: ed.Declaration,
				})
			} else {
				def := jToken("default")
				if ed.DefaultFunction != nil {
					if ed.DefaultFunction.BindingIdentifier == nil {
						ed.DefaultFunction.BindingIdentifier = def
					} else {
						def = ed.DefaultFunction.BindingIdentifier
					}
					d.config.statementList = append(d.config.statementList, javascript.StatementListItem{
						Declaration: &javascript.Declaration{
							FunctionDeclaration: ed.DefaultFunction,
						},
					})
				} else if ed.DefaultClass != nil {
					if ed.DefaultClass.BindingIdentifier == nil {
						ed.DefaultClass.BindingIdentifier = def
					} else {
						def = ed.DefaultClass.BindingIdentifier
					}
					d.config.statementList = append(d.config.statementList, javascript.StatementListItem{
						Declaration: &javascript.Declaration{
							ClassDeclaration: ed.DefaultClass,
						},
					})
				} else if ed.DefaultAssignmentExpression != nil {
					d.config.statementList = append(d.config.statementList, javascript.StatementListItem{
						Declaration: &javascript.Declaration{
							LexicalDeclaration: &javascript.LexicalDeclaration{
								LetOrConst: javascript.Const,
								BindingList: []javascript.LexicalBinding{
									{
										BindingIdentifier: def,
										Initializer:       ed.DefaultAssignmentExpression,
									},
								},
							},
						},
					})
				}
				d.scope.Bindings["default"] = []scope.Binding{
					{
						BindingType: scope.BindingLexicalConst,
						Token:       def,
					},
				}
				d.setExportBinding("default", nil, "default")
			}
		}
	}
	if d.needsMeta {
		d.config.statementList[1].Declaration.LexicalDeclaration.BindingList = append(d.config.statementList[1].Declaration.LexicalDeclaration.BindingList, javascript.LexicalBinding{
			BindingIdentifier: jToken(d.prefix + "import"),
			Initializer: &javascript.AssignmentExpression{
				ConditionalExpression: javascript.WrapConditional(&javascript.ObjectLiteral{
					PropertyDefinitionList: []javascript.PropertyDefinition{
						{
							PropertyName: &javascript.PropertyName{
								LiteralPropertyName: jToken("url"),
							},
							AssignmentExpression: &javascript.AssignmentExpression{
								ConditionalExpression: javascript.WrapConditional(&javascript.AdditiveExpression{
									AdditiveExpression: &javascript.AdditiveExpression{
										MultiplicativeExpression: javascript.MultiplicativeExpression{
											ExponentiationExpression: javascript.ExponentiationExpression{
												UnaryExpression: javascript.UnaryExpression{
													UpdateExpression: javascript.UpdateExpression{
														LeftHandSideExpression: &javascript.LeftHandSideExpression{
															NewExpression: &javascript.NewExpression{
																MemberExpression: javascript.MemberExpression{
																	PrimaryExpression: &javascript.PrimaryExpression{
																		IdentifierReference: jToken("o"),
																	},
																},
															},
														},
													},
												},
											},
										},
									},
									AdditiveOperator: javascript.AdditiveAdd,
									MultiplicativeExpression: javascript.MultiplicativeExpression{
										ExponentiationExpression: javascript.ExponentiationExpression{
											UnaryExpression: javascript.UnaryExpression{
												UpdateExpression: javascript.UpdateExpression{
													LeftHandSideExpression: &javascript.LeftHandSideExpression{
														NewExpression: &javascript.NewExpression{
															MemberExpression: javascript.MemberExpression{
																PrimaryExpression: &javascript.PrimaryExpression{
																	Literal: jToken(strconv.Quote(d.url)),
																},
															},
														},
													},
												},
											},
										},
									},
								}),
							},
						},
					},
				}),
			},
		})
	}
	d.processBindings(d.scope)
	if d.config.parseDynamic {
		if err := walk.Walk(module, d); err != nil {
			return err
		}
	}
	return nil
}

func (d *dependency) Handle(t javascript.Type) error {
	if ce, ok := t.(*javascript.CallExpression); ok && isConditionalExpression(ce.ImportCall) {
		d.HandleImportConditional(ce.ImportCall.ConditionalExpression)
		ce.MemberExpression = &javascript.MemberExpression{
			PrimaryExpression: &javascript.PrimaryExpression{
				IdentifierReference: jToken("include"),
			},
		}
		ce.Arguments = &javascript.Arguments{
			ArgumentList: []javascript.AssignmentExpression{
				*ce.ImportCall,
			},
		}
		ce.ImportCall = nil
	} else if ok && ce.MemberExpression != nil && ce.MemberExpression.PrimaryExpression != nil && ce.MemberExpression.PrimaryExpression.IdentifierReference != nil && ce.MemberExpression.PrimaryExpression.IdentifierReference.Data == "include" && ce.MemberExpression.MemberExpression == nil && ce.MemberExpression.Expression == nil && ce.MemberExpression.IdentifierName == nil && ce.MemberExpression.TemplateLiteral == nil && !ce.MemberExpression.SuperProperty && !ce.MemberExpression.NewTarget && !ce.MemberExpression.ImportMeta && ce.MemberExpression.Arguments == nil && !ce.SuperCall && ce.ImportCall == nil && ce.Arguments != nil && ce.Expression == nil && ce.IdentifierName == nil && ce.TemplateLiteral == nil && len(ce.Arguments.ArgumentList) == 1 {
		d.HandleImportConditional(ce.Arguments.ArgumentList[0].ConditionalExpression)
	} else if d.config != nil {
		if me, ok := t.(*javascript.MemberExpression); ok && me.ImportMeta {
			d.needsMeta = true
			me.PrimaryExpression = &javascript.PrimaryExpression{
				IdentifierReference: jToken(d.prefix + "import"),
			}
			me.ImportMeta = false
		}
	}
	return walk.Walk(t, d)
}

func (d *dependency) HandleImportConditional(ce *javascript.ConditionalExpression) {
	if ce.True != nil && ce.False != nil {
		if isConditionalExpression(ce.True) {
			d.HandleImportConditional(ce.True.ConditionalExpression)
		}
		if isConditionalExpression(ce.False) {
			d.HandleImportConditional(ce.False.ConditionalExpression)
		}
	} else if pe, ok := javascript.UnwrapConditional(ce).(*javascript.PrimaryExpression); ok && pe.Literal != nil && pe.Literal.Type == javascript.TokenStringLiteral {
		durl, _ := javascript.Unquote(pe.Literal.Data)
		iurl := d.RelTo(durl)
		pe.Literal.Data = strconv.Quote(iurl)
		if d.config != nil {
			d.addImport(iurl)
			d.dynamicRequirement = true
		}
	}
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
	return ae != nil && ae.ConditionalExpression != nil && ae.Yield == false && ae.Delegate == false && (ae.AssignmentOperator == javascript.AssignmentNone || ae.AssignmentOperator == javascript.AssignmentAssign)
}

func (d *dependency) processArrayBinding(binding *javascript.ArrayBindingPattern) {
	for _, be := range binding.BindingElementList {
		d.processBindingElement(be.SingleNameBinding, be.ArrayBindingPattern, be.ObjectBindingPattern)
	}
	if binding.BindingRestElement != nil {
		d.processBindingElement(binding.BindingRestElement.SingleNameBinding, binding.BindingRestElement.ArrayBindingPattern, binding.BindingRestElement.ObjectBindingPattern)
	}
}

func (d *dependency) processObjectBinding(binding *javascript.ObjectBindingPattern) {
	for _, be := range binding.BindingPropertyList {
		d.processBindingElement(be.BindingElement.SingleNameBinding, be.BindingElement.ArrayBindingPattern, be.BindingElement.ObjectBindingPattern)
	}
	if binding.BindingRestProperty != nil {
		d.setExportBinding(binding.BindingRestProperty.Data, nil, binding.BindingRestProperty.Data)
	}
}

func (d *dependency) processBindingElement(snb *javascript.Token, abp *javascript.ArrayBindingPattern, obp *javascript.ObjectBindingPattern) {
	if snb != nil {
		d.setExportBinding(snb.Data, nil, snb.Data)
	} else if abp != nil {
		d.processArrayBinding(abp)
	} else if obp != nil {
		d.processObjectBinding(obp)
	}
}

func (d *dependency) resolveExport(binding string) *scope.Binding {
	export, ok := d.exports[binding]
	if !ok {
		return nil
	}
	if export.dependency != nil {
		return export.dependency.resolveExport(export.binding)
	}
	imp, ok := d.imports[export.binding]
	if ok {
		return imp.dependency.resolveExport(imp.binding)
	}
	sc, ok := d.scope.Bindings[export.binding]
	if !ok || len(sc) == 0 {
		return nil
	}
	return &sc[0]
}

func (d *dependency) resolveImports() error {
	if d.done {
		return nil
	}
	d.done = true
	for _, r := range d.requires {
		if err := r.resolveImports(); err != nil {
			return err
		}
	}
	for name, binding := range d.imports {
		if binding.binding == "*" {
			continue
		}
		b := binding.dependency.resolveExport(binding.binding)
		if b == nil {
			return fmt.Errorf("error resolving import (%s): %w", d.url, ErrInvalidExport)
		}
		for _, c := range d.scope.Bindings[name] {
			c.Data = b.Data
		}
	}
	return nil
}

func (d *dependency) processBindings(s *scope.Scope) {
	for name, bindings := range s.Bindings {
		if len(bindings) == 0 || bindings[0].BindingType == scope.BindingRef || bindings[0].BindingType == scope.BindingBare || bindings[0].BindingType == scope.BindingImport {
			continue
		}
		for n := range bindings {
			bindings[n].Data = d.prefix + name
		}
	}
	for _, cs := range s.Scopes {
		d.processBindings(cs)
	}
}

// Errors
var (
	ErrInvalidExport = errors.New("invalid export")
)
