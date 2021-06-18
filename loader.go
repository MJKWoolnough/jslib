package jslib

import (
	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

func loader(exports *javascript.ArrayLiteral) *javascript.StatementListItem {
	promise := &javascript.MemberExpression{
		PrimaryExpression: &javascript.PrimaryExpression{
			IdentifierReference: &javascript.Token{Token: parser.Token{Data: "Promise"}},
		},
	}
	promiseResolve := &javascript.MemberExpression{
		MemberExpression: promise,
		IdentifierName:   &javascript.Token{Token: parser.Token{Data: "resolve"}},
	}
	successFn := &javascript.Token{Token: parser.Token{Data: "successFn"}}
	trueAE := &javascript.AssignmentExpression{
		ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
			Literal: &javascript.Token{Token: parser.Token{Data: "true"}},
		}),
	}
	window := &javascript.PrimaryExpression{
		IdentifierReference: &javascript.Token{Token: parser.Token{Data: "window"}},
	}
	pageLoad := javascript.PropertyDefinition{
		PropertyName: &javascript.PropertyName{
			LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "pageLoad"}},
		},
		AssignmentExpression: &javascript.AssignmentExpression{
			ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
				ObjectLiteral: &javascript.ObjectLiteral{
					PropertyDefinitionList: []javascript.PropertyDefinition{
						{
							PropertyName: &javascript.PropertyName{
								LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "value"}},
							},
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
																					ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
																						ObjectLiteral: &javascript.ObjectLiteral{
																							PropertyDefinitionList: []javascript.PropertyDefinition{
																								{
																									PropertyName: &javascript.PropertyName{
																										LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "once"}},
																									},
																									AssignmentExpression: trueAE,
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
										}),
									},
								},
							},
						},
					},
				},
			}),
		},
	}
	objectDefineProperties := &javascript.MemberExpression{
		MemberExpression: &javascript.MemberExpression{
			PrimaryExpression: &javascript.PrimaryExpression{
				IdentifierReference: &javascript.Token{Token: parser.Token{Data: "Object"}},
			},
		},
		IdentifierName: &javascript.Token{Token: parser.Token{Data: "defineProperties"}},
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
	var props [2]javascript.PropertyDefinition
	props[0] = pageLoad
	if exports == nil {
		props[1] = javascript.PropertyDefinition{
			PropertyName: &javascript.PropertyName{
				LiteralPropertyName: &javascript.Token{Token: parser.Token{Data: "include"}},
			},
			AssignmentExpression: &javascript.AssignmentExpression{
				ArrowFunction: &javascript.ArrowFunction{
					BindingIdentifier: url,
					AssignmentExpression: &javascript.AssignmentExpression{
						ConditionalExpression: importURL,
					},
				},
			},
		}
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
										ConditionalExpression: javascript.WrapConditional(&javascript.PrimaryExpression{
											ObjectLiteral: &javascript.ObjectLiteral{
												PropertyDefinitionList: props[:],
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
