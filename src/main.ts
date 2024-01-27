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
import { Container, MIPMAP_MODES } from 'pixi.js'
import { BoxGameObject, GameObject, TriangleGameObject } from './gameObject.ts'
import regularVertex from './regular.vert?raw'
import colorFrag from './color.frag?raw'
import { filterLoop, linspace, ones } from './linear-algebra.ts'
import { createWhiteNoiseTexture } from './createWhiteNoiseTexture.ts'
import { createPerlinNoiseTexture } from './createPerlinNoise.ts'
import { Shape, Triangles, triangulate, Vec2, Vec3 } from './triangulate.ts'
import { contour } from './contour.ts'
import { createDebugShape } from './createDebugShape.ts'
import { normalized1 } from './vec.ts'
import { getRandomColor } from './randomColor.ts'
import { douglasPeucker, radialDistance } from './signal-processing'

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
  RigidBodyDesc.dynamic().setTranslation(0.0, 5.0).setLinearDamping(0.2),
)

// Create a ball collider attached to the dynamic rigidBody.
let playerCollider = world.createCollider(
  ColliderDesc.ball(0.5).setFriction(0.9).setRestitution(1),
  playerBody,
)

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
  const viewportWidth = 50

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

const rectangleGeometry = new PIXI.Geometry()
  .addAttribute(
    'aVertexPosition',
    [
      // x, y
      -1, -1,
      // x, y
      1, -1,
      // x, y
      1, 1,
      // x, y
      -1, 1,
    ],
    2,
  )
  .addIndex([0, 1, 2, 0, 2, 3])

const rectangleUvs = [
  // u, v
  0, 0,
  // u, v
  1, 0,
  // u, v
  1, 1,
  // u, v
  0, 1,
]

const whiteNoiseTexture = createWhiteNoiseTexture(app.renderer, {
  width: 1024,
  height: 1024,
})

const perlinTextureDimensions = {
  // width: 128,
  // height: 128,
  width: 128,
  height: 128,
}
const perlinNoiseTexture = createPerlinNoiseTexture(
  app.renderer,
  perlinTextureDimensions,
  whiteNoiseTexture,
)

const shader = PIXI.Shader.from(regularVertex, colorFrag, {
  // uSampler2: PIXI.Texture.from('https://pixijs.com/assets/perlin.jpg'),
  uSampler2: perlinNoiseTexture,
  time: 0,
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
  const rectangle = new PIXI.Mesh(geometry, shader)
  rectangle.position.set(position.x, position.y)
  rectangle.width = 1
  rectangle.height = 1

  let sprite = new PIXI.Graphics()
  sprite.beginFill(0xff0000)
  sprite.drawRect(-0.5 * boxSize, -0.5 * boxSize, boxSize, boxSize)

  return {
    tag: 'box',
    sprite: rectangle,
    rigidBodyDesc: RigidBodyDesc.fixed().setTranslation(position.x, position.y),
    colliderDesc: ColliderDesc.cuboid(0.5 * boxSize, 0.5 * boxSize)
      .setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS)
      .setContactForceEventThreshold(100000),
  }
}

const createTriangle = (vertices: [Vec2, Vec2, Vec2]): TriangleGameObject => {
  const position = new Vector2(0, 0)

  const colliderDesc = ColliderDesc.convexPolyline(
    new Float32Array(vertices.flat()),
  )
    ?.setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS)
    ?.setContactForceEventThreshold(40)

  if (!colliderDesc) {
    throw new Error(
      `Failed to instantiate collider description with verices: ${JSON.stringify(vertices)}`,
    )
  }

  return {
    tag: 'triangle',
    sprite: triangleGeometry(vertices, 1),
    rigidBodyDesc: RigidBodyDesc.fixed().setTranslation(position.x, position.y),
    colliderDesc: colliderDesc,
  }
}

const triangleGeometry = (vertices: [Vec2, Vec2, Vec2], alpha: number) => {
  const g = new PIXI.Graphics()
  // g.addAt
  g.alpha = alpha
  // g.beginFill(getRandomColor())
  g.beginFill(0x333333)
  g.moveTo(...vertices[0])
  g.lineTo(...vertices[1])
  g.lineTo(...vertices[2])
  g.closePath()
  g.endFill()
  return g
}

let gameObjects = [] as GameObject[]

const addGameObjects = (newObjs: GameObject[]) => {
  gameObjects = [...gameObjects, ...newObjs]
  newObjs.forEach((it) => {
    pixiWorld.addChild(it.sprite)
    const ridigBody = world.createRigidBody(it.rigidBodyDesc)
    it.rigidBody = ridigBody
    it.collider = world.createCollider(it.colliderDesc, ridigBody)
  })
}

//
// Generate world
//

