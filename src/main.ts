import './style.css'
import * as Rapier from '@dimforge/rapier2d'
import {
  ActiveEvents,
  ColliderDesc,
  EventQueue,
  JointData,
  Ray,
  RigidBody,
  RigidBodyDesc,
  RigidBodyType,
  Vector2,
} from '@dimforge/rapier2d'
import * as PIXI from 'pixi.js'
import { Container, Graphics, Mesh, MIPMAP_MODES, Sprite } from 'pixi.js'
import {
  GameObject,
  GrenadeGameObject,
  TriangleGameObject,
} from './gameObject.ts'
import { filterLoop, linspace, zeros } from './linear-algebra.ts'
import { createWhiteNoiseTexture } from './createWhiteNoiseTexture.ts'
import { createPerlinNoiseTexture } from './createPerlinNoise.ts'
import {
  TriangulationInput,
  Triangles,
  triangulate,
  Vec2,
} from './triangulate.ts'
import { contour } from './contour.ts'
import {
  add,
  angle,
  antiClockWise90deg,
  centroid,
  clockwise90deg,
  degrees,
  distSquared,
  div,
  dot,
  down,
  fromAngle,
  left,
  neg,
  norm2,
  normalized1,
  normalized2,
  origo,
  project,
  right,
  scale,
  sub,
  sum,
  Tuple3,
  up,
  vec2,
  Vec3,
  vecXy,
} from './vec.ts'
import { radialDistance } from './signal-processing'
import { calculateZIndices } from './calculateZIndices.ts'
import { createTriangleShader } from './createTriangleShader.ts'
import { vector } from './vector.ts'
import { createGrassTexture } from './createGrassTexture'
import { DropShadowFilter, OutlineFilter } from 'pixi-filters'
import { pseudoRandomColor, randomColor } from './randomColor.ts'
import { areTrianglesJoined, groupTriangles } from './groupTriangles.ts'
import { v4 as randomUuid } from 'uuid'
import { groupBy, throttle } from 'lodash'
import { keyDownTracker, Key } from './keyDownTracker.ts'
import { createArrow } from './createArrow.ts'
import { findC } from './triangle.ts'
import { createStats } from './createStats.ts'
import { isNonEmpty, min } from './arrays.ts'

/*
 * Configration
 */

const debug = {
  enabled: false,
  wireframes: true,
  weightlessness: true,
}
const debugController = {
  enabled: false,
  flyK: 0.2,
}

// Map params
// const seed = 11
// const seed = Math.random()
const seed = 110
const thresholdFill = 0.55
const thresholdHole = 0.3

// Physics
const makeGroupDynamicThreshold = 30
const breakThreshold = 100
const gravity: Vec2 = [0, -9.82]

// Player controller
const playerRadius = 0.2
const snapToGroundDist = playerRadius * 5
const hoverHeight = playerRadius * 2
const clawForce = 30
const maxClimbAngle = 180
const minSlideAngle = 20
const walkK = 0.24
const autoStepMaxHeight = playerRadius * 3
const autoStepMinWidth = playerRadius * 0.1

// Camera
const rotateCamera = false
const rotationDamping = 0.98 as number

/*
 * Init game
 */

// Use the Rapier module here.
const world = new Rapier.World(
  vecXy(debug.enabled && debug.weightlessness ? origo : gravity),
)

const characterControllerOffset = 0.01
const characterController = world.createCharacterController(
  characterControllerOffset,
)
// Don’t allow climbing slopes larger than 45 degrees.
characterController.setMaxSlopeClimbAngle((maxClimbAngle * Math.PI) / 180)
// Automatically slide down on slopes smaller than 30 degrees.
characterController.setMinSlopeSlideAngle((minSlideAngle * Math.PI) / 180)
characterController.enableSnapToGround(snapToGroundDist)
characterController.enableAutostep(autoStepMaxHeight, autoStepMinWidth, true)

const app = new PIXI.Application<HTMLCanvasElement>({
  background: '#30aacc',
  antialias: true,
})
document.body.appendChild(app.view)

// Stats
const stats = createStats()
document.body.appendChild(stats.dom)

const viewport = new Container()

