export type TypeGuardOf<T> = T extends (v: unknown) => v is infer U ? U : never;

export const Bool = () => (v: unknown): v is boolean => typeof v === "boolean",
Str = () => (v: unknown): v is string => typeof v === "string",
Undefined = () => (v: unknown): v is undefined => v === undefined,
Null = () => (v: unknown): v is null => v === null,
Num = () => (v: unknown): v is number => typeof v === "number",
BigInt = () => (v: unknown): v is bigint => typeof v === "bigint",
Sym = () => (v: unknown): v is Symbol => typeof v === "symbol",
Arr = () => (v: unknown): v is Array<any> => v instanceof Array,
Obj = () => (v: unknown): v is Object => v instanceof Object;
