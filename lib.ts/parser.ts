/**
 * The parser module can be used to parse text into token or phrase streams.
 *
 * @module parser
 */
/** */

/** TokenType is used to ID a particular class of Tokens. Negative numbers represent built-in states, so only positive numbers should be used by implementing functions. */
export type TokenType = number;

/** PhraseType is used to ID a particular class of Phrases. Negative numbers represent built-in states, so only positive numbers should be used by implementing functions. */
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
	data: string;
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
 */
export type TokenFn = (p: Tokeniser) => [Token, TokenFn];

/*
 * PhraseFn is used by the parsing function to parse a Phrase from a token stream.
 *
 * @param {Phraser} p The phraser from which to parse the phrase.
 *
 * @returns {[Phrase, PhraseFn]} Returns the parsed phrase and the next PhraseFn with which to parse the next phrase.
 */
export type PhraserFn = (p: Phraser) => [Phrase, PhraserFn];

/** The StringParser interface represents an alternate to a string for parsing. */
type StringParser  = Iterator<string, void>;

interface ParserOrPhraser {
	(text: string | StringParser, parserFn: TokenFn): Generator<Token, never>;
	(text: string | StringParser, parserFn: TokenFn, phraserFn: PhraserFn): Generator<Phrase, never>;
}

const noChar = {
	"value": undefined,
	"done": true as const
      },
      pseudoIterator = {
	"next": () => noChar
      };

/** A Tokeniser is a collection of methods that allow the easy parsing of a text stream. */
export class Tokeniser {
	#text: StringParser = pseudoIterator;
	#buffer = "";
	#pos = 0;

	constructor(text: string | StringParser) {
		if (typeof text === "string") {
			this.#buffer = text;
		} else {
			this.#text = text;
		}
	}

	/** next() adds the next character to the buffer and returns it. */
	next() {
		if (this.#pos !== this.#buffer.length) {
			return this.#buffer.at(this.#pos++)!;
		}

		const char = this.#text.next().value ?? "";

		if (char) {
			this.#buffer += char;

			this.#pos++;
		}

		return char;
	}

	backup() {
		if (this.#pos) {
			this.#pos--;
		}
	}

	reset() {
		this.#pos = 0;
	}

	/** length() returns the number of characters in the buffer. */
	length() {
		return this.#pos;
	}

	/** get() returns all of the characters processed, clearing the buffer. */
	get() {
		const buffer = this.#buffer.slice(0, this.#pos);

		this.#buffer = this.#buffer.slice(this.#pos);

		this.#pos = 0;

		return buffer;
	}

	/** peek() looks ahead at the next character in the stream without adding it to the buffer. */
	peek() {
		const c = this.next();

		this.backup();

		return c;
	}

	/** accept() adds the next character in the stream to the buffer if it is in the string provided. Returns true if a character was added. */
	accept(chars: string) {
		if (!chars.includes(this.next())) {
			this.backup();

			return false;
		}

		return true;
	}

	acceptWord(words: string[], caseSensitive = true) {
		if (!caseSensitive) {
			words = words.map(w => w.toLowerCase());
		}

		return this.#acceptWord(words, caseSensitive);
	}

	#acceptWord(words: string[], caseSensitive: boolean): string {
		let read = "";

		while (words.length) {
			let found = false,
			    char = this.next();

			if (!char) {
				break;
			}

			read += char;

			if (!caseSensitive) {
				char = char.toLowerCase();
			}

			const newWords: string[] = [];

			for (const word of words) {
				if (word.startsWith(char)) {
					const w = word.slice(1);

					if (w) {
						newWords.push(w);
					} else {
						found = true;
					}
				}
			}

			if (found) {
				return read + newWords.length ? this.#acceptWord(newWords, caseSensitive) : "";
			}

			words = newWords;
		}

		for (const _ of read) {
			this.backup();
		}

