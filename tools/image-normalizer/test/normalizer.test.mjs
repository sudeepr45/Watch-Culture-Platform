import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { NormalizerError } from '../src/errors.mjs'
import { inspectImageBuffer, inspectImageFile, readImageHeader } from '../src/inspect.mjs'
import {
  LIMITS,
  estimateWorkingMemory,
  validateDimensions,
  validateInputSize,
  validateResourceLimits,
  validateWorkingMemory,
} from '../src/limits.mjs'
import { normalizeImage } from '../src/normalize.mjs'
import { inspectWithVips, resolveVipsRuntime, runTool } from '../src/runtime.mjs'

const MIB = 1024n * 1024n
const fixturesDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const f91w = process.env.MOJEAN_NORM_FIXTURE_F91W
const ordinaryJpeg = process.env.MOJEAN_NORM_FIXTURE_JPEG
const pngFixture = process.env.MOJEAN_NORM_FIXTURE_PNG
const oversizedDimensions = process.env.MOJEAN_NORM_FIXTURE_OVERSIZED_DIMENSIONS
const oversizedCompressed = process.env.MOJEAN_NORM_FIXTURE_OVERSIZED_COMPRESSED
const corrupt = process.env.MOJEAN_NORM_FIXTURE_CORRUPT
const malformed = process.env.MOJEAN_NORM_FIXTURE_MALFORMED
const vipsPath = process.env.MOJEAN_VIPS_PATH
const webpFixture = process.env.MOJEAN_NORM_FIXTURE_WEBP ?? path.join(fixturesDirectory, 'webp-decoder-control.webp')
const rotatedJpeg = process.env.MOJEAN_NORM_FIXTURE_ROTATED_JPEG ?? path.join(fixturesDirectory, 'rotated-orientation-6.jpg')
const wideGamutJpeg = process.env.MOJEAN_NORM_FIXTURE_WIDE_GAMUT_JPEG ?? path.join(fixturesDirectory, 'wide-gamut-adobe-rgb.jpg')

function expectCode(action, code) {
  assert.throws(action, (error) => error instanceof NormalizerError && error.code === code)
}

async function readIccProfile(runtime, imagePath) {
  const { stdout } = await runTool(runtime, runtime.headerPath, ['-f', 'icc-profile-data', imagePath])
  const profile = Buffer.from(stdout.trim(), 'base64')
  assert.equal(profile.toString('ascii', 36, 40), 'acsp')
  return profile
}

function readIccTags(profile) {
  const count = profile.readUInt32BE(128)
  const tags = new Map()
  for (let index = 0; index < count; index += 1) {
    const record = 132 + index * 12
    tags.set(profile.toString('ascii', record, record + 4), {
      offset: profile.readUInt32BE(record + 4),
      length: profile.readUInt32BE(record + 8),
    })
  }
  return tags
}

function readIccDescription(profile, tags) {
  const tag = tags.get('desc')
  assert.ok(tag)
  const length = profile.readUInt32BE(tag.offset + 8)
  return profile.toString('ascii', tag.offset + 12, tag.offset + 12 + length - 1)
}

function readIccXyzX(profile, tags, signature) {
  const tag = tags.get(signature)
  assert.ok(tag)
  return profile.readInt32BE(tag.offset + 8) / 65536
}

