import { forwardRef, useEffect, useImperativeHandle, useRef, type MutableRefObject } from 'react'
import { HIDDEN_AMPERSAND_TIMING } from './hiddenAmpersandTiming'
import type { LiquidArrivalField } from './liquidArrivalField'
import type { AmpersandOrigin } from './BrandLogo'

export interface LiquidInkRendererHandle {
  draw: (coverage: number, velocity: number, frameTime: number, exitProgress?: number | null) => void
  prepareExitField: (origin: AmpersandOrigin, onReady: (ready: boolean) => void) => void
}

interface Props {
  originX: number
  originY: number
  available: boolean
  ambientEnabled: boolean
  onAvailabilityChange: (available: boolean) => void
  coverageRef: MutableRefObject<number>
  velocityRef: MutableRefObject<number>
  frameTimeRef: MutableRefObject<number>
}

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
uniform sampler2D u_exitArrival;
uniform vec2 u_fieldSize;
uniform vec2 u_exitFieldSize;
uniform float u_pixelRatio;
uniform float u_coverage;
uniform float u_velocity;
uniform float u_ambientTime;
uniform float u_exitProgress;
uniform float u_exitBand;

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

float exitFieldAt(vec2 uv) {
  vec2 grid = uv * (u_exitFieldSize - 1.0);
  ivec2 base = ivec2(floor(grid));
  vec2 fraction = fract(grid);
  ivec2 maximum = ivec2(u_exitFieldSize) - 1;
  float lowerLeft = texelFetch(u_exitArrival, clamp(base, ivec2(0), maximum), 0).r;
  float lowerRight = texelFetch(u_exitArrival, clamp(base + ivec2(1, 0), ivec2(0), maximum), 0).r;
  float upperLeft = texelFetch(u_exitArrival, clamp(base + ivec2(0, 1), ivec2(0), maximum), 0).r;
  float upperRight = texelFetch(u_exitArrival, clamp(base + ivec2(1, 1), ivec2(0), maximum), 0).r;
  return mix(mix(lowerLeft, lowerRight, fraction.x), mix(upperLeft, upperRight, fraction.x), fraction.y);
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
  float gradient = length(vec2(dFdx(arrival), dFdy(arrival))) * u_pixelRatio;
  float exitArrival = exitFieldAt(screenUv);
  vec2 edgeNormal = normalize(vec2(dFdx(arrival), dFdy(arrival)) + vec2(0.000001));
  if (u_exitProgress >= 0.0) {
    float trailingEdge = u_exitProgress - u_exitBand;
    if (exitArrival <= trailingEdge) {
      outColor = vec4(0.0);
      return;
    }
    if (exitArrival <= u_exitProgress) {
      outColor = vec4(0.9020, 0.8627, 0.7961, 1.0); // aged ivory #E6DCCB
      return;
    }
  }
  bool mainCovered = arrival <= u_coverage;
  float mainDistance = (arrival - u_coverage) / max(gradient, 0.00001);

  if (u_coverage >= 0.99999) mainDistance = -10000.0;

  // Feather only the dry side of the edge. Consumed field cells stay opaque,
  // preventing the warm homepage from showing through as interior holes.
  float alpha = mainCovered ? 1.0 : 1.0 - smoothstep(0.0, 1.15, mainDistance);
  if (alpha <= 0.001) {
    outColor = vec4(0.0);
    return;
  }

  vec3 mainOxblood = vec3(0.2235, 0.0275, 0.0510); // #39070D
  vec3 darkOxblood = vec3(0.1490, 0.0118, 0.0314); // #260308
  vec3 deepestBurgundy = vec3(0.0863, 0.0078, 0.0196); // #160205
  vec3 nearBlackInk = vec3(0.0314, 0.0039, 0.0118); // #080103
  float innerRim = smoothstep(0.0, 3.0, -mainDistance) * smoothstep(-4.0, -0.45, mainDistance);
  float grain = paperNoise(gl_FragCoord.xy);
  float bodyTone = 0.26 + grain * 0.22 + smoothstep(0.68, 0.98, arrival) * 0.16;
  vec3 color = mix(darkOxblood, mainOxblood, bodyTone);
  color = mix(color, deepestBurgundy, grain * 0.12 + innerRim * 0.32);
  float movingDepth = smoothstep(0.025, 0.34, u_velocity) * innerRim * 0.3;
  color = mix(color, nearBlackInk, movingDepth);
  float surfaceFold = exp(-abs(mainDistance + 2.8) * 0.28) * smoothstep(0.025, 0.2, u_velocity);
  float foldShade = 0.045 + (0.5 + 0.5 * dot(edgeNormal, normalize(vec2(-0.58, 0.82)))) * 0.085;
  color = mix(color, deepestBurgundy, surfaceFold * foldShade);
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

const LiquidInkRenderer = forwardRef<LiquidInkRendererHandle, Props>(function LiquidInkRenderer({
  originX, originY, available, ambientEnabled, onAvailabilityChange, coverageRef, velocityRef, frameTimeRef,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef<(coverage: number, velocity: number, frameTime: number, exitProgress?: number | null) => void>(() => undefined)
  const prepareExitFieldRef = useRef<(origin: AmpersandOrigin, onReady: (ready: boolean) => void) => void>((_origin, onReady) => onReady(false))
  const activeExitProgressRef = useRef<number | null>(null)
  const sizeRef = useRef({ width: 1, height: 1, pixelRatio: 1 })
  const lastFrameTimeRef = useRef(0)
  const slowFrameCountRef = useRef(0)
  const renderScaleRef = useRef(1)
  const fieldRef = useRef<LiquidArrivalField | null>(null)
  const exitFieldRef = useRef<LiquidArrivalField | null>(null)
  const seedRef = useRef<number>(HIDDEN_AMPERSAND_TIMING.defaultSeed)
  const cleanupRef = useRef<() => void>(() => undefined)

  useImperativeHandle(ref, () => ({
    draw: (coverage, velocity, frameTime, exitProgress = null) => drawRef.current(coverage, velocity, frameTime, exitProgress),
    prepareExitField: (origin, onReady) => prepareExitFieldRef.current(origin, onReady),
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
    let exitTexture: WebGLTexture | null = null
    let vertexArray: WebGLVertexArrayObject | null = null
    let resizeFrame = 0
    let lost = false
    let disposed = false
    let worker: Worker | null = null
    let pendingExitCallback: ((ready: boolean) => void) | null = null
    const locations: {
      coverage: WebGLUniformLocation | null
      velocity: WebGLUniformLocation | null
      pixelRatio: WebGLUniformLocation | null
      fieldSize: WebGLUniformLocation | null
      exitFieldSize: WebGLUniformLocation | null
      ambientTime: WebGLUniformLocation | null
      exitProgress: WebGLUniformLocation | null
      exitBand: WebGLUniformLocation | null
    } = {
      coverage: null,
      velocity: null,
      pixelRatio: null,
      fieldSize: null,
      exitFieldSize: null,
      ambientTime: null,
      exitProgress: null,
      exitBand: null,
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
      gl.uniform1f(locations.pixelRatio, pixelRatio)
    }

    const drawCurrent = (coverage: number, velocity: number, frameTime: number, exitProgress?: number | null) => {
      const activeExitProgress = exitProgress === undefined ? activeExitProgressRef.current : exitProgress
      activeExitProgressRef.current = activeExitProgress
      if (!gl || !program || !texture || !exitTexture || lost) return
      const previous = lastFrameTimeRef.current
      if (previous > 0) {
        const frameDelta = frameTime - previous
        if (frameDelta > 24 && frameDelta < 200) slowFrameCountRef.current += 1
        else slowFrameCountRef.current = Math.max(0, slowFrameCountRef.current - 1)
        if (slowFrameCountRef.current >= 12 && renderScaleRef.current > 0.55 && fieldRef.current) {
          renderScaleRef.current = Math.max(0.55, renderScaleRef.current * 0.8)
          resizeCanvas()
          slowFrameCountRef.current = 0
        }
      }
      lastFrameTimeRef.current = frameTime
      gl.useProgram(program)
      gl.bindVertexArray(vertexArray)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, exitTexture)
      gl.uniform1f(locations.coverage, coverage)
      gl.uniform1f(locations.velocity, velocity)
      gl.uniform1f(locations.ambientTime, frameTime * 0.001)
      gl.uniform1f(locations.exitProgress, activeExitProgress ?? -1)
      gl.disable(gl.BLEND)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const createGraphics = () => {
      if (!gl) throw new Error('WebGL2 context is unavailable')
      program = buildProgram(gl)
      vertexArray = gl.createVertexArray()
      texture = gl.createTexture()
      exitTexture = gl.createTexture()
      if (!vertexArray || !texture || !exitTexture) throw new Error('Unable to allocate WebGL resources')
      gl.bindVertexArray(vertexArray)
      gl.useProgram(program)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, exitTexture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      locations.coverage = gl.getUniformLocation(program, 'u_coverage')
      locations.velocity = gl.getUniformLocation(program, 'u_velocity')
      locations.pixelRatio = gl.getUniformLocation(program, 'u_pixelRatio')
      locations.fieldSize = gl.getUniformLocation(program, 'u_fieldSize')
      locations.exitFieldSize = gl.getUniformLocation(program, 'u_exitFieldSize')
      locations.ambientTime = gl.getUniformLocation(program, 'u_ambientTime')
      locations.exitProgress = gl.getUniformLocation(program, 'u_exitProgress')
      locations.exitBand = gl.getUniformLocation(program, 'u_exitBand')
      gl.uniform1i(gl.getUniformLocation(program, 'u_arrival'), 0)
      gl.uniform1i(gl.getUniformLocation(program, 'u_exitArrival'), 1)
      gl.uniform1f(locations.exitBand, HIDDEN_AMPERSAND_TIMING.ivoryFrontBand)
    }

    const initializeContext = () => {
      if (!gl || !fieldRef.current || !program || !vertexArray || !texture || !exitTexture) return
      gl.bindVertexArray(vertexArray)
      gl.useProgram(program)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, fieldRef.current.columns, fieldRef.current.rows, 0, gl.RED, gl.FLOAT, fieldRef.current.values)
      if (gl.getError() !== gl.NO_ERROR) throw new Error('The WebGL2 implementation rejected the R32F arrival texture')
      gl.uniform2f(locations.fieldSize, fieldRef.current.columns, fieldRef.current.rows)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, exitTexture)
      if (exitFieldRef.current) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, exitFieldRef.current.columns, exitFieldRef.current.rows, 0, gl.RED, gl.FLOAT, exitFieldRef.current.values)
        gl.uniform2f(locations.exitFieldSize, exitFieldRef.current.columns, exitFieldRef.current.rows)
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([1]))
        gl.uniform2f(locations.exitFieldSize, 1, 1)
      }
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
    }

    const prepareExitField = (origin: AmpersandOrigin, onReady: (ready: boolean) => void) => {
      if (!gl || !program || !texture || !exitTexture || lost || disposed || !fieldRef.current) {
        onReady(false)
        return
      }
      try {
        worker?.terminate()
        worker = new Worker(new URL('./liquidArrivalWorker.ts', import.meta.url), { type: 'module' })
        const exitWorker = worker
        pendingExitCallback?.(false)
        pendingExitCallback = onReady
        exitWorker.onmessage = (event: MessageEvent<LiquidArrivalField & { error?: string }>) => {
          if (disposed || worker !== exitWorker) return
          exitWorker.terminate()
          worker = null
          const finish = pendingExitCallback
          pendingExitCallback = null
          if (event.data.error) {
            finish?.(false)
            return
          }
          const nextField: LiquidArrivalField = {
            columns: event.data.columns,
            rows: event.data.rows,
            values: event.data.values instanceof Float32Array ? event.data.values : new Float32Array(event.data.values),
          }
          if (nextField.columns > (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number)
            || nextField.rows > (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number)) {
            finish?.(false)
            return
          }
          exitFieldRef.current = nextField
          if (lost) return
          try {
            gl.useProgram(program)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, exitTexture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, nextField.columns, nextField.rows, 0, gl.RED, gl.FLOAT, nextField.values)
            if (gl.getError() !== gl.NO_ERROR) throw new Error('Unable to upload the ivory impact field')
            gl.uniform2f(locations.exitFieldSize, nextField.columns, nextField.rows)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            drawCurrent(coverageRef.current, velocityRef.current, frameTimeRef.current || performance.now())
            finish?.(true)
          } catch {
            finish?.(false)
          }
        }
        exitWorker.onerror = () => {
          if (worker !== exitWorker) return
          exitWorker.terminate()
          worker = null
          const finish = pendingExitCallback
          pendingExitCallback = null
          finish?.(false)
        }
        exitWorker.postMessage({
          width: sizeRef.current.width,
          height: sizeRef.current.height,
          seed: seedRef.current,
          ampX: origin.x,
          ampY: origin.y,
        })
      } catch {
        const finish = pendingExitCallback
        pendingExitCallback = null
        finish?.(false)
      }
    }
    prepareExitFieldRef.current = prepareExitField

    const warmShader = () => {
      if (!gl || !program || !vertexArray || !texture || !exitTexture) return
      gl.bindVertexArray(vertexArray)
      gl.useProgram(program)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([0]))
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, exitTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([1]))
      gl.uniform2f(locations.exitFieldSize, 1, 1)
      gl.uniform1f(locations.exitProgress, -1)
      gl.uniform2f(locations.fieldSize, 1, 1)
      gl.uniform1f(locations.pixelRatio, 1)
      gl.uniform1f(locations.coverage, 0)
      gl.uniform1f(locations.velocity, 0)
      gl.uniform1f(locations.ambientTime, 0)
      gl.uniform1f(locations.exitBand, HIDDEN_AMPERSAND_TIMING.ivoryFrontBand)
      gl.uniform1i(gl.getUniformLocation(program, 'u_arrival'), 0)
      gl.uniform1i(gl.getUniformLocation(program, 'u_exitArrival'), 1)
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
      pendingExitCallback?.(false)
      pendingExitCallback = null
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
      pendingExitCallback?.(false)
      pendingExitCallback = null
      worker?.terminate()
      cancelAnimationFrame(resizeFrame)
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      drawRef.current = () => undefined
      if (gl && !lost) {
        if (texture) gl.deleteTexture(texture)
        if (exitTexture) gl.deleteTexture(exitTexture)
        if (program) gl.deleteProgram(program)
        if (vertexArray) gl.deleteVertexArray(vertexArray)
      }
      fieldRef.current = null
      exitFieldRef.current = null
      prepareExitFieldRef.current = (_origin, onReady) => onReady(false)
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
          }
          if (field.columns > maxTexture || field.rows > maxTexture) throw new Error('Arrival field exceeds the supported texture size')
          fieldRef.current = field
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

  return <canvas
    ref={canvasRef}
    className="mojean-amp-webgl"
    aria-hidden="true"
    style={{ visibility: available ? 'visible' : 'hidden' }}
  />
})

export default LiquidInkRenderer
