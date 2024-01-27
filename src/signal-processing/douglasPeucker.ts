// square distance from a point to a segment
import { Vec2 } from '../vec.ts'

function getSqSegDist(p: Vec2, p1: Vec2, p2: Vec2) {
  var x = p1[0],
    y = p1[1],
    dx = p2[0] - x,
    dy = p2[1] - y

  if (dx !== 0 || dy !== 0) {
    var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)

    if (t > 1) {
      x = p2[0]
      y = p2[1]
    } else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }

  dx = p[0] - x
  dy = p[1] - y

  return dx * dx + dy * dy
}

function simplifyDPStep(
  points: Vec2[],
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Vec2[],
) {
  var maxSqDist = sqTolerance,
    index

  for (var i = first + 1; i < last; i++) {
    var sqDist = getSqSegDist(points[i], points[first], points[last])

    if (sqDist > maxSqDist) {
      index = i
      maxSqDist = sqDist
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1)
      simplifyDPStep(points, first, index, sqTolerance, simplified)
    simplified.push(points[index])
    if (last - index > 1)
      simplifyDPStep(points, index, last, sqTolerance, simplified)
  }
}

// simplification using Ramer-Douglas-Peucker algorithm
export const douglasPeucker = (points: Vec2[], tolerance: number): Vec2[] => {
  if (points.length <= 1) {
    return points
  }
  var sqTolerance = tolerance * tolerance

  var last = points.length - 1

  var simplified = [points[0]]
  simplifyDPStep(points, 0, last, sqTolerance, simplified)
  simplified.push(points[last])

  return simplified
}
