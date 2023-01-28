const gcd = (a, b) => b === 0n ? a : gcd(b, a % b);

export default class Fraction {
	#numerator;
	#denominator;
	static zero = new Fraction(0n);
	static one = new Fraction(1n);
	static NaN = new Fraction(0n, 0n);
	constructor(numerator, denominator = 1n) {
		if (denominator < 0n) {
			this.#numerator = -numerator;
			this.#denominator = -denominator;
		} else {
			this.#numerator = numerator;
			this.#denominator = denominator;
		}
	}
	add(num) {
		if (this.#denominator === num.#denominator) {
			return new Fraction(this.#numerator + num.#numerator, this.#denominator);
		}
		return new Fraction(this.#numerator * num.#denominator + this.#denominator * num.#numerator, this.#denominator * num.#denominator);
	}
	sub(num) {
		if (this.#denominator === num.#denominator) {
			return new Fraction(this.#numerator - num.#numerator, this.#denominator);
		}
		return new Fraction(this.#numerator * num.#denominator - this.#denominator * num.#numerator, this.#denominator * num.#denominator);
	}
	mul(num) {
		return new Fraction(this.#numerator * num.#numerator, this.#denominator * num.#denominator);
	}
	div(num) {
		return new Fraction(this.#numerator * num.#denominator, this.#denominator * num.#numerator);
	}
	cmp(num) {
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
		}
		const a = this.#numerator < 0n ? -this.#numerator : this.#numerator,
		      b = this.#denominator,
		      g = a > b ? gcd(a, b) : gcd(b, a);
		return new Fraction(this.#numerator / g, b / g);
	}
	[Symbol.toPrimitive](hint) {
		if (hint !== "number") {
			switch (this.#denominator) {
			case 0n:
				return "NaN";
			case 1n:
				return `${this.#numerator}`;
			default:
				return `${this.#numerator} / ${this.#denominator}`;
			}
		}
		if (!this.#denominator) {
			return NaN;
		}
		return Number(10000n * this.#numerator / this.#denominator) / 10000;
	}
	static min(a, b) {
		return a.cmp(b) === -1 ? a : b;
	}
	static max(a, b) {
		return a.cmp(b) === 1 ? a : b;
	}
}
