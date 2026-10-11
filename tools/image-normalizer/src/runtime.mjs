import { access, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { NormalizerError } from './errors.mjs'
import { LIMITS } from './limits.mjs'

const COMMAND_TIMEOUT_MS = 120_000
const COMMAND_OUTPUT_LIMIT = 1024 * 1024
const JOB_RUNNER_PATH = fileURLToPath(new URL('./windows-job-runner.ps1', import.meta.url))

function runtimeError(message, cause) {
  return new NormalizerError('RUNTIME_CONFIG', message, cause)
}

async function findExecutable(configuredPath) {
  const resolved = path.resolve(configuredPath)
  let entry
  try {
    entry = await stat(resolved)
  } catch (error) {
    throw runtimeError('Configured libvips runtime was not found. Set --vips or MOJEAN_VIPS_PATH to a vips executable or bundle directory.', error)
  }

  const executableName = process.platform === 'win32' ? 'vips.exe' : 'vips'
  if (entry.isFile()) return resolved
  if (!entry.isDirectory()) throw runtimeError('Configured libvips path must be an executable or directory.')

  const candidates = [
    path.join(resolved, executableName),
    path.join(resolved, 'bin', executableName),
    path.join(resolved, 'vips-dev-8.18', 'bin', executableName),
  ]
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch {
      // Continue through the supported bundle layouts.
    }
  }
  throw runtimeError('Configured libvips directory contains no vips executable.')
}

/** Resolve an explicit executable or bundle directory and verify both CLI tools. */
export async function resolveVipsRuntime(configuredPath) {
  if (typeof configuredPath !== 'string' || !configuredPath.trim()) {
    throw runtimeError('libvips is required. Configure --vips <path> or MOJEAN_VIPS_PATH; the normalizer does not install it.')
  }

  const vipsPath = await findExecutable(configuredPath.trim())
  const binDirectory = path.dirname(vipsPath)
  const rootDirectory = path.basename(binDirectory).toLowerCase() === 'bin'
    ? path.dirname(binDirectory)
    : binDirectory
  const headerName = process.platform === 'win32' ? 'vipsheader.exe' : 'vipsheader'
  const headerPath = path.join(binDirectory, headerName)
  try {
    await access(headerPath, constants.F_OK)
  } catch (error) {
    throw runtimeError('Configured libvips bundle is missing the sibling vipsheader executable.', error)
  }

  const env = {
    ...process.env,
    PATH: `${binDirectory}${path.delimiter}${process.env.PATH ?? ''}`,
    VIPSHOME: rootDirectory,
    VIPS_CONCURRENCY: '2',
  }
  const runtime = { vipsPath, headerPath, rootDirectory, env, processMemoryLimitBytes: LIMITS.processMemoryBytes }
  const version = await runTool(runtime, vipsPath, ['--version'])
  if (!/^vips-\d/.test(version.stdout.trim())) {
    throw runtimeError('Configured executable did not identify itself as libvips.')
  }
  return { ...runtime, version: version.stdout.trim() }
}

/** Run a libvips executable without a shell and bound runtime/output time. */
export function runTool(runtime, executable, args) {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      reject(runtimeError('The configured 768 MiB native process boundary currently requires Windows Job Objects.'))
      return
    }
    const powershell = process.env.MOJEAN_POWERSHELL || 'powershell.exe'
    const argumentsBase64 = Buffer.from(JSON.stringify(args), 'utf8').toString('base64')
    const child = spawn(powershell, [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', JOB_RUNNER_PATH,
      '-Executable', executable,
      '-ArgumentsBase64', argumentsBase64,
      '-MemoryLimitBytes', LIMITS.processMemoryBytes.toString(),
    ], { env: runtime.env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let outputBytes = 0
    let failedForOutput = false
    const append = (target, chunk) => {
      outputBytes += chunk.length
      if (outputBytes > COMMAND_OUTPUT_LIMIT) {
        failedForOutput = true
        child.kill()
        return target
      }
      return target + chunk.toString('utf8')
    }
    child.stdout.on('data', (chunk) => { stdout = append(stdout, chunk) })
    child.stderr.on('data', (chunk) => { stderr = append(stderr, chunk) })

    const timer = setTimeout(() => child.kill(), COMMAND_TIMEOUT_MS)
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(new NormalizerError('RUNTIME_FAILURE', 'Unable to start the configured libvips executable.', error))
    })
    child.once('close', (code, signal) => {
      clearTimeout(timer)
      if (failedForOutput) {
        reject(new NormalizerError('RUNTIME_FAILURE', 'libvips exceeded the diagnostic output limit.'))
      } else if (code !== 0) {
        const reason = signal ? ` (terminated by ${signal})` : ''
        const detail = stderr.trim().split(/\r?\n/).slice(-4).join(' ').slice(0, 1000)
        reject(new NormalizerError('RUNTIME_FAILURE', `libvips command failed${reason}${detail ? `: ${detail}` : '.'}`))
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

/** Read libvips header metadata only; callers must apply preflight guards first. */
export async function inspectWithVips(runtime, imagePath) {
  const { stdout } = await runTool(runtime, runtime.headerPath, ['-a', imagePath])
  const dimensionLine = stdout.match(/:\s*(\d+)x(\d+)\s+\w+,\s*(\d+)\s+bands,\s*([^,\r\n]+)/)
  const field = (name) => stdout.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? null
  if (!dimensionLine) throw new NormalizerError('INVALID_HEADER', 'libvips could not read image header metadata.')
  return {
    width: Number(dimensionLine[1]),
    height: Number(dimensionLine[2]),
    bands: Number(dimensionLine[3]),
    interpretation: dimensionLine[4].trim(),
    loader: field('vips-loader'),
    hasIccProfile: field('icc-profile-data') !== null,
    hasGainmap: field('gainmap-data') !== null,
    hasExif: field('exif-data') !== null,
    hasOrientationTag: field('exif-ifd0-Orientation') !== null,
    raw: stdout,
  }
}
