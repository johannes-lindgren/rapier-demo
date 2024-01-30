import { TriangulationInput, Vec2 } from './triangulate.ts'

export const createDebugShape = (position: Vec2): TriangulationInput => {
  // outer
  const outerVertices: Vec2[] = [
    // x, y
    [-2, -2],
    // x, y
    [2, -2],
    // x, y
    [10, 2],
    // x, y
    [3, 3],
    // x, y
    [-2, 5],
  ]
  // inner
  const innerVertices: Vec2[] = [
    [-1, -0.5],
    [0, 0.5],
    [1, -0.5],
  ]

  const translateMesh = (pos: Vec2): Vec2 => [
    pos[0] + position[0],
    pos[1] + position[1],
  ]
  const vertices = [...outerVertices, ...innerVertices].map(translateMesh)
  const segments: Vec2[] = [
    [4, 0],
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [7, 5],
    [5, 6],
    [6, 7],
  ]
  const holes = [[0, -0.1]].map(translateMesh)
  return {
    vertices,
    segments,
    holes,
  }
}
