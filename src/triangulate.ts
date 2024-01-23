import Triangle from 'triangle-wasm'

export const triangulate = async (options: {
  vertices: [number, number][]
  segments: [number, number][]
  holes: [number, number][]
}) => {
  await Triangle.init('/triangle.out.wasm')

  console.log('verts', options.vertices.length)
  console.log('segments', options.segments.length)
  console.log('holes', options.holes.length)
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
      quality: 10,
      holes: true,
      ccdt: false,
      convexHull: false,
      area: 0.2,
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
