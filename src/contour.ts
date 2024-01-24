import { greet } from 'wasm-lib'
import { parseSvgPath } from './parseSvgPath/parseSvgPath.ts'

export const contour = (width: number, height: number, pixels: Uint8Array) => {
  const path = greet(width, height, pixels)
  return parseSvgPath(path)
}
