import { Shader, Texture } from 'pixi.js'
import vertexShader from './triangle.vert?raw'
import fragmentShader from './triangle.frag?raw'
import { Vector } from './vector.ts'

export const createTriangleShader = (
  heightMap: Texture,
  whiteNoise: Texture,
  dimensions: Vector,
  threshold: number,
) =>
  Shader.from(vertexShader, fragmentShader, {
    heightMap,
    whiteNoise,
    dimensions,
    threshold,
  })
