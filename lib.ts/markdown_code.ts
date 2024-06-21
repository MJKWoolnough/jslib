import type {TokenFn, TokenType} from './parser.js';
import {createDocumentFragment} from './dom.js';
import {br, span} from './html.js';
import Parser, {processToEnd} from './parser.js';

export const [TokenWhitespace, TokenLineTerminator, TokenSingleLineComment, TokenMultiLineComment, TokenIdentifier, TokenPrivateIdentifier, TokenBooleanLiteral, TokenKeyword, TokenPunctuator, TokenNumericLiteral, TokenStringLiteral, TokenNoSubstitutionTemplate, TokenTemplateHead, TokenTemplateMiddle, TokenTemplateTail, TokenDivPunctuator, TokenRightBracePunctuator, TokenRegularExpressionLiteral, TokenNullLiteral, TokenFutureReservedWord] = Array.from({"length": 20}, n => n) as TokenType[];

export default (contents: string, fn: TokenFn, colours: Map<TokenType, string>, noPre = true) => {
	const nodes: HTMLElement[] = [];

	for (const tk of processToEnd(Parser(contents, fn))) {
		const colour = colours.get(tk.type);

		nodes.push(span(colour?.startsWith(".") ? {"class": colour} : {"style": colour ? "color: " + colour:  null}, tk.data));

		if (noPre && tk.type == TokenLineTerminator) {
			nodes.push(br());
		}
	}

	return createDocumentFragment(nodes);
};
