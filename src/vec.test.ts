import { describe, expect, it } from 'vitest'
import { normalized1 } from './vec.ts'

describe('normalized1', () => {
  it('normalizes ', () => {
    expect(normalized1([1, 1])).toEqual([1 / 2, 1 / 2])
  })
})
