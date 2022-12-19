export const isInt = (v: any, min = -Infinity, max = Infinity): v is number => typeof v === "number" && (v|0) === v && v >= min && v <= max,
checkInt = (n: any, min = -Infinity, max = Infinity, def = 0) => isInt(n, min, max) ? n : def,
mod = (n: number, m: number) => ((n % m) + m) % m;
