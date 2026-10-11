export const MiB = 1024 * 1024

export const LIMITS = Object.freeze({
  maxFileBytes: 10 * MiB,
  maxWidth: 8192,
  maxHeight: 8192,
  maxPixels: 10_000_000,
  estimatedBytesPerPixel: 51,
  fixedMemoryOverheadBytes: 64 * MiB,
  maxEstimatedWorkingBytes: 576 * MiB,
  maxProcessBytes: 768 * MiB,
})

export class NormalizationError extends Error {
  constructor(category, message, details = {}) {
    super(message)
    this.name = 'NormalizationError'
    this.category = category
    this.details = details
  }
}

export function checkInputByteLength(byteLength, limits = LIMITS) {
  if (!Number.isSafeInteger(byteLength) || byteLength <= 0) {
    throw new NormalizationError('INVALID_INPUT', 'Image input is empty or has an invalid byte length.')
  }

  if (byteLength > limits.maxFileBytes) {
    throw new NormalizationError('FILE_TOO_LARGE', 'Image input exceeds the compressed file size limit.', {
      byteLength,
      maximumBytes: limits.maxFileBytes,
    })
  }
}

export function checkedMultiply(a, b) {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0) {
    throw new NormalizationError('DIMENSIONS_INVALID', 'Image dimensions are not safe non-negative integers.')
  }
  if (b !== 0 && a > Math.floor(Number.MAX_SAFE_INTEGER / b)) {
    throw new NormalizationError('MEMORY_LIMIT_EXCEEDED', 'Image resource calculation overflowed.')
  }
  return a * b
}

export function validateDimensions(width, height, inputBytes, limits = LIMITS) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new NormalizationError('DIMENSIONS_INVALID', 'Image header contains missing or invalid dimensions.', {
      width,
      height,
    })
  }

  if (width > limits.maxWidth || height > limits.maxHeight) {
    throw new NormalizationError('DIMENSIONS_TOO_LARGE', 'Image dimensions exceed the configured side limit.', {
      width,
      height,
      maximumWidth: limits.maxWidth,
      maximumHeight: limits.maxHeight,
    })
  }

  const pixels = checkedMultiply(width, height)
  if (pixels > limits.maxPixels) {
    throw new NormalizationError('PIXEL_COUNT_TOO_LARGE', 'Image pixel count exceeds the configured limit.', {
      width,
      height,
      pixels,
      maximumPixels: limits.maxPixels,
    })
  }

  const estimatedBigInt = BigInt(pixels) * BigInt(limits.estimatedBytesPerPixel)
    + BigInt(limits.fixedMemoryOverheadBytes)
    + BigInt(inputBytes)

  if (estimatedBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new NormalizationError('MEMORY_LIMIT_EXCEEDED', 'Image memory estimate overflowed safe integer range.')
  }

  const estimatedWorkingBytes = Number(estimatedBigInt)
  if (estimatedWorkingBytes > limits.maxEstimatedWorkingBytes) {
    throw new NormalizationError('MEMORY_LIMIT_EXCEEDED', 'Image exceeds the estimated working memory limit.', {
      estimatedWorkingBytes,
      maximumBytes: limits.maxEstimatedWorkingBytes,
    })
  }

  return { width, height, pixels, estimatedWorkingBytes }
}

export function orientedDimensions(width, height, orientation) {
  if ([5, 6, 7, 8].includes(orientation)) return { width: height, height: width }
  return { width, height }
}
