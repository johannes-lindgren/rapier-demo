import { Vec2 } from '../vec.ts'

export const radialDistance = (points: Vec2[], tolerance: number): Vec2[] => {
  if (points.length <= 1) {
    return points
  }
  var sqTolerance = tolerance * tolerance

  var prevPoint = points[0]
  var newPoints = [prevPoint]
  var point: Vec2

  for (var i = 1, len = points.length; i < len; i++) {
    point = points[i]

    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point)
      prevPoint = point
    }
  }

  if (prevPoint !== point) {
    newPoints.push(point)
  }

  return newPoints
}

const getSqDist = (p1: Vec2, p2: Vec2) => {
  var dx = p1[0] - p2[0],
    dy = p1[1] - p2[1]

  return dx * dx + dy * dy
}
