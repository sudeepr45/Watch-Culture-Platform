import { open, stat } from 'node:fs/promises'
import { NormalizerError } from './errors.mjs'
import { validateResourceLimits } from './limits.mjs'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const JPEG_SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])

function containsUltraHdrMarker(buffer) {
  return [
    'hdr-gain-map', 'HDR-GAIN-MAP', 'hdrgm:', 'HDRGM:',
    'iso 21496', 'ISO 21496', 'urn:iso:std:iso:ts:21496', 'gainmapmax', 'GainMapMax',
  ].some((marker) => buffer.includes(Buffer.from(marker, 'ascii')))
}

function parseJpeg(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new NormalizerError('INVALID_HEADER', 'Input does not contain a readable JPEG header.')
  }
  let offset = 2
  let dimensions = null
  let hasIccProfile = false
  let hasExif = false
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      throw new NormalizerError('INVALID_HEADER', 'JPEG header contains an invalid marker sequence.')
    }
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1
    if (offset >= buffer.length) break
    const marker = buffer[offset++]
    if (marker === 0xd9 || marker === 0xda) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 2 > buffer.length) {
      throw new NormalizerError('INVALID_HEADER', 'JPEG segment length is incomplete.')
    }
    const segmentLength = buffer.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      throw new NormalizerError('INVALID_HEADER', 'JPEG segment is truncated or malformed.')
    }
    const dataStart = offset + 2
    const dataEnd = offset + segmentLength
    if (JPEG_SOF.has(marker)) {
      if (segmentLength < 8) throw new NormalizerError('INVALID_HEADER', 'JPEG frame header is too short.')
      dimensions = {
        height: buffer.readUInt16BE(dataStart + 1),
        width: buffer.readUInt16BE(dataStart + 3),
      }
    }
    if (marker === 0xe1 && buffer.subarray(dataStart, dataStart + 6).equals(Buffer.from('Exif\0\0', 'latin1'))) hasExif = true
    if (marker === 0xe2 && buffer.subarray(dataStart, dataStart + 12).toString('latin1').startsWith('ICC_PROFILE\0')) hasIccProfile = true
    offset = dataEnd
  }
  if (!dimensions) throw new NormalizerError('INVALID_HEADER', 'JPEG frame dimensions were not found before image data.')
  return {
    format: 'jpeg',
    ...dimensions,
    isUltraHdr: containsUltraHdrMarker(buffer),
    hasIccProfile,
    hasExif,
    isAnimated: false,
  }
}

function readU24LE(buffer, offset) {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16)
}

function parsePng(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new NormalizerError('INVALID_HEADER', 'Input does not contain a readable PNG header.')
  }
  if (buffer.readUInt32BE(8) !== 13 || buffer.toString('ascii', 12, 16) !== 'IHDR') {
    throw new NormalizerError('INVALID_HEADER', 'PNG does not begin with a valid IHDR chunk.')
  }
  const width = buffer.readUInt32BE(16)
  const height = buffer.readUInt32BE(20)
  let hasIccProfile = false
  let isAnimated = false
  let offset = 8
  while (offset + 12 <= buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset)
    const chunkType = buffer.toString('ascii', offset + 4, offset + 8)
    const end = BigInt(offset) + 12n + BigInt(chunkLength)
    if (end > BigInt(buffer.length)) break
    if (chunkType === 'iCCP') hasIccProfile = true
    if (chunkType === 'acTL') isAnimated = true
    offset = Number(end)
    if (chunkType === 'IDAT' || chunkType === 'IEND') break
  }
  return { format: 'png', width, height, isUltraHdr: false, hasIccProfile, hasExif: false, isAnimated }
}

