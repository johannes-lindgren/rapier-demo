import { chunk } from 'lodash'

export type Tuple2<T> = [T, T]
export type Tuple3<T> = [T, T, T]
export type Tuple4<T> = [T, T, T, T]
export type Vec = number[]
export type Vec2 = Tuple2<number>
export type Vec3 = Tuple3<number>
export type Vec4 = Tuple4<number>

export const add = (v1: Vec2, v2: Vec2): Vec2 => [v1[0] + v2[0], v1[1] + v2[1]]

export const scale = <T extends Vec>(vec: T, scalar: number): T => {
  let out = new Array(vec.length)
  for (let i = 0; i < vec.length; i++) {
    out[i] = vec[i] * scalar
  }
  return out as T
}

export const mean = (vecs: Vec2[]): Vec2 => {
  let x = 0
  let y = 0
  for (let v of vecs) {
    x += v[0]
    y += v[1]
  }
  x /= vecs.length
  y /= vecs.length
  return [x, y]
}

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
