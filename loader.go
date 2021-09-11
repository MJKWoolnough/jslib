package jslib

import (
	"fmt"
	"sort"
	"strconv"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

func jToken(data string) *javascript.Token {
	return &javascript.Token{Token: parser.Token{Data: data}}
}

type export struct {
	binding, module string
	writeable       bool
}

type exportMap map[string]export

type exportsMap map[string]exportMap

func (c *config) makeLoader() error {
	promise := &javascript.MemberExpression{
		PrimaryExpression: &javascript.PrimaryExpression{
			IdentifierReference: jToken("Promise"),
		},
	}
	promiseResolve := &javascript.MemberExpression{
		MemberExpression: promise,
		IdentifierName:   jToken("resolve"),
	}
	trueAE := &javascript.AssignmentExpression{
		ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
			Literal: jToken("true"),
		}),
	}
	object := &javascript.MemberExpression{
		PrimaryExpression: &javascript.PrimaryExpression{
			IdentifierReference: jToken("Object"),
		},
	}
	objectDefineProperties := &javascript.MemberExpression{
		MemberExpression: object,
		IdentifierName:   jToken("defineProperties"),
	}
	url := jToken("url")
	wrappedURL := javascript.WrapConditional(&javascript.PrimaryExpression{
		IdentifierReference: url,
	})
	importURL := javascript.WrapConditional(&javascript.CallExpression{
		ImportCall: &javascript.AssignmentExpression{
			ConditionalExpression: wrappedURL,
		},
	})
	var include *javascript.AssignmentExpression
	if !c.bare || c.parseDynamic {
		exportArr := &javascript.ArrayLiteral{
			ElementList: make([]javascript.AssignmentExpression, 0, len(c.filesDone)),
		}
		urls := make([]string, 0, len(c.filesDone))
		imports := jToken("imports")
		importsGet := &javascript.MemberExpression{
			MemberExpression: &javascript.MemberExpression{
				PrimaryExpression: &javascript.PrimaryExpression{
					IdentifierReference: imports,
				},
			},
			IdentifierName: jToken("get"),
		}
		for url := range c.filesDone {
			urls = append(urls, url)
		}
		sort.Strings(urls)
		for _, url := range urls {
			d := c.filesDone[url]
			if c.bare && !d.dynamicRequirement {
				continue
			}
			el := append(make([]javascript.AssignmentExpression, 0, len(d.exports)+1), javascript.AssignmentExpression{
				ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
					Literal: jToken(strconv.Quote(url)),
				}),
			})
			props := make([]string, 0, len(d.exports))
			for prop := range d.exports {
				props = append(props, prop)
			}
			sort.Strings(props)
			for _, prop := range props {
				binding := d.exports[prop]
				propName := javascript.AssignmentExpression{
					ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
						Literal: jToken(strconv.Quote(prop)),
					}),
				}
				var ael []javascript.AssignmentExpression
				if binding.binding == "" {
					ael = []javascript.AssignmentExpression{
						propName,
						{
							ArrowFunction: &javascript.ArrowFunction{
								FormalParameters: &javascript.FormalParameters{},
								AssignmentExpression: &javascript.AssignmentExpression{
									ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
										MemberExpression: importsGet,
										Arguments: &javascript.Arguments{
											ArgumentList: []javascript.AssignmentExpression{
												{
													ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
														Literal: jToken(strconv.Quote(binding.dependency.url)),
													}),
												},
											},
										},
									}),
								},
							},
						},
					}
				} else {
					b := d.resolveExport(prop)
					if b == nil {
						return fmt.Errorf("error resolving export (%s): %w", d.url, ErrInvalidExport)
					}
					ael = []javascript.AssignmentExpression{
						propName,
						javascript.AssignmentExpression{
							ArrowFunction: &javascript.ArrowFunction{
								FormalParameters: &javascript.FormalParameters{},
								AssignmentExpression: &javascript.AssignmentExpression{
									ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
										IdentifierReference: b.Token,
									}),
								},
							},
						},
					}
				}
				el = append(el, javascript.AssignmentExpression{
					ConditionalExpression: javascript.WrapConditional(&javascript.ArrayLiteral{
						ElementList: ael,
					}),
				})
			}
			exportArr.ElementList = append(exportArr.ElementList, javascript.AssignmentExpression{
				ConditionalExpression: javascript.WrapConditional(&javascript.ArrayLiteral{
					ElementList: el,
				}),
			})
		}
		if len(exportArr.ElementList) > 0 {
			mapt := jToken("map")
			prop := jToken("prop")
			get := jToken("get")
			props := jToken("props")
			include = &javascript.AssignmentExpression{
				ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
					MemberExpression: &javascript.MemberExpression{
						PrimaryExpression: &javascript.PrimaryExpression{
							CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
								Expressions: []javascript.AssignmentExpression{
									{
										ArrowFunction: &javascript.ArrowFunction{
											FormalParameters: &javascript.FormalParameters{},
											FunctionBody: &javascript.Block{
												StatementList: []javascript.StatementListItem{
													{
														Declaration: &javascript.Declaration{
															LexicalDeclaration: &javascript.LexicalDeclaration{
																LetOrConst: javascript.Const,
																BindingList: []javascript.LexicalBinding{
																	{
																		BindingIdentifier: imports,
																		Initializer: &javascript.AssignmentExpression{
																			ConditionalExpression: javascript.WrapConditional(javascript.MemberExpression{
																				MemberExpression: &javascript.MemberExpression{
																					PrimaryExpression: &javascript.PrimaryExpression{
																						IdentifierReference: jToken("Map"),
																					},
																				},
																				Arguments: &javascript.Arguments{
																					ArgumentList: []javascript.AssignmentExpression{
																						{
																							ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																								MemberExpression: &javascript.MemberExpression{
																									MemberExpression: &javascript.MemberExpression{
																										PrimaryExpression: &javascript.PrimaryExpression{
																											ArrayLiteral: exportArr,
																										},
																									},
																									IdentifierName: mapt,
																								},
																								Arguments: &javascript.Arguments{
																									ArgumentList: []javascript.AssignmentExpression{
																										{
																											ArrowFunction: &javascript.ArrowFunction{
																												FormalParameters: &javascript.FormalParameters{
																													FormalParameterList: []javascript.BindingElement{
																														{
																															ArrayBindingPattern: &javascript.ArrayBindingPattern{
																																BindingElementList: []javascript.BindingElement{
																																	{
																																		SingleNameBinding: url,
																																	},
																																},
																																BindingRestElement: &javascript.BindingElement{
																																	SingleNameBinding: props,
																																},
																															},
																														},
																													},
																												},
																												AssignmentExpression: &javascript.AssignmentExpression{
																													ConditionalExpression: javascript.WrapConditional(&javascript.ArrayLiteral{
																														ElementList: []javascript.AssignmentExpression{
																															{
																																ConditionalExpression: wrappedURL,
																															},
																															{
																																ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																																	MemberExpression: &javascript.MemberExpression{
																																		MemberExpression: object,
																																		IdentifierName:   jToken("freeze"),
																																	},
																																	Arguments: &javascript.Arguments{
																																		ArgumentList: []javascript.AssignmentExpression{
																																			{
																																				ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																																					MemberExpression: objectDefineProperties,
																																					Arguments: &javascript.Arguments{
																																						ArgumentList: []javascript.AssignmentExpression{
																																							{
																																								ConditionalExpression: javascript.WrapConditional(&javascript.ObjectLiteral{}),
																																							},
																																							{
																																								ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																																									MemberExpression: &javascript.MemberExpression{
																																										MemberExpression: object,
																																										IdentifierName:   jToken("fromEntries"),
																																									},
																																									Arguments: &javascript.Arguments{
																																										ArgumentList: []javascript.AssignmentExpression{
																																											{
																																												ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																																													MemberExpression: &javascript.MemberExpression{
																																														MemberExpression: &javascript.MemberExpression{
																																															PrimaryExpression: &javascript.PrimaryExpression{
																																																IdentifierReference: props,
																																															},
																																														},
																																														IdentifierName: mapt,
																																													},
																																													Arguments: &javascript.Arguments{
																																														ArgumentList: []javascript.AssignmentExpression{
																																															{
																																																ArrowFunction: &javascript.ArrowFunction{
																																																	FormalParameters: &javascript.FormalParameters{
																																																		FormalParameterList: []javascript.BindingElement{
																																																			{
																																																				ArrayBindingPattern: &javascript.ArrayBindingPattern{
																																																					BindingElementList: []javascript.BindingElement{
																																																						{
																																																							SingleNameBinding: prop,
																																																						},
																																																						{
																																																							SingleNameBinding: get,
																																																						},
																																																					},
																																																				},
																																																			},
																																																		},
																																																	},
																																																	AssignmentExpression: &javascript.AssignmentExpression{
																																																		ConditionalExpression: javascript.WrapConditional(&javascript.ArrayLiteral{
																																																			ElementList: []javascript.AssignmentExpression{
																																																				{
																																																					ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																																																						IdentifierReference: prop,
																																																					}),
																																																				},
																																																				{
																																																					ConditionalExpression: javascript.WrapConditional(&javascript.ObjectLiteral{
																																																						PropertyDefinitionList: []javascript.PropertyDefinition{
																																																							{
																																																								PropertyName: &javascript.PropertyName{
																																																									LiteralPropertyName: jToken("enumerable"),
																																																								},
																																																								AssignmentExpression: trueAE,
																																																							},
																																																							{
																																																								PropertyName: &javascript.PropertyName{
																																																									LiteralPropertyName: get,
																																																								},
																																																								AssignmentExpression: &javascript.AssignmentExpression{
																																																									ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																																																										IdentifierReference: get,
																																																									}),
																																																								},
																																																							},
																																																						},
																																																					}),
																																																				},
																																																			},
																																																		}),
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
																																				}),
																																			},
																																		},
																																	},
																																}),
																															},
																														},
																													}),
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
															},
														},
													},
													{
														Statement: &javascript.Statement{
															Type: javascript.StatementReturn,
															ExpressionStatement: &javascript.Expression{
																Expressions: []javascript.AssignmentExpression{
																	{
																		ArrowFunction: &javascript.ArrowFunction{
																			BindingIdentifier: url,
																			AssignmentExpression: &javascript.AssignmentExpression{
																				ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																					MemberExpression: promiseResolve,
																					Arguments: &javascript.Arguments{
																						ArgumentList: []javascript.AssignmentExpression{
																							{
																								ConditionalExpression: &javascript.ConditionalExpression{
																									CoalesceExpression: &javascript.CoalesceExpression{
																										CoalesceExpressionHead: &javascript.CoalesceExpression{
																											BitwiseORExpression: javascript.WrapConditional(&javascript.CallExpression{
																												MemberExpression: importsGet,
																												Arguments: &javascript.Arguments{
																													ArgumentList: []javascript.AssignmentExpression{
																														{
																															ConditionalExpression: wrappedURL,
																														},
																													},
																												},
																											}).LogicalORExpression.LogicalANDExpression.BitwiseORExpression,
																										},
																										BitwiseORExpression: importURL.LogicalORExpression.LogicalANDExpression.BitwiseORExpression,
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
					Arguments: &javascript.Arguments{},
				}),
			}
		}
	}
	if include == nil {
		include = &javascript.AssignmentExpression{
			ArrowFunction: &javascript.ArrowFunction{
				BindingIdentifier: url,
				AssignmentExpression: &javascript.AssignmentExpression{
					ConditionalExpression: importURL,
				},
			},
		}
	}
	successFn := jToken("successFn")
	globalThis := &javascript.PrimaryExpression{
		IdentifierReference: jToken("globalThis"),
	}
	value := &javascript.PropertyName{
		LiteralPropertyName: jToken("value"),
	}
	c.statementList[0] = javascript.StatementListItem{
		Statement: &javascript.Statement{
			ExpressionStatement: &javascript.Expression{
				Expressions: []javascript.AssignmentExpression{
					{
						ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
							MemberExpression: objectDefineProperties,
							Arguments: &javascript.Arguments{

								ArgumentList: []javascript.AssignmentExpression{
									{
										ConditionalExpression: javascript.WrapConditional(globalThis),
									},
									{
										ConditionalExpression: javascript.WrapConditional(&javascript.ObjectLiteral{
											PropertyDefinitionList: []javascript.PropertyDefinition{
												{
													PropertyName: &javascript.PropertyName{
														LiteralPropertyName: jToken("pageLoad"),
													},
													AssignmentExpression: &javascript.AssignmentExpression{
														ConditionalExpression: javascript.WrapConditional(&javascript.ObjectLiteral{
															PropertyDefinitionList: []javascript.PropertyDefinition{
																{
																	PropertyName: value,
																	AssignmentExpression: &javascript.AssignmentExpression{
																		ConditionalExpression: &javascript.ConditionalExpression{
																			LogicalORExpression: javascript.WrapConditional(&javascript.EqualityExpression{
																				EqualityExpression: &javascript.WrapConditional(javascript.MemberExpression{
																					MemberExpression: &javascript.MemberExpression{
																						PrimaryExpression: &javascript.PrimaryExpression{
																							IdentifierReference: jToken("document"),
																						},
																					},
																					IdentifierName: jToken("readyState"),
																				}).LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression,
																				EqualityOperator: javascript.EqualityEqual,
																				RelationalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																					Literal: jToken("\"complete\""),
																				}).LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression,
																			}).LogicalORExpression,
																			True: &javascript.AssignmentExpression{
																				ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																					MemberExpression: promiseResolve,
																					Arguments:        &javascript.Arguments{},
																				}),
																			},
																			False: &javascript.AssignmentExpression{
																				ConditionalExpression: javascript.WrapConditional(&javascript.NewExpression{
																					MemberExpression: javascript.MemberExpression{
																						MemberExpression: promise,
																						Arguments: &javascript.Arguments{
																							ArgumentList: []javascript.AssignmentExpression{
																								{
																									ArrowFunction: &javascript.ArrowFunction{
																										BindingIdentifier: successFn,
																										AssignmentExpression: &javascript.AssignmentExpression{
																											ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																												MemberExpression: &javascript.MemberExpression{
																													MemberExpression: &javascript.MemberExpression{
																														PrimaryExpression: globalThis,
																													},
																													IdentifierName: jToken("addEventListener"),
																												},
																												Arguments: &javascript.Arguments{
																													ArgumentList: []javascript.AssignmentExpression{
																														{
																															ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																																Literal: jToken("\"load\""),
																															}),
																														},
																														{
																															ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																																IdentifierReference: successFn,
																															}),
																														},
																														{
																															ConditionalExpression: javascript.WrapConditional(&javascript.ObjectLiteral{
																																PropertyDefinitionList: []javascript.PropertyDefinition{
																																	{
																																		PropertyName: &javascript.PropertyName{
																																			LiteralPropertyName: jToken("once"),
																																		},
																																		AssignmentExpression: trueAE,
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
																							},
																						},
																					},
																				}),
																			},
																		},
																	},
																},
															},
														}),
													},
												},
												{
													PropertyName: &javascript.PropertyName{
														LiteralPropertyName: jToken("include"),
													},
													AssignmentExpression: &javascript.AssignmentExpression{
														ConditionalExpression: javascript.WrapConditional(&javascript.ObjectLiteral{
															PropertyDefinitionList: []javascript.PropertyDefinition{
																{
																	PropertyName:         value,
																	AssignmentExpression: include,
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
						}),
					},
				},
			},
		},
	}
	return nil
}
