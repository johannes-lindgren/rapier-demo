import tokenizeSvg from 'parse-svg-path'
import { span } from './stringUtils.ts'
import { SvgToken } from './SvgToken.ts'

export const parseSvgPath = (path: string) =>
  parseSvg(tokenizeSvg(path)).map(transformPath)

const parseSvg = (tokens: SvgToken[]): SvgToken[][] => {
  const [first, [z, ...rest]] = span((command) => command[0] !== 'Z', tokens)
  return rest.length === 0
    ? [[...first, z]]
    : [[...first, z], ...parseSvg(rest)]
}

const transformPath = (path: SvgToken[]): [number, number][] =>
  path.reduce(
    (vertices, currentValue, currentIndex, array) => {
      switch (currentValue[0]) {
        case 'M': {
          vertices.push([currentValue[1], currentValue[2]])
          break
        }
        case 'V': {
          const previousPos = vertices[currentIndex - 1]
          vertices.push([previousPos[0], currentValue[1]])
          break
        }
        case 'H': {
          const previousPos = vertices[currentIndex - 1]
          vertices.push([currentValue[1], previousPos[1]])
          break
        }
        case 'Z': {
          break
        }
      }
      return vertices
    },
    [] as [number, number][],
  )
