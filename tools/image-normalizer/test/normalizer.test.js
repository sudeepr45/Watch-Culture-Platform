import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import {
  LIMITS,
  MiB,
  NormalizationError,
  checkInputByteLength,
  checkedMultiply,
  normalizeImage,
  validateDimensions,
} from '../src/index.js'
import { getVipsRuntime, runVips } from '../src/vips.js'

const runtime = getVipsRuntime()
const fixturePaths = {
  hdr: process.env.MOJEAN_TEST_ULTRAHDR,
  sdr: process.env.MOJEAN_TEST_SDR_JPEG,
  png: process.env.MOJEAN_TEST_PNG,
  oversized: process.env.MOJEAN_TEST_OVERSIZED,
  corrupt: process.env.MOJEAN_TEST_CORRUPT,
}

let scratch
let generatedWebp
let generatedRotatedJpeg
let generatedSdrJpeg
let generatedPng

function exifOrientation(bytes, orientation) {
  const tiff = Buffer.from([
    0x45, 0x78, 0x69, 0x66, 0, 0,
    0x49, 0x49, 0x2a, 0, 0x08, 0, 0, 0,
    0x01, 0,
    0x12, 0x01, 0x03, 0, 0x01, 0, 0, 0,
    orientation, 0, 0, 0,
    0, 0, 0, 0,
  ])
  const app1 = Buffer.alloc(4 + tiff.length)
  app1[0] = 0xff
  app1[1] = 0xe1
  app1.writeUInt16BE(tiff.length + 2, 2)
  tiff.copy(app1, 4)
  return Buffer.concat([bytes.subarray(0, 2), app1, bytes.subarray(2)])
}

async function vips(operation, args) {
  return runVips(runtime, operation, args)
}

async function createFixtures() {
  scratch = await mkdtemp(path.join(os.tmpdir(), 'mojean-normalizer-tests-'))
  const raster = path.join(scratch, 'generated.v')
  generatedSdrJpeg = path.join(scratch, 'generated-sdr.jpg')
  generatedRotatedJpeg = path.join(scratch, 'generated-orientation-6.jpg')
  generatedWebp = path.join(scratch, 'generated.webp')
  generatedPng = path.join(scratch, 'generated.png')

  await vips('black', [raster, '4', '2', '--bands', '3'])
  await vips('jpegsave', [raster, generatedSdrJpeg, '--Q', '90'])
  const rawJpeg = await readFile(generatedSdrJpeg)
  await writeFile(generatedRotatedJpeg, exifOrientation(rawJpeg, 6))
  await vips('webpsave', [raster, generatedWebp, '--Q', '85'])
  await vips('pngsave', [raster, generatedPng])
}

before(createFixtures)
after(async () => {
  if (scratch) await rm(scratch, { recursive: true, force: true })
})

async function normalizeAndCheck(input, outputName) {
  const beforeEntries = await readdir(scratch)
  const outputPath = path.join(scratch, outputName)
  const result = await normalizeImage(input, { outputPath, tempRoot: scratch })
  assert.equal(result.ok, true)
  assert.equal(result.format, 'jpeg')
  assert.equal(result.colorSpace, 'sRGB')
  assert.equal(result.dynamicRange, 'SDR')
  const output = await readFile(outputPath)
  assert.ok(output.length > 4)
  const remaining = await readdir(scratch)
  assert.deepEqual(remaining.filter((entry) => entry.startsWith('mojean-normalizer-')), [])
  assert.ok(remaining.includes(path.basename(outputPath)))
  assert.ok(beforeEntries.length < remaining.length + 1)
  return { result, outputPath, output }
}

function skipIfMissing(t, key) {
  if (!fixturePaths[key]) {
    t.skip(`Set MOJEAN_TEST_${key.toUpperCase()} to a real ${key} fixture to run this case.`)
    return true
  }
  return false
}

test('normalizes the real Ultra HDR fixture to a verified SDR JPEG', async (t) => {
  if (skipIfMissing(t, 'hdr')) return
  const sourceBefore = createHash('sha256').update(await readFile(fixturePaths.hdr)).digest('hex')
  const { result, outputPath } = await normalizeAndCheck(fixturePaths.hdr, 'f91w-normalized.jpg')
  assert.equal(result.source.ultraHdr, true)
  assert.equal(result.source.format, 'jpeg')
  assert.deepEqual([result.width, result.height], [2420, 3420])
  const sourceAfter = createHash('sha256').update(await readFile(fixturePaths.hdr)).digest('hex')
  assert.equal(sourceAfter, sourceBefore)
  assert.ok((await stat(outputPath)).size > 0)
})

test('normalizes an independent ordinary SDR JPEG and is repeatably valid', async (t) => {
  if (skipIfMissing(t, 'sdr')) return
  const { result: first } = await normalizeAndCheck(fixturePaths.sdr, 'sdr-first.jpg')
  const { result: second } = await normalizeAndCheck(fixturePaths.sdr, 'sdr-second.jpg')
  assert.equal(first.source.ultraHdr, false)
  assert.deepEqual([first.width, first.height], [second.width, second.height])
  assert.equal(first.format, 'jpeg')
})

test('detects content rather than extension when a JPEG is mislabeled', async () => {
  const misleadingPath = path.join(scratch, 'misleading.png')
  await writeFile(misleadingPath, await readFile(fixturePaths.sdr || generatedSdrJpeg))
  const { result } = await normalizeAndCheck(misleadingPath, 'mislabeled-normalized.jpg')
  assert.equal(result.source.format, 'jpeg')
})

