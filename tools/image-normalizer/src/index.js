import { mkdtemp, readFile, realpath, rm, stat, writeFile, rename } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  LIMITS,
  MiB,
  NormalizationError,
  checkInputByteLength,
  checkedMultiply,
  orientedDimensions,
  validateDimensions,
} from './limits.js'
import { inspectJpegMarkers } from './jpeg-metadata.js'
import { getVipsRuntime, runVips } from './vips.js'

function detectFormat(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png'
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  throw new NormalizationError('UNSUPPORTED_FORMAT', 'Input content is not JPEG, PNG, or WebP.')
}

function parseHeader(text) {
  const lines = text.split(/\r?\n/)
  const firstLine = lines.find((line) => /:\s*\d+x\d+\s/.test(line))
  const dimensions = firstLine?.match(/:\s*(\d+)x(\d+)\s/)
  const values = new Map()
  for (const line of lines) {
    const separator = line.indexOf(':')
    if (separator > 0) values.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim())
  }
  if (!dimensions) {
    throw new NormalizationError('HEADER_READ_FAILED', 'Image header did not contain trustworthy dimensions.', {
      diagnostic: text.trim().slice(-1500),
    })
  }
  const width = Number(dimensions[1])
  const height = Number(dimensions[2])
  const bands = Number(values.get('bands'))
  const interpretation = values.get('interpretation')?.toLowerCase()
  const loader = values.get('vips-loader')
  const orientationMatch = text.match(/exif-ifd0-Orientation:\s*(\d+)/i)
  const orientation = orientationMatch ? Number(orientationMatch[1]) : 1
  const hasIcc = /^icc-profile-data:\s*\d+ bytes of binary data$/im.test(text)
  return { width, height, bands, interpretation, loader, orientation, hasIcc, raw: text }
}

async function loadBytes(input) {
  if (typeof input === 'string' || input instanceof URL) {
    const inputPath = input instanceof URL ? fileURLToPath(input) : input
    let fileStat
    try {
      fileStat = await stat(inputPath)
    } catch (error) {
      throw new NormalizationError('INVALID_INPUT', `Unable to read image input: ${error.message}`)
    }
    if (!fileStat.isFile()) throw new NormalizationError('INVALID_INPUT', 'Image path must refer to a regular file.')
    checkInputByteLength(fileStat.size)
    let bytes
    try {
      bytes = await readFile(inputPath)
    } catch (error) {
      throw new NormalizationError('INVALID_INPUT', `Unable to read image input: ${error.message}`)
    }
    checkInputByteLength(bytes.length)
    if (bytes.length !== fileStat.size) {
      throw new NormalizationError('INVALID_INPUT', 'Image input changed while it was being read.')
    }
    return { bytes, sourcePath: inputPath }
  }

  if (!(Buffer.isBuffer(input) || input instanceof Uint8Array)) {
    throw new NormalizationError('INVALID_INPUT', 'Input must be a filesystem path, Buffer, or Uint8Array.')
  }
  checkInputByteLength(input.byteLength)
  return { bytes: Buffer.from(input), sourcePath: null }
}

function stageForFormat(format) {
  return { jpeg: 'jpg', png: 'png', webp: 'webp' }[format]
}

async function runHeader(runtime, inputPath, invoke = runVips) {
  let result
  try {
    result = await invoke(runtime, 'header', ['-a', inputPath])
  } catch (error) {
    throw new NormalizationError('HEADER_READ_FAILED', 'Image header could not be read.', { diagnostic: error.message })
  }
  return parseHeader(`${result.stdout}\n${result.stderr}`)
}

function isSamePath(left, right) {
  const normalizedLeft = path.resolve(left)
  const normalizedRight = path.resolve(right)
  return process.platform === 'win32'
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight
}

async function writeVerifiedOutput(bytes, outputPath, sourcePath) {
  const targetPath = path.resolve(outputPath)
  if (sourcePath) {
    try {
      if (isSamePath(await realpath(sourcePath), await realpath(targetPath))) {
        throw new NormalizationError('INVALID_INPUT', 'Output path must not overwrite the source image.')
      }
    } catch (error) {
      if (error instanceof NormalizationError) throw error
      if (error.code !== 'ENOENT') throw new NormalizationError('OUTPUT_WRITE_FAILED', `Unable to validate output path: ${error.message}`)
    }
  }

  const outputDirectory = path.dirname(targetPath)
  const temporaryOutput = path.join(outputDirectory, `.mojean-image-${randomUUID()}.tmp`)
  try {
    await writeFile(temporaryOutput, bytes, { flag: 'wx' })
    await rename(temporaryOutput, targetPath)
  } catch (error) {
    await rm(temporaryOutput, { force: true }).catch(() => {})
    throw new NormalizationError('OUTPUT_WRITE_FAILED', `Unable to write verified image output: ${error.message}`)
  }
}