const backgroundContainer = new Container()
const backgroundSprite = Sprite.from(
  `${import.meta.env.BASE_URL}background.png`,
  {
    mipmap: MIPMAP_MODES.POW2,
  },
)
backgroundContainer.scale.set(1, -1)
backgroundContainer.addChild(backgroundSprite)
viewport.addChild(backgroundContainer)

app.stage.addChild(viewport)
const pixiWorld = new Container()
pixiWorld.sortableChildren = true
pixiWorld.filters = [
  new OutlineFilter(0.5, 0x333333, 1.0),
  new DropShadowFilter(),
]
viewport.addChild(pixiWorld)

const handleResize = () => {
  const containerWidth = window.innerWidth
  const containerHeight = window.innerHeight

  // See 10 meters horizontally
  const viewportWidth = debug.enabled ? 30 : 15

  const scale = containerWidth / viewportWidth
  viewport.scale.set(scale, -scale)
  viewport.x = containerWidth / 2
  viewport.y = debug.enabled ? containerHeight / 10 : containerHeight / 2

  console.log(containerWidth, viewportWidth)
  // backgroundSprite.scale.set(1, -1)
  backgroundSprite.width = viewportWidth * 2
  backgroundSprite.height = viewportWidth * 2
  backgroundSprite.x = -viewportWidth
  backgroundSprite.y = -viewportWidth

  app.renderer.resize(containerWidth, containerHeight)
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

const createPlayerSprite = () => {
  const eyeRadius = playerRadius * 0.4
  const pupilRadius = eyeRadius * 0.4

  const head = new PIXI.Graphics()
  head.beginFill(0x0f0f0f)
  head.drawCircle(0, 0, playerRadius)
  head.endFill()

  // Left eye
  head.beginFill(0xffffff)
  head.drawCircle(-eyeRadius, 0, eyeRadius)
  head.endFill()
  // Left pupil
  head.beginFill(0x000000)
  head.drawCircle(-eyeRadius, 0, pupilRadius)
  head.endFill()

  // Left eye
  head.beginFill(0xffffff)
  head.drawCircle(eyeRadius, 0, eyeRadius)
  head.endFill()
  // Left pupil
  head.beginFill(0x000000)
  head.drawCircle(eyeRadius, 0, pupilRadius)
  head.endFill()

  return head
}
const playerSprite = createPlayerSprite()

// center the sprite's anchor point
// playerSprite.anchor.set(0.5)
// move the sprite to the center of the screen
playerSprite.x = 0
playerSprite.y = 0
playerSprite.zIndex = zIndex.player
pixiWorld.addChild(playerSprite)

const playerDirLine = createArrow(0.1, 0x000000)
pixiWorld.addChild(playerDirLine)

const sensorCount = 50
const legCount = 8

type Leg = {
  angle: number
  foot: undefined | Vec2
}
const legs: Leg[] = linspace(0, 2 * Math.PI, legCount + 1)
  .slice(1)
  .map((angle) => {
    // const hip =
    return {
      angle,
      foot: undefined as undefined | Vec2,
    }
  })

const sensorLines = zeros(sensorCount).map(() =>
  createArrow(0.05, 0xd5402b, 0.5),
)
const legLines = zeros(legCount).map(() => [
  createArrow(0.03, 0x000000, 1),
  createArrow(0.03, 0x000000, 1),
])
pixiWorld.addChild(...sensorLines)
pixiWorld.addChild(...legLines.flat())

const whiteNoiseTexture = createWhiteNoiseTexture(
  app.renderer,
  {
    width: 1024,
    height: 1024,
  },
  [seed, 0, 0, 0],
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

const triangleMesh = (vertices: Tuple3<Vec2>, color: number) => {
  const triangle = new Graphics()
  triangle.beginFill(color, 1)
  triangle.moveTo(vertices[0][0], vertices[0][1])
  triangle.lineTo(vertices[1][0], vertices[1][1])
  triangle.lineTo(vertices[2][0], vertices[2][1])
  triangle.endFill()
  triangle.zIndex = zIndex.debug
  return triangle
}

const createTriangle = (
  vertices: [Vec2, Vec2, Vec2],
  indices: Vec3,
): Omit<TriangleGameObject, 'debugDisplayObject' | 'groupId'> => {
  const position = new Vector2(0, 0)

  const colliderDesc = ColliderDesc.convexPolyline(
    new Float32Array(vertices.flat()),
  )
    ?.setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS)
    ?.setContactForceEventThreshold(breakThreshold)

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
    indices,
    vertices,
    // For debug purposes
    sprite: mesh,
    rigidBodyDesc: RigidBodyDesc.fixed().setTranslation(position.x, position.y),
    colliderDesc: colliderDesc,
  }
}

