import { norm2, sub, Vec, Vec2 } from './vec.ts'

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
  a: Vec2,
  b: Vec2,
  bc: number,
  ca: number,
): Vec2 | undefined {
  const ab = norm2(sub(a, b))
  const cosAcb = (bc ** 2 + ca ** 2 - ab ** 2) / (2 * bc * ca)
  const sinAcb = Math.sin(Math.acos(cosAcb))
  const c: Vec2 = [a[0] + ca * cosAcb, a[1] + ca * sinAcb]
  return isNaN(c[0]) || isNaN(c[1]) ? undefined : c
}
