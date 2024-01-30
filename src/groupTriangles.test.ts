import { describe, expect, it } from 'vitest'
import { areTrianglesJoined } from './groupTriangles.ts'

describe('shareTwoIndices', () => {
  it('validates identical vectors', () => {
    expect(areTrianglesJoined([0, 1, 2], [0, 1, 2])).toEqual(true)
  })
  it('validates vectors with two shared indices', () => {
    expect(areTrianglesJoined([0, 1, 2], [0, 1, 3])).toEqual(true)
  })
  it('invalidates vectors with one shared indices', () => {
    expect(areTrianglesJoined([0, 1, 2], [0, 3, 4])).toEqual(false)
  })
  it('invalidates vectors with 0 shared indices', () => {
    expect(areTrianglesJoined([0, 1, 2], [3, 4, 5])).toEqual(false)
  })
})
