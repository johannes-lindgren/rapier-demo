import { Shader, Texture } from 'pixi.js'
import vertexShader from './triangle.vert?raw'
import fragmentShader from './triangle.frag?raw'
import { Vector } from './vector.ts'
import { Vec2 } from './vec.ts'

export const createTriangleShader = (
  heightMap: Texture,
  dimensions: Vector,
  threshold: number,
) =>
  Shader.from(vertexShader, fragmentShader, {
    heightMap,
    dimensions,
    threshold,
  })
