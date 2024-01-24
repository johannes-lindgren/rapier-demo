import { Filter, Renderer, RenderTexture, Texture } from 'pixi.js'
import * as PIXI from 'pixi.js'
import defaultVert from './default.vert?raw'
import noiseFrag from './perlinNoise.frag?raw'

export const createPerlinNoiseTexture = (
  renderer: Renderer,
  dimensions: {
    width: number
    height: number
  },
  whiteNoiseTexture: Texture,
): RenderTexture => {
  const whiteNoiseFilter = new Filter(defaultVert, noiseFrag, {
    whiteNoise: whiteNoiseTexture,
    size: [0.2, 0.2],
  })

  const renderTexture = RenderTexture.create(dimensions)

  let sprite = new PIXI.Graphics()
  sprite.beginFill(0x000000)
  sprite.drawRect(0, 0, dimensions.width, dimensions.height)
  sprite.filters = [whiteNoiseFilter]

  renderer.render(sprite, { renderTexture })
  return renderTexture
}
