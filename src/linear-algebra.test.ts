import { describe, expect, it } from 'vitest'
import { linspace } from './linear-algebra.ts'

describe('linspace', () => {
  it('works', () => {
    expect(linspace(0, 1, 2)).toEqual([0, 1])
    expect(linspace(0, 9, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
