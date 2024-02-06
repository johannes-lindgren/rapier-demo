export type NonEmptyArray<T> = [T, ...T[]]

export const isNonEmpty = <T>(arr: T[]): arr is NonEmptyArray<T> =>
  arr.length > 0

export const isEmpty = <T>(arr: T[]): arr is [] => arr.length === 0

export const min = <T>(
  arr: NonEmptyArray<T>,
  predicate: (item: T) => number,
): T =>
  arr.reduce(
    (minimum, item) =>
      predicate(item) < minimum[1]
        ? ([item, predicate(item)] as const)
        : minimum,
    [arr[0], predicate(arr[0])] as const,
  )[0]
