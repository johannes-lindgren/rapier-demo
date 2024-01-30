import { DisplayObject } from 'pixi.js'
import {
  Collider,
  ColliderDesc,
  RigidBody,
  RigidBodyDesc,
} from '@dimforge/rapier2d'

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
  debugDisplayObject: DisplayObject
  sprite: DisplayObject
  colliderDesc: ColliderDesc
  rigidBodyDesc: RigidBodyDesc
  rigidBody: RigidBody
  collider: Collider
  groupId: string
}

export type GameObject = BoxGameObject | TriangleGameObject
