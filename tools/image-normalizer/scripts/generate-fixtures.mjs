import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveVipsRuntime, runTool } from '../../src/runtime.mjs'

const fixtureDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../test/fixtures')
const sourceJpeg = process.env.MOJEAN_NORM_FIXTURE_JPEG
const sourcePng = process.env.MOJEAN_NORM_FIXTURE_PNG
const runtime = await resolveVipsRuntime(process.env.MOJEAN_VIPS_PATH)

if (!sourceJpeg || !sourcePng) {
  throw new Error('Set MOJEAN_NORM_FIXTURE_JPEG and MOJEAN_NORM_FIXTURE_PNG to existing local image files.')
}

await mkdir(fixtureDirectory, { recursive: true })

function xyzTag(values) {
  const tag = Buffer.alloc(20)
  tag.write('XYZ ', 0, 'ascii')
  values.forEach((value, index) => tag.writeInt32BE(Math.round(value * 65536), 8 + index * 4))
  return tag
}

function gammaTag(gamma) {
  const tag = Buffer.alloc(14)
  tag.write('curv', 0, 'ascii')
  tag.writeUInt32BE(1, 8)
  tag.writeUInt16BE(Math.round(gamma * 256), 12)
  return tag
}

function descriptionTag(value) {
  const string = Buffer.from(value, 'ascii')
  const tag = Buffer.alloc(12 + string.length + 1 + 4 + 4 + 2 + 1 + 67)
  tag.write('desc', 0, 'ascii')
  tag.writeUInt32BE(string.length + 1, 8)
  string.copy(tag, 12)
  return tag
}

function copyrightTag(value) {
  const string = Buffer.from(value, 'ascii')
  const tag = Buffer.alloc(8 + string.length)
  tag.write('text', 0, 'ascii')
  string.copy(tag, 8)
  return tag
}

function makeAdobeRgb1998Profile() {
  // Matrix columns, D50-adapted, and gamma from the Adobe RGB (1998) color space.
  const tags = [
    ['desc', descriptionTag('Adobe RGB (1998)')],
    ['cprt', copyrightTag('Isolated MOJEAN normalization test profile')],
    ['wtpt', xyzTag([0.9642, 1, 0.8249])],
    ['rXYZ', xyzTag([0.609741, 0.311111, 0.019470])],
    ['gXYZ', xyzTag([0.205276, 0.625671, 0.060867])],
    ['bXYZ', xyzTag([0.149185, 0.063217, 0.744568])],
    ['rTRC', gammaTag(2.19921875)],
    ['gTRC', gammaTag(2.19921875)],
    ['bTRC', gammaTag(2.19921875)],
  ]
  const headerSize = 128 + 4 + tags.length * 12
  let currentOffset = headerSize
  const records = []
  const payloads = []
  for (const [signature, payload] of tags) {
    const alignedOffset = (currentOffset + 3) & ~3
    if (alignedOffset > currentOffset) payloads.push(Buffer.alloc(alignedOffset - currentOffset))
    const record = Buffer.alloc(12)
    record.write(signature, 0, 'ascii')
    record.writeUInt32BE(alignedOffset, 4)
    record.writeUInt32BE(payload.length, 8)
    records.push(record)
    payloads.push(payload)
    currentOffset = alignedOffset + payload.length
  }

  const header = Buffer.alloc(128)
  header.writeUInt32BE(currentOffset, 0)
  header.write('MOJE', 4, 'ascii')
  header.writeUInt32BE(0x02100000, 8)
  header.write('mntr', 12, 'ascii')
  header.write('RGB ', 16, 'ascii')
  header.write('XYZ ', 20, 'ascii')
  header.writeUInt16BE(2026, 24)
  header.writeUInt16BE(1, 26)
  header.writeUInt16BE(1, 28)
  header.write('acsp', 36, 'ascii')
  header.write('MSFT', 40, 'ascii')
  header.writeUInt32BE(0, 64)
  ;[0.9642, 1, 0.8249].forEach((value, index) => header.writeInt32BE(Math.round(value * 65536), 68 + index * 4))
  header.write('MOJE', 80, 'ascii')

  const tagCount = Buffer.alloc(4)
  tagCount.writeUInt32BE(tags.length)
  return Buffer.concat([header, tagCount, ...records, ...payloads])
}

