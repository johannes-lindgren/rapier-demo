import { chunk } from 'lodash'
import { zeros } from './linear-algebra.ts'
import { n } from 'vitest/dist/reporters-rzC174PQ'

export type Tuple2<T> = [T, T]
export type Tuple3<T> = [T, T, T]
export type Tuple4<T> = [T, T, T, T]
export type Vec = number[]
export type Vec2 = Tuple2<number>
export type Vec3 = Tuple3<number>
export type Vec4 = Tuple4<number>

export type VecXy = {
  x: number
  y: number
}
export type VecXyz = {
  x: number
  y: number
  z: number
}

export const vec2 = (v: VecXy): Vec2 => [v.x, v.y]
export const vec3 = (v: VecXyz): Vec3 => [v.x, v.y, v.z]
export const vecXy = (v: Vec2): VecXy => ({
  x: v[0],
  y: v[1],
})
export const vecXyz = (v: Vec3): VecXyz => ({
  x: v[0],
  y: v[1],
  z: v[2],
})

export const add = (v1: Vec2, v2: Vec2): Vec2 => [v1[0] + v2[0], v1[1] + v2[1]]
export const sub = (v1: Vec2, v2: Vec2): Vec2 => [v1[0] - v2[0], v1[1] - v2[1]]

export const origo: Vec2 = [0, 0]

export const scale = <T extends Vec>(vec: T, scalar: number): T => {
  let out = new Array(vec.length)
  for (let i = 0; i < vec.length; i++) {
    out[i] = vec[i] * scalar
  }
  return out as T
}

export const centroid = <V extends Vec>(...vecs: V[]): V => {
  const dimensions = vecs[0].length
  let c = zeros(dimensions) as V
  for (let v of vecs) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      c[dimension] += v[dimension]
    }
  }
  for (let dimension = 0; dimension < dimensions; dimension++) {
    c[dimension] /= vecs.length
  }
  return c
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
