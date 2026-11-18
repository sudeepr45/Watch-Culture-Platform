export interface LiquidDrop {
  x: number
  y: number
  radius: number
  angle: number
  birth: number
  merge: number
  elongation: number
  neck: number
}

export interface LiquidArrivalField {
  columns: number
  rows: number
  values: Float32Array
  drops: LiquidDrop[]
}

class MinHeap {
  private nodes: number[] = []
  private values: number[] = []
  lastValue = Number.POSITIVE_INFINITY

  push(node: number, value: number) {
    let index = this.nodes.length
    this.nodes.push(node)
    this.values.push(value)
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (this.values[parent] <= value) break
      this.nodes[index] = this.nodes[parent]
      this.values[index] = this.values[parent]
      index = parent
    }
    this.nodes[index] = node
    this.values[index] = value
  }

  pop() {
    const node = this.nodes[0]
    this.lastValue = this.values[0]
    const lastNode = this.nodes.pop() as number
    const lastValue = this.values.pop() as number
    if (this.nodes.length > 0) {
      let index = 0
      while (true) {
        const left = index * 2 + 1
        if (left >= this.nodes.length) break
        const right = left + 1
        const child = right < this.nodes.length && this.values[right] < this.values[left] ? right : left
        if (this.values[child] >= lastValue) break
        this.nodes[index] = this.nodes[child]
        this.values[index] = this.values[child]
        index = child
      }
      this.nodes[index] = lastNode
      this.values[index] = lastValue
    }
    return node
  }

  get size() {
    return this.nodes.length
  }
}

function hashNoise(x: number, y: number, seed: number) {
  let value = Math.imul(x + seed, 0x45d9f3b) ^ Math.imul(y - seed, 0x119de1f3)
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295
}

function solveUpwindArrival(
  index: number,
  columns: number,
  dx: number,
  dy: number,
  speed: number,
  times: Float64Array,
  accepted: Uint8Array,
) {
  const x = index % columns
  const left = x > 0 && accepted[index - 1] ? times[index - 1] : Number.POSITIVE_INFINITY
  const right = x + 1 < columns && accepted[index + 1] ? times[index + 1] : Number.POSITIVE_INFINITY
  const up = index >= columns && accepted[index - columns] ? times[index - columns] : Number.POSITIVE_INFINITY
  const down = index + columns < times.length && accepted[index + columns] ? times[index + columns] : Number.POSITIVE_INFINITY
  const a = Math.min(left, right)
  const b = Math.min(up, down)
  const cost = 1 / (speed * speed)

  if (!Number.isFinite(a)) return Number.isFinite(b) ? b + dy / speed : Number.POSITIVE_INFINITY
  if (!Number.isFinite(b)) return a + dx / speed

  const ix = 1 / (dx * dx)
  const iy = 1 / (dy * dy)
  const qa = ix + iy
  const qb = -2 * (a * ix + b * iy)
  const qc = a * a * ix + b * b * iy - cost
  const discriminant = Math.max(0, qb * qb - 4 * qa * qc)
  const root = (-qb + Math.sqrt(discriminant)) / (2 * qa)
  return root >= Math.max(a, b)
    ? root
    : Math.min(a + dx / speed, b + dy / speed)
}