function inspectJpegMetadataMarkers(bytes) {
  assert.ok(bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8, 'output begins with JPEG SOI')
  const metadata = { exif: false, xmp: false, mpf: false, icc: false, iso21496: false, gainMap: false }
  let offset = 2
  while (offset + 1 < bytes.length) {
    assert.equal(bytes[offset], 0xff, 'JPEG marker sequence is valid before image data')
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.length) break
    const marker = bytes[offset++]
    if (marker === 0xd9 || marker === 0xda) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    assert.ok(offset + 2 <= bytes.length, 'JPEG marker length is present')
    const segmentLength = bytes.readUInt16BE(offset)
    assert.ok(segmentLength >= 2 && offset + segmentLength <= bytes.length, 'JPEG marker segment is complete')
    const payload = bytes.subarray(offset + 2, offset + segmentLength)
    const text = payload.toString('latin1').toLowerCase()
    if (marker === 0xe1 && text.startsWith('exif\0\0')) metadata.exif = true
    if (marker === 0xe1 && text.startsWith('http://ns.adobe.com/xap/1.0/')) metadata.xmp = true
    if (marker === 0xe2 && text.startsWith('mpf\0')) metadata.mpf = true
    if (marker === 0xe2 && text.startsWith('icc_profile\0')) metadata.icc = true
    if (text.includes('21496') || text.includes('iso:std:iso:ts:21496')) metadata.iso21496 = true
    if (text.includes('hdrgm') || text.includes('gainmap')) metadata.gainMap = true
    offset += segmentLength
  }
  assert.ok(bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9, 'output ends with JPEG EOI')
  return metadata
}

test('accepts configured size and dimension boundaries with safe integer arithmetic', () => {
  assert.equal(validateInputSize(LIMITS.inputBytes), LIMITS.inputBytes)
  assert.deepEqual(validateDimensions(2500, 4000), { width: 2500n, height: 4000n, pixels: 10_000_000n })
  assert.equal(validateResourceLimits({ width: 2500, height: 4000, inputBytes: 10n * MIB }).pixels, 10_000_000n)
})

test('rejects empty, oversized, invalid, over-dimension, and over-pixel inputs', () => {
  expectCode(() => validateInputSize(0), 'INPUT_ERROR')
  expectCode(() => validateInputSize(LIMITS.inputBytes + 1n), 'INPUT_TOO_LARGE')
  expectCode(() => validateDimensions(0, 1), 'INVALID_DIMENSIONS')
  expectCode(() => validateDimensions(Number.MAX_SAFE_INTEGER, 2), 'LIMIT_EXCEEDED')
  expectCode(() => validateDimensions(8193, 1), 'LIMIT_EXCEEDED')
  expectCode(() => validateDimensions(8192, 8192), 'LIMIT_EXCEEDED')
})

test('reads the oversized JPEG dimensions from its header before rejecting its pixel count', {
  skip: oversizedDimensions ? false : 'NOT TESTED — FIXTURE UNAVAILABLE',
}, async () => {
  const bytes = await readFile(oversizedDimensions)
  const header = readImageHeader(bytes)
  assert.equal(header.width, 30_000)
  assert.equal(header.height, 30_000)
  assert.throws(() => inspectImageBuffer(bytes), (error) => error instanceof NormalizerError && error.code === 'LIMIT_EXCEEDED')
})

test('enforces the estimate ceiling without overflowing and verifies the configured maximum case', () => {
  const largestCurrentEstimate = estimateWorkingMemory(LIMITS.pixels, LIMITS.inputBytes)
  assert.ok(largestCurrentEstimate < LIMITS.memoryBytes)
  assert.equal(validateWorkingMemory(largestCurrentEstimate), largestCurrentEstimate)
  expectCode(() => validateWorkingMemory(LIMITS.memoryBytes + 1n), 'LIMIT_EXCEEDED')
  assert.equal(estimateWorkingMemory(2n ** 64n, 10n), (2n ** 64n) * 51n + 64n * MIB + 10n)
})

test('reads Ultra HDR F91W header and applies resource limits before decode', {
  skip: f91w && vipsPath ? false : 'NOT TESTED — FIXTURE OR LIBVIPS RUNTIME UNAVAILABLE',
}, async () => {
  const result = await inspectImageFile(f91w)
  assert.equal(result.format, 'jpeg')
  assert.equal(result.isUltraHdr, true)
  assert.equal(result.width, 2420)
  assert.equal(result.height, 3420)
})

