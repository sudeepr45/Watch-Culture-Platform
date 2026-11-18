import { forwardRef, useEffect, useImperativeHandle, useRef, type MutableRefObject } from 'react'
import { HIDDEN_AMPERSAND_TIMING } from './hiddenAmpersandTiming'
import type { LiquidArrivalField, LiquidDrop } from './liquidArrivalField'

export interface LiquidInkRendererHandle {
  draw: (coverage: number, velocity: number, frameTime: number) => void
}

interface Props {
  originX: number
  originY: number
  ambientEnabled: boolean
  onAvailabilityChange: (available: boolean) => void
  coverageRef: MutableRefObject<number>
  velocityRef: MutableRefObject<number>
  frameTimeRef: MutableRefObject<number>
}

const MAX_DROPS = 24

const vertexSource = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 point = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = point * 0.5;
  gl_Position = vec4(point * 2.0 - 1.0, 0.0, 1.0);
}`

const fragmentSource = `#version 300 es
precision highp float;
precision highp int;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_arrival;
uniform vec2 u_fieldSize;
uniform vec2 u_cssResolution;
uniform float u_pixelRatio;
uniform float u_coverage;
uniform float u_velocity;
uniform float u_ambientTime;
uniform int u_dropCount;
uniform vec4 u_dropGeometry[24];
uniform vec4 u_dropTiming[24];

float fieldAt(vec2 uv) {
  // The CPU field samples span the exact viewport endpoints, so map screen
  // coordinates onto texel centers rather than half a texel beyond them.
  vec2 grid = uv * (u_fieldSize - 1.0);
  ivec2 base = ivec2(floor(grid));
  vec2 fraction = fract(grid);
  ivec2 maximum = ivec2(u_fieldSize) - 1;
  float lowerLeft = texelFetch(u_arrival, clamp(base, ivec2(0), maximum), 0).r;
  float lowerRight = texelFetch(u_arrival, clamp(base + ivec2(1, 0), ivec2(0), maximum), 0).r;
  float upperLeft = texelFetch(u_arrival, clamp(base + ivec2(0, 1), ivec2(0), maximum), 0).r;
  float upperRight = texelFetch(u_arrival, clamp(base + ivec2(1, 1), ivec2(0), maximum), 0).r;
  return mix(mix(lowerLeft, lowerRight, fraction.x), mix(upperLeft, upperRight, fraction.x), fraction.y);
}

