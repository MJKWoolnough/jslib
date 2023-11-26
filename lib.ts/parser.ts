type TokenType = number;

type PhraseType = number;

export const TokenDone: TokenType = -1,
TokenError: TokenType = -2,
PhraseDone: PhraseType = -1,
PhraseError: PhraseType = -2;

type Token = {
	type: TokenType;
	data: string
}

type Phrase = {
	type: PhraseType;
	data: Token[];
}

type ParserFn = (p: Parser) => [Token, ParserFn];

type PhraserFn = (p: Phraser) => [Phrase, PhraserFn];

class Parser {
	#text: string;
	#pos = 0;
	#lastPos = 0;

	constructor(text: string) {
		this.#text = text;
	}

	#next() {
		if (this.#pos === this.#text.length) {
			return "";
		}

		return this.#text.charAt(this.#pos++);
	}

	#backup() {
		if (this.#pos > this.#lastPos) {
			this.#pos--;
		}
	}

	length() {
		return this.#pos - this.#lastPos;
	}

	get() {
		const str = this.#text.slice(this.#lastPos, this.#pos);

		this.#lastPos = this.#pos;

		return str;
	}

	peek() {
		const c = this.#next();
		this.#backup();

		return c;
	}

	accept(chars: string) {
		if (!chars.includes(this.#next())) {
			this.#backup();

			return false;
		}

		return true;
	}

	acceptRun(chars: string) {
		while (true) {
			const c = this.#next();

			if (!chars.includes(c)) {
				this.#backup();

				return c;
			}
		}
	}

	except(chars: string) {
		const c = this.#next();

		if (!c || chars.includes(c)) {
			this.#backup();

			return false;
		}

		return true;
	}

	exceptRun(chars: string) {
		while (true) {
			const c = this.#next();

			if (!c || chars.includes(c)) {
				this.#backup()

				return c;
			}
		}
	}

	done() {
		const done = () => [{type: TokenDone, data: ""}, done];

		return done();
	}

	error(err = "unknown error") {
		const error = () => [{type: TokenError, data: err}, error];

		return error();
	}
}

class Phraser {
	#parser: Parser;
	#fn: ParserFn;
	#tokens: Token[] = [];
	#ignoreLast = false;

	constructor(parser: Parser, parserFn: ParserFn) {
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
}

export default function* (text: string, parserFn: ParserFn, phraserFn?: PhraserFn) {
	const parser = new Parser(text);

	if (phraserFn) {
		const phraser = new Phraser(parser, parserFn);

		for (let [phrase, nextPhraserFn] = phraserFn(phraser); ; phraserFn = nextPhraserFn) {
			yield phrase;
		}
	}

	for (let [token, nextParserFn] = parserFn(parser); ; parserFn = nextParserFn) {
		yield token;
	}
}
