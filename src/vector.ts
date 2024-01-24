export type Vector = {
  x: number
  y: number
}

export const vector = (x: number, y: number) => ({
  x,
  y,
})

export const sum = (v1: Vector, v2: Vector) => vector(v1.x + v2.x, v1.y + v2.y)
export const diff = (v1: Vector, v2: Vector) => vector(v1.x - v2.x, v1.y - v2.y)
export const cross = (v1: Vector, v2: Vector) => v1.x * v2.y - v1.y * v2.x
