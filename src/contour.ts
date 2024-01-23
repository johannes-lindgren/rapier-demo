import { greet } from 'wasm-lib'
import { parseSvgPath } from './parseSvgPath/parseSvgPath.ts'

export const contour = () => {
  const path = greet('')
  console.log('svg path:', path)
  return parseSvgPath(path)
}
