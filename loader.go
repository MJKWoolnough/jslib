package jslib

import (
	"sort"
	"strconv"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

type export struct {
	binding, module string
	writeable       bool
}

type exportMap map[string]export

type exportsMap map[string]exportMap

func loader(exports exportsMap) *javascript.StatementListItem {
	promise := &javascript.MemberExpression{
		PrimaryExpression: &javascript.PrimaryExpression{
			IdentifierReference: &javascript.Token{Token: parser.Token{Data: "Promise"}},
		},
	}
	promiseResolve := &javascript.MemberExpression{
		MemberExpression: promise,
		IdentifierName:   &javascript.Token{Token: parser.Token{Data: "resolve"}},
	}
	trueAE := &javascript.AssignmentExpression{
		ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
			Literal: &javascript.Token{Token: parser.Token{Data: "true"}},
		}),
	}
	object := &javascript.MemberExpression{
		PrimaryExpression: &javascript.PrimaryExpression{
			IdentifierReference: &javascript.Token{Token: parser.Token{Data: "Object"}},
		},
	}
	objectDefineProperties := &javascript.MemberExpression{
		MemberExpression: object,
		IdentifierName:   &javascript.Token{Token: parser.Token{Data: "defineProperties"}},
	}
	url := &javascript.Token{Token: parser.Token{Data: "url"}}
	wrappedURL := javascript.WrapConditional(&javascript.PrimaryExpression{
		IdentifierReference: url,
	})
	importURL := javascript.WrapConditional(&javascript.CallExpression{
		MemberExpression: &javascript.MemberExpression{
			PrimaryExpression: &javascript.PrimaryExpression{
				IdentifierReference: &javascript.Token{Token: parser.Token{Data: "import"}},
			},
		},
		Arguments: &javascript.Arguments{
			ArgumentList: []javascript.AssignmentExpression{
				{
					ConditionalExpression: wrappedURL,
				},
			},
		},
	})
	var include *javascript.AssignmentExpression
	if len(exports) == 0 {
		include = &javascript.AssignmentExpression{
			ArrowFunction: &javascript.ArrowFunction{
				BindingIdentifier: url,
				AssignmentExpression: &javascript.AssignmentExpression{
					ConditionalExpression: importURL,
				},
			},
		}
	} else {
		a := &javascript.Token{Token: parser.Token{Data: "a"}}
		aWrapped := javascript.AssignmentExpression{
			ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
				IdentifierReference: a,
			}),
		}
		exportArr := &javascript.ArrayLiteral{
			ElementList: make([]javascript.AssignmentExpression, 0, len(exports)),
		}
		urls := make([]string, 0, len(exports))
		for url := range exports {
			urls = append(urls, url)
		}
		sort.Strings(urls)
		for _, url := range urls {
			es := exports[url]
			el := append(make([]javascript.AssignmentExpression, 0, len(es)+1), javascript.AssignmentExpression{
				ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
					Literal: &javascript.Token{Token: parser.Token{Data: strconv.Quote(url)}},
				}),
			})
			props := make([]string, 0, len(es))
			for prop := range es {
				props = append(props, prop)
			}
			sort.Strings(props)
			for _, prop := range props {
				binding := es[prop]
				propName := javascript.AssignmentExpression{
					ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
						Literal: &javascript.Token{Token: parser.Token{Data: strconv.Quote(prop)}},
					}),
				}
				var ael []javascript.AssignmentExpression
				if binding.module != "" {
					ael = []javascript.AssignmentExpression{
						propName,
						{
							ArrowFunction: &javascript.ArrowFunction{
								CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{},
								AssignmentExpression: &javascript.AssignmentExpression{
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
														Literal: &javascript.Token{Token: parser.Token{Data: strconv.Quote(binding.module)}},
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
					}
				} else {
					bindingPE := &javascript.LeftHandSideExpression{
						NewExpression: &javascript.NewExpression{
							MemberExpression: javascript.MemberExpression{
								PrimaryExpression: &javascript.PrimaryExpression{
									IdentifierReference: &javascript.Token{Token: parser.Token{Data: binding.binding}},
								},
							},
						},
					}
					get := javascript.AssignmentExpression{
						ArrowFunction: &javascript.ArrowFunction{
							CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{},
							AssignmentExpression: &javascript.AssignmentExpression{
								ConditionalExpression: javascript.WrapConditional(bindingPE),
							},
						},
					}
					if binding.writeable {
						ael = []javascript.AssignmentExpression{
							propName,
							get,
							{
								ArrowFunction: &javascript.ArrowFunction{
									BindingIdentifier: a,
									AssignmentExpression: &javascript.AssignmentExpression{
										LeftHandSideExpression: bindingPE,
										AssignmentOperator:     javascript.AssignmentAssign,
										AssignmentExpression:   &aWrapped,
									},
								},
							},
						}
					} else {
						ael = []javascript.AssignmentExpression{
							propName,
							get,
						}
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
		imports := &javascript.Token{Token: parser.Token{Data: "imports"}}
		importsME := &javascript.MemberExpression{
			PrimaryExpression: &javascript.PrimaryExpression{
				IdentifierReference: imports,
			},
		}
		now := &javascript.LeftHandSideExpression{
			NewExpression: &javascript.NewExpression{
				MemberExpression: javascript.MemberExpression{
					PrimaryExpression: &javascript.PrimaryExpression{
						IdentifierReference: &javascript.Token{Token: parser.Token{Data: "now"}},
					},
				},
			},
		}
		mapt := &javascript.Token{Token: parser.Token{Data: "map"}}
		prop := javascript.AssignmentExpression{
			ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
				IdentifierReference: &javascript.Token{Token: parser.Token{Data: "prop"}},
			}),
		}
		get := &javascript.Token{Token: parser.Token{Data: "get"}}
		wrappedGet := javascript.AssignmentExpression{
			ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
				IdentifierReference: get,
			}),
		}
		set := &javascript.Token{Token: parser.Token{Data: "set"}}
		wrappedSet := javascript.AssignmentExpression{
			ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
				IdentifierReference: set,
			}),
		}
		props := &javascript.MemberExpression{
			PrimaryExpression: &javascript.PrimaryExpression{
				IdentifierReference: &javascript.Token{Token: parser.Token{Data: "props"}},
			},
		}
		include = &javascript.AssignmentExpression{
			ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
				MemberExpression: &javascript.MemberExpression{
					PrimaryExpression: &javascript.PrimaryExpression{
						CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
							Expressions: []javascript.AssignmentExpression{
								{
									ArrowFunction: &javascript.ArrowFunction{
										BindingIdentifier: imports,
										AssignmentExpression: &javascript.AssignmentExpression{
											ArrowFunction: &javascript.ArrowFunction{
												CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
													Expressions: []javascript.AssignmentExpression{
														{
															ConditionalExpression: wrappedURL,
														},
														{
															LeftHandSideExpression: now,
															AssignmentOperator:     javascript.AssignmentAssign,
															AssignmentExpression: &javascript.AssignmentExpression{
																ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																	Literal: &javascript.Token{Token: parser.Token{Data: "false"}},
																}),
															},
														},
													},
												},
												AssignmentExpression: &javascript.AssignmentExpression{
													ConditionalExpression: &javascript.ConditionalExpression{
														LogicalORExpression: javascript.WrapConditional(&javascript.CallExpression{
															MemberExpression: &javascript.MemberExpression{
																MemberExpression: importsME,
																IdentifierName:   &javascript.Token{Token: parser.Token{Data: "has"}},
															},
															Arguments: &javascript.Arguments{
																ArgumentList: []javascript.AssignmentExpression{
																	{
																		ConditionalExpression: wrappedURL,
																	},
																},
															},
														}).LogicalORExpression,
														True: &javascript.AssignmentExpression{
															ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																MemberExpression: &javascript.MemberExpression{
																	PrimaryExpression: &javascript.PrimaryExpression{
																		CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
																			Expressions: []javascript.AssignmentExpression{
																				{
																					ArrowFunction: &javascript.ArrowFunction{
																						BindingIdentifier: a,
																						AssignmentExpression: &javascript.AssignmentExpression{
																							ConditionalExpression: &javascript.ConditionalExpression{
																								LogicalORExpression: javascript.WrapConditional(now).LogicalORExpression,
																								True:                &aWrapped,
																								False: &javascript.AssignmentExpression{
																									ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																										MemberExpression: promiseResolve,
																										Arguments: &javascript.Arguments{
																											ArgumentList: []javascript.AssignmentExpression{
																												aWrapped,
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
																Arguments: &javascript.Arguments{
																	ArgumentList: []javascript.AssignmentExpression{
																		{
																			ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																				MemberExpression: &javascript.MemberExpression{
																					MemberExpression: importsME,
																					IdentifierName:   get,
																				},
																				Arguments: &javascript.Arguments{
																					ArgumentList: []javascript.AssignmentExpression{
																						{
																							ConditionalExpression: wrappedURL,
																						},
																					},
																				},
																			}),
																		},
																	},
																},
															}),
														},
														False: &javascript.AssignmentExpression{
															ConditionalExpression: importURL,
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
				Arguments: &javascript.Arguments{
					ArgumentList: []javascript.AssignmentExpression{
						{
							ConditionalExpression: javascript.WrapConditional(javascript.MemberExpression{
								MemberExpression: &javascript.MemberExpression{
									PrimaryExpression: &javascript.PrimaryExpression{
										IdentifierReference: &javascript.Token{Token: parser.Token{Data: "Map"}},
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
																CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
																	Expressions: []javascript.AssignmentExpression{
																		{
																			ConditionalExpression: javascript.WrapConditional(&javascript.ArrayLiteral{
																				ElementList: []javascript.AssignmentExpression{
																					{
																						ConditionalExpression: wrappedURL,
																					},
																				},
																				SpreadElement: &javascript.AssignmentExpression{
																					ConditionalExpression: javascript.WrapConditional(props),
																				},
																			}),
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
																						IdentifierName:   &javascript.Token{Token: parser.Token{Data: "freeze"}},
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
																														IdentifierName:   &javascript.Token{Token: parser.Token{Data: "fromEntries"}},
																													},
																													Arguments: &javascript.Arguments{
																														ArgumentList: []javascript.AssignmentExpression{
																															{
																																ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
																																	MemberExpression: &javascript.MemberExpression{
																																		MemberExpression: props,
																																		IdentifierName:   mapt,
																																	},
																																	Arguments: &javascript.Arguments{
																																		ArgumentList: []javascript.AssignmentExpression{
																																			{
																																				ArrowFunction: &javascript.ArrowFunction{
																																					CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
																																						Expressions: []javascript.AssignmentExpression{
																																							{
																																								ConditionalExpression: javascript.WrapConditional(&javascript.ArrayLiteral{
																																									ElementList: []javascript.AssignmentExpression{
																																										prop,
																																										wrappedGet,
																																										wrappedSet,
																																									},
																																								}),
																																							},
																																						},
																																					},
																																					AssignmentExpression: &javascript.AssignmentExpression{
																																						ConditionalExpression: javascript.WrapConditional(&javascript.ArrayLiteral{
																																							ElementList: []javascript.AssignmentExpression{
																																								{
																																									ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																																										IdentifierReference: &javascript.Token{Token: parser.Token{Data: "prop"}},
																																									}),
																																								},
																																								{
																																									ConditionalExpression: javascript.WrapConditional(&javascript.ObjectLiteral{
																																										PropertyDefinitionList: []javascript.PropertyDefinition{
																																											{
																																												PropertyName: &javascript.PropertyName{
																																													LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "enumerable"}},
																																												},
																																												AssignmentExpression: trueAE,
																																											},
																																											{
																																												PropertyName: &javascript.PropertyName{
																																													LiteralPropertyName: get,
																																												},
																																												AssignmentExpression: &wrappedGet,
																																											},
																																											{
																																												PropertyName: &javascript.PropertyName{
																																													LiteralPropertyName: set,
																																												},
																																												AssignmentExpression: &wrappedSet,
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
			}),
		}
	}
	successFn := &javascript.Token{Token: parser.Token{Data: "successFn"}}
	window := &javascript.PrimaryExpression{
		IdentifierReference: &javascript.Token{Token: parser.Token{Data: "window"}},
	}
	value := &javascript.PropertyName{
		LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "value"}},
	}
	return &javascript.StatementListItem{
		Statement: &javascript.Statement{
			ExpressionStatement: &javascript.Expression{
				Expressions: []javascript.AssignmentExpression{
					{
						ConditionalExpression: javascript.WrapConditional(&javascript.CallExpression{
							MemberExpression: objectDefineProperties,
							Arguments: &javascript.Arguments{

								ArgumentList: []javascript.AssignmentExpression{
									{
										ConditionalExpression: javascript.WrapConditional(window),
									},
									{
										ConditionalExpression: javascript.WrapConditional(&javascript.ObjectLiteral{
											PropertyDefinitionList: []javascript.PropertyDefinition{
												{
													PropertyName: &javascript.PropertyName{
														LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "pageLoad"}},
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
																							IdentifierReference: &javascript.Token{Token: parser.Token{Data: "document"}},
																						},
																					},
																					IdentifierName: &javascript.Token{Token: parser.Token{Data: "readyState"}},
																				}).LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression,
																				EqualityOperator: javascript.EqualityEqual,
																				RelationalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																					Literal: &javascript.Token{Token: parser.Token{Data: "\"complete\""}},
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
																														PrimaryExpression: window,
																													},
																													IdentifierName: &javascript.Token{Token: parser.Token{Data: "addEventListener"}},
																												},
																												Arguments: &javascript.Arguments{
																													ArgumentList: []javascript.AssignmentExpression{
																														{
																															ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																																Literal: &javascript.Token{Token: parser.Token{Data: "\"load\""}},
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
																																			LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "once"}},
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
														LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "include"}},
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
}