const triangleGeometry = (vertices: [Vec2, Vec2, Vec2]) => {
  const m = centroid(...vertices)
  const uniformUvs = Array(3).fill(textureCoordinateFromWorld(m)).flat()
  const uvs = vertices.map(textureCoordinateFromWorld).flat()
  return new PIXI.Geometry()
    .addAttribute('aVertexPosition', vertices.flat(), 2)
    .addAttribute('aUvsUniform', uniformUvs, 2)
    .addAttribute('aUvs', uvs, 2)
}

// World object
let gameObjects = [] as GameObject[]
const groups = {} as Record<string, TriangleGameObject[]>

const addGameObjects = (newObjs: GameObject[]) => {
  gameObjects = [...gameObjects, ...newObjs]
  newObjs.forEach((it) => {
    pixiWorld.addChild(it.sprite)
    if (debug.enabled && it.debugDisplayObject) {
      pixiWorld.addChild(it.debugDisplayObject)
    }
    const ridigBody = world.createRigidBody(it.rigidBodyDesc)
    it.rigidBody = ridigBody
    it.collider = world.createCollider(it.colliderDesc, ridigBody)
    //   Indices
    if (it.tag === 'triangle') {
      if (!groups[it.groupId]) {
        groups[it.groupId] = []
      }
      groups[it.groupId].push(it)
    }
  })
}

//
// Generate world
//

const debugSegments = (
  vertices: [number, number][],
  segments: [number, number][],
  color: number,
  width: number,
) => {
  let line = new PIXI.Graphics()
  line.lineStyle({
    width,
    color,
  })
  for (let i = 0; i < segments.length; i++) {
    const startVertex = segments[i][0]
    const endVertex = segments[i][1]
    line.moveTo(vertices[startVertex][0], vertices[startVertex][1])
    line.lineTo(vertices[endVertex][0], vertices[endVertex][1])
  }
  return line
}

const debugPoints = (points: Vec2[], color: number, pointRadius: number) => {
  let graphics = new PIXI.Graphics()
  graphics.beginFill(color)
  for (let i = 0; i < points.length; i++) {
    graphics.drawCircle(points[i][0], points[i][1], pointRadius)
  }
  graphics.endFill()
  return graphics
}

const drawDebugShape = (shape: Shape, color: number) => {
  const container = new Container()
  container.zIndex = zIndex.debug
  container.addChild(debugSegments(shape.vertices, shape.segments, color, 0.05))
  container.addChild(debugPoints(shape.vertices, color, 0.1))

  // for (let i = 0; i < shape.segments.length; i++) {
  //   const text = new Text('12', {
  //     fontFamily: 'Arial',
  //     fontSize: 24,
  //     fill: 0x000000,
  //     align: 'center',
  //   })
  //   text.scale.set(0.01, -0.01)
  //   text.position.set(shape.vertices[i][0], shape.vertices[i][1])
  //   container.addChild(text)
  // }

  pixiWorld.addChild(container)
}

const debugTriangles = (triangles: Triangles, color: number) => {
  const container = new Container()
  for (let i = 0; i < triangles.indices.length; i++) {
    const vertexIndices = triangles.indices[i]
    const vertices = [
      triangles.vertices[vertexIndices[0]],
      triangles.vertices[vertexIndices[1]],
      triangles.vertices[vertexIndices[2]],
    ] satisfies Tuple3<Vec2>
    container.addChild(triangleMesh(vertices, color))

    // Type the vertex index next to each corner
    // const center = mean(vertices)
    // for (let index = 0; index < 3; index++) {
    //   const vertexIndex = vertexIndices[index]
    //   const vertex = vertices[index]
    //   const text = new Text(vertexIndex, {
    //     fontFamily: 'Arial',
    //     fontSize: 12,
    //     fill: 0x222222,
    //     align: 'center',
    //   })
    //   text.scale.set(0.005, -0.005)
    //   text.position.set(...add(scale(center, 0.6), scale(vertex, 0.4)))
    //   container.addChild(text)
    // }
  }
  container.zIndex = zIndex.debug
  return container
}

