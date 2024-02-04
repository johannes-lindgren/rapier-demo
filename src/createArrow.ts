import { Graphics } from 'pixi.js'

export const createArrow = (
  width: number = 0.05,
  color: number = 0xd5402b,
  alpha: number = 1,
) => {
  const line = new Graphics()
  line.lineStyle(width, color, alpha)
  line.moveTo(0, 0)
  line.lineTo(1, 0)
  line.endFill()
  return line
}
