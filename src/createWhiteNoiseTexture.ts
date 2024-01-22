import { Filter, Renderer, RenderTexture } from 'pixi.js'
import * as PIXI from 'pixi.js'
import noiseFrag from './whiteNoise.frag?raw'

const whiteNoiseFilter = new Filter(undefined, noiseFrag, {
  seed: [Math.random(), Math.random(), Math.random(), Math.random()],
})

export const createWhiteNoiseTexture = (
  renderer: Renderer,
  dimensions: {
    width: number
    height: number
  },
): RenderTexture => {
  const renderTexture = RenderTexture.create(dimensions)

  let sprite = new PIXI.Graphics()
  sprite.beginFill(0xffffff)
  sprite.drawRect(0, 0, dimensions.width, dimensions.height)
  sprite.filters = [whiteNoiseFilter]

  renderer.render(sprite, { renderTexture })
  return renderTexture
}
