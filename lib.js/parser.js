/**
 * The parser module can be used to parse text into token or phrase streams.
 *
 * @module parser
 */
/** */

/** TokenType is used to ID a particular class of Tokens. Negative numbers represent built-in states, so only positive numbers should be used by implementing functions. */

/** PhraseType is used to ID a particular class of Phrases. Negative numbers represent built-in states, so only positive numbers should be used by implementing functions. */

export const
/** TokenDone represents the successful end of a Token stream. */
TokenDone = -1,
/** TokenError represents the unsuccessful end of a Token stream. */
TokenError = -2,
/** PhraseDone represents the successful end of a Phrase stream. */
PhraseDone = -1,
/** PhraseError represents the unsuccessful end of a Phrase stream. */
PhraseError = -2,
/** withNumbers adds positional information to the tokens, either in the token stream or phrase stream. */
withNumbers = function* (p) {
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

		yield t;
	}
},
/** processToEnd converts the infinite Generator, returned from the default fn, into a finite Generator only yielding non-Done and non-Error tokens and phrases. */
processToEnd = function* (p) {
	for (const t of p) {
		if (t.type < 0) {
			break;
		}

		yield t;
	}
};

/**
 * Token represents a parsed token.
 *
 * {
 *	// The type of Token parsed.
 *	type: TokenType;
 *	// The text parsed.
 *	data: string;
 * }
 */

/**
 * Phrase represents a parsed phrase, which is a collection of successive tokens.
 *
 * {
 *	// The type of Phrase parsed.
 *	type: PhraseType;
 *	// The parsed tokens.
 *	data: Token[];
 * }
 */

/** TokenWithNumbers represents a token which has its position within the text stream as an absolute position (pos), a zero-indexed line number (line), and the position on that line (linePos). */

/** PhraseWithNumbers represents a Phrase where the tokens are TokenWithNumbers. */

/**
 * TokenFn is used by the parsing function to parse a Token from a text stream.
 *
 * @param {Tokeniser} p The tokeniser from which to parse the token.
 *
 * @returns {[Token, TokenFn]} Returns the parsed token and the next TokenFn with which to parse the next token.
 */

/**
 * PhraseFn is used by the parsing function to parse a Phrase from a token stream.
 *
 * @param {Phraser} p The phraser from which to parse the phrase.
 *
 * @returns {[Phrase, PhraseFn]} Returns the parsed phrase and the next PhraseFn with which to parse the next phrase.
 */

/**
 * The StringParser interface represents an alternate to a string for parsing.
 * type StringParser = Iterator<string, void>;
 */

const noChar = {
	"value": undefined,
	"done": true
      },
      pseudoIterator = {
	"next": () => noChar
      },
      invalidChar = char => !char,
      invalidToken = tokenType => tokenType === TokenDone || tokenType === TokenError,
      peek = (p, isInvalid) => {
	const n = p.next();

	if (!isInvalid(n)) {
		p.backup();
	}

	return n;
      },
      accept = (p, isInvalid, match) => {
	const n = p.next();

	if (isInvalid(n)) {
		return false;
	}

	if (!match.includes(n)) {
		p.backup();

		return false;
	}

	return true;
      },
      acceptRun = (p, isInvalid, match) => {
	while (true) {
		const n = p.next();

		if (isInvalid(n)) {
			return n;
		}

		if (!match.includes(n)) {
			p.backup();

			return n;
		}
	}
      },
      except = (p, isInvalid, match) => {
	const n = p.next();

	if (isInvalid(n)) {
		return false;
	}

	if (match.includes(n)) {
		p.backup();

		return false;
	}

	return true;
      },
      exceptRun = (p, isInvalid, match) => {
	while (true) {
		const n = p.next();

		if (isInvalid(n)) {
			return n;
		}

		if (match.includes(n)) {
			p.backup();

			return n;
		}
	}
      };

/** A Tokeniser is a collection of methods that allow the easy parsing of a text stream. */
export class Tokeniser {
	#text = pseudoIterator;
	#buffer = "";
	#pos = 0;
	#stateNum = 0;

	/**
	 * Constructs a new Tokeniser.
	 *
	 * @param {string | StringParser} text The text/iterator to be used for parsing.
	 */
	constructor(text) {
		if (typeof text === "string") {
			this.#buffer = text;
		} else {
			this.#text = text;
		}
	}

