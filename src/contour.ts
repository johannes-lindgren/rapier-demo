import { greet } from 'wasm-lib'
import { parseSvgPath } from './parseSvgPath/parseSvgPath.ts'
import { Vec2, vec2sFromVec } from './vec.ts'

export type ContourResult = {
  contours: Vec2[][]
  holes: Vec2[]
}

export const contour = (
  width: number,
  height: number,
  pixels: Uint8Array,
): ContourResult => {
  // TODO call free
  const world = greet(width, height, pixels)
  const path = world.path
  return {
    contours: parseSvgPath(path),
    holes: vec2sFromVec(Array.from(world.holes)),
  }
}
