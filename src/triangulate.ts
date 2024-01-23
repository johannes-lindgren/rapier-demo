import Triangle from 'triangle-wasm'

export const triangulate = async (options: {
  pointList: number[]
  holeList?: number[]
}) => {
  await Triangle.init('/triangle.out.wasm')
  const data = {
    pointlist: options.pointList,
    holelist: options.holeList,
  }

  // Triangulation
  const input = Triangle.makeIO(data)
  const output = Triangle.makeIO()

  Triangle.triangulate(
    { pslg: false, quality: true, holes: true },
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
