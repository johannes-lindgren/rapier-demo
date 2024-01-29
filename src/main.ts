import './style.css'
import * as Rapier from '@dimforge/rapier2d'
import {
  ActiveEvents,
  ColliderDesc,
  EventQueue,
  RigidBodyDesc,
  RigidBodyType,
  Vector2,
} from '@dimforge/rapier2d'
import * as PIXI from 'pixi.js'
import { Container, Mesh, MIPMAP_MODES } from 'pixi.js'
import { GameObject, TriangleGameObject } from './gameObject.ts'
import { filterLoop, linspace } from './linear-algebra.ts'
import { createWhiteNoiseTexture } from './createWhiteNoiseTexture.ts'
import { createPerlinNoiseTexture } from './createPerlinNoise.ts'
import { Shape, Triangles, triangulate, Vec2 } from './triangulate.ts'
import { contour } from './contour.ts'
import { mean, normalized1 } from './vec.ts'
import { radialDistance } from './signal-processing'
import { calculateZIndices } from './calculateZIndices.ts'
import { createTriangleShader } from './createTriangleShader.ts'
import { vector } from './vector.ts'
import { createGrassTexture } from './createGrassTexture'
import { OutlineFilter } from 'pixi-filters'

const debug = {
  enabled: true,
  wireframes: true,
}

// Map params
const thresholdFill = 0.5
const thresholdHole = 0.3

// Use the Rapier module here.
let gravity = {
  x: 0.0,
  y: debug.enabled ? 0 : -9.81,
}
let world = new Rapier.World(gravity)

const playerRadius = 0.25
// Create a dynamic rigid-body.
let playerBody = world.createRigidBody(
  RigidBodyDesc.dynamic().setTranslation(0.0, 5.0).setLinearDamping(0.2),
)

// Create a ball collider attached to the dynamic rigidBody.
let playerCollider = world.createCollider(
  ColliderDesc.ball(playerRadius).setFriction(0.9).setRestitution(1),
  playerBody,
)

const app = new PIXI.Application({
  background: '#1099bb',
})
document.body.appendChild(app.view)

const viewport = new Container()
app.stage.addChild(viewport)
const pixiWorld = new Container()
pixiWorld.sortableChildren = true
pixiWorld.filters = [new OutlineFilter(1, 0x333333, 1.0)]
viewport.addChild(pixiWorld)

const handleResize = () => {
  const width = window.innerWidth
  const height = window.innerHeight

  // See 10 meters horizontally
  const viewportWidth = debug.enabled ? 50 : 10

  const scale = width / viewportWidth
  viewport.scale.set(scale, -scale)
  viewport.x = width / 2
  viewport.y = debug.enabled ? height / 10 : height / 2

  app.renderer.resize(width, height)
}
// activate plugins

window.addEventListener('resize', handleResize)
handleResize()

const zIndex = calculateZIndices([
  'background',
  'terrain',
  'player',
  'grenade',
  'debug',
])

const mapDimensions = {
  width: 20,
  height: 40,
}

// create a new Sprite from an image path
const playerSprite = PIXI.Sprite.from('/player_512.png', {
  mipmap: MIPMAP_MODES.POW2,
})
// center the sprite's anchor point
playerSprite.anchor.set(0.5)
// move the sprite to the center of the screen
playerSprite.x = 0
playerSprite.y = 0
playerSprite.zIndex = zIndex.player
playerSprite.width = playerRadius * 2
playerSprite.height = playerRadius * 2
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

const whiteNoiseTexture = createWhiteNoiseTexture(
  app.renderer,
  {
    width: 1024,
    height: 1024,
  },
  [11, 0, 0, 0],
)

const aspectRatio = mapDimensions.width / mapDimensions.height
const textureDimensions = vector(256, 256 / aspectRatio)
const perlinNoiseTexture = createPerlinNoiseTexture(
  app.renderer,
  textureDimensions,
  whiteNoiseTexture,
)
const grassTexture = createGrassTexture(
  app.renderer,
  textureDimensions,
  perlinNoiseTexture,
  thresholdFill,
)

// const noiseSprite = PIXI.Sprite.from(perlinNoiseTexture, {})
// noiseSprite.anchor.set(0.5, 1)
// noiseSprite.width = mapDimensions.width
// noiseSprite.height = mapDimensions.height
// noiseSprite.zIndex = zIndex.debug
// pixiWorld.addChild(noiseSprite)
//
// const grassSprite = PIXI.Sprite.from(grassTexture, {})
// grassSprite.anchor.set(0.5, 1)
// grassSprite.width = mapDimensions.width
// grassSprite.height = mapDimensions.height
// grassSprite.zIndex = zIndex.debug
// pixiWorld.addChild(grassSprite)

const triangleShader = createTriangleShader(
  grassTexture,
  whiteNoiseTexture,
  textureDimensions,
  thresholdFill,
)

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

  const geometry = triangleGeometry(vertices)

  const mesh = new Mesh(geometry, triangleShader)
  mesh.zIndex = zIndex.terrain

  return {
    tag: 'triangle',
    sprite: mesh,
    rigidBodyDesc: RigidBodyDesc.fixed().setTranslation(position.x, position.y),
    colliderDesc: colliderDesc,
  }
}

const triangleGeometry = (vertices: [Vec2, Vec2, Vec2]) => {
  const m = mean(vertices)
  const uniformUvs = Array(3).fill(textureCoordinateFromWorld(m)).flat()
  const uvs = vertices.map(textureCoordinateFromWorld).flat()
  return new PIXI.Geometry()
    .addAttribute('aVertexPosition', vertices.flat(), 2)
    .addAttribute('aUvsUniform', uniformUvs, 2)
    .addAttribute('aUvs', uvs, 2)
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
const pointRadius = 0.05
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
  line.zIndex = zIndex.debug
  pixiWorld.addChild(line)
}