	/**
	 * next() adds the next character to the buffer and returns it.
	 *
	 * @return {string} The character that has been added to the buffer, or empty string if at EOF.
	 */
	next() {
		if (this.#pos !== this.#buffer.length) {
			return this.#buffer.at(this.#pos++);
		}

		const char = this.#text.next().value ?? "";

		if (char) {
			this.#buffer += char;
			this.#pos++;
		}

		return char;
	}

	/** backup() restores the state to before the last call to next() (either directly, or via accept, acceptWord, acceptRun, except, or exceptRun). */
	backup() {
		if (this.#pos) {
			this.#pos--;
		}
	}

	/** reset() restores the state to after the last get() call (or init, if get() has not been called). */
	reset() {
		this.#pos = 0;
	}

	state() {
		const pos = this.#pos,
		      stateNum = this.#stateNum;

		return () => {
			if (this.#stateNum === stateNum) {
				this.#pos = pos;
			}
		};
	}

	/**
	 * length() returns the number of characters in the buffer that would be returned by a call to get().
	 *
	 * @return {number} The number of character in the buffer.
	 */
	length() {
		return this.#pos;
	}

	/**
	 * get() returns all of the characters processed, clearing the buffer.
	 *
	 * @return {string} The parsed characters.
	 */
	get() {
		const buffer = this.#buffer.slice(0, this.#pos);

		this.#buffer = this.#buffer.slice(this.#pos);
		this.#pos = 0;
		this.#stateNum++;

		return buffer;
	}

	/**
	 * peek() looks ahead at the next character in the stream without adding it to the buffer.
	 *
	 * @return {string} The next character in the buffer, or empty string if at EOF.
	 */
	peek() {
		return peek(this, invalidChar);
	}

	/**
	 * accept() adds the next character in the stream to the buffer if it is in the string provided. Returns true if a character was added.
	 *
	 * @param {string} chars The characters to match against.
	 *
	 * @return {boolean} Returns true if next character matched a character in the provided string, false otherwise.
	 */
	accept(chars) {
		return accept(this, invalidChar, chars);
	}

	/**
	 * acceptString() attempts to accept each character from the given string, in order, returning the number of characters accepted before a failure.
	 *
	 * @param {string}  str             The ordered characters to be accepted.
	 * @param {boolean} [caseSensitive] Should the match be made respecting case; defaults to true.
	 *
	 * @return {number} Returns the number of characters accepted.
	 */
	acceptString(str, caseSensitive = true) {
		let parsed = 0;

		for (const c of str) {
			if (!this.accept(caseSensitive ? c : c.toLowerCase() + c.toUpperCase())) {
				break;
			}

			parsed++;
		}

		return parsed;
	}

	/**
	 * acceptWord attempts to parse one of the words (string of characters) provided in the array.
	 *
	 * @param {string[]} words           The list of words (strings of characters) to match against.
	 * @param {boolean}  [caseSensitive] Determines whether matches are made in a case sensitive manner or not; defaults to true.
	 *
	 * @return {string} The matched word, or empty string if not word in the list could be matched.
	 */
	acceptWord(words, caseSensitive = true) {
		if (!caseSensitive) {
			words = words.map(w => w.toLowerCase());
		}

		return this.#acceptWord(words, caseSensitive);
	}

	#acceptWord(words, caseSensitive) {
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

			const newWords = [];

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
				return read + (newWords.length ? this.#acceptWord(newWords, caseSensitive) : "");
			}

