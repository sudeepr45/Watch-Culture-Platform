#!/usr/bin/env node
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { normalizeImage } from './index.js'

function usage() {
  return 'Usage: node src/cli.js <input-image> <output.jpg>\nSet MOJEAN_VIPS_BIN to the libvips bin directory. The output path must not overwrite the input.'
}

async function main(args) {
  if (args.length !== 2 || args.includes('--help')) {
    process.stdout.write(`${usage()}\n`)
    process.exitCode = args.includes('--help') ? 0 : 2
    return
  }

  const [inputPath, outputPath] = args.map((value) => path.resolve(value))
  try {
    const result = await normalizeImage(inputPath, { outputPath })
    process.stdout.write(`${JSON.stringify({
      ok: result.ok,
      output: outputPath,
      width: result.width,
      height: result.height,
      colorSpace: result.colorSpace,
      dynamicRange: result.dynamicRange,
      source: result.source,
      resourceEstimate: result.resourceEstimate,
    }, null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`${JSON.stringify({
      ok: false,
      category: error.category || 'NORMALIZATION_FAILED',
      message: error.message,
      details: error.details || {},
    }, null, 2)}\n`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main(process.argv.slice(2))
}
