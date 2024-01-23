import { greet } from 'wasm-lib'

export const contour = () => {
  const path = greet('')
  console.log('path', path)
}
