import { Triangles, Vec2 } from './triangulate.ts'
import { sum, Vec, Vec3 } from './vec.ts'

type GroupedTriangles = {
  vertices: Vec2[]
  groups: Record<number, Vec3[]>
}

/**
 * TODO NOT TESTED
 * @param group1
 * @param group2
 */
export const areGroupsConnected = (group1: Vec3[], group2: Vec3[]): boolean => {
  for (let i1 = 0; i1 < group1.length; i1++) {
    for (let i2 = 0; i2 < group2.length; i2++) {
      //   TODO cut in half
      if (areTrianglesJoined(group1[i1], group2[i2])) {
        return true
      }
    }
  }
  return false
}

export const isInGroup = (triangle: Vec3, group: Vec3[]): boolean => {
  for (let i = 0; i < group.length; i++) {
    //   TODO cut in half
    if (areTrianglesJoined(group[i], triangle)) {
      return true
    }
  }
  return false
}

/**
 * Given the indices of two triangles: do they share a common side?
 * @param indices1
 * @param indices2
 */
export const areTrianglesJoined = (indices1: Vec3, indices2: Vec3): boolean => {
  let identical = 0
  for (let i1 = 0; i1 < indices1.length; i1++) {
    for (let i2 = 0; i2 < indices2.length; i2++) {
      if (indices1[i1] === indices2[i2]) {
        identical++
        break
      }
    }
  }
  return identical >= 2
}

const splitGroup = (indices: Vec3[]): [Vec3[], Vec3[]] => {
  const group = [indices[0]] as Vec3[]
  let left = indices.slice(1)
  let groupIndex = 0
  while (groupIndex < group.length) {
    const currentTriangle = group[groupIndex]
    let nextLeft = [] as Vec3[]
    for (let i = 0; i < left.length; i++) {
      if (areTrianglesJoined(currentTriangle, left[i])) {
        group.push(left[i])
      } else {
        nextLeft.push(left[i])
      }
    }
    left = nextLeft
    groupIndex++
  }
  return [group, left]
}

export const groupTriangles = (indices: Vec3[]): Vec3[][] => {
  const groups = [] as Vec3[][]
  let left = indices
  while (left.length > 0) {
    const [group, nextLeft] = splitGroup(left)
    groups.push(group)
    left = nextLeft
  }
  return groups
}
