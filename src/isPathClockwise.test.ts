import { describe, expect, it } from 'vitest'
import { isPathClockwise } from './isPathClockwise.ts'
import { vector } from './vector.ts'

describe('isPathClockwise', () => {
  it('manages clockwise paths', () => {
    expect(isPathClockwise(vector(0, 0), vector(0, 1), vector(1, 1))).toEqual(
      true,
    )
  })
  it('manages counter-clockwise paths', () => {
    expect(isPathClockwise(vector(0, 0), vector(0, 1), vector(-1, 1))).toEqual(
      false,
    )
  })
})
