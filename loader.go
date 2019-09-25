package jslib

import (
	"strconv"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

var (
	loader *javascript.Module
	array  *javascript.ArrayLiteral
)

func offer(url string, body []javascript.StatementListItem) javascript.AssignmentExpression {
	return wrapLHS(&javascript.LeftHandSideExpression{
		NewExpression: &javascript.NewExpression{
			MemberExpression: javascript.MemberExpression{
				PrimaryExpression: &javascript.PrimaryExpression{
					ArrayLiteral: &javascript.ArrayLiteral{
						ElementList: []javascript.AssignmentExpression{
							wrapLHS(&javascript.LeftHandSideExpression{
								NewExpression: &javascript.NewExpression{
									MemberExpression: javascript.MemberExpression{
										PrimaryExpression: &javascript.PrimaryExpression{
											Literal: &javascript.Token{
												Token: parser.Token{
													Type: javascript.TokenStringLiteral,
													Data: strconv.Quote(url),
												},
											},
										},
									},
								},
							}),
							wrapLHS(&javascript.LeftHandSideExpression{
								NewExpression: &javascript.NewExpression{
									MemberExpression: javascript.MemberExpression{
										PrimaryExpression: &javascript.PrimaryExpression{
											FunctionExpression: &javascript.FunctionDeclaration{
												Type: javascript.FunctionGenerator,
												FunctionBody: javascript.Block{
													StatementList: body,
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
}

func makeElements(mappings map[string]javascript.AssignmentExpression) *javascript.AssignmentExpression {
	elements := make([]javascript.AssignmentExpression, 0, len(mappings))
	for n, m := range mappings {
		elements = append(elements, wrapLHS(&javascript.LeftHandSideExpression{
			NewExpression: &javascript.NewExpression{
				MemberExpression: javascript.MemberExpression{
					PrimaryExpression: &javascript.PrimaryExpression{
						ArrayLiteral: &javascript.ArrayLiteral{
							ElementList: []javascript.AssignmentExpression{
								wrapLHS(&javascript.LeftHandSideExpression{
									NewExpression: &javascript.NewExpression{
										MemberExpression: javascript.MemberExpression{
											PrimaryExpression: &javascript.PrimaryExpression{
												Literal: &javascript.Token{
													Token: parser.Token{
														Type: javascript.TokenStringLiteral,
														Data: strconv.Quote(n),
													},
												},
											},
										},
									},
								}),
								m,
							},
						},
					},
				},
			},
		}))
	}
	var arr javascript.AssignmentExpression
	if len(mappings) > 1 {
		arr = wrapLHS(&javascript.LeftHandSideExpression{
			NewExpression: &javascript.NewExpression{
				MemberExpression: javascript.MemberExpression{
					PrimaryExpression: &javascript.PrimaryExpression{
						ArrayLiteral: &javascript.ArrayLiteral{
							ElementList: elements,
						},
					},
				},
			},
		})
	} else {
		arr = elements[0]
	}
	return &arr
}

func exportFrom(url string) javascript.StatementListItem {
	ce := wrapLHS(&javascript.LeftHandSideExpression{
		CallExpression: &javascript.CallExpression{
			CallExpression: &javascript.CallExpression{
				CallExpression: &javascript.CallExpression{
					MemberExpression: &javascript.MemberExpression{
						MemberExpression: &javascript.MemberExpression{
							PrimaryExpression: &javascript.PrimaryExpression{
								IdentifierReference: &javascript.Token{
									Token: parser.Token{
										Type: javascript.TokenIdentifier,
										Data: "Object",
									},
								},
							},
						},
						IdentifierName: &javascript.Token{
							Token: parser.Token{
								Type: javascript.TokenIdentifier,
								Data: "getOwnPropertyDescriptors",
							},
						},
					},
					Arguments: &javascript.Arguments{
						ArgumentList: []javascript.AssignmentExpression{
							wrapLHS(&javascript.LeftHandSideExpression{
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
											wrapLHS(&javascript.LeftHandSideExpression{
												NewExpression: &javascript.NewExpression{
													MemberExpression: javascript.MemberExpression{
														PrimaryExpression: &javascript.PrimaryExpression{
															Literal: &javascript.Token{
																Token: parser.Token{
																	Type: javascript.TokenStringLiteral,
																	Data: strconv.Quote(url),
																},
															},
														},
													},
												},
											}),
											wrapLHS(&javascript.LeftHandSideExpression{
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
											}),
										},
									},
								},
							}),
						},
					},
				},
				IdentifierName: &javascript.Token{
					Token: parser.Token{
						Type: javascript.TokenIdentifier,
						Data: "filter",
					},
				},
			},
			Arguments: &javascript.Arguments{
				ArgumentList: []javascript.AssignmentExpression{
					{
						ArrowFunction: &javascript.ArrowFunction{
							CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
								ArrayBindingPattern: &javascript.ArrayBindingPattern{
									BindingElementList: []javascript.BindingElement{
										{
											SingleNameBinding: &javascript.Token{
												Token: parser.Token{
													Type: javascript.TokenIdentifier,
													Data: "key",
												},
											},
										},
									},
								},
							},
						},
						AssignmentExpression: &javascript.AssignmentExpression{
							ConditionalExpression: &javascript.ConditionalExpression{
								LogicalORExpression: javascript.LogicalORExpression{
									LogicalANDExpression: javascript.LogicalANDExpression{
										BitwiseORExpression: javascript.BitwiseORExpression{
											BitwiseXORExpression: javascript.BitwiseXORExpression{
												BitwiseANDExpression: javascript.BitwiseANDExpression{
													EqualityExpression: javascript.EqualityExpression{
														EqualityExpression: &wrapLHS(&javascript.LeftHandSideExpression{
															NewExpression: &javascript.NewExpression{
																MemberExpression: javascript.MemberExpression{
																	PrimaryExpression: &javascript.PrimaryExpression{
																		IdentifierReference: &javascript.Token{
																			Token: parser.Token{
																				Type: javascript.TokenIdentifier,
																				Data: "key",
																			},
																		},
																	},
																},
															},
														}).ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression,
														EqualityOperator: javascript.EqualityStrictNotEqual,
														RelationalExpression: wrapLHS(&javascript.LeftHandSideExpression{
															NewExpression: &javascript.NewExpression{
																MemberExpression: javascript.MemberExpression{
																	PrimaryExpression: &javascript.PrimaryExpression{
																		Literal: &javascript.Token{
																			Token: parser.Token{
																				Type: javascript.TokenStringLiteral,
																				Data: "\"default\"",
																			},
																		},
																	},
																},
															},
														}).ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression,
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	})
	return javascript.StatementListItem{
		Statement: &javascript.Statement{
			ExpressionStatement: &javascript.Expression{
				Expressions: []javascript.AssignmentExpression{
					{
						Yield:                true,
						Delegate:             true,
						AssignmentExpression: &ce,
					},
				},
			},
		},
	}
}

func exportXFrom(url string, mappings map[string]string) javascript.StatementListItem {
	elements := make(map[string]javascript.AssignmentExpression, len(mappings))
	for n, m := range mappings {
		elements[n] = wrapLHS(&javascript.LeftHandSideExpression{
			NewExpression: &javascript.NewExpression{
				MemberExpression: javascript.MemberExpression{
					MemberExpression: &javascript.MemberExpression{
						PrimaryExpression: &javascript.PrimaryExpression{
							IdentifierReference: &javascript.Token{
								Token: parser.Token{
									Type: javascript.TokenIdentifier,
									Data: "im",
								},
							},
						},
					},
					Expression: &javascript.Expression{
						Expressions: []javascript.AssignmentExpression{
							wrapLHS(&javascript.LeftHandSideExpression{
								NewExpression: &javascript.NewExpression{
									MemberExpression: javascript.MemberExpression{
										PrimaryExpression: &javascript.PrimaryExpression{
											Literal: &javascript.Token{
												Token: parser.Token{
													Type: javascript.TokenStringLiteral,
													Data: strconv.Quote(m),
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
		})
	}
	return javascript.StatementListItem{
		Statement: &javascript.Statement{
			BlockStatement: &javascript.Block{
				StatementList: []javascript.StatementListItem{
					{
						Declaration: &javascript.Declaration{
							LexicalDeclaration: &javascript.LexicalDeclaration{
								LetOrConst: javascript.Const,
								BindingList: []javascript.LexicalBinding{
									{
										BindingIdentifier: &javascript.Token{
											Token: parser.Token{
												Type: javascript.TokenIdentifier,
												Data: "im",
											},
										},
										Initializer: &javascript.AssignmentExpression{
											ConditionalExpression: wrapLHS(&javascript.LeftHandSideExpression{
												CallExpression: &javascript.CallExpression{
													MemberExpression: &javascript.MemberExpression{
														MemberExpression: &javascript.MemberExpression{
															PrimaryExpression: &javascript.PrimaryExpression{
																IdentifierReference: &javascript.Token{
																	Token: parser.Token{
																		Type: javascript.TokenIdentifier,
																		Data: "Object",
																	},
																},
															},
														},
														IdentifierName: &javascript.Token{
															Token: parser.Token{
																Type: javascript.TokenIdentifier,
																Data: "getOwnPropertyDescriptors",
															},
														},
													},
													Arguments: &javascript.Arguments{
														ArgumentList: []javascript.AssignmentExpression{
															wrapLHS(&javascript.LeftHandSideExpression{
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
																			wrapLHS(&javascript.LeftHandSideExpression{
																				NewExpression: &javascript.NewExpression{
																					MemberExpression: javascript.MemberExpression{
																						PrimaryExpression: &javascript.PrimaryExpression{
																							IdentifierReference: &javascript.Token{
																								Token: parser.Token{
																									Type: javascript.TokenIdentifier,
																									Data: strconv.Quote(url),
																								},
																							},
																						},
																					},
																				},
																			}),
																			wrapLHS(&javascript.LeftHandSideExpression{
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
																			}),
																		},
																	},
																},
															}),
														},
													},
												},
											}).ConditionalExpression,
										},
									},
								},
							},
						},
					},
					yield(elements),
				},
			},
		},
	}
}

func yield(elements map[string]javascript.AssignmentExpression) javascript.StatementListItem {
	return javascript.StatementListItem{
		Statement: &javascript.Statement{
			ExpressionStatement: &javascript.Expression{
				Expressions: []javascript.AssignmentExpression{
					{
						Yield:                true,
						Delegate:             len(elements) > 1,
						AssignmentExpression: makeElements(elements),
					},
				},
			},
		},
	}
}

func exportDefault(ae javascript.AssignmentExpression) javascript.StatementListItem {
	return yield(map[string]javascript.AssignmentExpression{
		"default": wrapLHS(&javascript.LeftHandSideExpression{
			NewExpression: &javascript.NewExpression{
				MemberExpression: javascript.MemberExpression{
					PrimaryExpression: &javascript.PrimaryExpression{
						ObjectLiteral: &javascript.ObjectLiteral{
							PropertyDefinitionList: []javascript.PropertyDefinition{
								{
									PropertyName: &javascript.PropertyName{
										LiteralPropertyName: &javascript.Token{
											Token: parser.Token{
												Type: javascript.TokenStringLiteral,
												Data: "\"value\"",
											},
										},
									},
									AssignmentExpression: &ae,
								},
							},
						},
					},
				},
			},
		}),
	})
}

func exportConst(mappings map[string]string) javascript.StatementListItem {
	elements := make(map[string]javascript.AssignmentExpression, len(mappings))
	for n, m := range mappings {
		elements[n] = wrapLHS(&javascript.LeftHandSideExpression{
			NewExpression: &javascript.NewExpression{
				MemberExpression: javascript.MemberExpression{
					PrimaryExpression: &javascript.PrimaryExpression{
						ObjectLiteral: &javascript.ObjectLiteral{
							PropertyDefinitionList: []javascript.PropertyDefinition{
								{
									PropertyName: &javascript.PropertyName{
										LiteralPropertyName: &javascript.Token{
											Token: parser.Token{
												Type: javascript.TokenStringLiteral,
												Data: "\"value\"",
											},
										},
									},
									AssignmentExpression: &javascript.AssignmentExpression{
										ConditionalExpression: wrapLHS(&javascript.LeftHandSideExpression{
											NewExpression: &javascript.NewExpression{
												MemberExpression: javascript.MemberExpression{
													PrimaryExpression: &javascript.PrimaryExpression{
														IdentifierReference: &javascript.Token{
															Token: parser.Token{
																Type: javascript.TokenIdentifier,
																Data: m,
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
					},
				},
			},
		})
	}
	return yield(elements)
}

func exportVar(mappings map[string]string) javascript.StatementListItem {
	elements := make(map[string]javascript.AssignmentExpression, len(mappings))
	for n, m := range mappings {
		elements[n] = wrapLHS(&javascript.LeftHandSideExpression{
			NewExpression: &javascript.NewExpression{
				MemberExpression: javascript.MemberExpression{
					PrimaryExpression: &javascript.PrimaryExpression{
						ObjectLiteral: &javascript.ObjectLiteral{
							PropertyDefinitionList: []javascript.PropertyDefinition{
								{
									PropertyName: &javascript.PropertyName{
										LiteralPropertyName: &javascript.Token{
											Token: parser.Token{
												Type: javascript.TokenStringLiteral,
												Data: "\"get\"",
											},
										},
									},
									AssignmentExpression: &javascript.AssignmentExpression{
										ArrowFunction: &javascript.ArrowFunction{
											CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{},
											AssignmentExpression: &javascript.AssignmentExpression{
												ConditionalExpression: wrapLHS(&javascript.LeftHandSideExpression{
													NewExpression: &javascript.NewExpression{
														MemberExpression: javascript.MemberExpression{
															PrimaryExpression: &javascript.PrimaryExpression{
																IdentifierReference: &javascript.Token{
																	Token: parser.Token{
																		Type: javascript.TokenIdentifier,
																		Data: m,
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
							},
						},
					},
				},
			},
		})
	}
	return yield(elements)
}

func wrapLHS(lhs *javascript.LeftHandSideExpression) javascript.AssignmentExpression {
	a := javascript.AssignmentExpression{ConditionalExpression: new(javascript.ConditionalExpression)}
	a.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.LeftHandSideExpression = lhs
	return a
}

func makeLoader() *javascript.Module {
	m, _ := javascript.ParseModule(parser.NewStringTokeniser(`[].forEach((() => {
	"use strict";
	const urlRe = /[^(@]*[(@](.+?):[0-9]+:[0-9]+[)\n]/g,
	      toURL = url => (new URL(url, (document.currentScript ? document.currentScript.src : new Error().stack.replace(urlRe, "$1\n").split("\n")[2]).match(/.*\//))).href,
	      included = new Map();
	Object.defineProperties(window, {
		"include": {value: (url, now) => {
			const aURL = toURL(url);
			if (included.has(aURL)) {
				if (now) {
					return included.get(aURL);
				}
				return Promise.resolve(included.get(aURL));
			}
			return import(url);
		}},
		"pageLoad": {value: document.readyState === "complete" ? Promise.resolve() : new Promise(successFn => window.addEventListener("load", successFn))}
	});
	return ([url, fn]) => included.set(toURL(url), Object.defineProperties({}, Object.fromEntries(Array.from(fn()).map(e => {e[1]["enumerable"] = true;return e;}))));
})());`))
	return m
}
