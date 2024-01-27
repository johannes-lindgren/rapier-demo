import { chunk } from 'lodash'

export type Tuple2<T> = [T, T]
export type Tuple3<T> = [T, T, T]
export type Vec = number[]
export type Vec2 = Tuple2<number>
export type Vec3 = Tuple3<number>

export const sum = (v: Vec) => {
  let acc = 0
  for (let x of v) {
    acc += x
  }
  return acc
}

/**
 * The L1 norm, Manhattan norm
 * @param v
 */
export const norm1 = (v: Vec): number => {
  let acc = 0
  for (let x of v) {
    acc += Math.abs(x)
  }
  return acc
}

/**
 * The vector normalized according to the L1 norm (Manhattan norm)
 * @param v
 */
export const normalized1 = (v: Vec): Vec => v.map((it) => it / norm1(v))

export const vec2sFromVec = (vec: Vec): Vec2[] =>
  chunk(vec, 2) as unknown as Vec2[]
