declare module 'parse-svg-path' {
  import { SvgToken } from './SvgToken.ts'

  function parse(path: string): SvgToken[]
  export = parse
}
