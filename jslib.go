package jslib

import (
	"errors"
	"os"
	"path/filepath"
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

func OSLoad(base string) func(url string) (*javascript.Module, error) {
	return func(url string) (*javascript.Module, error) {
		f, err := os.Open(filepath.Join(base, filepath.FromSlash(url)))
		if err != nil {
			if os.IsNotExist(err) && !strings.HasSuffix(url, jsSuffix) {
				f, err = os.Open(filepath.Join(base, filepath.FromSlash(url)+".js"))
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

func Package(opts ...Option) (*javascript.Script, error) {
	c := config{
		statementList: make([]javascript.StatementListItem, 1),
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
	c.dependency.resolveImports()
	if err := c.makeLoader(); err != nil {
		return nil, err
	}
	return &javascript.Script{
		StatementList: c.statementList,
	}, nil
}

func Plugin(m *javascript.Module, url string) (*javascript.Script, error) {
	statementList := make([]javascript.StatementListItem, 0, len(m.ModuleListItems))
	for _, li := range m.ModuleListItems {
		if li.ImportDeclaration != nil {
			awic := javascript.AssignmentExpression{
				ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
					ImportCall: &javascript.AssignmentExpression{
						ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
							Literal: li.ImportDeclaration.FromClause.ModuleSpecifier,
						}),
					},
				}),
			}
			awic.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UnaryOperators = []javascript.UnaryOperator{javascript.UnaryAwait}
			if ic := li.ImportDeclaration.ImportClause; ic == nil {
				statementList = append(statementList, javascript.StatementListItem{
					Statement: &javascript.Statement{
						ExpressionStatement: &javascript.Expression{
							Expressions: []javascript.AssignmentExpression{awic},
						},
					},
				})
			} else {
				var bpl []javascript.BindingProperty
				if ic.NamedImports != nil {
					if ic.ImportedDefaultBinding != nil {
						bpl = make([]javascript.BindingProperty, 1, len(ic.NamedImports.ImportList)+1)
						bpl[0].PropertyName.LiteralPropertyName = &javascript.Token{Token: parser.Token{Data: "default"}}
						bpl[0].BindingElement.SingleNameBinding = ic.ImportedDefaultBinding
					}
					for _, is := range ic.NamedImports.ImportList {
						tk := is.ImportedBinding
						if is.IdentifierName != nil {
							tk = is.IdentifierName
						}
						bpl = append(bpl, javascript.BindingProperty{
							PropertyName: javascript.PropertyName{
								LiteralPropertyName: tk,
							},
							BindingElement: javascript.BindingElement{
								SingleNameBinding: is.ImportedBinding,
							},
						})
					}
				} else if ic.ImportedDefaultBinding != nil {
					bpl = []javascript.BindingProperty{
						{
							PropertyName: javascript.PropertyName{
								LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "default"}},
							},
							BindingElement: javascript.BindingElement{
								SingleNameBinding: ic.ImportedDefaultBinding,
							},
						},
					}
				}
				bl := make([]javascript.LexicalBinding, 0, 2)
				if len(bpl) > 0 {
					bl = append(bl, javascript.LexicalBinding{
						ObjectBindingPattern: &javascript.ObjectBindingPattern{
							BindingPropertyList: bpl,
						},
						Initializer: &awic,
					})
				}
				if ic.NameSpaceImport != nil {
					bl = append(bl, javascript.LexicalBinding{
						BindingIdentifier: ic.NameSpaceImport,
						Initializer:       &awic,
					})
				}
				if len(bl) > 0 {
					statementList = append(statementList, javascript.StatementListItem{
						Declaration: &javascript.Declaration{
							LexicalDeclaration: &javascript.LexicalDeclaration{
								LetOrConst:  javascript.Const,
								BindingList: bl,
							},
						},
					})
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
	scope, err := scope.ModuleScope(m, nil)
	if err != nil {
		return nil, err
	}
	d := dependency{
		url:    url,
		prefix: "_",
	}
	d.processBindings(scope)
	walk.Walk(m, &d)
	return &javascript.Script{
		StatementList: statementList,
	}, nil
}

var (
	ErrNoFiles    = errors.New("no files")
	ErrInvalidURL = errors.New("added files must be absolute URLs")
)