function addExifOrientation6(jpegBytes) {
  if (jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) throw new Error('Orientation test source is not a JPEG.')
  const tiff = Buffer.alloc(26)
  tiff.write('II', 0, 'ascii')
  tiff.writeUInt16LE(42, 2)
  tiff.writeUInt32LE(8, 4)
  tiff.writeUInt16LE(1, 8)
  tiff.writeUInt16LE(0x0112, 10)
  tiff.writeUInt16LE(3, 12)
  tiff.writeUInt32LE(1, 14)
  tiff.writeUInt16LE(6, 18)
  tiff.writeUInt32LE(0, 22)

  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff])
  const app1 = Buffer.alloc(4 + payload.length)
  app1[0] = 0xff
  app1[1] = 0xe1
  app1.writeUInt16BE(payload.length + 2, 2)
  payload.copy(app1, 4)
  return Buffer.concat([jpegBytes.subarray(0, 2), app1, jpegBytes.subarray(2)])
}

const webpPath = path.join(fixtureDirectory, 'webp-decoder-control.webp')
await runTool(runtime, runtime.vipsPath, ['webpsave', sourcePng, webpPath, '--Q', '90'])

const orientationSource = path.join(fixtureDirectory, 'orientation-pattern.svg')
const orientationJpeg = path.join(fixtureDirectory, 'rotated-orientation-6.jpg')
const pattern = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="160" height="120" fill="#f01818"/><rect x="160" width="160" height="120" fill="#18dc18"/><rect y="120" width="160" height="120" fill="#1818f0"/><rect x="160" y="120" width="160" height="120" fill="#f0dc18"/></svg>'
await writeFile(orientationSource, pattern)
const temporaryVips = path.join(fixtureDirectory, 'orientation-pattern.v')
const temporaryJpeg = path.join(fixtureDirectory, 'orientation-pattern-base.jpg')
await runTool(runtime, runtime.vipsPath, ['svgload', orientationSource, temporaryVips])
await runTool(runtime, runtime.vipsPath, ['jpegsave', temporaryVips, temporaryJpeg, '--Q', '100'])
await writeFile(orientationJpeg, addExifOrientation6(await readFile(temporaryJpeg)))

const adobeProfilePath = path.join(fixtureDirectory, 'adobe-rgb-1998-test.icc')
const adobeTaggedImage = path.join(fixtureDirectory, 'wide-gamut-adobe-rgb.jpg')
const intermediateVips = path.join(fixtureDirectory, 'wide-gamut-adobe-rgb.v')
await writeFile(adobeProfilePath, makeAdobeRgb1998Profile())
await runTool(runtime, runtime.vipsPath, [
  'icc_transform', sourceJpeg, intermediateVips, adobeProfilePath,
  '--input-profile', 'srgb',
])
await runTool(runtime, runtime.vipsPath, [
  'jpegsave', intermediateVips, adobeTaggedImage,
  '--Q', '96', '--keep', 'icc',
])

await Promise.all([orientationSource, temporaryVips, temporaryJpeg, intermediateVips].map((filePath) => unlink(filePath)))

process.stdout.write(`${JSON.stringify({
  runtime: runtime.version,
  fixtures: [webpPath, orientationJpeg, adobeProfilePath, adobeTaggedImage],
  orientationSource: '320x240 four-quadrant SVG rasterized to JPEG, then an EXIF APP1 Orientation=6 tag was inserted',
  wideGamutProfile: 'Adobe RGB (1998), locally constructed ICC v2 matrix/TRC profile using D50-adapted Adobe RGB colorants and gamma 2.19921875',
}, null, 2)}\n`)
