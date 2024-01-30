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
  debugDisplayObject: DisplayObject
  sprite: DisplayObject
  colliderDesc: ColliderDesc
  rigidBodyDesc: RigidBodyDesc
  rigidBody: RigidBody
  collider: Collider
}

export type TriangleGameObject = {
  tag: 'triangle'
  indices: Vec3
  vertices: Tuple3<Vec2>
  debugDisplayObject: DisplayObject
  sprite: DisplayObject
  colliderDesc: ColliderDesc
  rigidBodyDesc: RigidBodyDesc
  rigidBody: RigidBody
  collider: Collider
  groupId: string
}

export type GameObject = BoxGameObject | TriangleGameObject