function assertOutputMetadata(header, expected) {
  if (header.width !== expected.width || header.height !== expected.height) {
    throw new NormalizationError('OUTPUT_VERIFICATION_FAILED', 'Encoded JPEG dimensions do not match the normalized image.')
  }
  if (header.loader !== 'jpegload' || header.interpretation !== 'srgb' || !header.hasIcc) {
    throw new NormalizationError('OUTPUT_VERIFICATION_FAILED', 'Output is not a profiled sRGB JPEG.', {
      loader: header.loader,
      interpretation: header.interpretation,
      hasIcc: header.hasIcc,
    })
  }
  if (header.bands !== 3) {
    throw new NormalizationError('OUTPUT_VERIFICATION_FAILED', 'Output JPEG must contain three opaque RGB bands.')
  }
  if (/^(exif-data|xmp-data|iptc-data|gainmap-data|orientation):/im.test(header.raw)) {
    throw new NormalizationError('OUTPUT_VERIFICATION_FAILED', 'Output retained source orientation or non-sRGB/HDR metadata.')
  }
}

/**
 * Convert a local image or its bytes into a verified, upright, SDR sRGB JPEG.
 * The source is read only. No output file is created unless outputPath is supplied.
 */
export async function normalizeImage(input, options = {}) {
  const { bytes, sourcePath } = await loadBytes(input)
  const format = detectFormat(bytes)
  let runtime
  try {
    runtime = options.runtime || getVipsRuntime(options.env)
  } catch (error) {
    if (error instanceof NormalizationError) throw error
    throw new NormalizationError('NORMALIZATION_FAILED', error.message)
  }

  if (options.outputPath && sourcePath && isSamePath(sourcePath, options.outputPath)) {
    throw new NormalizationError('INVALID_INPUT', 'Output path must not overwrite the source image.')
  }

  let temporaryDirectory
  try {
    temporaryDirectory = await mkdtemp(path.join(options.tempRoot || os.tmpdir(), 'mojean-normalizer-'))
  } catch (error) {
    throw new NormalizationError('NORMALIZATION_FAILED', `Unable to create isolated temporary workspace: ${error.message}`)
  }

  try {
    const inputPath = path.join(temporaryDirectory, `input.${stageForFormat(format)}`)
    await writeFile(inputPath, bytes, { flag: 'wx' })

    const invoke = options.invokeVips || runVips
    const header = await runHeader(runtime, inputPath, invoke)
    if (!Number.isSafeInteger(header.bands) || header.bands <= 0 || !header.loader) {
      throw new NormalizationError('HEADER_READ_FAILED', 'Image header is missing required format or channel information.')
    }
    if (format === 'jpeg' && !['jpegload', 'uhdrload'].includes(header.loader)) {
      throw new NormalizationError('HEADER_READ_FAILED', 'JPEG content was not recognized by the JPEG or Ultra HDR decoder.', { loader: header.loader })
    }
    if (format === 'png' && header.loader !== 'pngload') {
      throw new NormalizationError('HEADER_READ_FAILED', 'PNG content was not recognized by the PNG decoder.', { loader: header.loader })
    }
    if (format === 'webp' && header.loader !== 'webpload') {
      throw new NormalizationError('HEADER_READ_FAILED', 'WebP content was not recognized by the WebP decoder.', { loader: header.loader })
    }

    const resources = validateDimensions(header.width, header.height, bytes.length)
    const isUltraHdr = header.loader === 'uhdrload'
    const expected = orientedDimensions(header.width, header.height, header.orientation)
    const decodedPath = path.join(temporaryDirectory, 'decoded.v')
    const orientedPath = path.join(temporaryDirectory, 'oriented.v')
    const colorPath = path.join(temporaryDirectory, 'srgb.v')
    const opaquePath = path.join(temporaryDirectory, 'opaque.v')
    const outputPath = path.join(temporaryDirectory, 'normalized.jpg')

    const loader = isUltraHdr ? 'uhdrload' : ({ jpeg: 'jpegload', png: 'pngload', webp: 'webpload' }[format])
    try {
      await invoke(runtime, loader, [inputPath, decodedPath, '--fail-on', 'warning'])
    } catch (error) {
      throw new NormalizationError('DECODE_FAILED', 'Image pixels could not be decoded.', { diagnostic: error.message })
    }

    try {
      await invoke(runtime, 'autorot', [decodedPath, orientedPath])
    } catch (error) {
      throw new NormalizationError('NORMALIZATION_FAILED', 'Image orientation could not be normalized.', { diagnostic: error.message })
    }

    try {
      if (header.hasIcc) {
        await invoke(runtime, 'icc_transform', [orientedPath, colorPath, runtime.sRGBProfile, '--embedded', '--intent', 'perceptual'])
      } else if (header.interpretation === 'srgb') {
        await invoke(runtime, 'copy', [orientedPath, colorPath, '--interpretation', 'srgb'])
      } else if (['b-w', 'grey16'].includes(header.interpretation)) {
        await invoke(runtime, 'colourspace', [orientedPath, colorPath, 'srgb'])
      } else {
        throw new NormalizationError('NORMALIZATION_FAILED', 'Input color space has no embedded ICC profile and cannot be safely interpreted.', {
          interpretation: header.interpretation,
        })
      }

      const colorHeader = await runHeader(runtime, colorPath, invoke)
      const alphaBands = Number(colorHeader.bands) === 2 || Number(colorHeader.bands) === 4
      if (alphaBands) {
        await invoke(runtime, 'flatten', [colorPath, opaquePath, '--background', '255,255,255'])
      } else if (Number(colorHeader.bands) === 1) {
        await invoke(runtime, 'colourspace', [colorPath, opaquePath, 'srgb'])
      } else if (Number(colorHeader.bands) === 3) {
        await invoke(runtime, 'copy', [colorPath, opaquePath, '--interpretation', 'srgb'])
      } else {
        throw new NormalizationError('NORMALIZATION_FAILED', 'Decoded image cannot be represented as opaque RGB.')
      }
    } catch (error) {
      if (error instanceof NormalizationError) throw error
      throw new NormalizationError('NORMALIZATION_FAILED', 'Image color or alpha normalization failed.', { diagnostic: error.message })
    }

    try {
      await invoke(runtime, 'jpegsave', [opaquePath, outputPath,
        '--Q', '92', '--optimize-coding', '--keep', 'icc', '--profile', runtime.sRGBProfile])
    } catch (error) {
      throw new NormalizationError('ENCODE_FAILED', 'Normalized pixels could not be encoded as JPEG.', { diagnostic: error.message })
    }

    let outputBytes
    let outputHeader
    try {
      outputBytes = await readFile(outputPath)
      outputHeader = await runHeader(runtime, outputPath, invoke)
      assertOutputMetadata(outputHeader, expected)
      const markers = inspectJpegMarkers(outputBytes)
      if (!markers.validStart || !markers.hasEoi || markers.hasMpf || markers.hasGainMapMetadata) {
        throw new NormalizationError('OUTPUT_VERIFICATION_FAILED', 'JPEG marker verification failed or HDR gain-map structure remains.', markers)
      }
      await invoke(runtime, 'avg', [outputPath])
    } catch (error) {
      if (error instanceof NormalizationError) throw error
      throw new NormalizationError('OUTPUT_VERIFICATION_FAILED', 'Encoded JPEG failed independent reopen or full-decode verification.', {
        diagnostic: error.message,
      })
    }

    if (options.outputPath) await writeVerifiedOutput(outputBytes, options.outputPath, sourcePath)

    return {
      ok: true,
      bytes: outputBytes,
      format: 'jpeg',
      colorSpace: 'sRGB',
      dynamicRange: 'SDR',
      width: outputHeader.width,
      height: outputHeader.height,
      source: {
        format,
        width: header.width,
        height: header.height,
        orientation: header.orientation,
        ultraHdr: isUltraHdr,
      },
      resourceEstimate: {
        pixels: resources.pixels,
        estimatedWorkingBytes: resources.estimatedWorkingBytes,
        maximumEstimatedWorkingBytes: LIMITS.maxEstimatedWorkingBytes,
        processMemoryLimitBytes: runtime.processLimitBytes || LIMITS.maxProcessBytes,
      },
    }
  } catch (error) {
    if (error instanceof NormalizationError) throw error
    throw new NormalizationError('NORMALIZATION_FAILED', error.message)
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {})
  }
}

export { LIMITS, MiB, NormalizationError, checkInputByteLength, checkedMultiply, validateDimensions }
