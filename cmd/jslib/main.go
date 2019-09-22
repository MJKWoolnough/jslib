package main

import (
	"flag"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"strconv"
	"unsafe"

	"vimagination.zapto.org/errors"
	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

type fileDep struct {
	buf        []javascript.StatementListItem
	url        string
	Requires   []*fileDep
	RequiredBy []*fileDep
	written    bool
}

func (f *fileDep) AddDependency(g *fileDep) bool {
	if !f.checkDependency(g) {
		return false
	}
	f.Requires = append(f.Requires, g)
	g.RequiredBy = append(g.RequiredBy, f)
	return true
}

func (f *fileDep) checkDependency(g *fileDep) bool {
	for _, h := range f.RequiredBy {
		if h == g || !h.checkDependency(g) {
			return false
		}
	}
	return true
}

func (f *fileDep) add() {
	if f.written {
		return
	}
	f.written = true
	for _, r := range f.Requires {
		r.add()
	}
	if f.buf != nil {
		offer(f.url, f.buf)
	}
}

type Inputs []string

func (i *Inputs) Set(v string) error {
	*i = append(*i, v)
	return nil
}

func (i *Inputs) String() string {
	return ""
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	var (
		inputName, output, base string
		filesTodo               Inputs
		err                     error
	)

	flag.Var(&filesTodo, "i", "input file")
	flag.StringVar(&inputName, "n", "-", "input file name when using stdin")
	flag.StringVar(&output, "o", "-", "input file")
	flag.StringVar(&base, "b", "", "js base dir")
	flag.Parse()

	if len(filesTodo) == 0 {
		filesTodo = append(filesTodo, "-")
	}
	if output == "" {
		output = "-"
	}
	if base == "" {
		if output == "-" {
			base = "./"
		} else {
			base = path.Dir(output)
		}
	}
	base, err = filepath.Abs(base)
	if err != nil {
		return errors.WithContext("error getting absolute path for base: %s\n", err)
	}
	var main fileDep
	files := make(map[string]*fileDep, len(os.Args))
	for n, i := range filesTodo {
		if i == "-" {
			i = inputName
		}
		i, err = filepath.Abs(i)
		if err != nil {
			return errors.WithContext("error getting absolute path: ", err)
		}
		if filesTodo[n] == "-" {
			inputName = i
		} else {
			filesTodo[n] = i
		}
		if _, ok := files[i]; ok {
			return errors.Error("duplicate file")
		}
		url, err := filepath.Rel(base, i)
		if err != nil {
			return errors.WithContext("error getting relative path: ", err)
		}
		fd := &fileDep{
			url: filepath.ToSlash(url),
		}
		files[i] = fd
		main.AddDependency(fd)
	}
	imports := make([]*string, 0, 100)
	for len(filesTodo) > 0 {
		name := filesTodo[0]
		filesTodo = filesTodo[1:]
		var f *os.File
		if name == "-" {
			f = os.Stdin
			name = inputName
		} else {
			var err error
			f, err = os.Open(name)
			if err != nil {
				return errors.WithContext(fmt.Sprintf("error opening file %q: ", name), err)
			}
		}
		fd, ok := files[name]
		if !ok {
			fd = new(fileDep)
			files[name] = fd
		}
		p, err := javascript.ParseModule(parser.NewReaderTokeniser(f))
		f.Close()
		if err != nil {
			return errors.WithContext(fmt.Sprintf("error parsing file %q: ", name), err)
		}
		statementList := make([]javascript.StatementListItem, 0, len(p.ModuleListItems)+1)
		for n := range p.ModuleListItems {
			for _, im := range searchReplace(reflect.ValueOf(&p.ModuleListItems[n]), imports[:0]) {
				loc, err := javascript.Unquote(*im)
				if err != nil {
					return errors.WithContext("error unquoting import url: ", err)
				}
				loc = filepath.Join(filepath.Dir(name), loc)
				gd, ok := files[loc]
				if !ok {
					url, _ := filepath.Rel(base, loc)
					gd = &fileDep{
						url: filepath.ToSlash(url),
					}
					files[loc] = gd
					filesTodo = append(filesTodo, loc)
				}
				if !fd.AddDependency(gd) {
					return fmt.Errorf("circular reference with %s and %s\n", name, loc)
				}
				u := strconv.Quote(gd.url)
				*im = u
			}
			if p.ModuleListItems[n].ImportDeclaration != nil {
				id := p.ModuleListItems[n].ImportDeclaration
				loc, err := javascript.Unquote(id.ModuleSpecifier.Data)
				if err != nil {
					return errors.WithContext("error unquoting import url: ", err)
				}
				loc = filepath.Join(filepath.Dir(name), loc)
				gd, ok := files[loc]
				if !ok {
					url, _ := filepath.Rel(base, loc)
					gd = &fileDep{
						url: filepath.ToSlash(url),
					}
					files[loc] = gd
					filesTodo = append(filesTodo, loc)
				}
				if !fd.AddDependency(gd) {
					return fmt.Errorf("circular reference with %s and %s\n", name, loc)
				}
				if id.ImportClause == nil {
					continue
				}
				obp := new(javascript.ObjectBindingPattern)
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
						ConditionalExpression: wrapLHS(&javascript.LeftHandSideExpression{
							CallExpression: &javascript.CallExpression{
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
											ConditionalExpression: wrapLHS(&javascript.LeftHandSideExpression{
												NewExpression: &javascript.NewExpression{
													MemberExpression: javascript.MemberExpression{
														PrimaryExpression: &javascript.PrimaryExpression{
															Literal: &javascript.Token{
																Token: parser.Token{
																	Type: javascript.TokenStringLiteral,
																	Data: strconv.Quote(gd.url),
																},
															},
														},
													},
												},
											}).ConditionalExpression,
										},
										{
											ConditionalExpression: wrapLHS(&javascript.LeftHandSideExpression{
												NewExpression: &javascript.NewExpression{
													MemberExpression: javascript.MemberExpression{
														PrimaryExpression: &javascript.PrimaryExpression{
															Literal: &javascript.Token{
																Token: parser.Token{
																	Type: javascript.TokenBooleanLiteral,
																	Data: "true",
																},
															},
														},
													},
												},
											}).ConditionalExpression,
										},
									},
								},
							},
						}).ConditionalExpression,
					},
				}
				if l := len(statementList); l == 0 || statementList[l-1].Declaration == nil || statementList[l-1].Declaration.LexicalDeclaration == nil || statementList[l-1].Declaration.LexicalDeclaration.LetOrConst != javascript.Const {
					statementList = append(statementList, javascript.StatementListItem{
						Declaration: &javascript.Declaration{
							LexicalDeclaration: &javascript.LexicalDeclaration{
								LetOrConst:  javascript.Const,
								BindingList: []javascript.LexicalBinding{lb},
							},
						},
					})
				} else {
					statementList[l-1].Declaration.LexicalDeclaration.BindingList = append(statementList[l-1].Declaration.LexicalDeclaration.BindingList, lb)
				}
			} else if p.ModuleListItems[n].ExportDeclaration != nil {
				ed := p.ModuleListItems[n].ExportDeclaration
				if ed.FromClause != nil || ed.ExportClause != nil {
					var url string
					if ed.FromClause != nil {
						loc, _ := javascript.Unquote(ed.FromClause.ModuleSpecifier.Data)
						loc = filepath.Join(filepath.Dir(name), loc)
						gd, ok := files[loc]
						if !ok {
							url, _ := filepath.Rel(base, loc)
							gd = &fileDep{
								url: filepath.ToSlash(url),
							}
							files[loc] = gd
							filesTodo = append(filesTodo, loc)
						}
						url = gd.url
						if !fd.AddDependency(gd) {
							return fmt.Errorf("circular reference with %s and %s\n", name, loc)
						}
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
							statementList = append(statementList, exportXFrom(url, mappings))
						} else {
							statementList = append(statementList, exportVar(mappings))
						}
					} else {
						statementList = append(statementList, exportFrom(url))
					}
				} else if ed.VariableStatement != nil || ed.Declaration != nil {
					if ed.VariableStatement != nil {
						statementList = append(statementList, javascript.StatementListItem{
							Statement: &javascript.Statement{
								VariableStatement: ed.VariableStatement,
							},
						})
					} else {
						statementList = append(statementList, javascript.StatementListItem{Declaration: ed.Declaration})
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
					statementList = append(statementList, ex(mappings))
				} else if ed.DefaultFunction != nil {
					statementList = append(statementList, exportDefault(wrapLHS(&javascript.LeftHandSideExpression{
						NewExpression: &javascript.NewExpression{
							MemberExpression: javascript.MemberExpression{
								PrimaryExpression: &javascript.PrimaryExpression{
									FunctionExpression: ed.DefaultFunction,
								},
							},
						},
					})))
				} else if ed.DefaultClass != nil {
					statementList = append(statementList, exportDefault(wrapLHS(&javascript.LeftHandSideExpression{
						NewExpression: &javascript.NewExpression{
							MemberExpression: javascript.MemberExpression{
								PrimaryExpression: &javascript.PrimaryExpression{
									ClassExpression: ed.DefaultClass,
								},
							},
						},
					})))
				} else if ed.DefaultAssignmentExpression != nil {
					statementList = append(statementList, exportDefault(*ed.DefaultAssignmentExpression))
				}
			} else if p.ModuleListItems[n].StatementListItem != nil {
				statementList = append(statementList, *p.ModuleListItems[n].StatementListItem)
			}
		}
		fd.buf = statementList
	}

	main.add()

	var f *os.File

	if output == "-" {
		f = os.Stdout
	} else {
		var err error
		f, err = os.Create(output)
		if err != nil {
			return errors.WithContext(fmt.Sprintf("error creating file %q: ", output), err)
		}
	}
	if _, err := fmt.Fprintf(f, "%+s", loader); err != nil {
		return errors.WithContext("error writing file: ", err)
	}
	if err = f.Close(); err != nil {
		return errors.WithContext("error closing file: ", err)
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

var callExpression = reflect.TypeOf(&javascript.CallExpression{})

func searchReplace(v reflect.Value, imports []*string) []*string {
	if v.Type() == callExpression {
		ce := v.Interface().(*javascript.CallExpression)
		var ae *javascript.AssignmentExpression
		if ce.MemberExpression != nil && ce.Arguments != nil && len(ce.Arguments.ArgumentList) == 1 && ce.Arguments.SpreadArgument == nil {
			if ce.MemberExpression.PrimaryExpression != nil && ce.MemberExpression.PrimaryExpression.IdentifierReference != nil && ce.MemberExpression.PrimaryExpression.IdentifierReference.Data == "include" || ce.MemberExpression.MemberExpression != nil && ce.MemberExpression.MemberExpression.PrimaryExpression != nil && ce.MemberExpression.MemberExpression.PrimaryExpression.IdentifierReference != nil && ce.MemberExpression.MemberExpression.PrimaryExpression.IdentifierReference.Data == "window" && (ce.MemberExpression.IdentifierName != nil && ce.MemberExpression.IdentifierName.Data == "include" || ce.MemberExpression.Expression != nil && ce.MemberExpression.Expression.Expressions[len(ce.MemberExpression.Expression.Expressions)-1].AssignmentExpression != nil && *aeAsString(ce.MemberExpression.Expression.Expressions[len(ce.MemberExpression.Expression.Expressions)-1].AssignmentExpression) == "\"include\"") {
				ae = ce.Arguments.ArgumentList[0].AssignmentExpression
			}
		} else if ce.ImportCall != nil {
			*ce = javascript.CallExpression{
				MemberExpression: &javascript.MemberExpression {
					MemberExpression: &javascript.MemberExpression {
						PrimaryExpression: &javascript.PrimaryExpression {
							IdentifierReference: &javascript.Token {
								Token: parser.Token {
									Type: javascript.TokenIdentifier,
									Data: "window",
								},
							},
						},
					},
					IdentifierName: &javascript.Token {
						Token: parser.Token {
							Type: javascript.TokenIdentifier,
							Data: "include",
						},
					},
				},
				Arguments: &javascript.Arguments{
					ArgumentList: []javascript.AssignmentExpression{
						*ce.ImportCall,
					},
				},
			}
			ae = ce.Arguments.ArgumentList[0].AssignmentExpression
		}
		if ae != nil {
			if str := aeAsString(ae); str != nil {
				return append(imports, str)
			}
		}
	}
	switch v.Kind() {
	case reflect.Ptr:
		if !v.IsZero() {
			return searchReplace(v.Elem(), imports)
		}
	case reflect.Slice:
		for i := 0; i < v.Len(); i++ {
			imports = searchReplace(v.Index(i), imports)
		}
	case reflect.Struct:
		for i := 0; i < v.NumField()-1; i++ {
			imports = searchReplace(v.Field(i), imports)
		}
	}
	return imports
}

func aeAsString(ae *javascript.AssignmentExpression) *string {
	if ae != nil && ae.ConditionalExpression != nil && ae.ConditionalExpression.True == nil && ae.ConditionalExpression.LogicalORExpression.LogicalORExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.LogicalANDExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseORExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseXORExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.BitwiseANDExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.EqualityExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.RelationalExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.ShiftExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.AdditiveExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.MultiplicativeExpression == nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.ExponentiationExpression == nil && len(ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UnaryOperators) == 0 && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.LeftHandSideExpression != nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.UpdateOperator == 0 && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.LeftHandSideExpression.NewExpression != nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.LeftHandSideExpression.NewExpression.MemberExpression.PrimaryExpression != nil && ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.LeftHandSideExpression.NewExpression.MemberExpression.PrimaryExpression.Literal != nil {
		return &ae.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.LeftHandSideExpression.NewExpression.MemberExpression.PrimaryExpression.Literal.Data
	}
	return nil
}
