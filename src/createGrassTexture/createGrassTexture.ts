import { Filter, IRenderer, RenderTexture, Texture } from 'pixi.js'
import * as PIXI from 'pixi.js'
import defaultVert from '../default.vert?raw'
import fragmentShader from './grassTexture.frag?raw'
import { Vector } from '../vector.ts'

const filter = (
  terrainTexture: Texture,
  dimensions: Vector,
  threshold: number,
) =>
  new Filter(defaultVert, fragmentShader, {
    terrainTexture,
    threshold,
    dimensions: dimensions,
  })

export const createGrassTexture = (
  renderer: IRenderer,
  dimensions: Vector,
  whiteNoiseTexture: Texture,
  threshold: number,
): RenderTexture => {
  const renderTexture = RenderTexture.create({
    width: dimensions.x,
    height: dimensions.y,
  })

  let sprite = new PIXI.Graphics()
  sprite.beginFill(0x000000)
  sprite.drawRect(0, 0, dimensions.x, dimensions.y)
  sprite.filters = [filter(whiteNoiseTexture, dimensions, threshold)]

  renderer.render(sprite, { renderTexture })
  return renderTexture
}
