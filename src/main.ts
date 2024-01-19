import './style.css'
import * as Rapier from '@dimforge/rapier2d'
import {
  ActiveEvents,
  ColliderDesc,
  EventQueue,
  RigidBodyDesc,
  RigidBodyType,
  Vector,
  Vector2,
} from '@dimforge/rapier2d'
import * as PIXI from 'pixi.js'
import {
  Container,
  Geometry,
  GpuProgram,
  MIPMAP_MODES,
  Shader,
  State,
} from 'pixi.js'
import { BoxGameObject, GameObject } from './gameObject.ts'
import regularVertex from './regular.vert?raw'
import colorFrag from './color.frag?raw'
import { zeros } from './zeros.ts'

// const game = createGame()

//
// Rapier
//

const boxSize = 1

// Use the Rapier module here.
let gravity = {
  x: 0.0,
  // y: 0,
  y: -9.81,
}
let world = new Rapier.World(gravity)

// Create a dynamic rigid-body.
let playerBody = world.createRigidBody(
  RigidBodyDesc.dynamic().setTranslation(0.0, 5.0),
)

// Create a ball collider attached to the dynamic rigidBody.
let playerCollider = world.createCollider(ColliderDesc.ball(0.5), playerBody)

const app = new PIXI.Application({
  background: '#1099bb',
})
document.body.appendChild(app.view)

const viewport = new Container()
app.stage.addChild(viewport)
const pixiWorld = new Container()
viewport.addChild(pixiWorld)

const handleResize = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  // See 10 meters horizontally
  const viewportWidth = 20
  // const viewport = {
  //   width: viewportWidth,
  //   height: aspectRatio * viewportWidth,
  // }
  // Put the world into center of screen.
  // viewport.x = app.renderer.screen.width / 2
  // viewport.y = app.renderer.screen.height / 2
  // Show 10 world units on screen.

  const scale = width / viewportWidth
  viewport.scale.set(scale, -scale)
  viewport.x = width / 2
  viewport.y = height / 2

  app.renderer.resize(width, height)
}
// activate plugins

window.addEventListener('resize', handleResize)
handleResize()

// create a new Sprite from an image path
const playerSprite = PIXI.Sprite.from('/player_512.png', {
  mipmap: MIPMAP_MODES.POW2,
})
// center the sprite's anchor point
playerSprite.anchor.set(0.5)
// move the sprite to the center of the screen
playerSprite.x = 0
playerSprite.y = 0
playerSprite.width = 1
playerSprite.height = 1
pixiWorld.addChild(playerSprite)

const rectangleGeometry = new PIXI.Geometry().addAttribute(
  'aVertexPosition',
  [
    // x, y
    -1, -1,
    // x, y
    1, -1,
    // x, y
    1, 1,
    // x, y
    -1, -1,
    // x, y
    -1, 1,
    // x, y
    1, 1,
  ],
  2,
)

const rectangleUvs = [
  // u, v
  0, 0,
  // u, v
  1, 0,
  // u, v
  1, 1,
  // u, v
  0, 0,
  // u, v
  0, 1,
  // u, v
  1, 1,
]

const shader = PIXI.Shader.from(regularVertex, colorFrag, {
  uSampler2: PIXI.Texture.from('https://pixijs.com/assets/bg_scene_rotate.jpg'),
  time: new Vector2(1, 1),
})

