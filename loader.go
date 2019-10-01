package jslib

import (
	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

func makeLoader() *javascript.Module {
	return &javascript.Module{
		ModuleListItems: []javascript.ModuleItem{{
			StatementListItem: &javascript.StatementListItem{
				Statement: &javascript.Statement{
					ExpressionStatement: &javascript.Expression{
						Expressions: []javascript.AssignmentExpression{{
							ConditionalExpression: &javascript.ConditionalExpression{
								LogicalORExpression: javascript.LogicalORExpression{
									LogicalANDExpression: javascript.LogicalANDExpression{
										BitwiseORExpression: javascript.BitwiseORExpression{
											BitwiseXORExpression: javascript.BitwiseXORExpression{
												BitwiseANDExpression: javascript.BitwiseANDExpression{
													EqualityExpression: javascript.EqualityExpression{
														RelationalExpression: javascript.RelationalExpression{
															ShiftExpression: javascript.ShiftExpression{
																AdditiveExpression: javascript.AdditiveExpression{
																	MultiplicativeExpression: javascript.MultiplicativeExpression{
																		ExponentiationExpression: javascript.ExponentiationExpression{
																			UnaryExpression: javascript.UnaryExpression{
																				UpdateExpression: javascript.UpdateExpression{
																					LeftHandSideExpression: &javascript.LeftHandSideExpression{
																						CallExpression: &javascript.CallExpression{
																							MemberExpression: &javascript.MemberExpression{
																								MemberExpression: &javascript.MemberExpression{
																									PrimaryExpression: &javascript.PrimaryExpression{
																										ArrayLiteral: &javascript.ArrayLiteral{},
																									},
																								},
																								IdentifierName: &javascript.Token{
																									Token: parser.Token{
																										Type: javascript.TokenIdentifier,
																										Data: "forEach",
																									},
																								},
																							},
																							Arguments: &javascript.Arguments{
																								ArgumentList: []javascript.AssignmentExpression{{
																									ConditionalExpression: &javascript.ConditionalExpression{
																										LogicalORExpression: javascript.LogicalORExpression{
																											LogicalANDExpression: javascript.LogicalANDExpression{
																												BitwiseORExpression: javascript.BitwiseORExpression{
																													BitwiseXORExpression: javascript.BitwiseXORExpression{
																														BitwiseANDExpression: javascript.BitwiseANDExpression{
																															EqualityExpression: javascript.EqualityExpression{
																																RelationalExpression: javascript.RelationalExpression{
																																	ShiftExpression: javascript.ShiftExpression{
																																		AdditiveExpression: javascript.AdditiveExpression{
																																			MultiplicativeExpression: javascript.MultiplicativeExpression{
																																				ExponentiationExpression: javascript.ExponentiationExpression{
																																					UnaryExpression: javascript.UnaryExpression{
																																						UpdateExpression: javascript.UpdateExpression{
																																							LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																								CallExpression: &javascript.CallExpression{
																																									MemberExpression: &javascript.MemberExpression{
																																										PrimaryExpression: &javascript.PrimaryExpression{
																																											CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
																																												Expressions: []javascript.AssignmentExpression{{
																																													ArrowFunction: &javascript.ArrowFunction{
																																														CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{},
																																														FunctionBody: &javascript.Block{
																																															StatementList: []javascript.StatementListItem{{
																																																Statement: &javascript.Statement{
																																																	ExpressionStatement: &javascript.Expression{
																																																		Expressions: []javascript.AssignmentExpression{{
																																																			ConditionalExpression: &javascript.ConditionalExpression{
																																																				LogicalORExpression: javascript.LogicalORExpression{
																																																					LogicalANDExpression: javascript.LogicalANDExpression{
																																																						BitwiseORExpression: javascript.BitwiseORExpression{
																																																							BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																								BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																									EqualityExpression: javascript.EqualityExpression{
																																																										RelationalExpression: javascript.RelationalExpression{
																																																											ShiftExpression: javascript.ShiftExpression{
																																																												AdditiveExpression: javascript.AdditiveExpression{
																																																													MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																														ExponentiationExpression: javascript.ExponentiationExpression{
																																																															UnaryExpression: javascript.UnaryExpression{
																																																																UpdateExpression: javascript.UpdateExpression{
																																																																	LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																		NewExpression: &javascript.NewExpression{
																																																																			MemberExpression: javascript.MemberExpression{
																																																																				PrimaryExpression: &javascript.PrimaryExpression{
																																																																					Literal: &javascript.Token{
																																																																						Token: parser.Token{
																																																																							Type: javascript.TokenStringLiteral,
																																																																							Data: "\"use strict\"",
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
																																																							},
																																																						},
																																																					},
																																																				},
																																																			},
																																																		},
																																																		},
																																																	},
																																																},
																																															}, {
																																																Declaration: &javascript.Declaration{
																																																	LexicalDeclaration: &javascript.LexicalDeclaration{
																																																		LetOrConst: javascript.Const,
																																																		BindingList: []javascript.LexicalBinding{{
																																																			BindingIdentifier: &javascript.Token{
																																																				Token: parser.Token{
																																																					Type: javascript.TokenIdentifier,
																																																					Data: "urlRe",
																																																				},
																																																			},
																																																			Initializer: &javascript.AssignmentExpression{
																																																				ConditionalExpression: &javascript.ConditionalExpression{
																																																					LogicalORExpression: javascript.LogicalORExpression{
																																																						LogicalANDExpression: javascript.LogicalANDExpression{
																																																							BitwiseORExpression: javascript.BitwiseORExpression{
																																																								BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																									BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																										EqualityExpression: javascript.EqualityExpression{
																																																											RelationalExpression: javascript.RelationalExpression{
																																																												ShiftExpression: javascript.ShiftExpression{
																																																													AdditiveExpression: javascript.AdditiveExpression{
																																																														MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																															ExponentiationExpression: javascript.ExponentiationExpression{
																																																																UnaryExpression: javascript.UnaryExpression{
																																																																	UpdateExpression: javascript.UpdateExpression{
																																																																		LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																			NewExpression: &javascript.NewExpression{
																																																																				MemberExpression: javascript.MemberExpression{
																																																																					PrimaryExpression: &javascript.PrimaryExpression{
																																																																						Literal: &javascript.Token{
																																																																							Token: parser.Token{
																																																																								Type: javascript.TokenRegularExpressionLiteral,
																																																																								Data: "/[^(@]*[(@](.+?):[0-9]+:[0-9]+[)\\n]/g",
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
																																																								},
																																																							},
																																																						},
																																																					},
																																																				},
																																																			},
																																																		}, {
																																																			BindingIdentifier: &javascript.Token{
																																																				Token: parser.Token{
																																																					Type: javascript.TokenIdentifier,
																																																					Data: "toURL",
																																																				},
																																																			},
																																																			Initializer: &javascript.AssignmentExpression{
																																																				ArrowFunction: &javascript.ArrowFunction{
																																																					BindingIdentifier: &javascript.Token{
																																																						Token: parser.Token{
																																																							Type: javascript.TokenIdentifier,
																																																							Data: "url",
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
																																																													RelationalExpression: javascript.RelationalExpression{
																																																														ShiftExpression: javascript.ShiftExpression{
																																																															AdditiveExpression: javascript.AdditiveExpression{
																																																																MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																	ExponentiationExpression: javascript.ExponentiationExpression{
																																																																		UnaryExpression: javascript.UnaryExpression{
																																																																			UpdateExpression: javascript.UpdateExpression{
																																																																				LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																					NewExpression: &javascript.NewExpression{
																																																																						MemberExpression: javascript.MemberExpression{
																																																																							MemberExpression: &javascript.MemberExpression{
																																																																								PrimaryExpression: &javascript.PrimaryExpression{
																																																																									CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
																																																																										Expressions: []javascript.AssignmentExpression{{
																																																																											ConditionalExpression: &javascript.ConditionalExpression{
																																																																												LogicalORExpression: javascript.LogicalORExpression{
																																																																													LogicalANDExpression: javascript.LogicalANDExpression{
																																																																														BitwiseORExpression: javascript.BitwiseORExpression{
																																																																															BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																	EqualityExpression: javascript.EqualityExpression{
																																																																																		RelationalExpression: javascript.RelationalExpression{
																																																																																			ShiftExpression: javascript.ShiftExpression{
																																																																																				AdditiveExpression: javascript.AdditiveExpression{
																																																																																					MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																						ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																							UnaryExpression: javascript.UnaryExpression{
																																																																																								UpdateExpression: javascript.UpdateExpression{
																																																																																									LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																										NewExpression: &javascript.NewExpression{
																																																																																											MemberExpression: javascript.MemberExpression{
																																																																																												MemberExpression: &javascript.MemberExpression{
																																																																																													PrimaryExpression: &javascript.PrimaryExpression{
																																																																																														IdentifierReference: &javascript.Token{
																																																																																															Token: parser.Token{
																																																																																																Type: javascript.TokenIdentifier,
																																																																																																Data: "URL",
																																																																																															},
																																																																																														},
																																																																																													},
																																																																																												},
																																																																																												Arguments: &javascript.Arguments{
																																																																																													ArgumentList: []javascript.AssignmentExpression{{
																																																																																														ConditionalExpression: &javascript.ConditionalExpression{
																																																																																															LogicalORExpression: javascript.LogicalORExpression{
																																																																																																LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																	BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																		BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																			BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																				EqualityExpression: javascript.EqualityExpression{
																																																																																																					RelationalExpression: javascript.RelationalExpression{
																																																																																																						ShiftExpression: javascript.ShiftExpression{
																																																																																																							AdditiveExpression: javascript.AdditiveExpression{
																																																																																																								MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																									ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																										UnaryExpression: javascript.UnaryExpression{
																																																																																																											UpdateExpression: javascript.UpdateExpression{
																																																																																																												LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																													NewExpression: &javascript.NewExpression{
																																																																																																														MemberExpression: javascript.MemberExpression{
																																																																																																															PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																IdentifierReference: &javascript.Token{
																																																																																																																	Token: parser.Token{
																																																																																																																		Type: javascript.TokenIdentifier,
																																																																																																																		Data: "url",
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
																																																																																																		},
																																																																																																	},
																																																																																																},
																																																																																															},
																																																																																														},
																																																																																													}, {
																																																																																														ConditionalExpression: &javascript.ConditionalExpression{
																																																																																															LogicalORExpression: javascript.LogicalORExpression{
																																																																																																LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																	BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																		BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																			BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																				EqualityExpression: javascript.EqualityExpression{
																																																																																																					RelationalExpression: javascript.RelationalExpression{
																																																																																																						ShiftExpression: javascript.ShiftExpression{
																																																																																																							AdditiveExpression: javascript.AdditiveExpression{
																																																																																																								MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																									ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																										UnaryExpression: javascript.UnaryExpression{
																																																																																																											UpdateExpression: javascript.UpdateExpression{
																																																																																																												LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																													CallExpression: &javascript.CallExpression{
																																																																																																														MemberExpression: &javascript.MemberExpression{
																																																																																																															MemberExpression: &javascript.MemberExpression{
																																																																																																																PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																	CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
																																																																																																																		Expressions: []javascript.AssignmentExpression{{
																																																																																																																			ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																				LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																					LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																						BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																							BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																								BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																									EqualityExpression: javascript.EqualityExpression{
																																																																																																																										RelationalExpression: javascript.RelationalExpression{
																																																																																																																											ShiftExpression: javascript.ShiftExpression{
																																																																																																																												AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																													MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																														ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																															UnaryExpression: javascript.UnaryExpression{
																																																																																																																																UpdateExpression: javascript.UpdateExpression{
																																																																																																																																	LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																		NewExpression: &javascript.NewExpression{
																																																																																																																																			MemberExpression: javascript.MemberExpression{
																																																																																																																																				MemberExpression: &javascript.MemberExpression{
																																																																																																																																					PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																						IdentifierReference: &javascript.Token{
																																																																																																																																							Token: parser.Token{
																																																																																																																																								Type: javascript.TokenIdentifier,
																																																																																																																																								Data: "document",
																																																																																																																																							},
																																																																																																																																						},
																																																																																																																																					},
																																																																																																																																				},
																																																																																																																																				IdentifierName: &javascript.Token{
																																																																																																																																					Token: parser.Token{
																																																																																																																																						Type: javascript.TokenIdentifier,
																																																																																																																																						Data: "currentScript",
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
																																																																																																																						},
																																																																																																																					},
																																																																																																																				},
																																																																																																																				True: &javascript.AssignmentExpression{
																																																																																																																					ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																						LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																							LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																								BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																									BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																										BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																											EqualityExpression: javascript.EqualityExpression{
																																																																																																																												RelationalExpression: javascript.RelationalExpression{
																																																																																																																													ShiftExpression: javascript.ShiftExpression{
																																																																																																																														AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																															MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																	UnaryExpression: javascript.UnaryExpression{
																																																																																																																																		UpdateExpression: javascript.UpdateExpression{
																																																																																																																																			LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																				NewExpression: &javascript.NewExpression{
																																																																																																																																					MemberExpression: javascript.MemberExpression{
																																																																																																																																						MemberExpression: &javascript.MemberExpression{
																																																																																																																																							MemberExpression: &javascript.MemberExpression{
																																																																																																																																								PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																									IdentifierReference: &javascript.Token{
																																																																																																																																										Token: parser.Token{
																																																																																																																																											Type: javascript.TokenIdentifier,
																																																																																																																																											Data: "document",
																																																																																																																																										},
																																																																																																																																									},
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																							IdentifierName: &javascript.Token{
																																																																																																																																								Token: parser.Token{
																																																																																																																																									Type: javascript.TokenIdentifier,
																																																																																																																																									Data: "currentScript",
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																						},
																																																																																																																																						IdentifierName: &javascript.Token{
																																																																																																																																							Token: parser.Token{
																																																																																																																																								Type: javascript.TokenIdentifier,
																																																																																																																																								Data: "src",
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
																																																																																																																								},
																																																																																																																							},
																																																																																																																						},
																																																																																																																					},
																																																																																																																				},
																																																																																																																				False: &javascript.AssignmentExpression{
																																																																																																																					ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																						LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																							LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																								BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																									BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																										BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																											EqualityExpression: javascript.EqualityExpression{
																																																																																																																												RelationalExpression: javascript.RelationalExpression{
																																																																																																																													ShiftExpression: javascript.ShiftExpression{
																																																																																																																														AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																															MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																	UnaryExpression: javascript.UnaryExpression{
																																																																																																																																		UpdateExpression: javascript.UpdateExpression{
																																																																																																																																			LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																				CallExpression: &javascript.CallExpression{
																																																																																																																																					CallExpression: &javascript.CallExpression{
																																																																																																																																						CallExpression: &javascript.CallExpression{
																																																																																																																																							CallExpression: &javascript.CallExpression{
																																																																																																																																								MemberExpression: &javascript.MemberExpression{
																																																																																																																																									MemberExpression: &javascript.MemberExpression{
																																																																																																																																										MemberExpression: &javascript.MemberExpression{
																																																																																																																																											MemberExpression: &javascript.MemberExpression{
																																																																																																																																												PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																													IdentifierReference: &javascript.Token{
																																																																																																																																														Token: parser.Token{
																																																																																																																																															Type: javascript.TokenIdentifier,
																																																																																																																																															Data: "Error",
																																																																																																																																														},
																																																																																																																																													},
																																																																																																																																												},
																																																																																																																																											},
																																																																																																																																											Arguments: &javascript.Arguments{},
																																																																																																																																										},
																																																																																																																																										IdentifierName: &javascript.Token{
																																																																																																																																											Token: parser.Token{
																																																																																																																																												Type: javascript.TokenIdentifier,
																																																																																																																																												Data: "stack",
																																																																																																																																											},
																																																																																																																																										},
																																																																																																																																									},
																																																																																																																																									IdentifierName: &javascript.Token{
																																																																																																																																										Token: parser.Token{
																																																																																																																																											Type: javascript.TokenIdentifier,
																																																																																																																																											Data: "replace",
																																																																																																																																										},
																																																																																																																																									},
																																																																																																																																								},
																																																																																																																																								Arguments: &javascript.Arguments{
																																																																																																																																									ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																																										ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																											LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																												LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																													BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																														BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																															BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																																EqualityExpression: javascript.EqualityExpression{
																																																																																																																																																	RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																		ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																			AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																				MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																					ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																						UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																							UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																								LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																									NewExpression: &javascript.NewExpression{
																																																																																																																																																										MemberExpression: javascript.MemberExpression{
																																																																																																																																																											PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																												IdentifierReference: &javascript.Token{
																																																																																																																																																													Token: parser.Token{
																																																																																																																																																														Type: javascript.TokenIdentifier,
																																																																																																																																																														Data: "urlRe",
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
																																																																																																																																														},
																																																																																																																																													},
																																																																																																																																												},
																																																																																																																																											},
																																																																																																																																										},
																																																																																																																																									}, {
																																																																																																																																										ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																											LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																												LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																													BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																														BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																															BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																																EqualityExpression: javascript.EqualityExpression{
																																																																																																																																																	RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																		ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																			AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																				MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																					ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																						UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																							UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																								LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																									NewExpression: &javascript.NewExpression{
																																																																																																																																																										MemberExpression: javascript.MemberExpression{
																																																																																																																																																											PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																												Literal: &javascript.Token{
																																																																																																																																																													Token: parser.Token{
																																																																																																																																																														Type: javascript.TokenStringLiteral,
																																																																																																																																																														Data: "\"$1\\n\"",
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
																																																																																																																																														},
																																																																																																																																													},
																																																																																																																																												},
																																																																																																																																											},
																																																																																																																																										},
																																																																																																																																									},
																																																																																																																																									},
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																							IdentifierName: &javascript.Token{
																																																																																																																																								Token: parser.Token{
																																																																																																																																									Type: javascript.TokenIdentifier,
																																																																																																																																									Data: "split",
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																						},
																																																																																																																																						Arguments: &javascript.Arguments{
																																																																																																																																							ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																																								ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																									LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																										LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																											BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																												BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																													BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																														EqualityExpression: javascript.EqualityExpression{
																																																																																																																																															RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																	AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																		MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																			ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																				UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																					UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																						LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																							NewExpression: &javascript.NewExpression{
																																																																																																																																																								MemberExpression: javascript.MemberExpression{
																																																																																																																																																									PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																										Literal: &javascript.Token{
																																																																																																																																																											Token: parser.Token{
																																																																																																																																																												Type: javascript.TokenStringLiteral,
																																																																																																																																																												Data: "\"\\n\"",
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
																																																																																																																																												},
																																																																																																																																											},
																																																																																																																																										},
																																																																																																																																									},
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																							},
																																																																																																																																						},
																																																																																																																																					},
																																																																																																																																					Expression: &javascript.Expression{
																																																																																																																																						Expressions: []javascript.AssignmentExpression{{
																																																																																																																																							ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																								LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																									LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																										BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																											BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																												BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																													EqualityExpression: javascript.EqualityExpression{
																																																																																																																																														RelationalExpression: javascript.RelationalExpression{
																																																																																																																																															ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																	MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																		ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																			UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																				UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																					LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																						NewExpression: &javascript.NewExpression{
																																																																																																																																																							MemberExpression: javascript.MemberExpression{
																																																																																																																																																								PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																									Literal: &javascript.Token{
																																																																																																																																																										Token: parser.Token{
																																																																																																																																																											Type: javascript.TokenNumericLiteral,
																																																																																																																																																											Data: "2",
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
																																																																																																															},
																																																																																																															IdentifierName: &javascript.Token{
																																																																																																																Token: parser.Token{
																																																																																																																	Type: javascript.TokenIdentifier,
																																																																																																																	Data: "match",
																																																																																																																},
																																																																																																															},
																																																																																																														},
																																																																																																														Arguments: &javascript.Arguments{
																																																																																																															ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																	LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																		LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																			BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																				BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																					BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																						EqualityExpression: javascript.EqualityExpression{
																																																																																																																							RelationalExpression: javascript.RelationalExpression{
																																																																																																																								ShiftExpression: javascript.ShiftExpression{
																																																																																																																									AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																										MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																											ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																												UnaryExpression: javascript.UnaryExpression{
																																																																																																																													UpdateExpression: javascript.UpdateExpression{
																																																																																																																														LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																															NewExpression: &javascript.NewExpression{
																																																																																																																																MemberExpression: javascript.MemberExpression{
																																																																																																																																	PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																		Literal: &javascript.Token{
																																																																																																																																			Token: parser.Token{
																																																																																																																																				Type: javascript.TokenRegularExpressionLiteral,
																																																																																																																																				Data: "/.*\\//",
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
																																																																										},
																																																																									},
																																																																								},
																																																																							},
																																																																							IdentifierName: &javascript.Token{
																																																																								Token: parser.Token{
																																																																									Type: javascript.TokenIdentifier,
																																																																									Data: "href",
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
																																																									},
																																																								},
																																																							},
																																																						},
																																																					},
																																																				},
																																																			},
																																																		}, {
																																																			BindingIdentifier: &javascript.Token{
																																																				Token: parser.Token{
																																																					Type: javascript.TokenIdentifier,
																																																					Data: "included",
																																																				},
																																																			},
																																																			Initializer: &javascript.AssignmentExpression{
																																																				ConditionalExpression: &javascript.ConditionalExpression{
																																																					LogicalORExpression: javascript.LogicalORExpression{
																																																						LogicalANDExpression: javascript.LogicalANDExpression{
																																																							BitwiseORExpression: javascript.BitwiseORExpression{
																																																								BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																									BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																										EqualityExpression: javascript.EqualityExpression{
																																																											RelationalExpression: javascript.RelationalExpression{
																																																												ShiftExpression: javascript.ShiftExpression{
																																																													AdditiveExpression: javascript.AdditiveExpression{
																																																														MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																															ExponentiationExpression: javascript.ExponentiationExpression{
																																																																UnaryExpression: javascript.UnaryExpression{
																																																																	UpdateExpression: javascript.UpdateExpression{
																																																																		LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																			NewExpression: &javascript.NewExpression{
																																																																				MemberExpression: javascript.MemberExpression{
																																																																					MemberExpression: &javascript.MemberExpression{
																																																																						PrimaryExpression: &javascript.PrimaryExpression{
																																																																							IdentifierReference: &javascript.Token{
																																																																								Token: parser.Token{
																																																																									Type: javascript.TokenIdentifier,
																																																																									Data: "Map",
																																																																								},
																																																																							},
																																																																						},
																																																																					},
																																																																					Arguments: &javascript.Arguments{},
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
																																																					},
																																																				},
																																																			},
																																																		},
																																																		},
																																																	},
																																																},
																																															}, {
																																																Statement: &javascript.Statement{
																																																	ExpressionStatement: &javascript.Expression{
																																																		Expressions: []javascript.AssignmentExpression{{
																																																			ConditionalExpression: &javascript.ConditionalExpression{
																																																				LogicalORExpression: javascript.LogicalORExpression{
																																																					LogicalANDExpression: javascript.LogicalANDExpression{
																																																						BitwiseORExpression: javascript.BitwiseORExpression{
																																																							BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																								BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																									EqualityExpression: javascript.EqualityExpression{
																																																										RelationalExpression: javascript.RelationalExpression{
																																																											ShiftExpression: javascript.ShiftExpression{
																																																												AdditiveExpression: javascript.AdditiveExpression{
																																																													MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																														ExponentiationExpression: javascript.ExponentiationExpression{
																																																															UnaryExpression: javascript.UnaryExpression{
																																																																UpdateExpression: javascript.UpdateExpression{
																																																																	LeftHandSideExpression: &javascript.LeftHandSideExpression{
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
																																																																						Data: "defineProperties",
																																																																					},
																																																																				},
																																																																			},
																																																																			Arguments: &javascript.Arguments{
																																																																				ArgumentList: []javascript.AssignmentExpression{{
																																																																					ConditionalExpression: &javascript.ConditionalExpression{
																																																																						LogicalORExpression: javascript.LogicalORExpression{
																																																																							LogicalANDExpression: javascript.LogicalANDExpression{
																																																																								BitwiseORExpression: javascript.BitwiseORExpression{
																																																																									BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																										BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																											EqualityExpression: javascript.EqualityExpression{
																																																																												RelationalExpression: javascript.RelationalExpression{
																																																																													ShiftExpression: javascript.ShiftExpression{
																																																																														AdditiveExpression: javascript.AdditiveExpression{
																																																																															MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																	UnaryExpression: javascript.UnaryExpression{
																																																																																		UpdateExpression: javascript.UpdateExpression{
																																																																																			LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																				NewExpression: &javascript.NewExpression{
																																																																																					MemberExpression: javascript.MemberExpression{
																																																																																						PrimaryExpression: &javascript.PrimaryExpression{
																																																																																							IdentifierReference: &javascript.Token{
																																																																																								Token: parser.Token{
																																																																																									Type: javascript.TokenIdentifier,
																																																																																									Data: "window",
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
																																																																									},
																																																																								},
																																																																							},
																																																																						},
																																																																					},
																																																																				}, {
																																																																					ConditionalExpression: &javascript.ConditionalExpression{
																																																																						LogicalORExpression: javascript.LogicalORExpression{
																																																																							LogicalANDExpression: javascript.LogicalANDExpression{
																																																																								BitwiseORExpression: javascript.BitwiseORExpression{
																																																																									BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																										BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																											EqualityExpression: javascript.EqualityExpression{
																																																																												RelationalExpression: javascript.RelationalExpression{
																																																																													ShiftExpression: javascript.ShiftExpression{
																																																																														AdditiveExpression: javascript.AdditiveExpression{
																																																																															MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																	UnaryExpression: javascript.UnaryExpression{
																																																																																		UpdateExpression: javascript.UpdateExpression{
																																																																																			LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																				NewExpression: &javascript.NewExpression{
																																																																																					MemberExpression: javascript.MemberExpression{
																																																																																						PrimaryExpression: &javascript.PrimaryExpression{
																																																																																							ObjectLiteral: &javascript.ObjectLiteral{
																																																																																								PropertyDefinitionList: []javascript.PropertyDefinition{{
																																																																																									PropertyName: &javascript.PropertyName{
																																																																																										LiteralPropertyName: &javascript.Token{
																																																																																											Token: parser.Token{
																																																																																												Type: javascript.TokenStringLiteral,
																																																																																												Data: "\"include\"",
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
																																																																																																	RelationalExpression: javascript.RelationalExpression{
																																																																																																		ShiftExpression: javascript.ShiftExpression{
																																																																																																			AdditiveExpression: javascript.AdditiveExpression{
																																																																																																				MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																					ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																						UnaryExpression: javascript.UnaryExpression{
																																																																																																							UpdateExpression: javascript.UpdateExpression{
																																																																																																								LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																									NewExpression: &javascript.NewExpression{
																																																																																																										MemberExpression: javascript.MemberExpression{
																																																																																																											PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																												ObjectLiteral: &javascript.ObjectLiteral{
																																																																																																													PropertyDefinitionList: []javascript.PropertyDefinition{{
																																																																																																														PropertyName: &javascript.PropertyName{
																																																																																																															LiteralPropertyName: &javascript.Token{
																																																																																																																Token: parser.Token{
																																																																																																																	Type: javascript.TokenIdentifier,
																																																																																																																	Data: "value",
																																																																																																																},
																																																																																																															},
																																																																																																														},
																																																																																																														AssignmentExpression: &javascript.AssignmentExpression{
																																																																																																															ArrowFunction: &javascript.ArrowFunction{
																																																																																																																CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
																																																																																																																	Expressions: []javascript.AssignmentExpression{{
																																																																																																																		ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																			LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																				LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																					BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																						BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																							BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																								EqualityExpression: javascript.EqualityExpression{
																																																																																																																									RelationalExpression: javascript.RelationalExpression{
																																																																																																																										ShiftExpression: javascript.ShiftExpression{
																																																																																																																											AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																												MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																													ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																														UnaryExpression: javascript.UnaryExpression{
																																																																																																																															UpdateExpression: javascript.UpdateExpression{
																																																																																																																																LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																	NewExpression: &javascript.NewExpression{
																																																																																																																																		MemberExpression: javascript.MemberExpression{
																																																																																																																																			PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																				IdentifierReference: &javascript.Token{
																																																																																																																																					Token: parser.Token{
																																																																																																																																						Type: javascript.TokenIdentifier,
																																																																																																																																						Data: "url",
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
																																																																																																																						},
																																																																																																																					},
																																																																																																																				},
																																																																																																																			},
																																																																																																																		},
																																																																																																																	}, {
																																																																																																																		ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																			LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																				LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																					BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																						BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																							BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																								EqualityExpression: javascript.EqualityExpression{
																																																																																																																									RelationalExpression: javascript.RelationalExpression{
																																																																																																																										ShiftExpression: javascript.ShiftExpression{
																																																																																																																											AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																												MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																													ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																														UnaryExpression: javascript.UnaryExpression{
																																																																																																																															UpdateExpression: javascript.UpdateExpression{
																																																																																																																																LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																	NewExpression: &javascript.NewExpression{
																																																																																																																																		MemberExpression: javascript.MemberExpression{
																																																																																																																																			PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																				IdentifierReference: &javascript.Token{
																																																																																																																																					Token: parser.Token{
																																																																																																																																						Type: javascript.TokenIdentifier,
																																																																																																																																						Data: "now",
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
																																																																																																																						},
																																																																																																																					},
																																																																																																																				},
																																																																																																																			},
																																																																																																																		},
																																																																																																																	},
																																																																																																																	},
																																																																																																																},
																																																																																																																FunctionBody: &javascript.Block{
																																																																																																																	StatementList: []javascript.StatementListItem{{
																																																																																																																		Declaration: &javascript.Declaration{
																																																																																																																			LexicalDeclaration: &javascript.LexicalDeclaration{
																																																																																																																				LetOrConst: javascript.Const,
																																																																																																																				BindingList: []javascript.LexicalBinding{{
																																																																																																																					BindingIdentifier: &javascript.Token{
																																																																																																																						Token: parser.Token{
																																																																																																																							Type: javascript.TokenIdentifier,
																																																																																																																							Data: "aURL",
																																																																																																																						},
																																																																																																																					},
																																																																																																																					Initializer: &javascript.AssignmentExpression{
																																																																																																																						ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																							LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																								LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																									BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																										BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																											BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																												EqualityExpression: javascript.EqualityExpression{
																																																																																																																													RelationalExpression: javascript.RelationalExpression{
																																																																																																																														ShiftExpression: javascript.ShiftExpression{
																																																																																																																															AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																	ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																		UnaryExpression: javascript.UnaryExpression{
																																																																																																																																			UpdateExpression: javascript.UpdateExpression{
																																																																																																																																				LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																					CallExpression: &javascript.CallExpression{
																																																																																																																																						MemberExpression: &javascript.MemberExpression{
																																																																																																																																							PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																								IdentifierReference: &javascript.Token{
																																																																																																																																									Token: parser.Token{
																																																																																																																																										Type: javascript.TokenIdentifier,
																																																																																																																																										Data: "toURL",
																																																																																																																																									},
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																						},
																																																																																																																																						Arguments: &javascript.Arguments{
																																																																																																																																							ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																																								ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																									LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																										LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																											BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																												BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																													BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																														EqualityExpression: javascript.EqualityExpression{
																																																																																																																																															RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																	AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																		MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																			ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																				UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																					UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																						LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																							NewExpression: &javascript.NewExpression{
																																																																																																																																																								MemberExpression: javascript.MemberExpression{
																																																																																																																																																									PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																										IdentifierReference: &javascript.Token{
																																																																																																																																																											Token: parser.Token{
																																																																																																																																																												Type: javascript.TokenIdentifier,
																																																																																																																																																												Data: "url",
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
																																																																																																																	}, {
																																																																																																																		Statement: &javascript.Statement{
																																																																																																																			IfStatement: &javascript.IfStatement{
																																																																																																																				Expression: javascript.Expression{
																																																																																																																					Expressions: []javascript.AssignmentExpression{{
																																																																																																																						ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																							LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																								LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																									BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																										BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																											BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																												EqualityExpression: javascript.EqualityExpression{
																																																																																																																													RelationalExpression: javascript.RelationalExpression{
																																																																																																																														ShiftExpression: javascript.ShiftExpression{
																																																																																																																															AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																	ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																		UnaryExpression: javascript.UnaryExpression{
																																																																																																																																			UpdateExpression: javascript.UpdateExpression{
																																																																																																																																				LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																					CallExpression: &javascript.CallExpression{
																																																																																																																																						MemberExpression: &javascript.MemberExpression{
																																																																																																																																							MemberExpression: &javascript.MemberExpression{
																																																																																																																																								PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																									IdentifierReference: &javascript.Token{
																																																																																																																																										Token: parser.Token{
																																																																																																																																											Type: javascript.TokenIdentifier,
																																																																																																																																											Data: "included",
																																																																																																																																										},
																																																																																																																																									},
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																							IdentifierName: &javascript.Token{
																																																																																																																																								Token: parser.Token{
																																																																																																																																									Type: javascript.TokenIdentifier,
																																																																																																																																									Data: "has",
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																						},
																																																																																																																																						Arguments: &javascript.Arguments{
																																																																																																																																							ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																																								ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																									LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																										LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																											BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																												BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																													BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																														EqualityExpression: javascript.EqualityExpression{
																																																																																																																																															RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																	AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																		MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																			ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																				UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																					UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																						LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																							NewExpression: &javascript.NewExpression{
																																																																																																																																																								MemberExpression: javascript.MemberExpression{
																																																																																																																																																									PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																										IdentifierReference: &javascript.Token{
																																																																																																																																																											Token: parser.Token{
																																																																																																																																																												Type: javascript.TokenIdentifier,
																																																																																																																																																												Data: "aURL",
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
																																																																																																																				Statement: javascript.Statement{
																																																																																																																					BlockStatement: &javascript.Block{
																																																																																																																						StatementList: []javascript.StatementListItem{{
																																																																																																																							Statement: &javascript.Statement{
																																																																																																																								IfStatement: &javascript.IfStatement{
																																																																																																																									Expression: javascript.Expression{
																																																																																																																										Expressions: []javascript.AssignmentExpression{{
																																																																																																																											ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																												LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																													LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																														BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																															BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																	EqualityExpression: javascript.EqualityExpression{
																																																																																																																																		RelationalExpression: javascript.RelationalExpression{
																																																																																																																																			ShiftExpression: javascript.ShiftExpression{
																																																																																																																																				AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																					MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																						ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																							UnaryExpression: javascript.UnaryExpression{
																																																																																																																																								UpdateExpression: javascript.UpdateExpression{
																																																																																																																																									LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																										NewExpression: &javascript.NewExpression{
																																																																																																																																											MemberExpression: javascript.MemberExpression{
																																																																																																																																												PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																													IdentifierReference: &javascript.Token{
																																																																																																																																														Token: parser.Token{
																																																																																																																																															Type: javascript.TokenIdentifier,
																																																																																																																																															Data: "now",
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
																																																																																																																															},
																																																																																																																														},
																																																																																																																													},
																																																																																																																												},
																																																																																																																											},
																																																																																																																										},
																																																																																																																										},
																																																																																																																									},
																																																																																																																									Statement: javascript.Statement{
																																																																																																																										BlockStatement: &javascript.Block{
																																																																																																																											StatementList: []javascript.StatementListItem{{
																																																																																																																												Statement: &javascript.Statement{
																																																																																																																													Type: javascript.StatementReturn,
																																																																																																																													ExpressionStatement: &javascript.Expression{
																																																																																																																														Expressions: []javascript.AssignmentExpression{{
																																																																																																																															ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																	LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																		BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																			BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																				BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																					EqualityExpression: javascript.EqualityExpression{
																																																																																																																																						RelationalExpression: javascript.RelationalExpression{
																																																																																																																																							ShiftExpression: javascript.ShiftExpression{
																																																																																																																																								AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																									MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																										ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																											UnaryExpression: javascript.UnaryExpression{
																																																																																																																																												UpdateExpression: javascript.UpdateExpression{
																																																																																																																																													LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																														CallExpression: &javascript.CallExpression{
																																																																																																																																															MemberExpression: &javascript.MemberExpression{
																																																																																																																																																MemberExpression: &javascript.MemberExpression{
																																																																																																																																																	PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																		IdentifierReference: &javascript.Token{
																																																																																																																																																			Token: parser.Token{
																																																																																																																																																				Type: javascript.TokenIdentifier,
																																																																																																																																																				Data: "included",
																																																																																																																																																			},
																																																																																																																																																		},
																																																																																																																																																	},
																																																																																																																																																},
																																																																																																																																																IdentifierName: &javascript.Token{
																																																																																																																																																	Token: parser.Token{
																																																																																																																																																		Type: javascript.TokenIdentifier,
																																																																																																																																																		Data: "get",
																																																																																																																																																	},
																																																																																																																																																},
																																																																																																																																															},
																																																																																																																																															Arguments: &javascript.Arguments{
																																																																																																																																																ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																																																	ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																																		LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																																			LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																																				BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																																					BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																																						BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																																							EqualityExpression: javascript.EqualityExpression{
																																																																																																																																																								RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																									ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																										AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																											MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																												ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																													UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																														UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																															LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																																NewExpression: &javascript.NewExpression{
																																																																																																																																																																	MemberExpression: javascript.MemberExpression{
																																																																																																																																																																		PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																																			IdentifierReference: &javascript.Token{
																																																																																																																																																																				Token: parser.Token{
																																																																																																																																																																					Type: javascript.TokenIdentifier,
																																																																																																																																																																					Data: "aURL",
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
																																																																																																																										},
																																																																																																																									},
																																																																																																																								},
																																																																																																																							},
																																																																																																																						}, {
																																																																																																																							Statement: &javascript.Statement{
																																																																																																																								Type: javascript.StatementReturn,
																																																																																																																								ExpressionStatement: &javascript.Expression{
																																																																																																																									Expressions: []javascript.AssignmentExpression{{
																																																																																																																										ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																											LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																												LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																													BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																														BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																															BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																EqualityExpression: javascript.EqualityExpression{
																																																																																																																																	RelationalExpression: javascript.RelationalExpression{
																																																																																																																																		ShiftExpression: javascript.ShiftExpression{
																																																																																																																																			AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																				MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																					ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																						UnaryExpression: javascript.UnaryExpression{
																																																																																																																																							UpdateExpression: javascript.UpdateExpression{
																																																																																																																																								LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																									CallExpression: &javascript.CallExpression{
																																																																																																																																										MemberExpression: &javascript.MemberExpression{
																																																																																																																																											MemberExpression: &javascript.MemberExpression{
																																																																																																																																												PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																													IdentifierReference: &javascript.Token{
																																																																																																																																														Token: parser.Token{
																																																																																																																																															Type: javascript.TokenIdentifier,
																																																																																																																																															Data: "Promise",
																																																																																																																																														},
																																																																																																																																													},
																																																																																																																																												},
																																																																																																																																											},
																																																																																																																																											IdentifierName: &javascript.Token{
																																																																																																																																												Token: parser.Token{
																																																																																																																																													Type: javascript.TokenIdentifier,
																																																																																																																																													Data: "resolve",
																																																																																																																																												},
																																																																																																																																											},
																																																																																																																																										},
																																																																																																																																										Arguments: &javascript.Arguments{
																																																																																																																																											ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																																												ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																													LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																														LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																															BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																																BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																																	BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																																		EqualityExpression: javascript.EqualityExpression{
																																																																																																																																																			RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																				ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																					AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																						MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																							ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																								UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																									UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																										LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																											CallExpression: &javascript.CallExpression{
																																																																																																																																																												MemberExpression: &javascript.MemberExpression{
																																																																																																																																																													MemberExpression: &javascript.MemberExpression{
																																																																																																																																																														PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																															IdentifierReference: &javascript.Token{
																																																																																																																																																																Token: parser.Token{
																																																																																																																																																																	Type: javascript.TokenIdentifier,
																																																																																																																																																																	Data: "included",
																																																																																																																																																																},
																																																																																																																																																															},
																																																																																																																																																														},
																																																																																																																																																													},
																																																																																																																																																													IdentifierName: &javascript.Token{
																																																																																																																																																														Token: parser.Token{
																																																																																																																																																															Type: javascript.TokenIdentifier,
																																																																																																																																																															Data: "get",
																																																																																																																																																														},
																																																																																																																																																													},
																																																																																																																																																												},
																																																																																																																																																												Arguments: &javascript.Arguments{
																																																																																																																																																													ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																																																														ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																																															LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																																																LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																																																	BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																																																		BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																																																			BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																																																				EqualityExpression: javascript.EqualityExpression{
																																																																																																																																																																					RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																																						ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																																							AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																																								MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																																									ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																																										UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																																											UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																																												LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																																													NewExpression: &javascript.NewExpression{
																																																																																																																																																																														MemberExpression: javascript.MemberExpression{
																																																																																																																																																																															PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																																																IdentifierReference: &javascript.Token{
																																																																																																																																																																																	Token: parser.Token{
																																																																																																																																																																																		Type: javascript.TokenIdentifier,
																																																																																																																																																																																		Data: "aURL",
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
																																																																																																																								},
																																																																																																																							},
																																																																																																																						},
																																																																																																																						},
																																																																																																																					},
																																																																																																																				},
																																																																																																																			},
																																																																																																																		},
																																																																																																																	}, {
																																																																																																																		Statement: &javascript.Statement{
																																																																																																																			Type: javascript.StatementReturn,
																																																																																																																			ExpressionStatement: &javascript.Expression{
																																																																																																																				Expressions: []javascript.AssignmentExpression{{
																																																																																																																					ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																						LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																							LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																								BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																									BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																										BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																											EqualityExpression: javascript.EqualityExpression{
																																																																																																																												RelationalExpression: javascript.RelationalExpression{
																																																																																																																													ShiftExpression: javascript.ShiftExpression{
																																																																																																																														AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																															MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																	UnaryExpression: javascript.UnaryExpression{
																																																																																																																																		UpdateExpression: javascript.UpdateExpression{
																																																																																																																																			LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																				CallExpression: &javascript.CallExpression{
																																																																																																																																					ImportCall: &javascript.AssignmentExpression{
																																																																																																																																						ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																							LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																								LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																									BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																										BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																											BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																												EqualityExpression: javascript.EqualityExpression{
																																																																																																																																													RelationalExpression: javascript.RelationalExpression{
																																																																																																																																														ShiftExpression: javascript.ShiftExpression{
																																																																																																																																															AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																	ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																		UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																			UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																				LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																					NewExpression: &javascript.NewExpression{
																																																																																																																																																						MemberExpression: javascript.MemberExpression{
																																																																																																																																																							PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																								IdentifierReference: &javascript.Token{
																																																																																																																																																									Token: parser.Token{
																																																																																																																																																										Type: javascript.TokenIdentifier,
																																																																																																																																																										Data: "url",
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
																																																																																																},
																																																																																															},
																																																																																														},
																																																																																													},
																																																																																												},
																																																																																											},
																																																																																										},
																																																																																									},
																																																																																								}, {
																																																																																									PropertyName: &javascript.PropertyName{
																																																																																										LiteralPropertyName: &javascript.Token{
																																																																																											Token: parser.Token{
																																																																																												Type: javascript.TokenStringLiteral,
																																																																																												Data: "\"pageLoad\"",
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
																																																																																																	RelationalExpression: javascript.RelationalExpression{
																																																																																																		ShiftExpression: javascript.ShiftExpression{
																																																																																																			AdditiveExpression: javascript.AdditiveExpression{
																																																																																																				MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																					ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																						UnaryExpression: javascript.UnaryExpression{
																																																																																																							UpdateExpression: javascript.UpdateExpression{
																																																																																																								LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																									NewExpression: &javascript.NewExpression{
																																																																																																										MemberExpression: javascript.MemberExpression{
																																																																																																											PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																												ObjectLiteral: &javascript.ObjectLiteral{
																																																																																																													PropertyDefinitionList: []javascript.PropertyDefinition{{
																																																																																																														PropertyName: &javascript.PropertyName{
																																																																																																															LiteralPropertyName: &javascript.Token{
																																																																																																																Token: parser.Token{
																																																																																																																	Type: javascript.TokenIdentifier,
																																																																																																																	Data: "value",
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
																																																																																																																						EqualityExpression: &javascript.EqualityExpression{
																																																																																																																							RelationalExpression: javascript.RelationalExpression{
																																																																																																																								ShiftExpression: javascript.ShiftExpression{
																																																																																																																									AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																										MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																											ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																												UnaryExpression: javascript.UnaryExpression{
																																																																																																																													UpdateExpression: javascript.UpdateExpression{
																																																																																																																														LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																															NewExpression: &javascript.NewExpression{
																																																																																																																																MemberExpression: javascript.MemberExpression{
																																																																																																																																	MemberExpression: &javascript.MemberExpression{
																																																																																																																																		PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																			IdentifierReference: &javascript.Token{
																																																																																																																																				Token: parser.Token{
																																																																																																																																					Type: javascript.TokenIdentifier,
																																																																																																																																					Data: "document",
																																																																																																																																				},
																																																																																																																																			},
																																																																																																																																		},
																																																																																																																																	},
																																																																																																																																	IdentifierName: &javascript.Token{
																																																																																																																																		Token: parser.Token{
																																																																																																																																			Type: javascript.TokenIdentifier,
																																																																																																																																			Data: "readyState",
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
																																																																																																																						EqualityOperator: 3,
																																																																																																																						RelationalExpression: javascript.RelationalExpression{
																																																																																																																							ShiftExpression: javascript.ShiftExpression{
																																																																																																																								AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																									MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																										ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																											UnaryExpression: javascript.UnaryExpression{
																																																																																																																												UpdateExpression: javascript.UpdateExpression{
																																																																																																																													LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																														NewExpression: &javascript.NewExpression{
																																																																																																																															MemberExpression: javascript.MemberExpression{
																																																																																																																																PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																	Literal: &javascript.Token{
																																																																																																																																		Token: parser.Token{
																																																																																																																																			Type: javascript.TokenStringLiteral,
																																																																																																																																			Data: "\"complete\"",
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
																																																																																																																			},
																																																																																																																		},
																																																																																																																	},
																																																																																																																},
																																																																																																																True: &javascript.AssignmentExpression{
																																																																																																																	ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																		LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																			LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																				BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																					BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																						BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																							EqualityExpression: javascript.EqualityExpression{
																																																																																																																								RelationalExpression: javascript.RelationalExpression{
																																																																																																																									ShiftExpression: javascript.ShiftExpression{
																																																																																																																										AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																											MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																												ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																													UnaryExpression: javascript.UnaryExpression{
																																																																																																																														UpdateExpression: javascript.UpdateExpression{
																																																																																																																															LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																CallExpression: &javascript.CallExpression{
																																																																																																																																	MemberExpression: &javascript.MemberExpression{
																																																																																																																																		MemberExpression: &javascript.MemberExpression{
																																																																																																																																			PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																				IdentifierReference: &javascript.Token{
																																																																																																																																					Token: parser.Token{
																																																																																																																																						Type: javascript.TokenIdentifier,
																																																																																																																																						Data: "Promise",
																																																																																																																																					},
																																																																																																																																				},
																																																																																																																																			},
																																																																																																																																		},
																																																																																																																																		IdentifierName: &javascript.Token{
																																																																																																																																			Token: parser.Token{
																																																																																																																																				Type: javascript.TokenIdentifier,
																																																																																																																																				Data: "resolve",
																																																																																																																																			},
																																																																																																																																		},
																																																																																																																																	},
																																																																																																																																	Arguments: &javascript.Arguments{},
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
																																																																																																																	},
																																																																																																																},
																																																																																																																False: &javascript.AssignmentExpression{
																																																																																																																	ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																		LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																			LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																				BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																					BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																						BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																							EqualityExpression: javascript.EqualityExpression{
																																																																																																																								RelationalExpression: javascript.RelationalExpression{
																																																																																																																									ShiftExpression: javascript.ShiftExpression{
																																																																																																																										AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																											MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																												ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																													UnaryExpression: javascript.UnaryExpression{
																																																																																																																														UpdateExpression: javascript.UpdateExpression{
																																																																																																																															LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																NewExpression: &javascript.NewExpression{
																																																																																																																																	MemberExpression: javascript.MemberExpression{
																																																																																																																																		MemberExpression: &javascript.MemberExpression{
																																																																																																																																			PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																				IdentifierReference: &javascript.Token{
																																																																																																																																					Token: parser.Token{
																																																																																																																																						Type: javascript.TokenIdentifier,
																																																																																																																																						Data: "Promise",
																																																																																																																																					},
																																																																																																																																				},
																																																																																																																																			},
																																																																																																																																		},
																																																																																																																																		Arguments: &javascript.Arguments{
																																																																																																																																			ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																																				ArrowFunction: &javascript.ArrowFunction{
																																																																																																																																					BindingIdentifier: &javascript.Token{
																																																																																																																																						Token: parser.Token{
																																																																																																																																							Type: javascript.TokenIdentifier,
																																																																																																																																							Data: "successFn",
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
																																																																																																																																													RelationalExpression: javascript.RelationalExpression{
																																																																																																																																														ShiftExpression: javascript.ShiftExpression{
																																																																																																																																															AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																	ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																		UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																			UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																				LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																					CallExpression: &javascript.CallExpression{
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
																																																																																																																																																									Data: "addEventListener",
																																																																																																																																																								},
																																																																																																																																																							},
																																																																																																																																																						},
																																																																																																																																																						Arguments: &javascript.Arguments{
																																																																																																																																																							ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																																																								ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																																									LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																																										LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																																											BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																																												BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																																													BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																																														EqualityExpression: javascript.EqualityExpression{
																																																																																																																																																															RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																																ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																																	AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																																		MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																																			ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																																				UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																																					UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																																						LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																																							NewExpression: &javascript.NewExpression{
																																																																																																																																																																								MemberExpression: javascript.MemberExpression{
																																																																																																																																																																									PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																																										Literal: &javascript.Token{
																																																																																																																																																																											Token: parser.Token{
																																																																																																																																																																												Type: javascript.TokenStringLiteral,
																																																																																																																																																																												Data: "\"load\"",
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
																																																																																																																																																												},
																																																																																																																																																											},
																																																																																																																																																										},
																																																																																																																																																									},
																																																																																																																																																								},
																																																																																																																																																							}, {
																																																																																																																																																								ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																																									LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																																										LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																																											BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																																												BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																																													BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																																														EqualityExpression: javascript.EqualityExpression{
																																																																																																																																																															RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																																ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																																	AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																																		MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																																			ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																																				UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																																					UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																																						LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																																							NewExpression: &javascript.NewExpression{
																																																																																																																																																																								MemberExpression: javascript.MemberExpression{
																																																																																																																																																																									PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																																										IdentifierReference: &javascript.Token{
																																																																																																																																																																											Token: parser.Token{
																																																																																																																																																																												Type: javascript.TokenIdentifier,
																																																																																																																																																																												Data: "successFn",
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
																																															}, {
																																																Statement: &javascript.Statement{
																																																	Type: javascript.StatementReturn,
																																																	ExpressionStatement: &javascript.Expression{
																																																		Expressions: []javascript.AssignmentExpression{{
																																																			ArrowFunction: &javascript.ArrowFunction{
																																																				CoverParenthesizedExpressionAndArrowParameterList: &javascript.CoverParenthesizedExpressionAndArrowParameterList{
																																																					Expressions: []javascript.AssignmentExpression{{
																																																						ConditionalExpression: &javascript.ConditionalExpression{
																																																							LogicalORExpression: javascript.LogicalORExpression{
																																																								LogicalANDExpression: javascript.LogicalANDExpression{
																																																									BitwiseORExpression: javascript.BitwiseORExpression{
																																																										BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																											BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																												EqualityExpression: javascript.EqualityExpression{
																																																													RelationalExpression: javascript.RelationalExpression{
																																																														ShiftExpression: javascript.ShiftExpression{
																																																															AdditiveExpression: javascript.AdditiveExpression{
																																																																MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																	ExponentiationExpression: javascript.ExponentiationExpression{
																																																																		UnaryExpression: javascript.UnaryExpression{
																																																																			UpdateExpression: javascript.UpdateExpression{
																																																																				LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																					NewExpression: &javascript.NewExpression{
																																																																						MemberExpression: javascript.MemberExpression{
																																																																							PrimaryExpression: &javascript.PrimaryExpression{
																																																																								ArrayLiteral: &javascript.ArrayLiteral{
																																																																									ElementList: []javascript.AssignmentExpression{{
																																																																										ConditionalExpression: &javascript.ConditionalExpression{
																																																																											LogicalORExpression: javascript.LogicalORExpression{
																																																																												LogicalANDExpression: javascript.LogicalANDExpression{
																																																																													BitwiseORExpression: javascript.BitwiseORExpression{
																																																																														BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																															BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																EqualityExpression: javascript.EqualityExpression{
																																																																																	RelationalExpression: javascript.RelationalExpression{
																																																																																		ShiftExpression: javascript.ShiftExpression{
																																																																																			AdditiveExpression: javascript.AdditiveExpression{
																																																																																				MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																					ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																						UnaryExpression: javascript.UnaryExpression{
																																																																																							UpdateExpression: javascript.UpdateExpression{
																																																																																								LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																									NewExpression: &javascript.NewExpression{
																																																																																										MemberExpression: javascript.MemberExpression{
																																																																																											PrimaryExpression: &javascript.PrimaryExpression{
																																																																																												IdentifierReference: &javascript.Token{
																																																																																													Token: parser.Token{
																																																																																														Type: javascript.TokenIdentifier,
																																																																																														Data: "url",
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
																																																																														},
																																																																													},
																																																																												},
																																																																											},
																																																																										},
																																																																									}, {
																																																																										ConditionalExpression: &javascript.ConditionalExpression{
																																																																											LogicalORExpression: javascript.LogicalORExpression{
																																																																												LogicalANDExpression: javascript.LogicalANDExpression{
																																																																													BitwiseORExpression: javascript.BitwiseORExpression{
																																																																														BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																															BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																EqualityExpression: javascript.EqualityExpression{
																																																																																	RelationalExpression: javascript.RelationalExpression{
																																																																																		ShiftExpression: javascript.ShiftExpression{
																																																																																			AdditiveExpression: javascript.AdditiveExpression{
																																																																																				MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																					ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																						UnaryExpression: javascript.UnaryExpression{
																																																																																							UpdateExpression: javascript.UpdateExpression{
																																																																																								LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																									NewExpression: &javascript.NewExpression{
																																																																																										MemberExpression: javascript.MemberExpression{
																																																																																											PrimaryExpression: &javascript.PrimaryExpression{
																																																																																												IdentifierReference: &javascript.Token{
																																																																																													Token: parser.Token{
																																																																																														Type: javascript.TokenIdentifier,
																																																																																														Data: "fn",
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
																																																				AssignmentExpression: &javascript.AssignmentExpression{
																																																					ConditionalExpression: &javascript.ConditionalExpression{
																																																						LogicalORExpression: javascript.LogicalORExpression{
																																																							LogicalANDExpression: javascript.LogicalANDExpression{
																																																								BitwiseORExpression: javascript.BitwiseORExpression{
																																																									BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																										BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																											EqualityExpression: javascript.EqualityExpression{
																																																												RelationalExpression: javascript.RelationalExpression{
																																																													ShiftExpression: javascript.ShiftExpression{
																																																														AdditiveExpression: javascript.AdditiveExpression{
																																																															MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																ExponentiationExpression: javascript.ExponentiationExpression{
																																																																	UnaryExpression: javascript.UnaryExpression{
																																																																		UpdateExpression: javascript.UpdateExpression{
																																																																			LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																				CallExpression: &javascript.CallExpression{
																																																																					MemberExpression: &javascript.MemberExpression{
																																																																						MemberExpression: &javascript.MemberExpression{
																																																																							PrimaryExpression: &javascript.PrimaryExpression{
																																																																								IdentifierReference: &javascript.Token{
																																																																									Token: parser.Token{
																																																																										Type: javascript.TokenIdentifier,
																																																																										Data: "included",
																																																																									},
																																																																								},
																																																																							},
																																																																						},
																																																																						IdentifierName: &javascript.Token{
																																																																							Token: parser.Token{
																																																																								Type: javascript.TokenIdentifier,
																																																																								Data: "set",
																																																																							},
																																																																						},
																																																																					},
																																																																					Arguments: &javascript.Arguments{
																																																																						ArgumentList: []javascript.AssignmentExpression{{
																																																																							ConditionalExpression: &javascript.ConditionalExpression{
																																																																								LogicalORExpression: javascript.LogicalORExpression{
																																																																									LogicalANDExpression: javascript.LogicalANDExpression{
																																																																										BitwiseORExpression: javascript.BitwiseORExpression{
																																																																											BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																												BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																													EqualityExpression: javascript.EqualityExpression{
																																																																														RelationalExpression: javascript.RelationalExpression{
																																																																															ShiftExpression: javascript.ShiftExpression{
																																																																																AdditiveExpression: javascript.AdditiveExpression{
																																																																																	MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																		ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																			UnaryExpression: javascript.UnaryExpression{
																																																																																				UpdateExpression: javascript.UpdateExpression{
																																																																																					LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																						CallExpression: &javascript.CallExpression{
																																																																																							MemberExpression: &javascript.MemberExpression{
																																																																																								PrimaryExpression: &javascript.PrimaryExpression{
																																																																																									IdentifierReference: &javascript.Token{
																																																																																										Token: parser.Token{
																																																																																											Type: javascript.TokenIdentifier,
																																																																																											Data: "toURL",
																																																																																										},
																																																																																									},
																																																																																								},
																																																																																							},
																																																																																							Arguments: &javascript.Arguments{
																																																																																								ArgumentList: []javascript.AssignmentExpression{{
																																																																																									ConditionalExpression: &javascript.ConditionalExpression{
																																																																																										LogicalORExpression: javascript.LogicalORExpression{
																																																																																											LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																												BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																													BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																														BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																															EqualityExpression: javascript.EqualityExpression{
																																																																																																RelationalExpression: javascript.RelationalExpression{
																																																																																																	ShiftExpression: javascript.ShiftExpression{
																																																																																																		AdditiveExpression: javascript.AdditiveExpression{
																																																																																																			MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																				ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																					UnaryExpression: javascript.UnaryExpression{
																																																																																																						UpdateExpression: javascript.UpdateExpression{
																																																																																																							LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																								NewExpression: &javascript.NewExpression{
																																																																																																									MemberExpression: javascript.MemberExpression{
																																																																																																										PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																											IdentifierReference: &javascript.Token{
																																																																																																												Token: parser.Token{
																																																																																																													Type: javascript.TokenIdentifier,
																																																																																																													Data: "url",
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
																																																																															},
																																																																														},
																																																																													},
																																																																												},
																																																																											},
																																																																										},
																																																																									},
																																																																								},
																																																																							},
																																																																						}, {
																																																																							ConditionalExpression: &javascript.ConditionalExpression{
																																																																								LogicalORExpression: javascript.LogicalORExpression{
																																																																									LogicalANDExpression: javascript.LogicalANDExpression{
																																																																										BitwiseORExpression: javascript.BitwiseORExpression{
																																																																											BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																												BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																													EqualityExpression: javascript.EqualityExpression{
																																																																														RelationalExpression: javascript.RelationalExpression{
																																																																															ShiftExpression: javascript.ShiftExpression{
																																																																																AdditiveExpression: javascript.AdditiveExpression{
																																																																																	MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																		ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																			UnaryExpression: javascript.UnaryExpression{
																																																																																				UpdateExpression: javascript.UpdateExpression{
																																																																																					LeftHandSideExpression: &javascript.LeftHandSideExpression{
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
																																																																																										Data: "defineProperties",
																																																																																									},
																																																																																								},
																																																																																							},
																																																																																							Arguments: &javascript.Arguments{
																																																																																								ArgumentList: []javascript.AssignmentExpression{{
																																																																																									ConditionalExpression: &javascript.ConditionalExpression{
																																																																																										LogicalORExpression: javascript.LogicalORExpression{
																																																																																											LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																												BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																													BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																														BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																															EqualityExpression: javascript.EqualityExpression{
																																																																																																RelationalExpression: javascript.RelationalExpression{
																																																																																																	ShiftExpression: javascript.ShiftExpression{
																																																																																																		AdditiveExpression: javascript.AdditiveExpression{
																																																																																																			MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																				ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																					UnaryExpression: javascript.UnaryExpression{
																																																																																																						UpdateExpression: javascript.UpdateExpression{
																																																																																																							LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																								NewExpression: &javascript.NewExpression{
																																																																																																									MemberExpression: javascript.MemberExpression{
																																																																																																										PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																											ObjectLiteral: &javascript.ObjectLiteral{},
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
																																																																																											},
																																																																																										},
																																																																																									},
																																																																																								}, {
																																																																																									ConditionalExpression: &javascript.ConditionalExpression{
																																																																																										LogicalORExpression: javascript.LogicalORExpression{
																																																																																											LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																												BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																													BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																														BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																															EqualityExpression: javascript.EqualityExpression{
																																																																																																RelationalExpression: javascript.RelationalExpression{
																																																																																																	ShiftExpression: javascript.ShiftExpression{
																																																																																																		AdditiveExpression: javascript.AdditiveExpression{
																																																																																																			MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																				ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																					UnaryExpression: javascript.UnaryExpression{
																																																																																																						UpdateExpression: javascript.UpdateExpression{
																																																																																																							LeftHandSideExpression: &javascript.LeftHandSideExpression{
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
																																																																																																												Data: "fromEntries",
																																																																																																											},
																																																																																																										},
																																																																																																									},
																																																																																																									Arguments: &javascript.Arguments{
																																																																																																										ArgumentList: []javascript.AssignmentExpression{{
																																																																																																											ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																												LogicalORExpression: javascript.LogicalORExpression{
																																																																																																													LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																														BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																															BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																	EqualityExpression: javascript.EqualityExpression{
																																																																																																																		RelationalExpression: javascript.RelationalExpression{
																																																																																																																			ShiftExpression: javascript.ShiftExpression{
																																																																																																																				AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																					MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																						ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																							UnaryExpression: javascript.UnaryExpression{
																																																																																																																								UpdateExpression: javascript.UpdateExpression{
																																																																																																																									LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																										CallExpression: &javascript.CallExpression{
																																																																																																																											CallExpression: &javascript.CallExpression{
																																																																																																																												CallExpression: &javascript.CallExpression{
																																																																																																																													MemberExpression: &javascript.MemberExpression{
																																																																																																																														MemberExpression: &javascript.MemberExpression{
																																																																																																																															PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																IdentifierReference: &javascript.Token{
																																																																																																																																	Token: parser.Token{
																																																																																																																																		Type: javascript.TokenIdentifier,
																																																																																																																																		Data: "Array",
																																																																																																																																	},
																																																																																																																																},
																																																																																																																															},
																																																																																																																														},
																																																																																																																														IdentifierName: &javascript.Token{
																																																																																																																															Token: parser.Token{
																																																																																																																																Type: javascript.TokenIdentifier,
																																																																																																																																Data: "from",
																																																																																																																															},
																																																																																																																														},
																																																																																																																													},
																																																																																																																													Arguments: &javascript.Arguments{
																																																																																																																														ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																															ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																	LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																		BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																			BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																				BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																					EqualityExpression: javascript.EqualityExpression{
																																																																																																																																						RelationalExpression: javascript.RelationalExpression{
																																																																																																																																							ShiftExpression: javascript.ShiftExpression{
																																																																																																																																								AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																									MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																										ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																											UnaryExpression: javascript.UnaryExpression{
																																																																																																																																												UpdateExpression: javascript.UpdateExpression{
																																																																																																																																													LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																														CallExpression: &javascript.CallExpression{
																																																																																																																																															MemberExpression: &javascript.MemberExpression{
																																																																																																																																																PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																	IdentifierReference: &javascript.Token{
																																																																																																																																																		Token: parser.Token{
																																																																																																																																																			Type: javascript.TokenIdentifier,
																																																																																																																																																			Data: "fn",
																																																																																																																																																		},
																																																																																																																																																	},
																																																																																																																																																},
																																																																																																																																															},
																																																																																																																																															Arguments: &javascript.Arguments{},
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
																																																																																																																															},
																																																																																																																														},
																																																																																																																														},
																																																																																																																													},
																																																																																																																												},
																																																																																																																												IdentifierName: &javascript.Token{
																																																																																																																													Token: parser.Token{
																																																																																																																														Type: javascript.TokenIdentifier,
																																																																																																																														Data: "map",
																																																																																																																													},
																																																																																																																												},
																																																																																																																											},
																																																																																																																											Arguments: &javascript.Arguments{
																																																																																																																												ArgumentList: []javascript.AssignmentExpression{{
																																																																																																																													ArrowFunction: &javascript.ArrowFunction{
																																																																																																																														BindingIdentifier: &javascript.Token{
																																																																																																																															Token: parser.Token{
																																																																																																																																Type: javascript.TokenIdentifier,
																																																																																																																																Data: "e",
																																																																																																																															},
																																																																																																																														},
																																																																																																																														FunctionBody: &javascript.Block{
																																																																																																																															StatementList: []javascript.StatementListItem{{
																																																																																																																																Statement: &javascript.Statement{
																																																																																																																																	ExpressionStatement: &javascript.Expression{
																																																																																																																																		Expressions: []javascript.AssignmentExpression{{
																																																																																																																																			LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																				NewExpression: &javascript.NewExpression{
																																																																																																																																					MemberExpression: javascript.MemberExpression{
																																																																																																																																						MemberExpression: &javascript.MemberExpression{
																																																																																																																																							MemberExpression: &javascript.MemberExpression{
																																																																																																																																								PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																									IdentifierReference: &javascript.Token{
																																																																																																																																										Token: parser.Token{
																																																																																																																																											Type: javascript.TokenIdentifier,
																																																																																																																																											Data: "e",
																																																																																																																																										},
																																																																																																																																									},
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																							Expression: &javascript.Expression{
																																																																																																																																								Expressions: []javascript.AssignmentExpression{{
																																																																																																																																									ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																										LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																											LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																												BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																													BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																														BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																															EqualityExpression: javascript.EqualityExpression{
																																																																																																																																																RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																	ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																		AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																			MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																				ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																					UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																						UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																							LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																								NewExpression: &javascript.NewExpression{
																																																																																																																																																									MemberExpression: javascript.MemberExpression{
																																																																																																																																																										PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																											Literal: &javascript.Token{
																																																																																																																																																												Token: parser.Token{
																																																																																																																																																													Type: javascript.TokenNumericLiteral,
																																																																																																																																																													Data: "1",
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
																																																																																																																																													},
																																																																																																																																												},
																																																																																																																																											},
																																																																																																																																										},
																																																																																																																																									},
																																																																																																																																								},
																																																																																																																																								},
																																																																																																																																							},
																																																																																																																																						},
																																																																																																																																						Expression: &javascript.Expression{
																																																																																																																																							Expressions: []javascript.AssignmentExpression{{
																																																																																																																																								ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																									LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																										LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																											BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																												BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																													BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																														EqualityExpression: javascript.EqualityExpression{
																																																																																																																																															RelationalExpression: javascript.RelationalExpression{
																																																																																																																																																ShiftExpression: javascript.ShiftExpression{
																																																																																																																																																	AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																																		MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																																			ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																				UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																					UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																						LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																							NewExpression: &javascript.NewExpression{
																																																																																																																																																								MemberExpression: javascript.MemberExpression{
																																																																																																																																																									PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																										Literal: &javascript.Token{
																																																																																																																																																											Token: parser.Token{
																																																																																																																																																												Type: javascript.TokenStringLiteral,
																																																																																																																																																												Data: "\"enumerable\"",
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
																																																																																																																																			AssignmentOperator: 1,
																																																																																																																																			AssignmentExpression: &javascript.AssignmentExpression{
																																																																																																																																				ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																					LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																						LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																							BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																								BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																									BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																										EqualityExpression: javascript.EqualityExpression{
																																																																																																																																											RelationalExpression: javascript.RelationalExpression{
																																																																																																																																												ShiftExpression: javascript.ShiftExpression{
																																																																																																																																													AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																														MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																															ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																																UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																	UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																		LeftHandSideExpression: &javascript.LeftHandSideExpression{
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
																																																																																																																																			},
																																																																																																																																		},
																																																																																																																																		},
																																																																																																																																	},
																																																																																																																																},
																																																																																																																															}, {
																																																																																																																																Statement: &javascript.Statement{
																																																																																																																																	Type: javascript.StatementReturn,
																																																																																																																																	ExpressionStatement: &javascript.Expression{
																																																																																																																																		Expressions: []javascript.AssignmentExpression{{
																																																																																																																																			ConditionalExpression: &javascript.ConditionalExpression{
																																																																																																																																				LogicalORExpression: javascript.LogicalORExpression{
																																																																																																																																					LogicalANDExpression: javascript.LogicalANDExpression{
																																																																																																																																						BitwiseORExpression: javascript.BitwiseORExpression{
																																																																																																																																							BitwiseXORExpression: javascript.BitwiseXORExpression{
																																																																																																																																								BitwiseANDExpression: javascript.BitwiseANDExpression{
																																																																																																																																									EqualityExpression: javascript.EqualityExpression{
																																																																																																																																										RelationalExpression: javascript.RelationalExpression{
																																																																																																																																											ShiftExpression: javascript.ShiftExpression{
																																																																																																																																												AdditiveExpression: javascript.AdditiveExpression{
																																																																																																																																													MultiplicativeExpression: javascript.MultiplicativeExpression{
																																																																																																																																														ExponentiationExpression: javascript.ExponentiationExpression{
																																																																																																																																															UnaryExpression: javascript.UnaryExpression{
																																																																																																																																																UpdateExpression: javascript.UpdateExpression{
																																																																																																																																																	LeftHandSideExpression: &javascript.LeftHandSideExpression{
																																																																																																																																																		NewExpression: &javascript.NewExpression{
																																																																																																																																																			MemberExpression: javascript.MemberExpression{
																																																																																																																																																				PrimaryExpression: &javascript.PrimaryExpression{
																																																																																																																																																					IdentifierReference: &javascript.Token{
																																																																																																																																																						Token: parser.Token{
																																																																																																																																																							Type: javascript.TokenIdentifier,
																																																																																																																																																							Data: "e",
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
	}
}
