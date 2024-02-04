import { Vec2 } from './vec.ts'

// const getC = (
//   sideAB: number,
//   sideBC: number,
//   sideCA: number,
//   ) => [
//   (a^2 - b^2 + c^2)/(2 c)
//  // +/-
//  Math.sqrt(a^2 - (a^2 - b^2 + c^2)^2/(4 c^2))
// ]

export function findC(
  pointA: Vec2,
  pointB: Vec2,
  sideAB: number,
  sideBC: number,
  sideCA: number,
): Vec2 {
  // Convert coordinates to vectors
  const vectorA = pointA
  const vectorC = pointB

  // Calculate the vector from A to C
  const vectorAC = [vectorC[0] - vectorA[0], vectorC[1] - vectorA[1]]

  // Calculate the length of the vector from A to C
  const lengthAC_Vector = Math.sqrt(vectorAC[0] ** 2 + vectorAC[1] ** 2)

  // Normalize the vector AC
  const normalizedAC = [
    vectorAC[0] / lengthAC_Vector,
    vectorAC[1] / lengthAC_Vector,
  ]

  // Calculate the coordinates of point B
  const coordB = [
    pointA[0] + normalizedAC[0] * sideAB,
    pointA[1] + normalizedAC[1] * sideAB,
  ]

  return coordB
}
