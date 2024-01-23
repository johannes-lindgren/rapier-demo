import { DisplayObject } from 'pixi.js'
import {
  Collider,
  ColliderDesc,
  RigidBody,
  RigidBodyDesc,
} from '@dimforge/rapier2d'

export type BoxGameObject = {
  tag: 'box'
  sprite: DisplayObject
  colliderDesc: ColliderDesc
  rigidBodyDesc: RigidBodyDesc
  rigidBody: RigidBody
  collider: Collider
}

export type TriangleGameObject = {
  tag: 'triangle'
  sprite: DisplayObject
  colliderDesc: ColliderDesc
  rigidBodyDesc: RigidBodyDesc
  rigidBody: RigidBody
  collider: Collider
}

export type GameObject = BoxGameObject | TriangleGameObject