// Draw triangles
const triangleArea = 0.2
const triangleSide = Math.sqrt(triangleArea * 2) / 2

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

type Shape = {
  vertices: Vec2[]
  segments: Vec2[]
}
const calculateShape = (paths: Vec2[][]): Shape =>
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
    } as Pick<TriangulationInput, 'vertices' | 'segments'>,
  )

const filter = normalized1([1])
const filterPath = (it: Vec2[]) =>
  radialDistance(filterLoop(it, filter), triangleSide)
// const filterPath = identity

const holeShapes = calculateShape(holeContour.map(filterPath))

const worldShapes = mapContour
  .map(filterPath)
  .filter((path) => path.length >= 3)
  .map((contour) => calculateShape([contour]))

const worldTriangles = await Promise.all(
  worldShapes.map((segments) =>
    triangulate({ ...segments, holes: holeShapes.vertices }, triangleArea),
  ),
)

const createTriangles = (triangles: Triangles) =>
  triangles.indices.map((indices) => {
    const [i1, i2, i3] = indices
    return createTriangle(
      [triangles.vertices[i1], triangles.vertices[i2], triangles.vertices[i3]],
      indices,
    )
  })

worldTriangles
  .map((triangles) => createTriangles(triangles))
  .flatMap(groupTriangles)
  .map((triangles) => {
    const groupId = randomUuid()
    return triangles.map((triangle) => {
      const debugDisplayObject = triangleMesh(
        triangle.vertices,
        pseudoRandomColor(groupId),
      )
      return {
        ...triangle,
        groupId,
        debugDisplayObject,
      } as TriangleGameObject
    })
  })
  .forEach(addGameObjects)

// Debug lines
if (debug.enabled && debug.wireframes) {
  drawDebugShape(holeShapes, 0xffffff)
  worldShapes.forEach((shape) => {
    drawDebugShape(shape, randomColor())
  })
}

// const testTriangles: Triangles = {
//   vertices: [
//     [0, 0],
//     [0, 1],
//     [1, 0],
//     [1, 1],
//     [2, 0],
//     [2, 1],
//     [3, 0],
//     [3, 1],
//     [4, 0],
//     [4, 1],
//     [5, 0],
//     [5, 1],
//     [6, 0],
//     [6, 1],
//   ],
//   indices: [
//     [4, 5, 7],
//     [0, 1, 3],
//     [0, 2, 3],
//     [2, 3, 5],
//     [2, 4, 5],
//     [4, 6, 7],
//     // [7, 6, 9],
//     [6, 8, 9],
//   ],
// }
// groupTriangles(testTriangles.indices).forEach((indices) => {
//   pixiWorld.addChild(
//     debugTriangles(
//       {
//         vertices: testTriangles.vertices,
//         indices,
//       },
//       getRandomColor(),
//     ),
//   )
// })

/*
 * Spawn point
 */
let spawn: { pos: Vec2; angle: number } | undefined
let spawnAttempts = 0
// Need to step once to make scene queries
world.step()
while (!spawn && spawnAttempts < 100) {
  spawnAttempts++
  const rayFrom = [0, 0] as Vec2
  const dir = fromAngle(Math.random() * 2 * Math.PI)
  const intersection = world.castRayAndGetNormal(
    new Ray(vecXy(rayFrom), vecXy(dir)),
    mapDimensions.height,
    true,
  )
  if (intersection) {
    spawn = {
      pos: add(rayFrom, scale(dir, intersection.toi - hoverHeight)),
      angle: angle(vec2(intersection.normal)),
    }
  }
}
if (!spawn) {
  throw new Error(
    'Failed to spawn player: attempt to find a spawn point failed too many times',
  )
}

