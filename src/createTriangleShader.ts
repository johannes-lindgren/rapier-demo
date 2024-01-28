import { Shader, Texture } from 'pixi.js'
import vertexShader from './triangle.vert?raw'
import fragmentShader from './triangle.frag?raw'

export const createTriangleShader = (heightMap: Texture) =>
  Shader.from(vertexShader, fragmentShader, {
    heightMap,
  })
