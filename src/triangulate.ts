import Triangle from 'triangle-wasm'

export const triangulate = async (options: {
  vertices: [number, number][]
  segments: [number, number][]
  holes: [number, number][]
}) => {
  await Triangle.init('/triangle.out.wasm')
  const data = {
    pointlist: options.vertices.flat(),
    segmentlist: options.segments.flat(),
    holelist: options.holes.flat(),
  }

  // Triangulation
  const input = Triangle.makeIO(data)
  const output = Triangle.makeIO()

  Triangle.triangulate(
    {
      pslg: false,
      quality: true,
      holes: true,
      ccdt: true,
      convexHull: false,
      area: 1.0,
    },
    input,
    output,
  )

  // draw output
  // ...
  const triangles = {
    indices: Array.from(output.trianglelist) as number[],
    pointlist: Array.from(output.pointlist) as number[],
  }

  Triangle.freeIO(input, true)
  Triangle.freeIO(output)

  return triangles
}