test('normalizes PNG and WebP inputs', async () => {
  const { result: pngResult } = await normalizeAndCheck(generatedPng, 'png-normalized.jpg')
  assert.equal(pngResult.source.format, 'png')
  const { result: webpResult } = await normalizeAndCheck(generatedWebp, 'webp-normalized.jpg')
  assert.equal(webpResult.source.format, 'webp')
})

test('applies EXIF orientation before encoding', async () => {
  const { result } = await normalizeAndCheck(generatedRotatedJpeg, 'orientation-normalized.jpg')
  assert.equal(result.source.orientation, 6)
  assert.deepEqual([result.source.width, result.source.height], [4, 2])
  assert.deepEqual([result.width, result.height], [2, 4])
})

test('rejects invalid and corrupt image inputs without leaving an output', async (t) => {
  const nonImage = path.join(scratch, 'not-an-image.bin')
  await writeFile(nonImage, Buffer.from('not image data'))
  await assert.rejects(normalizeImage(nonImage), (error) => error.category === 'UNSUPPORTED_FORMAT')

  const malformedJpeg = path.join(scratch, 'malformed-header.jpg')
  await writeFile(malformedJpeg, Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]))
  const malformedOutput = path.join(scratch, 'malformed-output.jpg')
  await assert.rejects(normalizeImage(malformedJpeg, { outputPath: malformedOutput }), (error) => error.category === 'HEADER_READ_FAILED')
  await assert.rejects(stat(malformedOutput), { code: 'ENOENT' })

  if (!skipIfMissing(t, 'corrupt')) {
    await assert.rejects(normalizeImage(fixturePaths.corrupt), (error) => ['HEADER_READ_FAILED', 'DECODE_FAILED'].includes(error.category))
  }
})

test('rejects oversized compressed input before header inspection', async () => {
  const tooLarge = path.join(scratch, 'oversized-input.bin')
  const fileHandle = await import('node:fs/promises').then(({ open }) => open(tooLarge, 'w'))
  try { await fileHandle.truncate(LIMITS.maxFileBytes + 1) } finally { await fileHandle.close() }
  await assert.rejects(normalizeImage(tooLarge), (error) => error.category === 'FILE_TOO_LARGE')
})

test('rejects 30000 by 30000 dimensions after header inspection and before pixel decode', async (t) => {
  if (skipIfMissing(t, 'oversized')) return
  await assert.rejects(normalizeImage(fixturePaths.oversized), (error) => error.category === 'DIMENSIONS_TOO_LARGE')

  const operations = []
  const fakeRuntime = { processLimitBytes: LIMITS.maxProcessBytes }
  const fakeHeader = async (_runtime, operation, args) => {
    operations.push(operation)
    assert.equal(operation, 'header')
    return {
      stdout: `${args[1]}: 30000x30000 uchar, 3 bands, srgb, jpegload\nwidth: 30000\nheight: 30000\nbands: 3\ninterpretation: srgb\nvips-loader: jpegload\n`,
      stderr: '',
    }
  }
  await assert.rejects(normalizeImage(Buffer.from([0xff, 0xd8, 0xff]), {
    runtime: fakeRuntime,
    invokeVips: fakeHeader,
  }), (error) => error.category === 'DIMENSIONS_TOO_LARGE')
  assert.deepEqual(operations, ['header'])
})

test('fails closed on malformed header dimensions and resource arithmetic', async () => {
  const operations = []
  const fakeHeader = async (_runtime, operation) => {
    operations.push(operation)
    return { stdout: 'unreadable header\n', stderr: '' }
  }
  await assert.rejects(normalizeImage(Buffer.from([0xff, 0xd8, 0xff]), {
    runtime: {},
    invokeVips: fakeHeader,
  }), (error) => error.category === 'HEADER_READ_FAILED')
  assert.deepEqual(operations, ['header'])

  assert.throws(() => validateDimensions(0, 1, 10), (error) => error.category === 'DIMENSIONS_INVALID')
  assert.throws(() => checkedMultiply(Number.MAX_SAFE_INTEGER, 2), (error) => error.category === 'MEMORY_LIMIT_EXCEEDED')
  assert.throws(() => validateDimensions(5000, 2001, 10), (error) => error.category === 'PIXEL_COUNT_TOO_LARGE')
  assert.throws(() => validateDimensions(1, 1, 1, {
    ...LIMITS,
    maxEstimatedWorkingBytes: 1,
  }), (error) => error.category === 'MEMORY_LIMIT_EXCEEDED')
})

test('checks file, side, and pixel boundaries without decoding', () => {
  assert.doesNotThrow(() => checkInputByteLength(LIMITS.maxFileBytes - 1))
  assert.doesNotThrow(() => checkInputByteLength(LIMITS.maxFileBytes))
  assert.throws(() => checkInputByteLength(LIMITS.maxFileBytes + 1), (error) => error.category === 'FILE_TOO_LARGE')
  assert.doesNotThrow(() => validateDimensions(8192, 1, 1))
  assert.throws(() => validateDimensions(8193, 1, 1), (error) => error.category === 'DIMENSIONS_TOO_LARGE')
  assert.doesNotThrow(() => validateDimensions(5000, 2000, 1))
  assert.throws(() => validateDimensions(5000, 2001, 1), (error) => error.category === 'PIXEL_COUNT_TOO_LARGE')
  assert.ok(MiB > 0)
  assert.throws(() => checkInputByteLength(0), (error) => error.category === 'INVALID_INPUT')
})
