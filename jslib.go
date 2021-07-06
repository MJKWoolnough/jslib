// Package jslib is a javascript packer and library for javascript projects
package jslib

import (
	"errors"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/javascript/scope"
	"vimagination.zapto.org/javascript/walk"
	"vimagination.zapto.org/parser"
)

type config struct {
	filesToDo     []string
	filesDone     map[string]*dependency
	loader        func(string) (*javascript.Module, error)
	bare          bool
	parseDynamic  bool
	currURL       string
	nextID        uint
	exportAllFrom [][2]*dependency
	statementList []javascript.StatementListItem
	dependency
}

const jsSuffix = ".js"

// OSLoad is the default loader for Package, with the base set to CWD
func OSLoad(base string) func(string) (*javascript.Module, error) {
	return func(urlPath string) (*javascript.Module, error) {
		f, err := os.Open(filepath.Join(base, filepath.FromSlash(urlPath)))
		if err != nil {
			if os.IsNotExist(err) {
				if u, errr := url.Parse(urlPath); errr == nil {
					if u.Path != urlPath {
						f, err = os.Open(filepath.Join(base, filepath.FromSlash(u.Path)))
					}
					if err != nil && !strings.HasSuffix(u.Path, jsSuffix) {
						u.Path += jsSuffix
						f, err = os.Open(filepath.Join(base, u.String()))
						if err != nil {
							f, err = os.Open(filepath.Join(base, u.Path))
						}
					}
				}
			}
			if err != nil {
				return nil, err
			}
		}
		m, err := javascript.ParseModule(parser.NewReaderTokeniser(f))
		f.Close()
		return m, err
	}
}

// Package packages up multiple javascript modules into a single file, renaming
// bindings to simulate imports
func Package(opts ...Option) (*javascript.Script, error) {
	c := config{
		statementList: make([]javascript.StatementListItem, 2),
		filesDone:     make(map[string]*dependency),
		dependency: dependency{
			requires: make(map[string]*dependency),
		},
	}
	if c.loader == nil {
		base, err := os.Getwd()
		if err != nil {
			return nil, err
		}
		c.loader = OSLoad(base)
	}
	c.config = &c
	for _, o := range opts {
		o(&c)
	}
	if len(c.filesToDo) == 0 {
		return nil, ErrNoFiles
	}
	c.statementList[1].Declaration = &javascript.Declaration{
		LexicalDeclaration: &javascript.LexicalDeclaration{
			LetOrConst: javascript.Const,
			BindingList: []javascript.LexicalBinding{
				{
					BindingIdentifier: Token("o"),
					Initializer: &javascript.AssignmentExpression{
						ConditionalExpression: javascript.WrapConditional(javascript.MemberExpression{
							MemberExpression: &javascript.MemberExpression{
								PrimaryExpression: &javascript.PrimaryExpression{
									IdentifierReference: Token("location"),
								},
							},
							IdentifierName: Token("origin"),
						}),
					},
				},
			},
		},
	}
	for _, url := range c.filesToDo {
		if !strings.HasPrefix(url, "/") {
			return nil, ErrInvalidURL
		}
		if _, err := c.dependency.addImport(c.dependency.RelTo(url)); err != nil {
			return nil, err
		}
	}
	for changed := true; changed; {
		changed = false
		for _, eaf := range c.exportAllFrom {
			for export := range eaf[1].exports {
				if export == "default" {
					continue
				}
				if _, ok := eaf[0].exports[export]; !ok {
					eaf[0].exports[export] = &importBinding{
						dependency: eaf[1],
						binding:    export,
					}
					changed = true
				}
			}
		}
	}
	if err := c.dependency.resolveImports(); err != nil {
		return nil, err
	}
	if err := c.makeLoader(); err != nil {
		return nil, err
	}
	if len(c.statementList[1].Declaration.LexicalDeclaration.BindingList) == 1 {
		c.statementList[1] = c.statementList[0]
		c.statementList = c.statementList[1:]
	}
	return &javascript.Script{
		StatementList: c.statementList,
	}, nil
}