// Create a dynamic rigid-body.
let playerBody = world.createRigidBody(
  RigidBodyDesc.dynamic()
    .setTranslation(...spawn.pos)
    .setLinearDamping(1)
    .setAngularDamping(40),
)

// Create a ball collider attached to the dynamic rigidBody.
let playerCollider = world.createCollider(
  ColliderDesc.ball(playerRadius).setFriction(0.9).setRestitution(0),
  playerBody,
)

const createGrenade = (options: {
  pos: Vec2
  dir: Vec2
}): GrenadeGameObject => {
  const radius = 0.1
  const speed = 10
  // Create a dynamic rigid-body.
  const rigidBodyDesc = RigidBodyDesc.dynamic()
    .setTranslation(...add(options.pos, scale(options.dir, radius)))
    .setLinvel(...scale(options.dir, speed))
    .setGravityScale(0)

  // Create a ball collider attached to the dynamic rigidBody.
  const colliderDesc = ColliderDesc.ball(radius)

  const sprite = new PIXI.Graphics()
  sprite.beginFill(0xff0000)
  sprite.drawCircle(0, 0, radius)
  sprite.endFill()

  return {
    tag: 'grenade',
    sprite,
    colliderDesc,
    rigidBodyDesc,
  }
}
const shoot = throttle(
  () => {
    const dir = fromAngle(playerBody.rotation())
    addGameObjects([
      createGrenade({
        pos: add(vec2(playerBody.translation()), scale(dir, playerRadius)),
        dir,
      }),
    ])
  },
  1000,
  { trailing: false },
)
// const jump = throttle(
//   (direction: Vec2) => {
//     playerBody.applyImpulse(vecXy(scale(direction, jumpK)), true)
//   },
//   1000,
//   { trailing: false },
// )

/*
 * End of world spawn
 */
const { isKeyDown, drainEventQueue } = keyDownTracker()

const desiredTranslation = (
  isKeyDown: (key: Key) => boolean,
  surfaceNormal: Vec2,
): Vec2 => {
  let translation = origo
  const dir = rotateCamera
    ? {
        up: surfaceNormal,
        down: neg(surfaceNormal),
        left: antiClockWise90deg(surfaceNormal),
        right: clockwise90deg(surfaceNormal),
      }
    : {
        up,
        down,
        left,
        right,
      }
  if (isKeyDown(Key.KeyW) || isKeyDown(Key.ArrowUp)) {
    translation = add(translation, scale(dir.up, walkK))
  }
  if (isKeyDown(Key.KeyS) || isKeyDown(Key.ArrowDown)) {
    translation = add(translation, scale(dir.down, walkK))
  }
  if (isKeyDown(Key.KeyA) || isKeyDown(Key.ArrowLeft)) {
    translation = add(translation, scale(dir.left, walkK))
  }
  if (isKeyDown(Key.KeyD) || isKeyDown(Key.ArrowRight)) {
    translation = add(translation, scale(dir.right, walkK))
  }
  return translation
}

// const playerSurfaceNormal = (
//   body: RigidBody,
// ): { normal: Vec2; toi: number } | undefined => {
//   const legLength = snapToGroundDist
//   const playerPosition = body.translation()
//   // distance from player surface
//   const epsilon = characterControllerOffset / 2
//
//   const detectorCount = 50
//   const intersections = linspace(0, Math.PI * 2, detectorCount)
//     .map((angle) => {
//       // const normals = [-Math.PI / 2].map((angle) => {
//       const dir = [Math.cos(angle), Math.sin(angle)] as Vec2
//       const surface = add(
//         vec2(playerPosition),
//         scale(dir, playerRadius + epsilon),
//       )
//       return (
//         world.castRayAndGetNormal(
//           new Ray(vecXy(surface), vecXy(dir)),
//           legLength,
//           true,
//         ) ?? undefined
//       )
//     })
//     .filter((it) => it !== undefined) as RayColliderIntersection[]
//   const normals = intersections.map((it) => vec2(it.normal))
//   if (normals.length === 0) {
//     return undefined
//   }
//   const surfaceNormal = normalized2(centroid(...normals))
//   const antiSurfaceNormal = neg(surfaceNormal)
//   const surface = add(
//     vec2(playerPosition),
//     scale(antiSurfaceNormal, playerRadius + epsilon),
//   )
//   const surfaceIntersection =
//     world.castRayAndGetNormal(
//       new Ray(vecXy(surface), vecXy(antiSurfaceNormal)),
//       legLength,
//       true,
//     ) ?? undefined
//   if (!surfaceIntersection) {
//     //   Should not happen
//     return undefined
//   }
//   return { normal: surfaceNormal, toi: surfaceIntersection.toi }
// }

