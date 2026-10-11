import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { NormalizationError, LIMITS } from './limits.js'

const SCRIPT_PATH = fileURLToPath(new URL('./windows-job-runner.ps1', import.meta.url))
const MAX_CAPTURE_BYTES = 2 * 1024 * 1024

export function getVipsRuntime(env = process.env) {
  const binDirectory = env.MOJEAN_VIPS_BIN
  if (!binDirectory) {
    throw new NormalizationError('NORMALIZATION_FAILED', 'Set MOJEAN_VIPS_BIN to the directory containing vips.exe and vipsheader.exe.')
  }

  const sRGBProfile = env.MOJEAN_SRGB_ICC
    || (process.platform === 'win32'
      ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'spool', 'drivers', 'color', 'sRGB Color Space Profile.icm')
      : '')
  if (!sRGBProfile) {
    throw new NormalizationError('NORMALIZATION_FAILED', 'Set MOJEAN_SRGB_ICC to a verified sRGB ICC profile.')
  }

  return {
    vips: path.join(binDirectory, process.platform === 'win32' ? 'vips.exe' : 'vips'),
    vipsheader: path.join(binDirectory, process.platform === 'win32' ? 'vipsheader.exe' : 'vipsheader'),
    sRGBProfile,
    processLimitBytes: LIMITS.maxProcessBytes,
  }
}

function runWindowsJob(executable, args, { timeoutMs = 120_000, maxOutputBytes = MAX_CAPTURE_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    const powershell = process.env.MOJEAN_POWERSHELL || 'powershell.exe'
    const powershellArgs = [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-File', SCRIPT_PATH,
      '-Executable', executable,
      '-ArgumentsJson', JSON.stringify(args),
      '-MemoryLimitBytes', String(LIMITS.maxProcessBytes),
    ]
    const child = spawn(powershell, powershellArgs, { windowsHide: true, shell: false })
    let stdout = Buffer.alloc(0)
    let stderr = Buffer.alloc(0)
    let timedOut = false
    let outputExceeded = false

    const append = (current, chunk) => {
      if (current.length + chunk.length > maxOutputBytes) {
        outputExceeded = true
        child.kill()
        return current
      }
      return Buffer.concat([current, chunk])
    }

    const timer = setTimeout(() => {
      timedOut = true
      child.kill()
    }, timeoutMs)

    child.stdout.on('data', (chunk) => { stdout = append(stdout, chunk) })
    child.stderr.on('data', (chunk) => { stderr = append(stderr, chunk) })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(new NormalizationError('NORMALIZATION_FAILED', `Unable to start the bounded image process: ${error.message}`))
    })
    child.on('close', (code, signal) => {
      clearTimeout(timer)
      const result = { stdout: stdout.toString('utf8'), stderr: stderr.toString('utf8'), code, signal }
      if (timedOut) {
        reject(new NormalizationError('NORMALIZATION_FAILED', 'Image process exceeded its execution time limit.'))
      } else if (outputExceeded) {
        reject(new NormalizationError('NORMALIZATION_FAILED', 'Image process exceeded its diagnostic output limit.'))
      } else if (code !== 0) {
        const detail = (result.stderr || result.stdout).trim().slice(-4000)
        reject(new NormalizationError('NORMALIZATION_FAILED', detail || `Image process exited with code ${code}.`))
      } else {
        resolve(result)
      }
    })
  })
}

export async function runVips(runtime, operation, args, options = {}) {
  const executable = operation === 'header' ? runtime.vipsheader : runtime.vips
  const commandArgs = operation === 'header' ? args : [operation, ...args]
  return runWindowsJob(executable, commandArgs, options)
}
