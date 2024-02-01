import { Graphics } from 'pixi.js'

export const createArrow = () => {
  const line = new Graphics()
  line.lineStyle(0.05, 0xd5402b, 1)
  line.moveTo(0, 0)
  line.lineTo(1, 0)
  line.endFill()
  return line
}