type PlayerSense = {
  start: Vec2
  end: Vec2
  dir: Vec2
  angle: number
  toi: number
  surfaceNormal: Vec2
}
const playerSenses = (body: RigidBody): PlayerSense[] => {
  const legLength = snapToGroundDist
  const playerPosition = body.translation()
  // distance from player surface
  const epsilon = characterControllerOffset / 2

  const isRayCast = (value: PlayerSense | undefined): value is PlayerSense =>
    value !== undefined
  return linspace(0, Math.PI * 2, sensorCount)
    .map((angle) => {
      // const normals = [-Math.PI / 2].map((angle) => {
      const dir = [Math.cos(angle), Math.sin(angle)] as Vec2
      const surface = add(
        vec2(playerPosition),
        scale(dir, playerRadius + epsilon),
      )
      const intersection =
        world.castRayAndGetNormal(
          new Ray(vecXy(surface), vecXy(dir)),
          legLength,
          true,
        ) ?? undefined
      if (!intersection) {
        return undefined
      }
      return {
        start: surface,
        end: add(surface, scale(dir, intersection.toi)),
        dir,
        angle,
        toi: intersection.toi,
        surfaceNormal: vec2(intersection.normal),
      } satisfies PlayerSense
    })
    .filter(isRayCast)
}

