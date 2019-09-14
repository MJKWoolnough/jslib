package main

import (
	"fmt"
	"os"

	"vimagination.zapto.org/javascript"
	"vimagination.zapto.org/parser"
)

var (
	loader *javascript.Module
	array  *javascript.ArrayLiteral
)

func offer(url string, body []javascript.StatementListItem) {
	array.ElementList = append(array.ElementList, wrapLHS(&javascript.LeftHandSideExpression{
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
													Data: fmt.Sprintf("%q", url),
												},
											},
										},
									},
								},
							}),
							javascript.AssignmentExpression{
								ArrowFunction: &javascript.ArrowFunction{
									CoverParenthesizedExpressionAndArrowParameterList: new(javascript.CoverParenthesizedExpressionAndArrowParameterList),
									FunctionBody: &javascript.Block{
										StatementList: body,
									},
								},
							},
						},
					},
				},
			},
		},
	}))
}

func wrapLHS(lhs *javascript.LeftHandSideExpression) javascript.AssignmentExpression {
	a := javascript.AssignmentExpression{ConditionalExpression: new(javascript.ConditionalExpression)}
	a.ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.LeftHandSideExpression = lhs
	return a
}

func init() {
	m, err := javascript.ParseModule(parser.NewStringTokeniser(`[].forEach((() => {
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
	return ([url, fn]) => included.set(toURL(url), fn());
})());`))
	if err != nil {
		fmt.Fprintln(os.Stderr, "error parsing javascript loader: ", err)
		os.Exit(1)
	}
	loader = m
	array = m.ModuleListItems[0].StatementListItem.Statement.ExpressionStatement.Expressions[0].ConditionalExpression.LogicalORExpression.LogicalANDExpression.BitwiseORExpression.BitwiseXORExpression.BitwiseANDExpression.EqualityExpression.RelationalExpression.ShiftExpression.AdditiveExpression.MultiplicativeExpression.ExponentiationExpression.UnaryExpression.UpdateExpression.LeftHandSideExpression.CallExpression.MemberExpression.MemberExpression.PrimaryExpression.ArrayLiteral
}
