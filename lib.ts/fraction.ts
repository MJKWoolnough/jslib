const gcd = (a: bigint, b: bigint): bigint => b === 0n ? a : gcd(b, a % b);

export default class Fraction {
	#numerator: bigint;
	#denominator: bigint;
	static readonly zero = new Fraction(0n);
	static readonly one = new Fraction(1n);
	static readonly NaN = new Fraction(0n, 0n);
	constructor(numerator: bigint, denominator: bigint = 1n) {
		if (denominator < 0n) {
			this.#numerator = -numerator;
			this.#denominator = -denominator;
		} else {
			this.#numerator = numerator;
			this.#denominator = denominator;
		}
	}
	add(num: Fraction) {
		if (this.#denominator === num.#denominator) {
			return new Fraction(this.#numerator + num.#numerator, this.#denominator);
		}
		return new Fraction(this.#numerator * num.#denominator + this.#denominator * num.#numerator, this.#denominator * num.#denominator);
	}
	sub(num: Fraction) {
		if (this.#denominator === num.#denominator) {
			return new Fraction(this.#numerator - num.#numerator, this.#denominator);
		}
		return new Fraction(this.#numerator * num.#denominator - this.#denominator * num.#numerator, this.#denominator * num.#denominator);
	}
	mul(num: Fraction) {
		return new Fraction(this.#numerator * num.#numerator, this.#denominator * num.#denominator);
	}
	div(num: Fraction) {
		return new Fraction(this.#numerator * num.#denominator, this.#denominator * num.#numerator);
	}
	cmp(num: Fraction) {
		if (!this.#denominator || !num.#denominator) {
			return NaN;
		}
		const d = this.#numerator * num.#denominator - this.#denominator * num.#numerator;
		return d < 0n ? -1 : d > 0n ? 1: 0;
	}
	isNaN() {
		return !this.#denominator;
	}
	sign() {
		return !this.#denominator ? NaN : !this.#numerator ? 0 : this.#numerator < 0n ? -1 : 1;
	}
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
	[Symbol.toPrimitive](hint: string) {
		return hint === "number" ? this.toFloat() : this.toString();
	}
	toFloat() {
		if (!this.#denominator) {
			return NaN;
		}
		return Number(10000n * this.#numerator / this.#denominator) / 10000;
	}
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
	static min(a: Fraction, b: Fraction) {
		return a.cmp(b) === -1 ? a : b;
	}
	static max(a: Fraction, b: Fraction) {
		return a.cmp(b) === 1 ? a : b;
	}
}
