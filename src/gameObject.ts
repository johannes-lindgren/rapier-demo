import { DisplayObject } from 'pixi.js'
import {
  Collider,
  ColliderDesc,
  RigidBody,
  RigidBodyDesc,
} from '@dimforge/rapier2d'
import { Tuple3, Vec2, Vec3 } from './vec.ts'

export type BoxGameObject = {
  tag: 'box'
  sprite: DisplayObject
  debugDisplayObject: DisplayObject
  rigidBody: RigidBody
  collider: Collider
}

export type TriangleGameObject = {
  tag: 'triangle'
  indices: Vec3
  vertices: Tuple3<Vec2>
  groupId: string
  sprite: DisplayObject
  debugDisplayObject: DisplayObject
  rigidBody: RigidBody
  collider: Collider
}

export type GrenadeGameObject = {
  tag: 'grenade'
  sprite: DisplayObject
  debugDisplayObject?: DisplayObject
  rigidBody: RigidBody
  collider: Collider
}

export type Desc<G extends GameObject> = Omit<G, 'collider' | 'rigidBody'> & {
  colliderDesc: ColliderDesc
  rigidBodyDesc: RigidBodyDesc
}

export type GameObject = BoxGameObject | TriangleGameObject | GrenadeGameObject