			words = newWords;
		}

		for (const _ of read) {
			this.backup();
		}

		return "";
	}

	/**
	 * acceptRun() successively adds characters in the stream to the buffer as long as are in the string provided. Returns the character that stopped the run.
	 *
	 * @param {string} chars The characters to match against.
	 *
	 * @return {string} Returns the character that stopped the run, or empty string if at EOF.
	 */
	acceptRun(chars) {
		return acceptRun(this, invalidChar, chars);
	}
	
	/**
	 * except() adds the next character in the stream to the buffer as long as they are not in the string provided. Returns true if a character was added.
	 *
	 * @param {string} chars The characters to match against.
	 *
	 * @return {boolean} Returns true if next character did not matched a character in the provided string, false otherwise.
	 */
	except(chars) {
		return except(this, invalidChar, chars);
	}

	/**
	 * exceptRun() successively adds characters in the stream to the buffer as long as they are not in the string provided. Returns the character that stopped the run.
	 *
	 * @param {string} chars The characters to match against.
	 *
	 * @return {string} Returns the character that stopped the run, or empty string if at EOF.
	 * */
	exceptRun(chars) {
		return exceptRun(this, invalidChar, chars);
	}

	/**
	 * done() returns a Done token, with optional done message, and a recursive TokenFn which continually returns the same done Token.
	 *
	 * @param {string} [msg] An optional done message to be set as the data in the token.
	 *
	 * @return {[Token, TokenFn]} The return tuple which will cause a parser to recursively return a TokenDone.
	 */
	done(msg = "") {
		const done = () => [{"type": TokenDone, "data": msg}, done];

		return done();
	}

	/**
	 * error() returns an Error token, with optional error message, and a recursive TokenFn which continually returns the same error Token.
	 *
	 * @param {string} [err="unknown error"] An optional error message to be set as the data in the token.
	 *
	 * @return {[Token, TokenFn]} The return tuple which will cause a parser to recursively return a TokenError.
	 * */
	error(err = "unknown error") {
		const error = () => [{"type": TokenError, "data": err}, error];

		return error();
	}

	/**
	 * return() creates the [Token, TokenFn] tuple, using the parsed characters as the data. If no TokenFn is supplied, Tokeniser.done() is used.
	 *
	 * @param {TokenType} type The type of the token to be returned.
	 * @param {TokenFn}   [fn] Optional TokenFn; defaults to this.done().
	 *
	 * @return {[Token, TokenFn]} The return tuple which will return a Token to a parser and provide the next TokenFn to be used in later parsing.
	 */
	return(type, fn) {
		return [{type, "data": this.get()}, fn ?? (() => this.done())];
	}
}

/** A Phraser is a collection of methods that allow the easy parsing of a token stream. */
export class Phraser {
	#parser;
	#fn;
	#tokens = [];
	#pos = 0;
	#stateNum = 0;

	/**
	 * Constructs a new Phraser.
	 *
	 * @param {string | StringParser} text     The text/iterator to be used for parsing.
	 * @param {TokenFn}               parserFn The initial TokenFn that will start the parsing.
	 */
	constructor(text, parserFn) {
		this.#parser = new Tokeniser(text);
		this.#fn = parserFn;
	}

	/**
	 * next() adds the next token to the buffer (if its not a TokenDone or TokenError) and returns the TokenType.
	 *
	 * @return {TokenType} The type of the next token in the stream.
	 */
	next() {
		if (this.#pos < this.#tokens.length) {
			return this.#tokens.at(this.#pos++).type;
		}

		const [tk, nextFn] = this.#fn(this.#parser),
		      type = tk.type;

		if (type !== TokenDone && type !== TokenError) {
			this.#tokens.push(tk);

			this.#pos++;
		}

		this.#fn = nextFn;

		return type;
	}

	/** backup() restores the state to before the last call to next() (either directly, or via accept, acceptRun, except, or exceptRun). */
	backup() {
		if (this.#pos) {
			this.#pos--;
		}
	}

	/** reset() restores the state to after the last get() call (or init, if get() has not been called). */
	reset() {
		this.#pos = 0;
	}

	state() {
		const pos = this.#pos,
		      stateNum = this.#stateNum;

		return () => {
			if (this.#stateNum === stateNum) {
				this.#pos = pos;
			}
		};
	}

	/**
	 * length() returns the number of tokens in the buffer.
	 *
	 * @return {number} The number of tokens in the buffer that would be returned by a call to get().
	 */
	length() {
		return this.#pos;
	}

	/**
	 * get() returns all of the tokens processed, clearing the buffer.
	 *
	 * @return {Token[]} The parsed tokens.
	 */
	get() {
		const tks = this.#tokens.splice(0, this.#pos);

		this.#pos = 0;
		this.#stateNum++;

		return tks;
	}

	/**
	 * peek() looks ahead at the next token in the stream without adding it to the buffer, and returns the TokenID.
	 *
	 * @return {TokenType} The type of the next token in the token stream.
	 */
	peek() {
		return peek(this, invalidToken);
	}

