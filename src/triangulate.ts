import Triangle from 'triangle-wasm'
import { chunk } from 'lodash'

export type Vec2 = [number, number]
export type Vec3 = [number, number, number]

export type TriangulationInput = {
  vertices: Vec2[]
  segments: Vec2[]
  holes: Vec2[]
}

export type Triangles = {
  vertices: Vec2[]
  indices: Vec3[]
}

export const triangulate = async (
  shape: TriangulationInput,
  area: number,
): Promise<Triangles> => {
  await Triangle.init(`${import.meta.env.BASE_URL}triangle.out.wasm`)

  const data = {
    pointlist: shape.vertices.flat(),
    segmentlist: shape.segments.flat(),
    holelist: shape.holes.flat(),
  }

  // Triangulation
  const input = Triangle.makeIO(data)
  const output = Triangle.makeIO()

  Triangle.triangulate(
    {
      quality: 10,
      holes: true,
      ccdt: false,
      convexHull: false,
      area,
    },
    input,
    output,
  )

  // draw output
  // ...
  const triangles: Triangles = {
    vertices: chunk(Array.from(output.pointlist), 2) as Vec2[],
    indices: chunk(Array.from(output.trianglelist), 3) as Vec3[],
  }

  Triangle.freeIO(input, true)
  Triangle.freeIO(output)

  return triangles
}
