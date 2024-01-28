import { Filter, Renderer, RenderTexture, Texture } from 'pixi.js'
import * as PIXI from 'pixi.js'
import defaultVert from './default.vert?raw'
import fragmentShader from './perlinNoise.frag?raw'
import { sum, Vec } from './vec.ts'
import { Vector } from './vector.ts'

const perlinNoiseFilter = (whiteNoiseTexture: Texture, dimensions: Vector) =>
  new Filter(defaultVert, fragmentShader, {
    whiteNoise: whiteNoiseTexture,
    dimensions: dimensions,
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
  dimensions: Vector,
  whiteNoiseTexture: Texture,
): RenderTexture => {
  const renderTexture = RenderTexture.create({
    width: dimensions.x,
    height: dimensions.y,
  })

  let sprite = new PIXI.Graphics()
  sprite.beginFill(0x000000)
  sprite.drawRect(0, 0, dimensions.x, dimensions.y)
  sprite.filters = [perlinNoiseFilter(whiteNoiseTexture, dimensions)]

  renderer.render(sprite, { renderTexture })
  return renderTexture
}