		return "";
	}

	/** acceptRun() successively adds characters in the stream to the buffer as long as are in the string provided. Returns the character that stopped the run. */
	acceptRun(chars: string) {
		while (true) {
			const c = this.next();

			if (!c) {
				return "";
			}

			if (!chars.includes(c)) {
				this.backup();

				return c;
			}
		}
	}
	
	/** except() adds the next character in the stream to the buffer as long as they are not in the string provided. Returns true if a character was added. */
	except(chars: string) {
		const c = this.next();

		if (!c || chars.includes(c)) {
			this.backup();

			return false;
		}

		return true;
	}

	/** exceptRun() successively adds characters in the stream to the buffer as long as they are not in the string provided. Returns the character that stopped the run. */
	exceptRun(chars: string) {
		while (true) {
			const c = this.next();

			if (!c) {
				return c;
			}

			if (chars.includes(c)) {
				this.backup();

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

	/** return() creates the [Token, TokenFn] tuple, using the parsed characters as the data. If no TokenFn is supplied, Tokeniser.done() is used. */
	return(type: TokenType, fn?: TokenFn): [Token, TokenFn] {
		return [{type, "data": this.get()}, fn ?? (() => this.done())];
	}
}

/** A Phraser is a collection of methods that allow the easy parsing of a token stream. */
export class Phraser {
	#parser: Tokeniser;
	#fn: TokenFn;
	#tokens: Token[] = [];
	#ignoreLast = false;

	constructor(parser: Tokeniser, parserFn: TokenFn) {
		this.#parser = parser;
		this.#fn = parserFn;
	}

	#next() {
		if (this.#ignoreLast) {
			this.#ignoreLast = false;

			return this.#tokens.at(-1)!.type;
		}

		const [tk, nextFn] = this.#fn(this.#parser);

		this.#tokens.push(tk);
		this.#fn = nextFn;

		return tk.type;
	}

	#backup() {
		if (this.#tokens.length > 0 && !this.#ignoreLast) {
			this.#ignoreLast = true;
		}
	}

	/** next() adds the next token to the buffer (if it's not a TokenDone or TokenError) and returns the TokenType. */
	next() {
		const type = this.#next();

		if (type === TokenDone || type === TokenError) {
			this.#backup();
		}

		return type;
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

	/** peek() looks ahead at the next token in the stream without adding it to the buffer, and returns the TokenID. */
	peek() {
		const tk = this.#next();

		this.#backup();

		return tk;
	}

	/** accept() adds the next token in the stream to the buffer if it's TokenID is in the tokenTypes array provided. Returns true if a token was added. */
	accept(...tokenTypes: TokenType[]) {
		if (!tokenTypes.includes(this.#next())) {
			this.#backup();

			return false;
		}

		return true;
	}

	/** acceptRun() successively adds tokens in the stream to the buffer as long they are their TokenID is in the tokenTypes array provided. Returns the TokenID of the last token added. */
	acceptRun(...tokenTypes: TokenType[]) {
		while (true) {
			const tk = this.#next();

			if (!tokenTypes.includes(tk)) {
				this.#backup();

				return tk;
			}
		}
	}

	/** except() adds the next token in the stream to the buffer as long as it's TokenID is not in the tokenTypes array provided. Returns true if a token was added. */
	except(...tokenTypes: TokenType[]) {
		const tk = this.#next();

		if (tk < 0 || tokenTypes.includes(tk)) {
			this.#backup();

			return false;
		}

		return true;
	}

	/** exceptRun() successively adds tokens in the stream to the buffer as long as their TokenID is not in the tokenTypes array provided. Returns the TokenID of the last token added. */
	exceptRun(...tokenTypes: TokenType[]) {
		while (true) {
			const tk = this.#next();

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

	/** return() creates the [Phrase, PhraseFn] tuple, using the parsed tokens as the data. If no PhraseFn is supplied, Phraser.done() is used. */
	return(type: PhraseType, fn?: PhraserFn): [Phrase, PhraserFn] {
		return [{type, "data": this.get()}, fn ?? (() => this.done())];
	}
}

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
};

/**
 * The default function can parse a text stream into either a stream of tokens or a stream of phrases, depending on whether a phrase parsing function is provided.
 *
 * @param {text | StringParser} text The text stream that will be parsed.
 * @param {TokenFn} parserFn         The initial token parsing function.
 * @param {PhraserFn} [phraserFn]    Optional phraser function to produce a phrase steam.
 *
 * @returns {Token | Phrase}         Returns a stream of either Tokens or Phrases.
 */
export default (function* (text: string | StringParser, parserFn: TokenFn, phraserFn?: PhraserFn) {
	const parser = new Tokeniser(text),
	      p = phraserFn ? new Phraser(parser, parserFn) : parser;

	let fn = phraserFn ?? parserFn;

	while(true) {
		const [t, nextFn] = fn(p as any)

		yield t;

		fn = nextFn;
	}
} as ParserOrPhraser);