const createBox = (
  position: Vector,
  textureSpan: {
    u: number
    v: number
    uw: number
    vw: number
  },
): BoxGameObject => {
  const { u, v, uw, vw } = textureSpan
  const transformCoordinate = (coord: number, index: number) =>
    index % 2 === 0
      ? // u
        u + coord * uw
      : // v
        v + coord * vw
  const uvs = rectangleUvs.map(transformCoordinate)
  const geometry = rectangleGeometry.clone().addAttribute('aUvs', uvs, 2)
  const triangle = new PIXI.Mesh(geometry, shader)
  triangle.position.set(position.x, position.y)
  triangle.width = 1
  triangle.height = 1

  // for (let i = 0; i < triangle.uvs.length; i += 3 * 2) {
  //   triangle.uvs[i + 0] *= textureCoordinates.x
  //   triangle.uvs[i + 1] *= textureCoordinates.y
  //   triangle.uvs[i + 2] *= textureCoordinates.x
  //   triangle.uvs[i + 3] *= textureCoordinates.y
  //   triangle.uvs[i + 4] *= textureCoordinates.x
  //   triangle.uvs[i + 5] *= textureCoordinates.y
  // }

  let sprite = new PIXI.Graphics()
  sprite.beginFill(0xff0000)
  sprite.drawRect(-0.5 * boxSize, -0.5 * boxSize, boxSize, boxSize)

  return {
    tag: 'box',
    sprite: triangle,
    rigidBodyDesc: RigidBodyDesc.fixed().setTranslation(position.x, position.y),
    colliderDes: ColliderDesc.cuboid(0.5 * boxSize, 0.5 * boxSize)
      .setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS)
      .setContactForceEventThreshold(0),
  }
}

let gameObjects = [] as GameObject[]

const addGameObjects = (newObjs: GameObject[]) => {
  gameObjects = [...gameObjects, ...newObjs]
  newObjs.forEach((it) => {
    pixiWorld.addChild(it.sprite)
    const ridigBody = world.createRigidBody(it.rigidBodyDesc)
    it.rigidBody = ridigBody
    it.collider = world.createCollider(it.colliderDes, ridigBody)
  })
}

//
// Generate world
//

const horizontalBoxes = 10
const verticalBoxes = 10

addGameObjects(
  zeros(horizontalBoxes).flatMap((_, column) =>
    zeros(verticalBoxes).map((_, row) =>
      createBox(new Vector2(column - horizontalBoxes / 2, -row), {
        u: column / horizontalBoxes,
        v: row / verticalBoxes,
        uw: 1 / horizontalBoxes,
        vw: 1 / verticalBoxes,
      }),
    ),
  ),
)

// Listen for animate update
app.ticker.add(() => {
  let eventQueue = new EventQueue(true)
  // Ste the simulation forward.
  world.step(eventQueue)
  const handleCollision = (colliderHandle: number, forceMagniture: number) => {
    const gameObject = gameObjects.find(
      (it) => it.collider.handle === colliderHandle,
    )
    if (!gameObject) {
      return
    }

    // gameObject.rigidBody.setBodyType(RigidBodyType.Dynamic, true)
  }
  eventQueue.drainContactForceEvents((event) => {
    handleCollision(event.collider1(), event.totalForceMagnitude())
    handleCollision(event.collider2(), event.totalForceMagnitude())
  })

  gameObjects.forEach((it) => {
    const pos = it.collider.translation()
    it.sprite.position.x = pos.x
    it.sprite.position.y = pos.y
    it.sprite.rotation = it.collider.rotation()
  })

  let playerPosition = playerCollider.translation()

  // viewport.position.x = playerPosition.x
  // viewport.position.y = playerPosition.y
  // just for fun, let's rotate mr rabbit a little
  // delta is 1 if running at 100% performance
  // creates frame-independent transformation
  playerSprite.position.x = playerPosition.x
  playerSprite.position.y = playerPosition.y

  // console.log(position.x)
})

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW': {
      playerBody.applyImpulse({ x: 0.0, y: 3.0 }, true)
      break
    }
    case 'KeyS': {
      playerBody.applyImpulse({ x: 0.0, y: -3.0 }, true)
      break
    }
    case 'KeyA': {
      playerBody.applyImpulse({ x: -2.0, y: 0.0 }, true)
      break
    }
    case 'KeyD': {
      playerBody.applyImpulse({ x: 2.0, y: 0.0 }, true)
      break
    }
    case 'KeyG': {
      console.log('world snapshot', world.takeSnapshot())
      break
    }
  }
})