const drawPoints = (points: Vec2[], pointRadius: number, color: number) => {
  let graphics = new PIXI.Graphics()
  graphics.beginFill(color)
  for (let i = 0; i < points.length; i++) {
    graphics.drawCircle(points[i][0], points[i][1], pointRadius)
  }
  graphics.endFill()
  graphics.zIndex = zIndex.debug
  pixiWorld.addChild(graphics)
}

// Draw triangles
const triangleArea = 0.2
const triangleSide = Math.sqrt(triangleArea * 2) / 2

// const drawTriangles = (vertices: Vec2[], indices: Vec3[]) => {
//   for (let i = 0; i < indices.length - 1; i++) {
//     const vertexIndices = indices[i]
//     // console.log(triangle)
//     const vert1 = vertices[vertexIndices[0]]
//     const vert2 = vertices[vertexIndices[1]]
//     const vert3 = vertices[vertexIndices[2]]
//     pixiWorld.addChild(triangleGeometry([vert1, vert2, vert3], 0.2))
//   }
// }
// const debugShape: Shape = createDebugShape([10, 2])
// const debugTriangles = await triangulate(debugShape, triangleArea)
// drawSegments(debugShape.vertices, debugShape.segments, 0xff0000)
// drawPoints(debugShape.holes, 0xff0000)
// drawTriangles(debugTriangles.vertices, debugTriangles.indices)

const contourResult = contour(
  textureDimensions,
  app.renderer.extract.pixels(grassTexture),
  thresholdFill,
  thresholdHole,
)

const worldCoordinateFromContour = ([x, y]: Vec2) =>
  [
    mapDimensions.width * ((x - 1) / textureDimensions.x - 0.5),
    mapDimensions.height * ((y - 1) / textureDimensions.y - 1),
  ] as Vec2
const textureCoordinateFromWorld = ([x, y]: Vec2) =>
  [x / mapDimensions.width + 0.5, y / mapDimensions.height + 1] as Vec2

const mapContour = contourResult.contours.map((path) =>
  path.map(worldCoordinateFromContour),
)
const holeContour = contourResult.holes.map((path) =>
  path.map(worldCoordinateFromContour),
)

const calculateSegments = (
  paths: Vec2[][],
): Pick<Shape, 'vertices' | 'segments'> =>
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
    } as Pick<Shape, 'vertices' | 'segments'>,
  )

const filter = normalized1([1])
const filterPath = (it: Vec2[]) =>
  radialDistance(filterLoop(it, filter), triangleSide)
// const filterPath = identity

const worldSegments = calculateSegments(
  mapContour.map(
    // identity,
    filterPath,
  ),
)

const holeSegments = calculateSegments(holeContour.map(filterPath))

const worldTriangles = await triangulate(
  { ...worldSegments, holes: holeSegments.vertices },
  triangleArea,
)
// drawTriangles(worldTriangles.vertices, worldTriangles.indices)

const createTriangles = (triangles: Triangles) =>
  triangles.indices.map(([i1, i2, i3]) =>
    createTriangle([
      triangles.vertices[i1],
      triangles.vertices[i2],
      triangles.vertices[i3],
    ]),
  )

addGameObjects(createTriangles(worldTriangles))

// Debug lines
if (debug.enabled && debug.wireframes) {
  drawSegments(holeSegments.vertices, holeSegments.segments, 0x00ff00)
  drawPoints(holeSegments.vertices, 0.1, 0x00ff00)
  drawSegments(worldSegments.vertices, worldSegments.segments, 0xff0000)
  drawPoints(worldSegments.vertices, 0.1, 0xff0000)
}
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
const updatePhysics = () => {
  let eventQueue = new EventQueue(true)
  // Step the simulation forward.
  world.step(eventQueue)

  const freed = [] as GameObject[]
  const handleCollision = (colliderHandle: number, forceMagniture: number) => {
    const gameObject = gameObjects.find(
      (it) => it.collider.handle === colliderHandle,
    )
    if (!gameObject) {
      return
    }

    gameObject.rigidBody.setBodyType(RigidBodyType.Dynamic, true)
    freed.push(freed)
  }
  eventQueue.drainContactForceEvents((event) => {
    handleCollision(event.collider1(), event.totalForceMagnitude())
    handleCollision(event.collider2(), event.totalForceMagnitude())
  })
  console.log('freed', freed)

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
}

let timeSinceLastTick = 0
const physicsDt = 1000 / 60
const maxDt = 1000 / 30

// Listen for animate update

const loop = (then: number) => (now: number) => {
  const dt = now - then

  timeSinceLastTick = Math.min(timeSinceLastTick + dt, maxDt)
  while (timeSinceLastTick > physicsDt) {
    timeSinceLastTick -= physicsDt
    updatePhysics()
  }

  requestAnimationFrame(loop(now))
}
requestAnimationFrame(loop(0))

window.addEventListener('keydown', (event) => {
  const impulse = 1
  switch (event.code) {
    case 'KeyW': {
      playerBody.applyImpulse({ x: 0.0, y: impulse }, true)
      break
    }
    case 'KeyS': {
      playerBody.applyImpulse({ x: 0.0, y: -impulse }, true)
      break
    }
    case 'KeyA': {
      playerBody.applyImpulse({ x: -impulse, y: 0.0 }, true)
      break
    }
    case 'KeyD': {
      playerBody.applyImpulse({ x: impulse, y: 0.0 }, true)
      break
    }
  }
})
