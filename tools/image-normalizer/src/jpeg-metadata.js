const GAINMAP_MARKERS = [Buffer.from('hdrgm', 'ascii'), Buffer.from('gainmap', 'ascii'), Buffer.from('21496', 'ascii')]

export function inspectJpegMarkers(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return { validStart: false, hasEoi: false, hasMpf: false, hasGainMapMetadata: false }
  }

  let offset = 2
  let hasMpf = false
  let hasGainMapMetadata = false
  let reachedScan = false

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) break
    while (bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.length) break

    const marker = bytes[offset]
    offset += 1
    if (marker === 0xd9) break
    if (marker === 0xda) {
      reachedScan = true
      break
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 2 > bytes.length) break

    const segmentLength = bytes.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break
    const payload = bytes.subarray(offset + 2, offset + segmentLength)

    if (marker === 0xe2 && payload.subarray(0, 4).equals(Buffer.from('MPF\0', 'binary'))) {
      hasMpf = true
    }
    if (marker === 0xe1 && GAINMAP_MARKERS.some((needle) => payload.includes(needle))) {
      hasGainMapMetadata = true
    }

    offset += segmentLength
  }

  return {
    validStart: true,
    hasEoi: bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9,
    hasMpf,
    hasGainMapMetadata,
    reachedScan,
  }
}
