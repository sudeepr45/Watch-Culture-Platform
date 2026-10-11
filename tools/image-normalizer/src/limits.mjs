import { NormalizerError } from './errors.mjs'

export const LIMITS = Object.freeze({
  inputBytes: 10n * 1024n * 1024n,
  width: 8192n,
  height: 8192n,
  pixels: 10_000_000n,
  memoryBytes: 576n * 1024n * 1024n,
  processMemoryBytes: 768n * 1024n * 1024n,
  memoryPerPixel: 51n,
  memoryOverheadBytes: 64n * 1024n * 1024n,
})

/** @param {number|bigint} bytes */
export function validateInputSize(bytes) {
  let size
  try {
    size = BigInt(bytes)
  } catch {
    throw new NormalizerError('INPUT_ERROR', 'Input size is invalid.')
  }
  if (size <= 0n) throw new NormalizerError('INPUT_ERROR', 'Input file is empty.')
  if (size > LIMITS.inputBytes) {
    throw new NormalizerError('INPUT_TOO_LARGE', 'Input exceeds the 10 MiB compressed-file limit.')
  }
  return size
}

/** @param {number|bigint} width @param {number|bigint} height */
export function validateDimensions(width, height) {
  let w
  let h
  try {
    w = BigInt(width)
    h = BigInt(height)
  } catch {
    throw new NormalizerError('INVALID_DIMENSIONS', 'Image dimensions are invalid.')
  }
  if (w <= 0n || h <= 0n) {
    throw new NormalizerError('INVALID_DIMENSIONS', 'Image dimensions must be positive integers.')
  }
  if (w > LIMITS.width || h > LIMITS.height) {
    throw new NormalizerError('LIMIT_EXCEEDED', 'Image width and height must each be no greater than 8192 pixels.')
  }
  const pixels = w * h
  if (pixels > LIMITS.pixels) {
    throw new NormalizerError('LIMIT_EXCEEDED', 'Image exceeds the 10,000,000-pixel limit.')
  }
  return { width: w, height: h, pixels }
}

/** @param {bigint} pixels @param {bigint} inputBytes */
export function estimateWorkingMemory(pixels, inputBytes) {
  if (pixels < 0n || inputBytes < 0n) {
    throw new NormalizerError('INPUT_ERROR', 'Memory estimate inputs must not be negative.')
  }
  return pixels * LIMITS.memoryPerPixel + LIMITS.memoryOverheadBytes + inputBytes
}

/** @param {bigint} estimatedBytes */
export function validateWorkingMemory(estimatedBytes) {
  if (estimatedBytes < 0n || estimatedBytes > LIMITS.memoryBytes) {
    throw new NormalizerError('LIMIT_EXCEEDED', 'Estimated working memory exceeds the 576 MiB safety ceiling.')
  }
  return estimatedBytes
}

/** Apply dimensions and estimated-memory guards without unsafe integer arithmetic. */
export function validateResourceLimits({ width, height, inputBytes }) {
  const size = validateInputSize(inputBytes)
  const dimensions = validateDimensions(width, height)
  const estimatedMemoryBytes = validateWorkingMemory(
    estimateWorkingMemory(dimensions.pixels, size)
  )
  return { ...dimensions, inputBytes: size, estimatedMemoryBytes }
}
