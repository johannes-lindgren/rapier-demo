import { Filter, Renderer, RenderTexture, Texture } from 'pixi.js'
import * as PIXI from 'pixi.js'
import defaultVert from './default.vert?raw'
import fragmentShader from './perlinNoise.frag?raw'
import { sum, Vec, Vec2 } from './vec.ts'

const perlinNoiseFilter = (whiteNoiseTexture: Texture) =>
  new Filter(defaultVert, fragmentShader, {
    whiteNoise: whiteNoiseTexture,
    ...perlins([
      {
        size: 0.3,
        weight: 1,
      },
      {
        size: 0.1,
        weight: 1,
      },
      {
        size: 0.05,
        weight: 0.5,
      },
    ]),
  })

const perlins = (
  ps: { size: number; weight: number }[],
): { perlinsCount: number; perlins: Vec } => {
  const totalWeight = sum(ps.map((it) => it.weight))
  return {
    perlins: ps.flatMap((p) => [p.size, p.weight / totalWeight]),
    perlinsCount: ps.length,
  }
}

export const createPerlinNoiseTexture = (
  renderer: Renderer,
  dimensions: {
    width: number
    height: number
  },
  whiteNoiseTexture: Texture,
): RenderTexture => {
  const renderTexture = RenderTexture.create(dimensions)

  let sprite = new PIXI.Graphics()
  sprite.beginFill(0x000000)
  sprite.drawRect(0, 0, dimensions.width, dimensions.height)
  sprite.filters = [perlinNoiseFilter(whiteNoiseTexture)]

  renderer.render(sprite, { renderTexture })
  return renderTexture
}
