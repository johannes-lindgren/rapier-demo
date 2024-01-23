import { describe, expect, it } from 'vitest'
import { parseSvgPath } from './parseSvgPath.ts'

describe('parseSvgPath', () => {
  it('parses', () => {
    expect(parseSvgPath('M0 0H6V5H0ZM1 1V4H5V1ZM2 2H4V3H2Z')).toHaveLength(3)
  })
})

const svgPath = 'M0 0H6V5H0Z'
const correctAnswer = [
  [0, 0],
  [6, 0],
  [6, 5],
  [0, 5],
]

describe('parseSvgPath', () => {
  it('groups the paths', () => {
    expect(parseSvgPath('M0 0H6V5H0ZM1 1V4H5V1ZM2 2H4V3H2Z')).toHaveLength(3)
  })
  it('gets the coordinates right', () => {
    expect(parseSvgPath('M0 0H6V5H0Z')).toEqual([correctAnswer])
  })
  it('parses multiple paths', () => {
    expect(parseSvgPath([svgPath, svgPath, svgPath].join())).toEqual([
      correctAnswer,
      correctAnswer,
      correctAnswer,
    ])
  })
})
