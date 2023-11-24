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
			return -1;
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
}

export default (text: string, initialParser: ParserFn) => {
}
