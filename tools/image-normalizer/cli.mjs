#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { asResult, NormalizerError } from './src/errors.mjs'
import { inspectImageFile } from './src/inspect.mjs'
import { inspectWithVips, resolveVipsRuntime } from './src/runtime.mjs'
import { normalizeImage } from './src/normalize.mjs'

const HELP = `MOJEAN standalone image normalizer

Usage:
  node tools/image-normalizer/cli.mjs inspect --input <image> [--vips <executable-or-bundle>]
  node tools/image-normalizer/cli.mjs normalize --input <image> --output <new.jpg> [--vips <executable-or-bundle>]

Runtime configuration:
  --vips <path>                 libvips executable or bundle directory
  MOJEAN_VIPS_PATH=<path>       same setting through the environment
`

function parseArgs(argv) {
  const [command, ...rest] = argv
  const options = new Map()
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index]
    if (!argument.startsWith('--')) throw new NormalizerError('INPUT_ERROR', `Unexpected argument: ${argument}`)
    const key = argument.slice(2)
    const value = rest[index + 1]
    if (!value || value.startsWith('--')) throw new NormalizerError('INPUT_ERROR', `Missing value for --${key}.`)
    if (!['input', 'output', 'vips'].includes(key)) throw new NormalizerError('INPUT_ERROR', `Unknown option: --${key}.`)
    if (options.has(key)) throw new NormalizerError('INPUT_ERROR', `Option --${key} may be supplied only once.`)
    options.set(key, value)
    index += 1
  }
  return { command, options }
}

async function run(argv) {
  const { command, options } = parseArgs(argv)
  if (!command || command === 'help' || command === '--help') {
    process.stdout.write(HELP)
    return
  }
  if (command !== 'inspect' && command !== 'normalize') {
    throw new NormalizerError('INPUT_ERROR', 'Command must be inspect or normalize. Use help for usage.')
  }
  const inputPath = options.get('input')
  if (!inputPath) throw new NormalizerError('INPUT_ERROR', '--input is required.')
  const configuredVips = options.get('vips') ?? process.env.MOJEAN_VIPS_PATH

  if (command === 'inspect') {
    const inspected = await inspectImageFile(inputPath)
    const runtime = await resolveVipsRuntime(configuredVips)
    const header = await inspectWithVips(runtime, inputPath)
    if (header.width !== inspected.width || header.height !== inspected.height) {
      throw new NormalizerError('INVALID_HEADER', 'Header dimensions disagree with libvips; input rejected.')
    }
    process.stdout.write(`${JSON.stringify({
      ...inspected,
      pixels: inspected.pixels.toString(),
      inputBytes: inspected.inputBytes.toString(),
      estimatedMemoryBytes: inspected.estimatedMemoryBytes.toString(),
      ultraHdr: inspected.isUltraHdr || header.loader === 'uhdrload',
      loader: header.loader,
      colorInterpretation: header.interpretation,
      iccProfilePresent: header.hasIccProfile,
      runtime: runtime.version,
    }, null, 2)}\n`)
    return
  }

  const outputPath = options.get('output')
  if (!outputPath) throw new NormalizerError('OUTPUT_ERROR', '--output is required for normalization.')
  const result = await normalizeImage({ inputPath, outputPath, vipsPath: configuredVips })
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await asResult(() => run(process.argv.slice(2)))
  if (!result.ok) {
    process.stderr.write(`[${result.error.code}] ${result.error.message}\n`)
    process.exitCode = 1
  }
}
