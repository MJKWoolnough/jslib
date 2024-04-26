/**
 * The fraction module exports a default class to act as a fractional, infinite precision number type.
 *
 * @module fraction
 */

const gcd = (a, b) => b === 0n ? a : gcd(b, a % b);

/** The Fraction class allows for essentially infinite precision math. */
export default class Fraction {
	#numerator;
	#denominator;
	/** A Fraction representing 0. */
	static zero = new Fraction(0n);
	/** A Fraction representing 1. */
	static one = new Fraction(1n);
	/** A Fraction representing {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN) | NaN}. */
	static NaN = new Fraction(0n, 0n);
	/**
	 * The constructor of Fraction takes a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt | BigInt} numerator and an optional {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt | BigInt} denominator and returns a Fraction accordingly. A zero (0n) denominator would create a Fraction equivalent of {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN | NaN}).
	 *
	 * @param {bigint} numerator
	 * @param {bigint} [denominator=1n]
	 */
	constructor(numerator, denominator = 1n) {
		if (denominator < 0n) {
			this.#numerator = -numerator;
			this.#denominator = -denominator;
		} else {
			this.#numerator = numerator;
			this.#denominator = denominator;
		}
	}
	/**
	 * The add method creates a new Fraction with the values set as the result of the addition of the two Fraction values.
	 *
	 * @param {Fraction} num The value to add to the current.
	 *
	 * @return {Fraction} A new Fraction with the result of the addition.
	 */
	add(num) {
		if (this.#denominator === num.#denominator) {
			return new Fraction(this.#numerator + num.#numerator, this.#denominator);
		}
		return new Fraction(this.#numerator * num.#denominator + this.#denominator * num.#numerator, this.#denominator * num.#denominator);
	}
	/**
	 * The sub method creates a new Fraction with the values set as the result of the passed Fraction subtracted from the base Fraction.
	 *
	 * @param {Fraction} num The value to subtract from the current.
	 *
	 * @return {Fraction} A new Fraction with the result of the subtraction.
	 */
	sub(num) {
		if (this.#denominator === num.#denominator) {
			return new Fraction(this.#numerator - num.#numerator, this.#denominator);
		}
		return new Fraction(this.#numerator * num.#denominator - this.#denominator * num.#numerator, this.#denominator * num.#denominator);
	}
	/**
	 * The mul method creates a new Fraction with the values set as the result of the base Fraction multiplied by the passed Fraction.
	 *
	 * @param {Fraction} num The value to multiple the current by.
	 *
	 * @return {Fraction} A new Fraction with the result of the multiplication.
	 */
	mul(num) {
		return new Fraction(this.#numerator * num.#numerator, this.#denominator * num.#denominator);
	}
	/**
	 * The div method creates a new Fraction with the values set as the result of the base Fraction multiplied by the passed Fraction.
	 *
	 * @param {Fraction} num The value to divide the current by.
	 *
	 * @return {Fraction} A new Fraction with the result of the division.
	 */
	div(num) {
		return new Fraction(this.#numerator * num.#denominator, this.#denominator * num.#numerator);
	}
	/**
	 * The cmp method compares the base Fractions (A) to the passed Fraction (B), resulting in the following:
	 *
	 *   |  Comparison  |  Return Value  |
	 *   |--------------|----------------|
	 *   | A < B        | -1             |
	 *   | A == B       | 0              |
	 *   | A > B        | 1              |
	 *   | isNaN(A)     | NaN            |
	 *   | isNaN(B)     | NaN            |
	 *
	 * @param {Fraction} num The Fraction to compare to.
	 *
	 * @return {-1 | 0 | 1 | NaN} As per the table above.
	 */
	cmp(num) {
		if (!this.#denominator || !num.#denominator) {
			return NaN;
		}
		const d = this.#numerator * num.#denominator - this.#denominator * num.#numerator;
		return d < 0n ? -1 : d > 0n ? 1: 0;
	}
	/**
	 * The isNaN method returns true if the Fraction is equivalent to @{link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN | NaN}, which is when the denominator is equal to zero.
	 *
	 * @return {boolean} True is the Fraction is NaN.
	 */
	isNaN() {
		return !this.#denominator;
	}
	/**
	 * The sign method returns a number indicating the sign of the value:
	 * |  Fraction Value  |  Return Value  |
	 * |------------------|----------------|
	 * | < 0              | -1             |
	 * | = 0              | 0              |
	 * | > 0              | 1              |
	 * | NaN              | NaN            |
	 *
	 * @return {-1 | 0 | 1 | NaN} As per the table above.
	 */
	sign() {
		return !this.#denominator ? NaN : !this.#numerator ? 0 : this.#numerator < 0n ? -1 : 1;
	}
	/**
	 * Returns a simplified version of the Fraction.
	 *
	 * @return {Fraction} A simplified version of the Fraction.
	 */
	simplify() {
		if (!this.#denominator) {
			return Fraction.NaN;
		} else if (!this.#numerator) {
			return Fraction.zero;
		} else if (this.#numerator === this.#denominator) {
			return Fraction.one;
		}
		const a = this.#numerator < 0n ? -this.#numerator : this.#numerator,
		      b = this.#denominator,
		      g = a > b ? gcd(a, b) : gcd(b, a);
		return new Fraction(this.#numerator / g, b / g);
	}
	/**
	 * When the hint is set to "number", this method returns a normal javascript number representation of the Fraction value, to 5 decimal places. Otherwise, it returns a string representation of the fraction.
	 *
	 * See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive | toPrimitive} documentation for how to use this symbol.
	 */
	[Symbol.toPrimitive](hint) {
		return hint === "number" ? this.toFloat() : this.toString();
	}
	/**
	 * Converts a Fraction to a Number.
	 *
	 * @return {Number} Float representation of the Fraction.
	 */
	toFloat() {
		if (!this.#denominator) {
			return NaN;
		}
		return Number(10000n * this.#numerator / this.#denominator) / 10000;
	}
	/**
	 * Converts a Fraction to a string.
	 *
	 * @return {string} String representation of the Fraction.
	 */
	toString() {
		switch (this.#denominator) {
		case 0n:
			return "NaN";
		case 1n:
			return `${this.#numerator}`;
		default:
			return `${this.#numerator} / ${this.#denominator}`;
		}
	}

	static #compare(a, b, v) {
		for (const c of b) {
			const cmp = a.cmp(c);

			if (isNaN(cmp)) {
				return Fraction.NaN;
			}

			a = cmp === v ? a : c;
		}

		return a;
	}

	/**
	 * This static method returns the smaller of the two passed `Fraction`, or {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN | NaN} is either param is equivalent to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN | NaN}.
	 *
	 * @param {Fraction} a First Fraction.
	 * @param {Fraction} b Second Fraction.
	 *
	 * @return {Fraction} Smallest Fraction.
	 */
	static max(a, ...b) {
		return Fraction.#compare(a, b, -1);
	}
	/**
	 * This static method returns the larger of the two passed `Fraction`, or {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN | NaN} is either param is equivalent to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN | NaN}.
	 *
	 * @param {Fraction} a First Fraction.
	 * @param {Fraction} b Second Fraction.
	 *
	 * @return {Fraction} Largest Fraction.
	 */
	static max(a, ...b) {
		return Fraction.#compare(a, b, 1);
	}
}
