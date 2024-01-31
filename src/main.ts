import './style.css'
import * as Rapier from '@dimforge/rapier2d'
import {
  ActiveEvents,
  ColliderDesc,
  EventQueue,
  JointData,
  RigidBodyDesc,
  RigidBodyType,
  ShapeContact,
  Vector2,
} from '@dimforge/rapier2d'
import * as PIXI from 'pixi.js'
import { Container, Graphics, Mesh, MIPMAP_MODES, Text } from 'pixi.js'
import { GameObject, TriangleGameObject } from './gameObject.ts'
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
  centroid,
  normalized1,
  origo,
  sub,
  Tuple3,
  vec2,
  Vec3,
  vecXy,
} from './vec.ts'
import { radialDistance } from './signal-processing'
import { calculateZIndices } from './calculateZIndices.ts'
import { createTriangleShader } from './createTriangleShader.ts'
import { vector } from './vector.ts'
import { createGrassTexture } from './createGrassTexture'
import { OutlineFilter } from 'pixi-filters'
import { pseudoRandomColor, randomColor } from './randomColor.ts'
import { areTrianglesJoined, groupTriangles } from './groupTriangles.ts'
import { v4 as randomUuid } from 'uuid'
import { groupBy } from 'lodash'

const debug = {
  enabled: true,
  wireframes: true,
  weightlessness: true,
}

// Map params
const thresholdFill = 0.55
const thresholdHole = 0.3

// Use the Rapier module here.
let gravity = {
  x: 0.0,
  y: debug.enabled && debug.weightlessness ? 0 : -9.81,
}
let world = new Rapier.World(gravity)

const playerRadius = 0.25
// Create a dynamic rigid-body.
let playerBody = world.createRigidBody(
  RigidBodyDesc.dynamic()
    .setTranslation(0.0, 5.0)
    .setLinearDamping(1)
    .setAngularDamping(1),
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
  const viewportWidth = debug.enabled ? 30 : 10

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
    indices,
    vertices,
    // For debug purposes
    sprite: mesh,
    rigidBodyDesc: RigidBodyDesc.fixed().setTranslation(position.x, position.y),
    colliderDesc: colliderDesc,
  }
}

const triangleGeometry = (vertices: [Vec2, Vec2, Vec2]) => {
  const m = centroid(vertices)
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
    if (it.debugDisplayObject) {
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

const updatePhysics = () => {
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

          const oldDebugDisplayObject = triangle.debugDisplayObject
          const newDebugDisplayObject = triangleMesh(
            triangle.vertices,
            pseudoRandomColor(newGroupId),
          )

          triangle.debugDisplayObject = newDebugDisplayObject
          pixiWorld.removeChild(oldDebugDisplayObject)
          pixiWorld.addChild(newDebugDisplayObject)
        })
        groups[newGroupId] = triangles

        if (triangles.length < 20) {
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
                  console.log('pos', sub(leftPos, rightPos))
                  const params = JointData.fixed(
                    vecXy(sub(closest, sub(leftPos, rightPos))),
                    // left.rigidBody.rotation(),
                    0,
                    vecXy(sub(closest, sub(leftPos, rightPos))),
                    // right.rigidBody.rotation(),
                    0,
                  )
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
  trianglesHit.forEach((freedObj) => {
    const oldGroupId = freedObj.groupId
    const newGroupId = randomUuid()

    // groupTriangles(groups[oldGroupId]).forEach((triangle) => {
    //
    // })
    // Remove from group
    groups[oldGroupId] = groups[oldGroupId].filter((obj) => obj !== freedObj)

    // Assign new groupId
    groups[newGroupId] = [freedObj]
    freedObj.groupId = newGroupId

    // New debug mesh
    const oldDebugDisplayObject = freedObj.debugDisplayObject
    const newDebugDisplayObject = triangleMesh(
      freedObj.vertices,
      pseudoRandomColor(newGroupId),
    )
    pixiWorld.removeChild(oldDebugDisplayObject)
    freedObj.debugDisplayObject = newDebugDisplayObject
    pixiWorld.addChild(newDebugDisplayObject)

    groups[oldGroupId]
  })

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
