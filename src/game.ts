import { GameObject } from './gameObject.ts'
import * as Rapier from '@dimforge/rapier2d'

export const createGame = () => {
  let world = new Rapier.World(gravity)
  let gameObjects = [] as GameObject[]

  return {
    addGameObjects: (objs: GameObject[]) => {
      gameObjects = [...gameObjects, ...objs]
    },
  }
}
