import { dropWhile, span, takeWhile } from './stringUtils.ts'
import { describe, expect, it } from 'vitest'

const lessThan = (a: number) => (b: number) => b < a

describe('takeWhile', () => {
  it('takes empty arrays', () => {
    expect(takeWhile(() => false, [])).toEqual([])
    expect(takeWhile(() => true, [])).toEqual([])
  })
  it('takes whole arrays arrays', () => {
    expect(takeWhile(() => true, [1, 2, 3])).toEqual([1, 2, 3])
  })
  it('skips whole arrays', () => {
    expect(takeWhile(() => false, [1, 2, 3])).toEqual([])
  })
  it('takes while', () => {
    expect(takeWhile(lessThan(4), [1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3])
  })
})

describe('dropWhile', () => {
  it('drops empty arrays', () => {
    expect(dropWhile(() => true, [])).toEqual([])
    expect(dropWhile(() => false, [])).toEqual([])
  })
  it('drops whole arrays', () => {
    expect(dropWhile(() => true, [1, 2, 3, 4, 5, 6])).toEqual([])
  })
  it('takes whole arrays', () => {
    expect(dropWhile(() => false, [1, 2, 3])).toEqual([1, 2, 3])
  })
  it('drops whole arrays', () => {
    expect(dropWhile(lessThan(4), [1, 2, 3, 4, 5, 6])).toEqual([4, 5, 6])
  })
})

describe('span', () => {
  it('splits', () => {
    expect(span((it) => it !== 1, [0, 0, 0, 1, 0, 0])).toEqual([
      [0, 0, 0],
      [1, 0, 0],
    ])
  })
})