const updatePhysics = (dt: number) => {
  let eventQueue = new EventQueue(true)
  // Step the simulation forward.
  world.step(eventQueue)

  const trianglesHit = [] as TriangleGameObject[]
  const handleCollision = (colliderHandle: number, forceMagniture: number) => {
    const gameObject = gameObjects.find(
      (it) => it.collider.handle === colliderHandle,
    )
    if (!gameObject) {
      return
    }

    if (gameObject.tag === 'triangle') {
      trianglesHit.push(gameObject)
    }
  }
  eventQueue.drainContactForceEvents((event) => {
    handleCollision(event.collider1(), event.totalForceMagnitude())
    handleCollision(event.collider2(), event.totalForceMagnitude())
  })

  Object.entries(groupBy(trianglesHit, 'groupId')).map(
    ([oldGroupId, freedTriangles]) => {
      const nonFreedTriangles = groups[oldGroupId].filter(
        (triangleInExistinGroup) =>
          !freedTriangles.includes(triangleInExistinGroup),
      )
      const newGroups = [
        ...groupTriangles(nonFreedTriangles),
        // Every triangle that was hit gets its own group
        ...freedTriangles.map((it) => [it]),
      ]
      // Delete the existing group
      delete groups[oldGroupId]
      // Create new groups
      newGroups.forEach((triangles) => {
        // Assign all triangles in this list to a common group
        const newGroupId = randomUuid()
        triangles.forEach((triangle) => {
          triangle.groupId = newGroupId

          if (debug.enabled) {
            const oldDebugDisplayObject = triangle.debugDisplayObject
            const newDebugDisplayObject = triangleMesh(
              triangle.vertices,
              pseudoRandomColor(newGroupId),
            )

            triangle.debugDisplayObject = newDebugDisplayObject
            pixiWorld.removeChild(oldDebugDisplayObject)
            pixiWorld.addChild(newDebugDisplayObject)
          }
        })
        groups[newGroupId] = triangles

        if (triangles.length < makeGroupDynamicThreshold) {
          // Create joints between all triangles in the group and make the individual triangle bodies dynamic

          // TODO if the old group was dynamic, remove existing joints and create new.
          //  Thus, this if statement should be removed.
          if (triangles[0].rigidBody.isFixed()) {
            // For every combination of triangles in the group
            for (let i = 0; i < triangles.length; i++) {
              const left = triangles[i]

              // This will run for every object
              left.rigidBody.setBodyType(RigidBodyType.Dynamic, true)

              for (let j = i + 1; j < triangles.length; j++) {
                // This will run for every combination
                const right = triangles[j]

                if (areTrianglesJoined(left.indices, right.indices)) {
                  const leftPos = vec2(left.rigidBody.localCom())
                  const rightPos = vec2(right.rigidBody.localCom())

                  const closest = centroid(leftPos, rightPos)
                  // If they are next to each other, join them
                  const params = JointData.fixed(
                    vecXy(sub(closest, sub(leftPos, rightPos))),
                    // left.rigidBody.rotation(),
                    0,
                    vecXy(sub(closest, sub(leftPos, rightPos))),
                    // right.rigidBody.rotation(),
                    0,
                  )
                  // TODO save joint so that we can break it
                  const joint = world.createImpulseJoint(
                    params,
                    left.rigidBody,
                    right.rigidBody,
                    true,
                  )
                }
              }
            }
          }
          triangles.forEach((triangle) => {
            triangle.rigidBody.setBodyType(RigidBodyType.Dynamic, true)
          })
        }
      })
    },
  )

  gameObjects.forEach((it) => {
    const pos = it.collider.translation()
    const angle = it.collider.rotation()
    it.sprite.position.x = pos.x
    it.sprite.position.y = pos.y
    it.sprite.rotation = angle
    if (it.debugDisplayObject) {
      it.debugDisplayObject.position.x = pos.x
      it.debugDisplayObject.position.y = pos.y
      it.debugDisplayObject.rotation = angle
    }
  })

  const playerPosition = playerCollider.translation()
  // TODO use this instead
  const playerPos = vec2(playerCollider.translation())
  const playerAngle = playerCollider.rotation()
  const playerDir = fromAngle(playerAngle)

  playerSprite.position.x = playerPosition.x
  playerSprite.position.y = playerPosition.y
  playerSprite.rotation = playerAngle

  playerDirLine.position.set(
    ...add(playerPos, scale(playerDir, playerRadius * 0.9)),
  )
  playerDirLine.rotation = playerAngle
  playerDirLine.scale.set(0.1, 1)

  const senses = playerSenses(playerBody)

  const velocity = vec2(playerBody.linvel())
  sensorLines.forEach((line) => (line.visible = false))
  legLines.forEach(([thigh, calf]) => {
    thigh.visible = false
    calf.visible = false
  })
  const surfaceNormal =
    senses.length > 0
      ? normalized2(neg(centroid(...senses.map((it) => scale(it.dir, it.toi)))))
      : undefined

  if (isNonEmpty(senses)) {
    playerBody.setGravityScale(0, false)
    playerBody.setLinearDamping(3)

    // Draw legs
    const legLength = snapToGroundDist
    const hipPos = (leg: Leg) =>
      add(playerPos, scale(fromAngle(playerAngle + leg.angle), playerRadius))

    // // Detach legs
    legs.forEach((leg) => {
      if (!leg.foot) {
        return
      }
      const distance = norm2(sub(hipPos(leg), leg.foot))
      if (distance > legLength) {
        leg.foot = undefined
      }
    })

    const detachedLegs = legs.filter((leg) => !leg.foot)

    const attachedLegs = legs.filter((leg) => leg.foot)

    // Attach legs
    detachedLegs.forEach((leg) => {
      const distToSensorEnd = (sense: PlayerSense, leg: Leg) =>
        norm2(sub(hipPos(leg), sense.end))

      // Sensors that are not in the vicinity of other feet
      const minFeetDistance = 0.25
      const availableSenses = senses.filter((sense) => {
        const closestLeg = isNonEmpty(attachedLegs)
          ? min(attachedLegs, (attachedLeg) =>
              distSquared(attachedLeg.foot, sense.end),
            )
          : undefined
        return closestLeg === undefined
          ? true
          : distSquared(sense.end, closestLeg.foot) > minFeetDistance ** 2
      })

      const closestSensor = isNonEmpty(availableSenses)
        ? min(availableSenses, (sense) => distToSensorEnd(sense, leg))
        : undefined

      if (closestSensor && distToSensorEnd(closestSensor, leg) < legLength) {
        leg.foot = closestSensor.end
        attachedLegs.push(leg)
      }
    })

    attachedLegs.forEach((leg, legIndex) => {
      const hip = hipPos(leg)
      const foot = leg.foot
      const thighLength = snapToGroundDist / 2
      const calfLength = snapToGroundDist
      const knee = findC(hip, foot, calfLength, thighLength)

      // console.log(hip, knee, foot)

      if (!knee) {
        return
      }

      // Draw
      const [thighLine, calfLine] = legLines[legIndex]
      thighLine.visible = true
      calfLine.visible = true

      const hipKneeRel = sub(knee, hip)
      thighLine.position.set(...hip)
      thighLine.scale.set(norm2(hipKneeRel), 1)
      thighLine.rotation = angle(hipKneeRel)

      const kneeFotRel = sub(foot, knee)
      calfLine.position.set(...knee)
      calfLine.scale.set(norm2(kneeFotRel), 1)
      calfLine.rotation = angle(kneeFotRel)

      // const kneeFotRel = sub(foot, hip)
      // calfLine.position.set(...hip)
      // calfLine.scale.set(norm2(kneeFotRel), 1)
      // calfLine.rotation = angle(kneeFotRel)
    })
    // const sensorLine = sensorLines[index]

    // const hip = sense.pos
    // const foot = add(sense.pos, scale(sense.dir, sense.toi))
    // Climbing
    characterController.setUp(vecXy(playerDir))
    characterController.computeColliderMovement(
      playerCollider, // The collider we would like to move.
      vecXy(desiredTranslation(isKeyDown, playerDir)), // The movement we would like to apply if there wasn’t any obstacle.
    )
    const correctedMovement = vec2(characterController.computedMovement())

    const force = centroid(
      ...senses.map((sense) =>
        scale(
          sense.dir,
          clawForce * ((sense.toi - hoverHeight) / snapToGroundDist),
        ),
      ),
    )
    const dv = add(scale(force, dt), correctedMovement)
    const newLinVel = add(dv, velocity)
    playerBody.setLinvel(vecXy(newLinVel), true)

    if (surfaceNormal) {
      const springTorque =
        dot(surfaceNormal, fromAngle(playerAngle + Math.PI / 2)) * 0.01
      playerBody.applyTorqueImpulse(springTorque, true)
    }
    // }
  } else {
    playerBody.setGravityScale(1, false)
    playerBody.setLinearDamping(1)
    if (debugController.enabled) {
      // Debug controller
      if (isKeyDown(Key.KeyD)) {
        playerBody.applyImpulse(vecXy(scale(right, debugController.flyK)), true)
      }
      if (isKeyDown(Key.KeyA)) {
        playerBody.applyImpulse(vecXy(scale(left, debugController.flyK)), true)
      }
      if (isKeyDown(Key.KeyW)) {
        playerBody.applyImpulse(vecXy(scale(up, debugController.flyK)), true)
      }
      if (isKeyDown(Key.KeyS)) {
        playerBody.applyImpulse(vecXy(scale(down, debugController.flyK)), true)
      }
    }
  }
  // Shoot
  const clickEvents = drainEventQueue()
  if (clickEvents.has(Key.KeyS)) {
    shoot()
  }
  // Camera
  cameraAngle = rotateCamera
    ? rotationDamping * cameraAngle +
      (1 - rotationDamping) * angle(clockwise90deg(surfaceNormal ?? up))
    : 0
  viewport.rotation = cameraAngle
  pixiWorld.position.set(-playerPosition.x, -playerPosition.y)
}

let cameraAngle = rotationDamping === 1 ? 0 : spawn.angle - Math.PI / 2
let timeSinceLastTick = 0
const physicsDt = 1 / 60
const maxDt = physicsDt * 4

// Listen for animate update

const loop = (then: number) => (now: number) => {
  stats.begin()
  const dt = (now - then) / 1000

  timeSinceLastTick = Math.min(timeSinceLastTick + dt, maxDt)
  while (timeSinceLastTick > physicsDt) {
    timeSinceLastTick -= physicsDt
    updatePhysics(physicsDt)
  }

  requestAnimationFrame(loop(now))
  stats.end()
}
requestAnimationFrame(loop(0))
