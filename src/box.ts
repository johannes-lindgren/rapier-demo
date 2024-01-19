import { GameObject } from './gameObject.ts'

export const createBox = (): Extract<
  GameObject,
  {
    tag: 'box'
  }
> => {
  return {
    tag: 'box',
  }
}