function generateSpeedMap(
  width: number,
  height: number,
  columns: number,
  rows: number,
  seed: number,
  ampX: number,
  ampY: number,
) {
  const count = columns * rows
  const speeds = new Float32Array(count)
  const dx = width / (columns - 1)
  const dy = height / (rows - 1)
  const sources = [0.13, 0.51, 0.86]
  const islands = [
    [0.27, 0.56, 0.074, 0.105],
    [0.71, 0.42, 0.068, 0.09],
    [0.48, 0.73, 0.055, 0.08],
    [0.89, 0.68, 0.044, 0.065],
  ]

  for (let yIndex = 0; yIndex < rows; yIndex += 1) {
    const v = yIndex / (rows - 1)
    for (let xIndex = 0; xIndex < columns; xIndex += 1) {
      const u = xIndex / (columns - 1)
      const index = yIndex * columns + xIndex
      const noise = (hashNoise(xIndex, yIndex, seed) - 0.5) * 0.17
      const upwardBias = 0.84 + (1 - v) * 0.42
      let velocity = upwardBias * (1 + noise)

      for (let source = 0; source < sources.length; source += 1) {
        const sourceX = sources[source]
        const lobeCenterX = sourceX + Math.sin(v * (4.2 + source * 0.4) + source * 2.1) * 0.046
        const lobeX = (u - lobeCenterX) * width
        const lobeY = (v - 0.69) * height
        const lobe = Math.exp(-(lobeX * lobeX / (2 * 43 * 43) + lobeY * lobeY / (2 * 115 * 115)))
        velocity += lobe * (0.16 + source * 0.06)

        const branchPhase = hashNoise(source + 17, 29, seed) * Math.PI * 2
        const branch1 = sourceX
          + Math.sin(v * 7.2 + source * 1.8 + branchPhase) * 0.037
          + Math.sin(v * 13.4 + branchPhase * 0.7) * 0.009
        const branchBase = sourceX + Math.sin(v * 5.1 + source * 2.7 + 1.1) * 0.052
        const fork = Math.max(0, Math.min(1, (v - 0.46) / 0.44)) * 0.045
        const branch2a = branchBase - fork
        const branch2b = branchBase + fork
        const distance1 = Math.abs((u - branch1) * width)
        const distance2a = Math.abs((u - branch2a) * width)
        const distance2b = Math.abs((u - branch2b) * width)
        const surgeWindow = Math.max(0, Math.min(1, (v - 0.38) / 0.28))
          * (1 - Math.max(0, Math.min(1, (v - 0.82) / 0.14)))
        const surgeStrength = source === 1 ? 0.8 : 0.34 + hashNoise(source + 41, 13, seed) * 0.32
        velocity += Math.exp(-(distance1 * distance1) / (2 * 15 * 15)) * (0.7 + surgeWindow * surgeStrength)
        velocity += Math.exp(-(distance2a * distance2a) / (2 * 12 * 12)) * 0.28
        velocity += Math.exp(-(distance2b * distance2b) / (2 * 12 * 12)) * 0.28
      }

      for (let island = 0; island < islands.length; island += 1) {
        const spec = islands[island]
        const nx = (u - spec[0]) / spec[2]
        const ny = (v - spec[1]) / spec[3]
        const radius = nx * nx + ny * ny
        if (radius < 1.35) velocity *= 0.18 + 0.16 * Math.min(1, radius)
      }

      const ampDx = (u - ampX) * width
      const ampDy = (v - ampY) * height
      const ampRadius = Math.exp(-((ampDx * ampDx + ampDy * ampDy) / (2 * 64 * 64)))
      velocity *= 1 - ampRadius * 0.7
      speeds[index] = Math.max(0.12, Math.min(2.35, velocity))
    }
  }

  return { speeds, dx, dy }
}

function smoothField(source: Float64Array, columns: number, rows: number) {
  const result = new Float64Array(source.length)
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const index = y * columns + x
      let sum = source[index] * 4
      let weight = 4
      if (x > 0) { sum += source[index - 1]; weight += 1 }
      if (x + 1 < columns) { sum += source[index + 1]; weight += 1 }
      if (y > 0) { sum += source[index - columns]; weight += 1 }
      if (y + 1 < rows) { sum += source[index + columns]; weight += 1 }
      result[index] = sum / weight
    }
  }
  return result
}

export function generateLiquidArrivalField(
  width: number,
  height: number,
  seed: number,
  ampX: number,
  ampY: number,
): LiquidArrivalField {
  const columns = Math.max(2, Math.ceil(width / 6) + 1)
  const rows = Math.max(2, Math.ceil(height / 6) + 1)
  const count = columns * rows
  const { speeds, dx, dy } = generateSpeedMap(width, height, columns, rows, seed, ampX, ampY)
  const arrivals = new Float64Array(count)
  arrivals.fill(Number.POSITIVE_INFINITY)
  const accepted = new Uint8Array(count)
  const heap = new MinHeap()
  const sourceCenter = Math.round(0.51 * (columns - 1))
  const sourceY = rows - 1

  // A short, connected seed pool grows into the page as one substance.
  for (let offset = -1; offset <= 1; offset += 1) {
    const x = Math.max(0, Math.min(columns - 1, sourceCenter + offset))
    const index = sourceY * columns + x
    arrivals[index] = 0
    heap.push(index, 0)
  }

  const visitNeighbor = (neighbor: number) => {
    if (neighbor < 0 || accepted[neighbor]) return
    const next = solveUpwindArrival(neighbor, columns, dx, dy, speeds[neighbor], arrivals, accepted)
    if (next < arrivals[neighbor]) {
      arrivals[neighbor] = next
      heap.push(neighbor, next)
    }
  }

  while (heap.size > 0) {
    const node = heap.pop()
    if (accepted[node] || heap.lastValue !== arrivals[node]) continue
    accepted[node] = 1
    const x = node % columns
    visitNeighbor(x > 0 ? node - 1 : -1)
    visitNeighbor(x + 1 < columns ? node + 1 : -1)
    visitNeighbor(node >= columns ? node - columns : -1)
    visitNeighbor(node + columns < count ? node + columns : -1)
  }

  const smoothed = smoothField(arrivals, columns, rows)
  const order = Array.from({ length: count }, (_, index) => index)
  order.sort((left, right) => smoothed[left] - smoothed[right])
  const values = new Float32Array(count)
  const denominator = Math.max(1, count - 1)
  for (let rank = 0; rank < count; rank += 1) values[order[rank]] = rank / denominator

  return {
    columns,
    rows,
    values,
    drops: [],
  }
}