function parseWebp(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new NormalizerError('INVALID_HEADER', 'Input does not contain a readable WebP header.')
  }
  const riffEnd = BigInt(buffer.readUInt32LE(4)) + 8n
  if (riffEnd > BigInt(buffer.length) || riffEnd < 12n) {
    throw new NormalizerError('INVALID_HEADER', 'WebP RIFF container is truncated or malformed.')
  }
  let width = 0
  let height = 0
  let hasIccProfile = false
  let isAnimated = false
  let offset = 12
  while (BigInt(offset) + 8n <= riffEnd) {
    const chunkType = buffer.toString('ascii', offset, offset + 4)
    const chunkLength = buffer.readUInt32LE(offset + 4)
    const dataStart = offset + 8
    const dataEnd = BigInt(dataStart) + BigInt(chunkLength)
    if (dataEnd > riffEnd || dataEnd > BigInt(buffer.length)) {
      throw new NormalizerError('INVALID_HEADER', 'WebP chunk is truncated or malformed.')
    }
    if (chunkType === 'VP8X' && chunkLength >= 10) {
      const flags = buffer[dataStart]
      isAnimated = (flags & 0x02) !== 0
      width = readU24LE(buffer, dataStart + 4) + 1
      height = readU24LE(buffer, dataStart + 7) + 1
    } else if (chunkType === 'ICCP') {
      hasIccProfile = true
    } else if (chunkType === 'VP8 ' && chunkLength >= 10 && buffer[dataStart + 3] === 0x9d && buffer[dataStart + 4] === 0x01 && buffer[dataStart + 5] === 0x2a) {
      width = buffer.readUInt16LE(dataStart + 6) & 0x3fff
      height = buffer.readUInt16LE(dataStart + 8) & 0x3fff
    } else if (chunkType === 'VP8L' && chunkLength >= 5 && buffer[dataStart] === 0x2f) {
      const b1 = buffer[dataStart + 1]
      const b2 = buffer[dataStart + 2]
      const b3 = buffer[dataStart + 3]
      const b4 = buffer[dataStart + 4]
      width = 1 + b1 + ((b2 & 0x3f) << 8)
      height = 1 + ((b2 >> 6) & 0x03) + (b3 << 2) + ((b4 & 0x0f) << 10)
    }
    const paddedLength = BigInt(chunkLength) + BigInt(chunkLength & 1)
    offset = Number(BigInt(dataStart) + paddedLength)
    if (width > 0 && height > 0 && (chunkType === 'VP8 ' || chunkType === 'VP8L')) break
  }
  if (!width || !height) throw new NormalizerError('INVALID_HEADER', 'WebP image dimensions were not found in the container header.')
  return { format: 'webp', width, height, isUltraHdr: false, hasIccProfile, hasExif: false, isAnimated }
}

/** Detect the image format and read dimensions from the bounded compressed buffer. */
export function readImageHeader(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new NormalizerError('INPUT_ERROR', 'Input file is empty or unreadable.')
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return parseJpeg(buffer)
  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return parsePng(buffer)
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return parseWebp(buffer)
  throw new NormalizerError('UNSUPPORTED_FORMAT', 'Supported inputs are JPEG, Ultra HDR JPEG, PNG, and WebP.')
}

/** Apply size, dimension, pixel, and estimated-memory limits to parsed headers. */
export function inspectImageBuffer(buffer) {
  const header = readImageHeader(buffer)

  if (header.isAnimated) throw new NormalizerError('UNSUPPORTED_FORMAT', 'Animated PNG and WebP inputs are not supported.')
  const limits = validateResourceLimits({ width: header.width, height: header.height, inputBytes: buffer.length })
  return {
    ...header,
    width: Number(limits.width),
    height: Number(limits.height),
    pixels: limits.pixels,
    inputBytes: limits.inputBytes,
    estimatedMemoryBytes: limits.estimatedMemoryBytes,
  }
}

/** Parse only a JPEG's bounded pre-scan header, without applying input-size policy. */
export function inspectJpegHeaderBuffer(buffer) {
  const header = parseJpeg(buffer)
  const dimensions = validateResourceLimits({ width: header.width, height: header.height, inputBytes: 1 })
  return { ...header, width: Number(dimensions.width), height: Number(dimensions.height) }
}

/** Validate compressed size before reading its bounded header and metadata bytes. */
export async function inspectImageFile(inputPath, { includeBuffer = false } = {}) {
  if (typeof inputPath !== 'string' || !inputPath.trim()) throw new NormalizerError('INPUT_ERROR', 'An input file path is required.')
  let fileStats
  try {
    fileStats = await stat(inputPath)
  } catch (error) {
    throw new NormalizerError('INPUT_ERROR', 'Input file could not be read.', error)
  }
  if (!fileStats.isFile()) throw new NormalizerError('INPUT_ERROR', 'Input path must refer to a regular file.')
  validateResourceLimits({ width: 1, height: 1, inputBytes: fileStats.size })

  const handle = await open(inputPath, 'r').catch((error) => {
    throw new NormalizerError('INPUT_ERROR', 'Input file could not be opened.', error)
  })
  try {
    const currentStats = await handle.stat()
    if (currentStats.size !== fileStats.size) throw new NormalizerError('INPUT_ERROR', 'Input file changed during inspection.')
    const buffer = Buffer.alloc(Number(fileStats.size))
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    if (bytesRead !== buffer.length) throw new NormalizerError('INPUT_ERROR', 'Input file could not be read completely.')
    const inspection = inspectImageBuffer(buffer)
    return includeBuffer ? { ...inspection, compressedBytes: buffer } : inspection
  } finally {
    await handle.close()
  }
}
