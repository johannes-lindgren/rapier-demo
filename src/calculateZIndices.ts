export const calculateZIndices = <const Keys extends string[]>(
  keys: Keys,
): { [key in Keys[number]]: number } =>
  // @ts-ignore
  Object.fromEntries(keys.map((key, index) => [key, index]))
