/**
 * The parser module can be used to parse text into token or phrase streams.
 *
 * @module parser
 */
/** */

/** TokenType is used to ID a particular class of Tokens. */
export type TokenType = number;

/** PhraseType is used to ID a particular class of Phrases. */
export type PhraseType = number;

export const
/** TokenDone represents the successful end of a Token stream. */
TokenDone: TokenType = -1,
/** TokenError represents the unsuccessful end of a Token stream. */
TokenError: TokenType = -2,
/** PhraseDone represents the successful end of a Phrase stream. */
PhraseDone: PhraseType = -1,
/** PhraseError represents the unsuccessful end of a Phrase stream. */
PhraseError: PhraseType = -2;

/** Token represents a parsed token. */
export type Token = {
	/** The type of Token parsed. */
	type: TokenType;
	/** The text parsed. */
	data: string
}

/** Phrase represents a parsed phrase, which is a collection of successive tokens. */
export type Phrase = {
	/** The type of Phrase parsed. */
	type: PhraseType;
	/** The parsed tokens. */
	data: Token[];
}

type Nums = {
	pos: number;
	line: number;
	linePos: number;
}

/** TokenWithNumbers represents a token which has it's position within the text stream as an absolute position (pos), a zero-indexed line number (line), and the position on that line (linePos). */
export type TokenWithNumbers = Token & Nums;

/** PhraseWithNumbers represents a Phrase where the tokens are TokenWithNumbers. */
export type PhraseWithNumbers = {
	type: PhraseType;
	data: TokenWithNumbers[];
}

/*
 * TokenFn is used by the parsing function to parse a Token from a text stream.
 *
 * @param {Tokeniser} p The tokeniser from which to parse the token.
 *
 * @returns {[Token, TokenFn]} Returns the parsed token and the next TokenFn with which to parse the next token.
 * */
export type TokenFn = (p: Tokeniser) => [Token, TokenFn];

/*
 * PhraseFn is used by the parsing function to parse a Phrase from a token stream.
 *
 * @param {Phraser} p The phraser from which to parse the phrase.
 *
 * @returns {[Phrase, PhraseFn]} Returns the parsed phrase and the next PhraseFn with which to parse the next phrase.
 * */
export type PhraserFn = (p: Phraser) => [Phrase, PhraserFn];

/** The StringParser interface represents an alternate to a string for */
interface StringParser {
	/** next() should return the next character in the stream */
	next(): string;
	/** backup() should undo the last character read. Will only be called after a successful call to next(). */
	backup(): void;
	/** length() should return the number of characters read since the last call to get() or from initialisation. */
	length(): number;
	/** get() should return all of the characters returned by next() since the last call to get() or from initialisation. */
	get(): string;
}

interface ParserOrPhraser {
	(text: string | StringParser, parserFn: TokenFn): Generator<Token, never>;
	(text: string | StringParser, parserFn: TokenFn, phraserFn: PhraserFn): Generator<Phrase, never>;
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

class CTokeniser {
	#sp: StringParser;

	constructor(sp: StringParser) {
		this.#sp = sp;
	}

	/** length() returns the number of characters in the buffer. */
	length() {
		return this.#sp.length();
	}

	/** get() returns all of the characters processed, clearing the buffer. */
	get() {
		return this.#sp.get();
	}

	/** peek() looks ahead at the next character in the stream without adding it to the buffer. */
	peek() {
		const c = this.#sp.next();
		this.#sp.backup();

		return c;
	}

	/** accept() adds the next character in the stream to the buffer if it is in the string provided. */
	accept(chars: string) {
		if (!chars.includes(this.#sp.next())) {
			this.#sp.backup();

			return false;
		}

		return true;
	}

	/** acceptRun() successively adds characters in the stream to the buffer as long as are in the string provided. */
	acceptRun(chars: string) {
		while (true) {
			const c = this.#sp.next();

			if (!c) {
				return "";
			}

			if (!chars.includes(c)) {
				this.#sp.backup();

				return c;
			}
		}
	}
	
	/** except() adds the next character in the stream to the buffer as long as they are not in the string provided. */
	except(chars: string) {
		const c = this.#sp.next();

		if (!c || chars.includes(c)) {
			this.#sp.backup();

			return false;
		}

		return true;
	}

	/** exceptRun() successively adds characters in the stream to the buffer as long as they are not in the string provided. */
	exceptRun(chars: string) {
		while (true) {
			const c = this.#sp.next();

			if (!c) {
				return c;
			}

			if (chars.includes(c)) {
				this.#sp.backup();

				return c;
			}
		}
	}

	/** done() returns a Done token, with optional done message, and a recursive TokenFn which continually returns the same done Token. */
	done(msg = "") {
		const done: () => [Token, TokenFn] = () => [{"type": TokenDone, "data": msg}, done];

		return done();
	}

	/** error() returns an Error token, with optional error message, and a recursive TokenFn which continually returns the same error Token. */
	error(err = "unknown error") {
		const error: () => [Token, TokenFn] = () => [{"type": TokenError, "data": err}, error];

		return error();
	}
}

/** A Tokeniser is a collection of methods that allow the easy parsing of a text stream. */
export type Tokeniser = CTokeniser;

class CPhraser {
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