test('normalizes the actual F91W Ultra HDR JPEG to verified SDR sRGB JPEG', {
  skip: f91w && vipsPath ? false : 'NOT TESTED — FIXTURE OR LIBVIPS RUNTIME UNAVAILABLE',
}, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-f91w-test-'))
  const outputPath = path.join(directory, 'f91w-sdr.jpg')
  try {
    const sourceHashBefore = createHash('sha256').update(await readFile(f91w)).digest('hex')
    const result = await normalizeImage({ inputPath: f91w, outputPath, vipsPath })
    const sourceHashAfter = createHash('sha256').update(await readFile(f91w)).digest('hex')
    assert.equal(sourceHashAfter, sourceHashBefore)
    assert.equal(result.input.ultraHdr, true)
    assert.deepEqual(result.output, {
      format: 'jpeg', width: 2420, height: 3420, colorSpace: 'sRGB', dynamicRange: 'SDR',
      orientationNormalized: true, ultraHdr: false, independentlyDecoded: true,
      path: outputPath, bytes: (await stat(outputPath)).size,
    })

    const runtime = await resolveVipsRuntime(vipsPath)
    const outputBytes = await readFile(outputPath)
    const parsedOutput = readImageHeader(outputBytes)
    const outputHeader = await inspectWithVips(runtime, outputPath)
    const metadata = inspectJpegMetadataMarkers(outputBytes)
    assert.equal(parsedOutput.format, 'jpeg')
    assert.deepEqual([parsedOutput.width, parsedOutput.height], [2420, 3420])
    assert.equal(parsedOutput.isUltraHdr, false)
    assert.equal(outputHeader.loader, 'jpegload')
    assert.equal(outputHeader.interpretation.toLowerCase(), 'srgb')
    assert.equal(outputHeader.hasIccProfile, true)
    assert.equal(outputHeader.hasGainmap, false)
    assert.equal(outputHeader.hasExif, false)
    assert.equal(outputHeader.hasOrientationTag, false)
    assert.deepEqual(metadata, {
      exif: false, xmp: false, mpf: false, icc: true, iso21496: false, gainMap: false,
    })

    const outputProfile = await readIccProfile(runtime, outputPath)
    const outputTags = readIccTags(outputProfile)
    assert.equal(outputProfile.toString('ascii', 16, 20), 'RGB ')
    assert.ok(Math.abs(readIccXyzX(outputProfile, outputTags, 'rXYZ') - 0.436) < 0.003)
    assert.ok(Math.abs(readIccXyzX(outputProfile, outputTags, 'gXYZ') - 0.385) < 0.003)
    assert.ok(Math.abs(readIccXyzX(outputProfile, outputTags, 'bXYZ') - 0.143) < 0.003)

    const { stdout: averageOutput } = await runTool(runtime, runtime.vipsPath, ['avg', outputPath])
    assert.ok(Number.isFinite(Number(averageOutput.trim())), 'normalized JPEG fully decodes')
    assert.deepEqual(await readdir(directory), ['f91w-sdr.jpg'])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('normalizes an actual ordinary SDR JPEG fixture', {
  skip: ordinaryJpeg && vipsPath ? false : 'NOT TESTED — FIXTURE OR LIBVIPS RUNTIME UNAVAILABLE',
}, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-jpeg-test-'))
  const sourceHashBefore = createHash('sha256').update(await readFile(ordinaryJpeg)).digest('hex')
  try {
    const result = await normalizeImage({ inputPath: ordinaryJpeg, outputPath: path.join(directory, 'control.jpg'), vipsPath })
    assert.equal(result.input.format, 'jpeg')
    assert.equal(result.input.ultraHdr, false)
    assert.equal(result.output.format, 'jpeg')
    assert.equal(result.output.colorSpace, 'sRGB')
    assert.equal(result.output.dynamicRange, 'SDR')
    assert.equal(result.output.independentlyDecoded, true)
    assert.equal(createHash('sha256').update(await readFile(ordinaryJpeg)).digest('hex'), sourceHashBefore)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('normalizes an existing local PNG asset without changing the source', {
  skip: pngFixture && vipsPath ? false : 'NOT TESTED — FIXTURE OR LIBVIPS RUNTIME UNAVAILABLE',
}, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-png-test-'))
  const pngInput = await inspectImageFile(pngFixture)
  const sourceHashBefore = createHash('sha256').update(await readFile(pngFixture)).digest('hex')
  try {
    const result = await normalizeImage({ inputPath: pngFixture, outputPath: path.join(directory, 'png-converted.jpg'), vipsPath })
    assert.equal(result.input.format, 'png')
    assert.deepEqual([result.output.width, result.output.height], [pngInput.width, pngInput.height])
    assert.equal(result.output.format, 'jpeg')
    assert.equal(result.output.colorSpace, 'sRGB')
    assert.equal(result.output.independentlyDecoded, true)
    assert.equal(createHash('sha256').update(await readFile(pngFixture)).digest('hex'), sourceHashBefore)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

for (const [name, fixturePath, expectedCode] of [
  ['30,000 × 30,000 header-only JPEG', oversizedDimensions, 'LIMIT_EXCEEDED'],
  ['oversized compressed file', oversizedCompressed, 'INPUT_TOO_LARGE'],
  ['corrupt truncated JPEG', corrupt, 'INVALID_HEADER'],
  ['malformed text with JPEG extension', malformed, 'UNSUPPORTED_FORMAT'],
]) {
  test(`rejects ${name} before any full image decode`, {
    skip: fixturePath ? false : 'NOT TESTED — FIXTURE UNAVAILABLE',
  }, async () => {
    await assert.rejects(inspectImageFile(fixturePath), (error) => error instanceof NormalizerError && error.code === expectedCode)
  })

  if (name === '30,000 × 30,000 header-only JPEG' || name === 'oversized compressed file') {
    test(`normalizer rejects ${name} before launching libvips`, { skip: fixturePath ? false : 'NOT TESTED — FIXTURE UNAVAILABLE' }, async () => {
      const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-preflight-test-'))
      const outputPath = path.join(directory, 'must-not-exist.jpg')
      try {
        await assert.rejects(
          normalizeImage({ inputPath: fixturePath, outputPath, vipsPath: path.join(directory, 'missing-vips.exe') }),
          (error) => error instanceof NormalizerError && error.code === expectedCode
        )
        await assert.rejects(stat(outputPath), (error) => error?.code === 'ENOENT')
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    })
  }
}

test('normalizes a genuine static WebP fixture and preserves the source', {
  skip: vipsPath ? false : 'NOT TESTED — LIBVIPS RUNTIME UNAVAILABLE',
}, async () => {
  const runtime = await resolveVipsRuntime(vipsPath)
  const input = await inspectImageFile(webpFixture)
  const sourceHeader = await inspectWithVips(runtime, webpFixture)
  const sourceHashBefore = createHash('sha256').update(await readFile(webpFixture)).digest('hex')
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-webp-test-'))
  const outputPath = path.join(directory, 'normalized.jpg')
  try {
    assert.equal(input.format, 'webp')
    assert.equal(input.isAnimated, false)
    assert.equal(sourceHeader.loader, 'webpload')
    const result = await normalizeImage({ inputPath: webpFixture, outputPath, vipsPath })
    const outputHeader = await inspectWithVips(runtime, outputPath)
    assert.deepEqual([result.output.width, result.output.height], [input.width, input.height])
    assert.equal(result.output.format, 'jpeg')
    assert.equal(result.output.colorSpace, 'sRGB')
    assert.equal(result.output.independentlyDecoded, true)
    assert.equal(outputHeader.loader, 'jpegload')
    assert.equal(outputHeader.interpretation.toLowerCase(), 'srgb')
    assert.equal(outputHeader.hasGainmap, false)
    assert.equal(outputHeader.hasOrientationTag, false)
    const { stdout: transparentSourcePixel } = await runTool(runtime, runtime.vipsPath, ['getpoint', webpFixture, '10', '10'])
    const sourceChannels = transparentSourcePixel.trim().split(/\s+/).map(Number)
    assert.equal(sourceChannels.length, 4)
    assert.equal(sourceChannels[3], 0, 'the fixture point is fully transparent')
    const { stdout: flattenedPixel } = await runTool(runtime, runtime.vipsPath, ['getpoint', outputPath, '10', '10'])
    assert.ok(flattenedPixel.trim().split(/\s+/).map(Number).every((channel) => channel > 245), 'transparent source pixels flatten to white')
    assert.equal(createHash('sha256').update(await readFile(webpFixture)).digest('hex'), sourceHashBefore)
    assert.deepEqual(await readdir(directory), ['normalized.jpg'])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('autorotates an actual JPEG with EXIF orientation 6 and verifies directional pixels', {
  skip: vipsPath ? false : 'NOT TESTED — LIBVIPS RUNTIME UNAVAILABLE',
}, async () => {
  const runtime = await resolveVipsRuntime(vipsPath)
  const sourceHeader = await inspectWithVips(runtime, rotatedJpeg)
  const orientation = sourceHeader.raw.match(/^exif-ifd0-Orientation:\s*(\d+)/m)?.[1]
  assert.equal(sourceHeader.loader, 'jpegload')
  assert.equal(orientation, '6')
  assert.deepEqual([sourceHeader.width, sourceHeader.height], [320, 240])
  const sourceHashBefore = createHash('sha256').update(await readFile(rotatedJpeg)).digest('hex')
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-orientation-test-'))
  const outputPath = path.join(directory, 'upright.jpg')
  try {
    const result = await normalizeImage({ inputPath: rotatedJpeg, outputPath, vipsPath })
    const outputHeader = await inspectWithVips(runtime, outputPath)
    assert.deepEqual([result.output.width, result.output.height], [240, 320])
    assert.equal(result.output.orientationNormalized, true)
    assert.equal(result.output.independentlyDecoded, true)
    assert.equal(outputHeader.loader, 'jpegload')
    assert.equal(outputHeader.interpretation.toLowerCase(), 'srgb')
    assert.equal(outputHeader.hasOrientationTag, false)
    assert.equal(outputHeader.hasGainmap, false)

    const expectedColors = [
      { x: 20, y: 20, predicate: ([r, g, b]) => r < 80 && g < 80 && b > 160 },
      { x: 220, y: 20, predicate: ([r, g, b]) => r > 160 && g < 80 && b < 80 },
      { x: 20, y: 300, predicate: ([r, g, b]) => r > 160 && g > 140 && b < 80 },
      { x: 220, y: 300, predicate: ([r, g, b]) => r < 80 && g > 140 && b < 80 },
    ]
    for (const { x, y, predicate } of expectedColors) {
      const { stdout } = await runTool(runtime, runtime.vipsPath, ['getpoint', outputPath, String(x), String(y)])
      const channels = stdout.trim().split(/\s+/).map(Number)
      assert.equal(channels.length, 3)
      assert.ok(predicate(channels), `Expected the orientation-correct color at (${x}, ${y}); got ${channels.join(', ')}`)
    }
    assert.equal(createHash('sha256').update(await readFile(rotatedJpeg)).digest('hex'), sourceHashBefore)
    assert.deepEqual(await readdir(directory), ['upright.jpg'])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('converts a genuinely embedded Adobe RGB (1998) JPEG profile to sRGB', {
  skip: vipsPath ? false : 'NOT TESTED — LIBVIPS RUNTIME UNAVAILABLE',
}, async () => {
  const runtime = await resolveVipsRuntime(vipsPath)
  const input = await inspectImageFile(wideGamutJpeg)
  const sourceHeader = await inspectWithVips(runtime, wideGamutJpeg)
  const sourceProfile = await readIccProfile(runtime, wideGamutJpeg)
  const sourceTags = readIccTags(sourceProfile)
  const sourceDescription = readIccDescription(sourceProfile, sourceTags)
  assert.equal(input.format, 'jpeg')
  assert.equal(sourceHeader.hasIccProfile, true)
  assert.equal(sourceProfile.toString('ascii', 16, 20), 'RGB ')
  assert.equal(sourceDescription, 'Adobe RGB (1998)')
  assert.ok(readIccXyzX(sourceProfile, sourceTags, 'rXYZ') > 0.6, 'Adobe RGB red primary differs from sRGB')

  const sourceHashBefore = createHash('sha256').update(await readFile(wideGamutJpeg)).digest('hex')
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-wide-gamut-test-'))
  const outputPath = path.join(directory, 'srgb.jpg')
  try {
    const result = await normalizeImage({ inputPath: wideGamutJpeg, outputPath, vipsPath })
    const outputHeader = await inspectWithVips(runtime, outputPath)
    const outputProfile = await readIccProfile(runtime, outputPath)
    const outputTags = readIccTags(outputProfile)
    assert.deepEqual([result.output.width, result.output.height], [input.width, input.height])
    assert.equal(result.output.format, 'jpeg')
    assert.equal(result.output.colorSpace, 'sRGB')
    assert.equal(result.output.independentlyDecoded, true)
    assert.equal(outputHeader.loader, 'jpegload')
    assert.equal(outputHeader.interpretation.toLowerCase(), 'srgb')
    assert.ok(Math.abs(readIccXyzX(outputProfile, outputTags, 'rXYZ') - 0.436) < 0.003, 'output red primary matches sRGB')
    assert.ok(Math.abs(readIccXyzX(outputProfile, outputTags, 'gXYZ') - 0.385) < 0.003, 'output green primary matches sRGB')
    assert.ok(Math.abs(readIccXyzX(outputProfile, outputTags, 'bXYZ') - 0.143) < 0.003, 'output blue primary matches sRGB')
    assert.equal(outputHeader.hasGainmap, false)
    assert.equal(outputHeader.hasOrientationTag, false)
    assert.equal(createHash('sha256').update(await readFile(wideGamutJpeg)).digest('hex'), sourceHashBefore)
    assert.deepEqual(await readdir(directory), ['srgb.jpg'])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('repeated normalization has stable verified behavior and removes temporary work', {
  skip: ordinaryJpeg && vipsPath ? false : 'NOT TESTED — FIXTURE OR LIBVIPS RUNTIME UNAVAILABLE',
}, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-repeat-test-'))
  const firstPath = path.join(directory, 'first.jpg')
  const secondPath = path.join(directory, 'second.jpg')
  try {
    const first = await normalizeImage({ inputPath: ordinaryJpeg, outputPath: firstPath, vipsPath })
    const second = await normalizeImage({ inputPath: ordinaryJpeg, outputPath: secondPath, vipsPath })
    assert.deepEqual(
      [first.output.format, first.output.width, first.output.height, first.output.colorSpace, first.output.dynamicRange, first.output.independentlyDecoded],
      [second.output.format, second.output.width, second.output.height, second.output.colorSpace, second.output.dynamicRange, second.output.independentlyDecoded]
    )
    assert.deepEqual((await readdir(directory)).sort(), ['first.jpg', 'second.jpg'])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('failed runtime setup leaves no temporary or success output behind', {
  skip: ordinaryJpeg ? false : 'NOT TESTED — FIXTURE UNAVAILABLE',
}, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-cleanup-test-'))
  try {
    await assert.rejects(
      normalizeImage({ inputPath: ordinaryJpeg, outputPath: path.join(directory, 'never.jpg'), vipsPath: path.join(directory, 'missing-vips.exe') }),
      (error) => error instanceof NormalizerError && error.code === 'RUNTIME_CONFIG'
    )
    assert.deepEqual(await readdir(directory), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('refuses an existing output path without overwriting it', {
  skip: ordinaryJpeg ? false : 'NOT TESTED — FIXTURE UNAVAILABLE',
}, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-existing-output-test-'))
  const outputPath = path.join(directory, 'existing.jpg')
  const sentinel = Buffer.from('leave this output untouched')
  try {
    await writeFile(outputPath, sentinel)
    await assert.rejects(
      normalizeImage({ inputPath: ordinaryJpeg, outputPath, vipsPath }),
      (error) => error instanceof NormalizerError && error.code === 'OUTPUT_ERROR'
    )
    assert.deepEqual(await readFile(outputPath), sentinel)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
