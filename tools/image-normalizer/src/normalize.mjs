import { mkdtemp, link, lstat, open, realpath, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { NormalizerError } from './errors.mjs'
import { inspectImageFile, inspectJpegHeaderBuffer } from './inspect.mjs'
import { validateDimensions, validateWorkingMemory } from './limits.mjs'
import { inspectWithVips, resolveVipsRuntime, runTool } from './runtime.mjs'

const OUTPUT_HEADER_BYTES = 1024 * 1024

async function readJpegOutputHeader(filePath) {
  const handle = await open(filePath, 'r')
  try {
    const fileStats = await handle.stat()
    const buffer = Buffer.alloc(Math.min(fileStats.size, OUTPUT_HEADER_BYTES))
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    return inspectJpegHeaderBuffer(buffer.subarray(0, bytesRead))
  } finally {
    await handle.close()
  }
}

function samePath(first, second) {
  const a = path.resolve(first)
  const b = path.resolve(second)
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}

async function requireAbsentOutput(outputPath) {
  try {
    await lstat(outputPath)
    throw new NormalizerError('OUTPUT_ERROR', 'Output already exists; the normalizer never overwrites files.')
  } catch (error) {
    if (error instanceof NormalizerError) throw error
    if (error?.code !== 'ENOENT') throw new NormalizerError('OUTPUT_ERROR', 'Output path cannot be checked safely.', error)
  }
}

/**
 * Inspect, preflight, normalize, encode, and verify an image as a new SDR sRGB JPEG.
 * The source path is never modified and existing output paths are never replaced.
 */
export async function normalizeImage({ inputPath, outputPath, vipsPath }) {
  const input = await inspectImageFile(inputPath, { includeBuffer: true })
  if (typeof outputPath !== 'string' || !outputPath.trim()) {
    throw new NormalizerError('OUTPUT_ERROR', 'An explicit output path is required.')
  }
  const resolvedInput = await realpath(inputPath).catch((error) => {
    throw new NormalizerError('INPUT_ERROR', 'Input file path could not be resolved.', error)
  })
  const resolvedOutput = path.resolve(outputPath)
  if (!/\.jpe?g$/i.test(resolvedOutput)) throw new NormalizerError('OUTPUT_ERROR', 'Output path must end in .jpg or .jpeg.')
  const outputDirectory = path.dirname(resolvedOutput)
  const realOutputDirectory = await realpath(outputDirectory).catch((error) => {
    throw new NormalizerError('OUTPUT_ERROR', 'Output directory must exist and be accessible.', error)
  })
  const finalPath = path.join(realOutputDirectory, path.basename(resolvedOutput))
  if (samePath(resolvedInput, finalPath)) throw new NormalizerError('OUTPUT_ERROR', 'Output path must be different from the source image.')
  await requireAbsentOutput(finalPath)

  let temporaryDirectory
  try {
    temporaryDirectory = await mkdtemp(path.join(realOutputDirectory, '.mojean-image-normalizer-'))
    const sourceExtension = input.format === 'jpeg' ? '.jpg' : `.${input.format}`
    const snapshotPath = path.join(temporaryDirectory, `validated-input${sourceExtension}`)
    await writeFile(snapshotPath, input.compressedBytes, { flag: 'wx' })

    // Runtime discovery and all libvips work happen only after compressed-size,
    // format, dimensions, pixel-count, and estimated-memory checks have passed.
    // libvips reads this exact validated snapshot to avoid a source-file race.
    const runtime = await resolveVipsRuntime(vipsPath ?? process.env.MOJEAN_VIPS_PATH)
    const sourceHeader = await inspectWithVips(runtime, snapshotPath)
    if (sourceHeader.width !== input.width || sourceHeader.height !== input.height) {
      throw new NormalizerError('INVALID_HEADER', 'Header dimensions disagree with libvips; input rejected.')
    }
    if (sourceHeader.interpretation.toLowerCase() === 'cmyk' && !sourceHeader.hasIccProfile) {
      throw new NormalizerError('INVALID_HEADER', 'CMYK input has no embedded ICC profile for safe color conversion.')
    }

    const isUltraHdr = input.isUltraHdr || sourceHeader.loader === 'uhdrload'
    if (isUltraHdr && (sourceHeader.loader !== 'uhdrload' || !sourceHeader.hasGainmap)) {
      throw new NormalizerError('UNSUPPORTED_FORMAT', 'Ultra HDR markers were found, but the configured libvips runtime could not decode the gain-map image.')
    }
    if (sourceHeader.bands < 1 || sourceHeader.bands > 4) {
      throw new NormalizerError('UNSUPPORTED_FORMAT', 'Image has an unsupported number of color channels.')
    }

    const orientedPath = path.join(temporaryDirectory, 'oriented.v')
    const srgbPath = path.join(temporaryDirectory, 'srgb.v')
    const encodedPath = path.join(temporaryDirectory, 'verified.jpg')

    await runTool(runtime, runtime.vipsPath, ['autorot', snapshotPath, orientedPath])
    const orientedHeader = await inspectWithVips(runtime, orientedPath)
    const orientedLimits = validateDimensions(orientedHeader.width, orientedHeader.height)
    const estimatedMemory = input.pixels * 51n + 64n * 1024n * 1024n + input.inputBytes
    validateWorkingMemory(estimatedMemory)
    if (orientedLimits.pixels !== input.pixels) {
      throw new NormalizerError('VERIFICATION_FAILED', 'Orientation normalization unexpectedly changed the pixel count.')
    }

    // `uhdrload` decodes an Ultra HDR JPEG into its real SDR base image and
    // gain-map metadata. The final JPEG keeps only the converted ICC profile,
    // so no Ultra HDR/gain-map payload survives in the SDR output.
    await runTool(runtime, runtime.vipsPath, [
      'icc_transform', orientedPath, srgbPath, 'srgb',
      '--embedded', '--input-profile', 'srgb',
    ])
    const srgbHeader = await inspectWithVips(runtime, srgbPath)
    let jpegInputPath = srgbPath
    if (srgbHeader.bands === 4) {
      jpegInputPath = path.join(temporaryDirectory, 'flattened.v')
      await runTool(runtime, runtime.vipsPath, [
        'flatten', srgbPath, jpegInputPath, '--background', '255,255,255',
      ])
    } else if (srgbHeader.bands !== 3) {
      throw new NormalizerError('UNSUPPORTED_FORMAT', 'Color conversion did not produce an RGB image suitable for JPEG output.')
    }
    await runTool(runtime, runtime.vipsPath, [
      'jpegsave', jpegInputPath, encodedPath,
      '--Q', '92', '--optimize-coding', '--keep', 'icc',
    ])

    const encodedStats = await stat(encodedPath).catch((error) => {
      throw new NormalizerError('VERIFICATION_FAILED', 'JPEG encoder did not produce an output file.', error)
    })
    if (encodedStats.size < 4) throw new NormalizerError('VERIFICATION_FAILED', 'JPEG output is empty or incomplete.')

    const encodedHeader = await readJpegOutputHeader(encodedPath)
    const outputHeader = await inspectWithVips(runtime, encodedPath)
    if (encodedHeader.format !== 'jpeg' || outputHeader.loader !== 'jpegload') {
      throw new NormalizerError('VERIFICATION_FAILED', 'Output is not an independently readable standard JPEG.')
    }
    if (encodedHeader.width !== orientedHeader.width || encodedHeader.height !== orientedHeader.height || outputHeader.width !== orientedHeader.width || outputHeader.height !== orientedHeader.height) {
      throw new NormalizerError('VERIFICATION_FAILED', 'Output dimensions do not match the orientation-normalized image.')
    }
    if (outputHeader.interpretation.toLowerCase() !== 'srgb' || !outputHeader.hasIccProfile) {
      throw new NormalizerError('VERIFICATION_FAILED', 'Output does not contain a verified sRGB color profile.')
    }
    if (encodedHeader.isUltraHdr || encodedHeader.hasExif || outputHeader.hasGainmap || outputHeader.hasOrientationTag) {
      throw new NormalizerError('VERIFICATION_FAILED', 'Output retained orientation, EXIF, or Ultra HDR metadata.')
    }
    const { stdout: averageOutput } = await runTool(runtime, runtime.vipsPath, ['avg', encodedPath])
    if (!Number.isFinite(Number(averageOutput.trim()))) {
      throw new NormalizerError('VERIFICATION_FAILED', 'Output could not be fully decoded for independent verification.')
    }

    // Linking is atomic and exclusive on the same volume: verified output is
    // published only after every check succeeds, and an existing file is safe.
    await link(encodedPath, finalPath).catch((error) => {
      if (error?.code === 'EEXIST') throw new NormalizerError('OUTPUT_ERROR', 'Output already exists; the normalizer never overwrites files.', error)
      throw new NormalizerError('OUTPUT_ERROR', 'Verified output could not be placed at the requested path.', error)
    })

    return {
      input: {
        format: input.format,
        width: input.width,
        height: input.height,
        ultraHdr: isUltraHdr,
        iccProfilePresent: sourceHeader.hasIccProfile,
      },
      output: {
        format: 'jpeg',
        width: outputHeader.width,
        height: outputHeader.height,
        colorSpace: 'sRGB',
        dynamicRange: 'SDR',
        orientationNormalized: true,
        ultraHdr: false,
        independentlyDecoded: true,
        path: finalPath,
        bytes: encodedStats.size,
      },
      runtime: runtime.version,
      resourceEstimateBytes: input.estimatedMemoryBytes.toString(),
    }
  } finally {
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {})
  }
}