float smoothUnion(float a, float b, float radius) {
  float k = max(radius, 0.001);
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float capsuleDistance(vec2 point, vec2 endPoint, float radius) {
  vec2 nearest = clamp(dot(point, endPoint) / max(dot(endPoint, endPoint), 0.001), 0.0, 1.0) * endPoint;
  return length(point - nearest) - radius;
}

float ellipseDistance(vec2 point, vec2 radii) {
  vec2 safeRadii = max(radii, vec2(0.001));
  float k0 = length(point / safeRadii);
  float k1 = length(point / (safeRadii * safeRadii));
  return k1 > 0.0001 ? k0 * (k0 - 1.0) / k1 : 10000.0;
}

float pixelHash(vec2 pixel) {
  vec3 p = fract(vec3(pixel.xyx) * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float paperNoise(vec2 pixel) {
  vec2 cell = floor(pixel * 0.14);
  vec2 fraction = fract(pixel * 0.14);
  fraction = fraction * fraction * (3.0 - 2.0 * fraction);
  float a = pixelHash(cell);
  float b = pixelHash(cell + vec2(1.0, 0.0));
  float c = pixelHash(cell + vec2(0.0, 1.0));
  float d = pixelHash(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, fraction.x), mix(c, d, fraction.x), fraction.y);
}

float inkFilament(vec2 uv, float axis, float seed, float startY, float endY) {
  float bend = paperNoise(vec2(uv.y * 12.0 + seed * 3.1, u_ambientTime * 0.14 + seed * 7.0));
  float pathX = axis + (bend - 0.5) * 0.055 + sin(uv.y * 9.0 + seed + u_ambientTime * 0.025) * 0.003;
  float strand = 1.0 - smoothstep(0.00055, 0.0011, abs(uv.x - pathX));
  float span = smoothstep(startY, startY + 0.045, uv.y) * (1.0 - smoothstep(endY - 0.045, endY, uv.y));
  float presence = smoothstep(0.28, 0.74, paperNoise(vec2(seed * 31.0, u_ambientTime * 0.18 + seed * 17.0)));
  return strand * span * presence;
}

void main() {
  vec2 screenUv = vec2(v_uv.x, 1.0 - v_uv.y);
  float arrival = fieldAt(screenUv);
  bool mainCovered = arrival <= u_coverage;
  float gradient = length(vec2(dFdx(arrival), dFdy(arrival))) * u_pixelRatio;
  float mainDistance = (arrival - u_coverage) / max(gradient, 0.00001);

  if (u_coverage >= 0.99999) mainDistance = -10000.0;

  float liquidDistance = mainDistance;
  for (int index = 0; index < 24; index++) {
    if (index >= u_dropCount) break;
    vec4 geometry = u_dropGeometry[index];
    vec4 timing = u_dropTiming[index];
    float growth = smoothstep(timing.x, timing.y, u_coverage);
    if (growth <= 0.0001) continue;

    float radius = geometry.z * growth;
    vec2 delta = (screenUv - geometry.xy) * u_cssResolution;
    float angle = geometry.w;
    float cosine = cos(angle);
    float sine = sin(angle);
    vec2 rotated = vec2(cosine * delta.x + sine * delta.y, -sine * delta.x + cosine * delta.y);
    float dropDistance = ellipseDistance(rotated, vec2(radius * timing.z, radius * 0.68));
    vec2 neck = vec2(cosine, sine) * radius * timing.w;
    float neckDistance = capsuleDistance(delta, neck, radius * 0.2);
    dropDistance = smoothUnion(dropDistance, neckDistance, radius * 0.34);
    liquidDistance = smoothUnion(liquidDistance, dropDistance, radius * 0.3);
  }

  // Feather only the dry side of the edge. Consumed field cells stay opaque,
  // preventing the warm homepage from showing through as interior holes.
  float alpha = mainCovered ? 1.0 : 1.0 - smoothstep(0.0, 1.15, liquidDistance);
  if (alpha <= 0.001) {
    outColor = vec4(0.0);
    return;
  }

  vec3 mainOxblood = vec3(0.2235, 0.0275, 0.0510); // #39070D
  vec3 darkOxblood = vec3(0.1490, 0.0118, 0.0314); // #260308
  vec3 deepestBurgundy = vec3(0.0863, 0.0078, 0.0196); // #160205
  vec3 nearBlackInk = vec3(0.0314, 0.0039, 0.0118); // #080103
  float innerRim = smoothstep(0.0, 3.0, -liquidDistance) * smoothstep(-4.0, -0.45, liquidDistance);
  float grain = paperNoise(gl_FragCoord.xy);
  float bodyTone = 0.26 + grain * 0.22 + smoothstep(0.68, 0.98, arrival) * 0.16;
  vec3 color = mix(darkOxblood, mainOxblood, bodyTone);
  color = mix(color, deepestBurgundy, grain * 0.12 + innerRim * 0.32);
  float movingDepth = smoothstep(0.025, 0.34, u_velocity) * innerRim * 0.3;
  color = mix(color, nearBlackInk, movingDepth);
  // Grain shades the surface within the burgundy palette and never adds light.
  color = mix(color, deepestBurgundy, (1.0 - grain) * 0.08);
  float settledSurface = step(0.99999, u_coverage);
  if (u_coverage >= 0.99999) {
    float filaments = max(inkFilament(screenUv, 0.19, 1.7, 0.08, 0.69) * 0.24,
      max(inkFilament(screenUv, 0.78, 4.3, 0.29, 0.94) * 0.21,
        inkFilament(screenUv, 0.54, 8.1, 0.17, 0.53) * 0.18));
    color = mix(color, nearBlackInk, filaments * settledSurface);
  }
  outColor = vec4(color, alpha);
}`

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Unable to allocate WebGL shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown WebGL shader error'
    gl.deleteShader(shader)
    throw new Error(message)
  }
  return shader
}

function buildProgram(gl: WebGL2RenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!program) throw new Error('Unable to allocate WebGL program')
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown WebGL link error'
    gl.deleteProgram(program)
    throw new Error(message)
  }
  return program
}

function packDrops(field: LiquidArrivalField, activeCount: number) {
  const geometry = new Float32Array(MAX_DROPS * 4)
  const timing = new Float32Array(MAX_DROPS * 4)
  for (let index = 0; index < activeCount; index += 1) {
    const drop = field.drops[index]
    const offset = index * 4
    geometry[offset] = drop.x
    geometry[offset + 1] = drop.y
    geometry[offset + 2] = drop.radius
    geometry[offset + 3] = drop.angle
    timing[offset] = drop.birth
    timing[offset + 1] = drop.merge
    timing[offset + 2] = drop.elongation
    timing[offset + 3] = drop.neck
  }
  return { geometry, timing }
}

const LiquidInkRenderer = forwardRef<LiquidInkRendererHandle, Props>(function LiquidInkRenderer({
  originX, originY, ambientEnabled, onAvailabilityChange, coverageRef, velocityRef, frameTimeRef,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef<(coverage: number, velocity: number, frameTime: number) => void>(() => undefined)
  const sizeRef = useRef({ width: 1, height: 1, pixelRatio: 1 })
  const lastFrameTimeRef = useRef(0)
  const slowFrameCountRef = useRef(0)
  const renderScaleRef = useRef(1)
  const activeDropCountRef = useRef(0)
  const fieldRef = useRef<LiquidArrivalField | null>(null)
  const seedRef = useRef<number>(HIDDEN_AMPERSAND_TIMING.defaultSeed)
  const cleanupRef = useRef<() => void>(() => undefined)

  useImperativeHandle(ref, () => ({
    draw: (coverage, velocity, frameTime) => drawRef.current(coverage, velocity, frameTime),
  }), [])

  useEffect(() => {
    if (!ambientEnabled) return
    let animationFrame = 0
    const drawAmbientFrame = (frameTime: number) => {
      if (coverageRef.current < 0.99999) return
      drawRef.current(coverageRef.current, 0, frameTime)
      animationFrame = requestAnimationFrame(drawAmbientFrame)
    }
    animationFrame = requestAnimationFrame(drawAmbientFrame)
    return () => cancelAnimationFrame(animationFrame)
  }, [ambientEnabled, coverageRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'high-performance' })
    let program: WebGLProgram | null = null
    let texture: WebGLTexture | null = null
    let vertexArray: WebGLVertexArrayObject | null = null
    let resizeFrame = 0
    let lost = false
    let disposed = false
    let worker: Worker | null = null
    const locations: {
      coverage: WebGLUniformLocation | null
      velocity: WebGLUniformLocation | null
      resolution: WebGLUniformLocation | null
      pixelRatio: WebGLUniformLocation | null
      fieldSize: WebGLUniformLocation | null
      ambientTime: WebGLUniformLocation | null
      dropCount: WebGLUniformLocation | null
      dropGeometry: WebGLUniformLocation | null
      dropTiming: WebGLUniformLocation | null
    } = {
      coverage: null,
      velocity: null,
      resolution: null,
      pixelRatio: null,
      fieldSize: null,
      ambientTime: null,
      dropCount: null,
      dropGeometry: null,
      dropTiming: null,
    }

    const querySeed = Number(new URLSearchParams(window.location.search).get('ampSeed'))
    seedRef.current = Number.isFinite(querySeed) && querySeed !== 0 ? querySeed : HIDDEN_AMPERSAND_TIMING.defaultSeed

    const resizeCanvas = () => {
      if (!gl || lost || !program) return
      const cssWidth = window.innerWidth
      const cssHeight = window.innerHeight
      const maxRatio = cssWidth < 700 ? 1.25 : 1.5
      const pixelRatio = Math.min(window.devicePixelRatio || 1, maxRatio) * renderScaleRef.current
      sizeRef.current.width = cssWidth
      sizeRef.current.height = cssHeight
      sizeRef.current.pixelRatio = pixelRatio
      canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio))
      canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(program)
      gl.uniform2f(locations.resolution, cssWidth, cssHeight)
      gl.uniform1f(locations.pixelRatio, pixelRatio)
    }

    const drawCurrent = (coverage: number, velocity: number, frameTime: number) => {
      if (!gl || !program || !texture || lost) return
      const previous = lastFrameTimeRef.current
      if (previous > 0) {
        const frameDelta = frameTime - previous
        if (frameDelta > 24 && frameDelta < 200) slowFrameCountRef.current += 1
        else slowFrameCountRef.current = Math.max(0, slowFrameCountRef.current - 1)
        if (slowFrameCountRef.current >= 12 && renderScaleRef.current > 0.55 && fieldRef.current) {
          renderScaleRef.current = Math.max(0.55, renderScaleRef.current * 0.8)
          const minimumDrops = sizeRef.current.width < 700 ? 4 : 8
          activeDropCountRef.current = Math.min(
            fieldRef.current.drops.length,
            Math.max(minimumDrops, Math.floor(activeDropCountRef.current * 0.75)),
          )
          const packed = packDrops(fieldRef.current, activeDropCountRef.current)
          gl.uniform4fv(locations.dropGeometry, packed.geometry)
          gl.uniform4fv(locations.dropTiming, packed.timing)
          gl.uniform1i(locations.dropCount, activeDropCountRef.current)
          resizeCanvas()
          slowFrameCountRef.current = 0
        }
      }
      lastFrameTimeRef.current = frameTime
      gl.useProgram(program)
      gl.bindVertexArray(vertexArray)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1f(locations.coverage, coverage)
      gl.uniform1f(locations.velocity, velocity)
      gl.uniform1f(locations.ambientTime, frameTime * 0.001)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const createGraphics = () => {
      if (!gl) throw new Error('WebGL2 context is unavailable')
      program = buildProgram(gl)
      vertexArray = gl.createVertexArray()
      texture = gl.createTexture()
      if (!vertexArray || !texture) throw new Error('Unable to allocate WebGL resources')
      gl.bindVertexArray(vertexArray)
      gl.useProgram(program)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      locations.coverage = gl.getUniformLocation(program, 'u_coverage')
      locations.velocity = gl.getUniformLocation(program, 'u_velocity')
      locations.resolution = gl.getUniformLocation(program, 'u_cssResolution')
      locations.pixelRatio = gl.getUniformLocation(program, 'u_pixelRatio')
      locations.fieldSize = gl.getUniformLocation(program, 'u_fieldSize')
      locations.ambientTime = gl.getUniformLocation(program, 'u_ambientTime')
      locations.dropCount = gl.getUniformLocation(program, 'u_dropCount')
      locations.dropGeometry = gl.getUniformLocation(program, 'u_dropGeometry[0]')
      locations.dropTiming = gl.getUniformLocation(program, 'u_dropTiming[0]')
      gl.uniform1i(gl.getUniformLocation(program, 'u_arrival'), 0)
    }

    const initializeContext = () => {
      if (!gl || !fieldRef.current || !program || !vertexArray || !texture) return
      gl.bindVertexArray(vertexArray)
      gl.useProgram(program)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, fieldRef.current.columns, fieldRef.current.rows, 0, gl.RED, gl.FLOAT, fieldRef.current.values)
      if (gl.getError() !== gl.NO_ERROR) throw new Error('The WebGL2 implementation rejected the R32F arrival texture')
      const packed = packDrops(fieldRef.current, activeDropCountRef.current)
      gl.uniform2f(locations.fieldSize, fieldRef.current.columns, fieldRef.current.rows)
      gl.uniform4fv(locations.dropGeometry, packed.geometry)
      gl.uniform4fv(locations.dropTiming, packed.timing)
      gl.uniform1i(locations.dropCount, activeDropCountRef.current)
    }

    const warmShader = () => {
      if (!gl || !texture) return
      gl.bindVertexArray(vertexArray)
      gl.useProgram(program)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([0]))
      gl.uniform2f(locations.fieldSize, 1, 1)
      gl.uniform2f(locations.resolution, 1, 1)
      gl.uniform1f(locations.pixelRatio, 1)
      gl.uniform1f(locations.coverage, 0)
      gl.uniform1f(locations.velocity, 0)
      gl.uniform1f(locations.ambientTime, 0)
      gl.uniform1i(locations.dropCount, 0)
      gl.viewport(0, 0, 1, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      if (gl.getError() !== gl.NO_ERROR) throw new Error('WebGL2 shader warmup failed')
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      lost = true
      onAvailabilityChange(false)
    }
    const onContextRestored = () => {
      lost = false
      if (!gl || !fieldRef.current) return
      try {
        program = null
        vertexArray = null
        texture = null
        createGraphics()
        initializeContext()
        resizeCanvas()
        drawCurrent(coverageRef.current, velocityRef.current, frameTimeRef.current || performance.now())
        drawRef.current = drawCurrent
        onAvailabilityChange(true)
      } catch {
        lost = true
        onAvailabilityChange(false)
      }
    }
    const handleResize = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        resizeCanvas()
        drawCurrent(coverageRef.current, velocityRef.current, frameTimeRef.current || performance.now())
      })
    }

    const dispose = () => {
      disposed = true
      worker?.terminate()
      cancelAnimationFrame(resizeFrame)
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      drawRef.current = () => undefined
      if (gl && !lost) {
        if (texture) gl.deleteTexture(texture)
        if (program) gl.deleteProgram(program)
        if (vertexArray) gl.deleteVertexArray(vertexArray)
      }
      fieldRef.current = null
    }
    cleanupRef.current = dispose

    try {
      if (!gl) throw new Error('WebGL2 is unavailable')
      const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)
      if (!precision || precision.precision === 0) throw new Error('High precision fragment shaders are unavailable')
      const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
      const width = window.innerWidth
      const height = window.innerHeight
      createGraphics()
      warmShader()
      canvas.addEventListener('webglcontextlost', onContextLost)
      canvas.addEventListener('webglcontextrestored', onContextRestored)
      window.addEventListener('resize', handleResize)
      window.visualViewport?.addEventListener('resize', handleResize)
      worker = new Worker(new URL('./liquidArrivalWorker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<LiquidArrivalField & { error?: string }>) => {
        if (disposed) return
        worker?.terminate()
        worker = null
        if (event.data.error) {
          onAvailabilityChange(false)
          return
        }
        try {
          const field: LiquidArrivalField = {
            columns: event.data.columns,
            rows: event.data.rows,
            values: event.data.values instanceof Float32Array ? event.data.values : new Float32Array(event.data.values),
            drops: event.data.drops as LiquidDrop[],
          }
          if (field.columns > maxTexture || field.rows > maxTexture) throw new Error('Arrival field exceeds the supported texture size')
          fieldRef.current = field
          activeDropCountRef.current = width < 700 ? Math.min(12, field.drops.length) : Math.min(MAX_DROPS, field.drops.length)
          if (lost) return
          initializeContext()
          resizeCanvas()
          drawCurrent(coverageRef.current, velocityRef.current, frameTimeRef.current || performance.now())
          drawRef.current = drawCurrent
          onAvailabilityChange(true)
        } catch {
          onAvailabilityChange(false)
        }
      }
      worker.onerror = () => {
        worker?.terminate()
        worker = null
        onAvailabilityChange(false)
      }
      worker.postMessage({ width, height, seed: seedRef.current, ampX: originX, ampY: originY })
    } catch {
      onAvailabilityChange(false)
      drawRef.current = () => undefined
    }

    return () => cleanupRef.current()
  }, [originX, originY, onAvailabilityChange, coverageRef, velocityRef, frameTimeRef])

  return <canvas ref={canvasRef} className="mojean-amp-webgl" aria-hidden="true" />
})

export default LiquidInkRenderer
