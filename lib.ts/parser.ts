type TokenType = number;

export const TokenDone: TokenType = -1,
TokenError: TokenType = -2;

type Token = {
	type: TokenType;
	data: string
}

type ParserFn = (p: Parser) => [Token, ParserFn];

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

export default function* (text: string, parserFn: ParserFn) {
	const parser = new Parser(text);

	while (true) {
		let [tk, nextParserFn] = parserFn(parser);

		yield tk;

		parserFn = nextParserFn;
	}
}
