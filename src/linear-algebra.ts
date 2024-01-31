import { Vec, Vec2 } from './vec.ts'

export const zeros = (n: number): Vec => {
  const arr = new Array(n)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = 0
  }
  return arr
}

export const ones = (n: number) => {
  const arr = new Array(n)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = 1
  }
  return arr
}

export const linspace = (x1: number, x2: number, n: number) => {
  if (n === 0) {
    return []
  }
  if (n === 1) {
    return [x1]
  }
  return zeros(n).map((_, index) => x1 + (index * (x2 - x1)) / (n - 1))
}
/**
 *  Apply a filter on looped verices
 * @param arr
 * @param filter
 */
export const filterLoop = (arr: Vec2[], filter: number[]): Vec2[] => {
  const offset = Math.floor(filter.length / 2)
  return arr.map((_, vertexIndex) =>
    filter.reduce(
      (sum, amp, filterIndex) => {
        const n = mod(vertexIndex + filterIndex - offset, arr.length)
        const vertex = arr[n]
        sum[0] += amp * vertex[0]
        sum[1] += amp * vertex[1]
        return sum
      },
      [0, 0],
    ),
  )
}

/**
 * Fix to the JavaScript modulo bug
 * @param n
 * @param m
 */
const mod = (n: number, m: number) => ((n % m) + m) % m