// Plugin converts a single javascript module to make use of the processed
// exports from package
func Plugin(m *javascript.Module, url string) (*javascript.Script, error) {
	if !strings.HasPrefix(url, "/") {
		return nil, ErrInvalidURL
	}
	var (
		imports              = uint(0)
		importURLs           = make(map[string]string)
		importBindings       = make(importBindingMap)
		importObjectBindings []javascript.BindingElement
		importURLsArray      []javascript.AssignmentExpression
		statementList        = make([]javascript.StatementListItem, 1, len(m.ModuleListItems))
		d                    = dependency{
			url:    url,
			prefix: "_",
		}
	)
	scope, err := scope.ModuleScope(m, nil)
	if err != nil {
		return nil, err
	}
	for _, li := range m.ModuleListItems {
		if li.ImportDeclaration != nil {
			id := li.ImportDeclaration
			durl, _ := javascript.Unquote(id.ModuleSpecifier.Data)
			iurl := d.RelTo(durl)
			ib, ok := importURLs[iurl]
			if !ok {
				imports++
				ib = id2String(imports)
				importURLs[iurl] = ib
				importURLsArray = append(importURLsArray, javascript.AssignmentExpression{
					ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
						Literal: Token(strconv.Quote(iurl)),
					}),
				})
				importObjectBindings = append(importObjectBindings, javascript.BindingElement{
					SingleNameBinding: Token(ib),
				})
			}
			if id.ImportClause != nil {
				if id.NameSpaceImport != nil {
					for _, binding := range scope.Bindings[li.ImportDeclaration.NameSpaceImport.Data] {
						binding.Data = ib
					}
				}
				if id.ImportedDefaultBinding != nil {
					importBindings[id.ImportedDefaultBinding.Data] = javascript.MemberExpression{
						MemberExpression: &javascript.MemberExpression{
							PrimaryExpression: &javascript.PrimaryExpression{
								IdentifierReference: Token(ib),
							},
						},
						IdentifierName: Token("default"),
					}
				}
				if id.NamedImports != nil {
					for _, is := range id.NamedImports.ImportList {
						tk := is.ImportedBinding
						if is.IdentifierName != nil {
							tk = is.IdentifierName
						}
						importBindings[is.ImportedBinding.Data] = javascript.MemberExpression{
							MemberExpression: &javascript.MemberExpression{
								PrimaryExpression: &javascript.PrimaryExpression{
									IdentifierReference: Token(ib),
								},
							},
							IdentifierName: tk,
						}
					}
				}
			}
		} else if li.StatementListItem != nil {
			statementList = append(statementList, *li.StatementListItem)
		} else if li.ExportDeclaration != nil {
			ed := li.ExportDeclaration
			if ed.VariableStatement != nil {
				statementList = append(statementList, javascript.StatementListItem{
					Statement: &javascript.Statement{
						VariableStatement: ed.VariableStatement,
					},
				})
			} else if ed.Declaration != nil {
				statementList = append(statementList, javascript.StatementListItem{
					Declaration: ed.Declaration,
				})
			} else if ed.DefaultFunction != nil {
				if ed.DefaultFunction.BindingIdentifier != nil {
					statementList = append(statementList, javascript.StatementListItem{
						Declaration: &javascript.Declaration{
							FunctionDeclaration: ed.DefaultFunction,
						},
					})
				}
			} else if ed.DefaultClass != nil {
				if ed.DefaultClass.BindingIdentifier != nil {
					statementList = append(statementList, javascript.StatementListItem{
						Declaration: &javascript.Declaration{
							ClassDeclaration: ed.DefaultClass,
						},
					})
				}
			} else if ed.DefaultAssignmentExpression != nil {
				statementList = append(statementList, javascript.StatementListItem{
					Statement: &javascript.Statement{
						ExpressionStatement: &javascript.Expression{
							Expressions: []javascript.AssignmentExpression{
								*ed.DefaultAssignmentExpression,
							},
						},
					},
				})
			}
		}
	}
	d.processBindings(scope)
	if imports == 0 {
		statementList = statementList[1:]
	} else if imports == 1 {
		statementList[0] = javascript.StatementListItem{
			Declaration: &javascript.Declaration{
				LexicalDeclaration: &javascript.LexicalDeclaration{
					LetOrConst: javascript.Const,
					BindingList: []javascript.LexicalBinding{
						{
							BindingIdentifier: importObjectBindings[0].SingleNameBinding,
							Initializer: &javascript.AssignmentExpression{
								ConditionalExpression: javascript.WrapConditional(&javascript.UnaryExpression{
									UnaryOperators: []javascript.UnaryOperator{javascript.UnaryAwait},
									UpdateExpression: javascript.UpdateExpression{
										LeftHandSideExpression: &javascript.LeftHandSideExpression{
											CallExpression: &javascript.CallExpression{
												MemberExpression: &javascript.MemberExpression{
													PrimaryExpression: &javascript.PrimaryExpression{
														IdentifierReference: Token("include"),
													},
												},
												Arguments: &javascript.Arguments{
													ArgumentList: importURLsArray,
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
		}
	} else {
		statementList[0] = javascript.StatementListItem{
			Declaration: &javascript.Declaration{
				LexicalDeclaration: &javascript.LexicalDeclaration{
					LetOrConst: javascript.Const,
					BindingList: []javascript.LexicalBinding{
						{
							ArrayBindingPattern: &javascript.ArrayBindingPattern{
								BindingElementList: importObjectBindings,
							},
							Initializer: &javascript.AssignmentExpression{
								ConditionalExpression: javascript.WrapConditional(&javascript.UnaryExpression{
									UnaryOperators: []javascript.UnaryOperator{javascript.UnaryAwait},
									UpdateExpression: javascript.UpdateExpression{
										LeftHandSideExpression: &javascript.LeftHandSideExpression{
											CallExpression: &javascript.CallExpression{
												MemberExpression: &javascript.MemberExpression{
													MemberExpression: &javascript.MemberExpression{
														PrimaryExpression: &javascript.PrimaryExpression{
															IdentifierReference: Token("Promise"),
														},
													},
													IdentifierName: Token("all"),
												},
												Arguments: &javascript.Arguments{
													ArgumentList: []javascript.AssignmentExpression{
														{
															ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																MemberExpression: &javascript.MemberExpression{
																	MemberExpression: &javascript.MemberExpression{
																		PrimaryExpression: &javascript.PrimaryExpression{
																			ArrayLiteral: &javascript.ArrayLiteral{
																				ElementList: importURLsArray,
																			},
																		},
																	},
																	IdentifierName: Token("map"),
																},
																Arguments: &javascript.Arguments{
																	ArgumentList: []javascript.AssignmentExpression{
																		{
																			ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																				IdentifierReference: Token("include"),
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
									},
								}),
							},
						},
					},
				},
			},
		}
	}
	s := &javascript.Script{
		StatementList: statementList,
	}
	walk.Walk(s, &d)
	walk.Walk(s, importBindings)
	return s, nil
}

type importBindingMap map[string]javascript.MemberExpression

func (i importBindingMap) Handle(t javascript.Type) error {
	if me, ok := t.(*javascript.MemberExpression); ok && me.PrimaryExpression != nil && me.PrimaryExpression.IdentifierReference != nil {
		if nme, ok := i[me.PrimaryExpression.IdentifierReference.Data]; ok {
			*me = nme
			return nil
		}
	}
	return walk.Walk(t, i)
}

// Errors
var (
	ErrNoFiles    = errors.New("no files")
	ErrInvalidURL = errors.New("added files must be absolute URLs")
)
