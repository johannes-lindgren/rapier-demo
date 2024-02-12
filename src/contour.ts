import { greet } from 'wasm-lib'
import { parseSvgPath } from './parseSvgPath/parseSvgPath.ts'
import { Vec2 } from './vec.ts'
import { Vector } from './vector.ts'

export type ContourResult = {
  contours: Vec2[][]
  holes: Vec2[][]
}

export const contour = (
  dimensions: Vector,
  pixels: Uint8Array | Uint8ClampedArray,
  thresholdFill: number,
  thresholdHole: number,
): ContourResult => {
  // TODO call free
  const world = greet(
    dimensions.x,
    dimensions.y,
    thresholdFill,
    thresholdHole,
    pixels,
  )
  return {
    contours: parseSvgPath(world.path),
    holes: parseSvgPath(world.holes),
  }
}