	/** length() returns the number of tokens in the buffer. */
	length() {
		return this.#tokens.length - +this.#ignoreLast;
	}

	/** get() returns all of the tokens processed, clearing the buffer. */
	get() {
		const toRet = this.#tokens;

		this.#tokens = toRet.splice(this.#tokens.length - +this.#ignoreLast, 1);

		return toRet;
	}

	/** peek() looks ahead at the next token in the stream without adding it to the buffer. */
	peek() {
		const tk = this.#next();

		this.#backup();

		return tk;
	}

	/** accept() adds the next token in the stream to the buffer if it's TokenID is in the tokenTypes array provided. */
	accept(...tokenTypes: TokenType[]) {
		if (!tokenTypes.includes(this.#next().type)) {
			this.#backup();

			return false;
		}

		return true;
	}

	/** acceptRun() successively adds tokens in the stream to the buffer as long they are their TokenID is in the tokenTypes array provided. */
	acceptRun(...tokenTypes: TokenType[]) {
		while (true) {
			const tk = this.#next().type;

			if (!tokenTypes.includes(tk)) {
				this.#backup();

				return tk;
			}
		}
	}

	/** except() adds the next token in the stream to the buffer as long as it's TokenID is not in the tokenTypes array provided. */
	except(...tokenTypes: TokenType[]) {
		const tk = this.#next().type;

		if (tk < 0 || tokenTypes.includes(tk)) {
			this.#backup();

			return false;
		}

		return true;
	}

	/** exceptRun() successively adds tokens in the stream to the buffer as long as their TokenID is not in the tokenTypes array provided. */
	exceptRun(...tokenTypes: TokenType[]) {
		while (true) {
			const tk = this.#next().type;

			if (tk < 0 || tokenTypes.includes(tk)) {
				this.#backup();

				return tk;
			}
		}
	}

	/** done() returns a Done phrase, optionally with a Done token with a done message, and a recursive PhraseFn which continually returns the same done Phrase. */
	done(msg = "") {
		const done: () => [Phrase, PhraserFn] = () => [{"type": PhraseDone, "data": msg ? [{"type": TokenDone, "data": msg}] : []}, done];

		return done();
	}

	/** error() returns an Error phrase, optionally with an Error token with an error message, and a recursive PhraseFn which continually returns the same error Phrase. */
	error(err = "unknown error") {
		const error: () => [Phrase, PhraserFn] = () => [{"type": PhraseError, "data": [{"type": TokenError, "data": err}]}, error];

		return error();
	}
}

/** A Phrase is a collection of methods that allow the easy parsing of a token stream. */
export type Phraser = CPhraser;

/** withNumbers adds positional information to the tokens, either in the token stream or phrase stream. */
export const withNumbers = function* <T extends Token | Phrase>(p: Generator<T, never>): Generator<T extends Token ? TokenWithNumbers : PhraseWithNumbers, void> {
	const pos = {
		"pos": 0,
		"line": 0,
		"linePos": 0
	      };

	for (const t of p) {
		for (const tk of t.data instanceof Array ? t.data : [t]) {
			Object.assign(tk, pos);

			if (tk.type === TokenDone || tk.type === TokenError) {
				continue;
			}

			for (const c of tk.data) {
				pos.pos++;
				pos.linePos++;

				if (c === "\n") {
					pos.line++;
					pos.linePos = 0;
				}
			}
		}

		yield t as any;
	}
}

/**
 * The default function can parse a text stream into either a stream of tokens or a stream of phrases, depending on whether a phrase parsing function is provided.
 *
 * @param {text | StringParser} text The text stream that will be parsed.
 * @param {TokenFn} parserFn         The initial token parsing function.
 * @param {PhraserFn} [phraserFn]    Optional phraser function to produce a phrase steam.
 *
 * @returns {Token | Phrase}         Returns a stream of either Tokens or Phrases.
 * */
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