const lineWidth = 0.05
const pointRadius = 0.1
const drawSegments = (
  vertices: [number, number][],
  segments: [number, number][],
  color: number,
) => {
  let line = new PIXI.Graphics()
  line.lineStyle({
    width: lineWidth,
    color,
  })
  for (let i = 0; i < segments.length; i++) {
    const startVertex = segments[i][0]
    const endVertex = segments[i][1]
    line.moveTo(vertices[startVertex][0], vertices[startVertex][1])
    line.lineTo(vertices[endVertex][0], vertices[endVertex][1])
  }
  pixiWorld.addChild(line)
}

const drawTriangles = (vertices: Vec2[], indices: Vec3[]) => {
  for (let i = 0; i < indices.length - 1; i++) {
    const vertexIndices = indices[i]
    // console.log(triangle)
    const vert1 = vertices[vertexIndices[0]]
    const vert2 = vertices[vertexIndices[1]]
    const vert3 = vertices[vertexIndices[2]]
    pixiWorld.addChild(triangleGeometry([vert1, vert2, vert3], 0.2))
  }
}

const drawPoints = (holes: [number, number][], color: number) => {
  let graphics = new PIXI.Graphics()
  graphics.beginFill(color)
  for (let i = 0; i < holes.length; i++) {
    graphics.drawCircle(holes[i][0], holes[i][1], pointRadius)
  }
  graphics.endFill()
  pixiWorld.addChild(graphics)
}

const debugShape: Shape = createDebugShape([10, 2])

// Draw triangles
const triangleArea = 0.2
const triangleSide = Math.sqrt(triangleArea / 2)
const debugTriangles = await triangulate(debugShape, triangleArea)
drawSegments(debugShape.vertices, debugShape.segments, 0xff0000)
drawPoints(debugShape.holes, 0xff0000)
drawTriangles(debugTriangles.vertices, debugTriangles.indices)

const mapDimensions = {
  width: 40,
  height: 40,
}
const contourResult = contour(
  perlinTextureDimensions.width,
  perlinTextureDimensions.height,
  app.renderer.extract.pixels(perlinNoiseTexture),
)

const worldCoordinateFromContour = ([x, y]: Vec2) =>
  [
    mapDimensions.width * ((x - 1) / perlinTextureDimensions.width - 0.5),
    mapDimensions.height * ((y - 1) / perlinTextureDimensions.height - 1),
  ] as Vec2

const mapContour = contourResult.contours.map((path) =>
  path.map(worldCoordinateFromContour),
)
const mapHoles = contourResult.holes.map(worldCoordinateFromContour)

const shapeFromContours = (paths: Vec2[][]): Shape =>
  paths.reduce(
    (shape, path) => {
      // Calculate before we mutate shape
      const firstIndex = shape.segments.length
      const lastIndex = firstIndex + path.length - 1
      shape.vertices.push(...path)
      const segments = [
        ...linspace(firstIndex, lastIndex - 1, path.length - 1).map(
          (i) => [i, i + 1] as Vec2,
        ),
        [lastIndex, firstIndex] as Vec2,
      ]
      shape.segments.push(...segments)
      return shape
    },
    {
      vertices: [],
      segments: [],
      holes: [],
    } as Shape,
  )

const filter = normalized1([1, 2, 3, 2, 1])
const worldShape = shapeFromContours(
  mapContour.map(
    // (it) => douglasPeucker(filterLoop(it, filter), triangleSide / 10),
    (it) => it,
  ),
  // mapContour.map((it: Vec2[]) =>
  //   radialDistance(filterLoop(it, filter), triangleSide * 2),
  // ),
)

const worldTriangles = await triangulate(worldShape, triangleArea)
// drawTriangles(worldTriangles.vertices, worldTriangles.indices)

const createTriangles = (triangles: Triangles) =>
  triangles.indices.map(([i1, i2, i3]) =>
    createTriangle([
      triangles.vertices[i1],
      triangles.vertices[i2],
      triangles.vertices[i3],
    ]),
  )

// addGameObjects(createTriangles(debugTriangles))
addGameObjects(createTriangles(worldTriangles))
drawPoints(mapHoles, 0x00ff00)
drawSegments(worldShape.vertices, worldShape.segments, 0xff0000)
drawPoints(worldShape.vertices, 0xff0000)

// Boxes
// const horizontalBoxes = 20
// const verticalBoxes = 20
//
// addGameObjects(
//   zeros(horizontalBoxes).flatMap((_, column) =>
//     zeros(verticalBoxes).map((_, row) =>
//       createBox(
//         new Vector2(column - horizontalBoxes / 2, row - verticalBoxes),
//         {
//           u: column / horizontalBoxes,
//           v: row / verticalBoxes,
//           uw: 1 / horizontalBoxes,
//           vw: 1 / verticalBoxes,
//         },
//       ),
//     ),
//   ),
// )

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

    gameObject.rigidBody.setBodyType(RigidBodyType.Dynamic, true)
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
  playerSprite.rotation = playerCollider.rotation()

  pixiWorld.position.set(-playerPosition.x, -playerPosition.y)
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
  }
})