	/**
	 * accept() adds the next token in the stream to the buffer if its TokenID is in the tokenTypes array provided. Returns true if a token was added.
	 *
	 * @param {TokenType[]} ...tokenTypes The token types to match against.
	 *
	 * @return {boolean} Returns true if the next token in the stream is of a type in the supplied array.
	 */
	accept(...tokenTypes) {
		return accept(this, invalidToken, tokenTypes);
	}

	/**
	 * acceptRun() successively adds tokens in the stream to the buffer as long they are their TokenID is in the tokenTypes array provided. Returns the TokenID of the last token added.
	 *
	 * @param {TokenType[]} ...tokenTypes The token types to match against.
	 *
	 * @return {TokenType} The type of the token which stopped the run.
	 */
	acceptRun(...tokenTypes) {
		return acceptRun(this, invalidToken, tokenTypes);
	}

	/**
	 * except() adds the next token in the stream to the buffer as long as its TokenID is not in the tokenTypes array provided. Returns true if a token was added.
	 *
	 * @param {TokenType[]} ...tokenTypes The token types to match against.
	 *
	 * @return {boolean} Returns true if the next token in the stream is of a type not in the supplied array.
	 */
	except(...tokenTypes) {
		return except(this, invalidToken, tokenTypes);
	}

	/**
	 * exceptRun() successively adds tokens in the stream to the buffer as long as their TokenID is not in the tokenTypes array provided. Returns the TokenID of the last token added.
	 *
	 * @param {TokenType[]} ...tokenTypes The token types to match against.
	 *
	 * @return {TokenType} The type of the token which stopped the run.
	 */
	exceptRun(...tokenTypes) {
		return exceptRun(this, invalidToken, tokenTypes);
	}

	/**
	 * done() returns a Done phrase, optionally with a Done token with a done message, and a recursive PhraseFn which continually returns the same done Phrase.
	 *
	 * @param {string} [msg] An optional done message, which will cause a pseudo-token to be created in the phrase, with the data in the token set to the message.
	 *
	 * @return {[Phrase, PhraserFn]} The return tuple which will cause a parser to recursively return a PhraseDone.
	 */
	done(msg = "") {
		const done = () => [{"type": PhraseDone, "data": msg ? [{"type": TokenDone, "data": msg}] : []}, done];

		return done();
	}

	/**
	 * error() returns an Error phrase, optionally with an Error token with an error message, and a recursive PhraseFn which continually returns the same error Phrase.
	 *
	 * @param {string} [err] An optional error message, which will cause a pseudo-token to be created in the phrase, with the data in the token set to the message.
	 *
	 * @return {[Phrase, PhraserFn]} The return tuple which will cause a parser to recursively return a PhraseError.
	 */
	error(err = "unknown error") {
		const error = () => [{"type": PhraseError, "data": [{"type": TokenError, "data": err}]}, error];

		return error();
	}

	/**
	 * return() creates the [Phrase, PhraseFn] tuple, using the parsed tokens as the data. If no PhraseFn is supplied, Phraser.done() is used.
	 *
	 * @param {PhraseType} type The type of the phrase to be returned.
	 * @param {PhraserFn}  [fn] Optional PhraserFn; defaults to this.done().
	 *
	 * @return {[Phrase, PhraserFn]} The return tuple which will return a Phrase to a parser and provide the next PhraserFn to be used in later parsing.
	 */
	return(type, fn) {
		return [{type, "data": this.get()}, fn ?? (() => this.done())];
	}
}

/**
 * The default function can parse a text stream into either a stream of tokens or a stream of phrases, depending on whether a phrase parsing function is provided.
 *
 * @param {text | StringParser} text        The text stream that will be parsed.
 * @param {TokenFn}             parserFn    The initial token parsing function.
 * @param {PhraserFn}           [phraserFn] Optional phraser function to produce a phrase steam.
 *
 * @returns {Token | Phrase} Returns a stream of either Tokens or Phrases.
 */
export default function* (text, parserFn, phraserFn) {
	const p = phraserFn ? new Phraser(text, parserFn) : new Tokeniser(text);

	let fn = phraserFn ?? parserFn;

	while(true) {
		const [t, nextFn] = fn(p);

		yield t;

		fn = nextFn;
	}
};
