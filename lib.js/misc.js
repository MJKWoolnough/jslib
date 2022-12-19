export const isInt = (v, min = -Infinity, max = Infinity) => typeof v === "number" && (v|0) === v && v >= min && v <= max,
checkInt = (n, min = -Infinity, max = Infinity, def = 0) => isInt(n, min, max) ? n : def,
mod = (n, m) => ((n % m) + m) % m;
