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
  colliderDes: ColliderDesc
  rigidBodyDesc: RigidBodyDesc
  rigidBody: RigidBody
  collider: Collider
}

export type GameObject = BoxGameObject
