export const takeWhile = <T>(
  fn: (char: T) => boolean,
  xs: T[],
): T[] =>
  xs.length > 0 && fn(xs[0]) ? [xs[0], ...takeWhile(fn, xs.slice(1))] : [];

export const dropWhile = <T>(
  fn: (char: T) => boolean,
  xs: T[],
): T[] => xs.length > 0 && fn(xs[0]) ? dropWhile(fn, xs.slice(1)) : xs;

export const span = <T>(
  fn: (char: T) => boolean,
  cs: T[],
): [T[], T[]] => [
  takeWhile(fn, cs),
  dropWhile(fn, cs),
];
