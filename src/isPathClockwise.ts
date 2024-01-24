import { Vector } from './vector.ts'

export const isPathClockwise = (a: Vector, b: Vector, c: Vector) => {
  // const ab = diff(b, a)
  // const ac = diff(c, a)
  // return cross(ab, ac) < 0
  // Faster than above
  return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y) < 0
}
