package main

import (
	"flag"
	"fmt"
	"os"
	"path"
	"path/filepath"

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
	base += "/"
	if err != nil {
		return errors.WithContext("error getting absolute path for base: %s\n", err)
	}
	var main fileDep
	files := make(map[string]*fileDep, len(os.Args))
	for _, i := range filesTodo {
		if i == "-" {
			i = inputName
		}
		if _, ok := files[i]; ok {
			return errors.Error("duplicate file")
		}
		fd := &fileDep{
			url: i,
		}
		files[i] = fd
		main.AddDependency(fd)
	}
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
		if err != nil {
			return errors.WithContext(fmt.Sprintf("error parsing file %q: ", name), err)
		}
		statementList := make([]javascript.StatementListItem, 0, len(p.ModuleListItems)+1)
		for n := range p.ModuleListItems {
			if p.ModuleListItems[n].ImportDeclaration != nil {
				id := p.ModuleListItems[n].ImportDeclaration
				loc, _ := javascript.Unquote(id.ModuleSpecifier.Data) // TODO: make relative path
				gd, ok := files[loc]
				if !ok {
					gd = &fileDep{
						url: loc,
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
															Literal: id.FromClause.ModuleSpecifier, //TODO: change to relative path
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
			} else if p.ModuleListItems[n].StatementListItem != nil {
			}
			fd.buf = statementList
		}
		f.Close()
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
