import { Filter, IRenderer, RenderTexture } from 'pixi.js'
import * as PIXI from 'pixi.js'
import noiseFrag from './whiteNoise.frag?raw'
import { Vec4 } from './vec.ts'

const whiteNoiseFilter = (seed: Vec4) =>
  new Filter(undefined, noiseFrag, {
    seed,
  })

export const createWhiteNoiseTexture = (
  renderer: IRenderer,
  dimensions: {
    width: number
    height: number
  },
  seed: Vec4,
): RenderTexture => {
  const renderTexture = RenderTexture.create(dimensions)

  let sprite = new PIXI.Graphics()
  sprite.beginFill(0xffffff)
  sprite.drawRect(0, 0, dimensions.width, dimensions.height)
  sprite.filters = [whiteNoiseFilter(seed)]

  renderer.render(sprite, { renderTexture })
  return renderTexture
}
