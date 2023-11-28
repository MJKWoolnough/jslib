export type TokenType = number;

export type PhraseType = number;

export const TokenDone: TokenType = -1,
TokenError: TokenType = -2,
PhraseDone: PhraseType = -1,
PhraseError: PhraseType = -2;

export type Token = {
	type: TokenType;
	data: string
}

export type Phrase = {
	type: PhraseType;
	data: Token[];
}

export type TokenFn = (p: Tokeniser) => [Token, TokenFn];

export type PhraserFn = (p: Phraser) => [Phrase, PhraserFn];

interface StringParser {
	next(): string;
	backup(): void;
	length(): number;
	get(): string;
}

interface ParserOrPhraser {
	(text: string | StringParser, parserFn: TokenFn): Generator<Token, Token>;
	(text: string | StringParser, parserFn: TokenFn, phraserFn: PhraserFn): Generator<Phrase, Phrase>;
}

class StrParser {
	#text: string;
	#pos = 0;
	#lastPos = 0;

	constructor(text: string) {
		this.#text = text;
	}

	next() {
		if (this.#pos === this.#text.length) {
			return "";
		}

		return this.#text.charAt(this.#pos++);
	}

	backup() {
		if (this.#pos > this.#lastPos) {
			this.#pos--;
		}
	}

	length() {
		return this.#pos - this.#lastPos;
	}

	get() {
		return this.#text.slice(this.#lastPos, this.#lastPos = this.#pos);
	}
}

export class CTokeniser {
	#sp: StringParser;

	constructor(sp: StringParser) {
		this.#sp = sp;
	}

	length() {
		return this.#sp.length();
	}

	get() {
		return this.#sp.get();
	}

	peek() {
		const c = this.#sp.next();
		this.#sp.backup();

		return c;
	}

	accept(chars: string) {
		if (!chars.includes(this.#sp.next())) {
			this.#sp.backup();

			return false;
		}

		return true;
	}

	acceptRun(chars: string) {
		while (true) {
			const c = this.#sp.next();

			if (!chars.includes(c)) {
				this.#sp.backup();

				return c;
			}
		}
	}

	except(chars: string) {
		const c = this.#sp.next();

		if (!c || chars.includes(c)) {
			this.#sp.backup();

			return false;
		}

		return true;
	}

	exceptRun(chars: string) {
		while (true) {
			const c = this.#sp.next();

			if (!c || chars.includes(c)) {
				this.#sp.backup();

				return c;
			}
		}
	}

	done(msg = "") {
		const done: () => [Token, TokenFn] = () => [{"type": TokenDone, "data": msg}, done];

		return done();
	}

	error(err = "unknown error") {
		const error: () => [Token, TokenFn] = () => [{"type": TokenError, "data": err}, error];

		return error();
	}
}

export type Tokeniser = CTokeniser;

export class CPhraser {
	#parser: CTokeniser;
	#fn: TokenFn;
	#tokens: Token[] = [];
	#ignoreLast = false;

	constructor(parser: CTokeniser, parserFn: TokenFn) {
		this.#parser = parser;
		this.#fn = parserFn;
	}

	#next() {
		if (this.#ignoreLast) {
			this.#ignoreLast = false;

			return this.#tokens.at(-1)!;
		}

		const [tk, nextFn] = this.#fn(this.#parser);

		this.#tokens.push(tk);
		this.#fn = nextFn;

		return tk;
	}

	#backup() {
		if (this.#tokens.length > 0 && !this.#ignoreLast) {
			this.#ignoreLast = true;
		}
	}

	length() {
		return this.#tokens.length - +this.#ignoreLast;
	}

	get() {
		const toRet = this.#tokens;

		this.#tokens = toRet.splice(this.#tokens.length - +this.#ignoreLast, 1);

		return toRet;
	}

	peek() {
		const tk = this.#next();

		this.#backup();

		return tk;
	}

	accept(...tokenTypes: TokenType[]) {
		if (!tokenTypes.includes(this.#next().type)) {
			this.#backup();

			return false;
		}

		return true;
	}

	acceptRun(...tokenTypes: TokenType[]) {
		while (true) {
			const tk = this.#next().type;

			if (!tokenTypes.includes(tk)) {
				this.#backup();

				return tk;
			}
		}
	}

	except(...tokenTypes: TokenType[]) {
		const tk = this.#next().type;

		if (tk < 0 || tokenTypes.includes(tk)) {
			this.#backup();

			return false;
		}

		return true;
	}

	exceptRun(...tokenTypes: TokenType[]) {
		while (true) {
			const tk = this.#next().type;

			if (tk < 0 || tokenTypes.includes(tk)) {
				this.#backup();

				return tk;
			}
		}
	}

	done(msg = "") {
		const done = () => [{"type": PhraseDone, "data": msg ? [{"type": TokenDone, "data": msg}] : []}, done];

		return done();
	}

	error(err = "unknown error") {
		const error = () => [{"type": PhraseError, "data": [{"type": TokenError, "data": err}]}, error];

		return error();
	}
}

export type Phraser = CPhraser;

export default (function* (text: string | StringParser, parserFn: TokenFn, phraserFn?: PhraserFn) {
	const parser = new CTokeniser(typeof text === "string" ? new StrParser(text) : text),
	      p = phraserFn ? new CPhraser(parser, parserFn) : parser;

	let fn = phraserFn ?? parserFn;

	while(true) {
		const [t, nextFn] = fn(p as any)

		yield t;

		fn = nextFn;
	}
} as ParserOrPhraser);
