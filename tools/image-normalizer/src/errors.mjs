/** @typedef {'INPUT_ERROR'|'INPUT_TOO_LARGE'|'UNSUPPORTED_FORMAT'|'INVALID_HEADER'|'INVALID_DIMENSIONS'|'LIMIT_EXCEEDED'|'RUNTIME_CONFIG'|'RUNTIME_FAILURE'|'OUTPUT_ERROR'|'VERIFICATION_FAILED'} NormalizerErrorCode */

/** A safe, machine-readable failure from the standalone normalizer. */
export class NormalizerError extends Error {
  /** @param {NormalizerErrorCode} code @param {string} message @param {unknown} [cause] */
  constructor(code, message, cause) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'NormalizerError'
    this.code = code
  }
}

/** @template T @typedef {{ ok: true, value: T } | { ok: false, error: { code: NormalizerErrorCode, message: string } }} NormalizerResult */

/** @template T @param {() => Promise<T>} action @returns {Promise<NormalizerResult<T>>} */
export async function asResult(action) {
  try {
    return { ok: true, value: await action() }
  } catch (error) {
    if (error instanceof NormalizerError) {
      return { ok: false, error: { code: error.code, message: error.message } }
    }
    return {
      ok: false,
      error: {
        code: 'RUNTIME_FAILURE',
        message: error instanceof Error ? error.message : 'Unexpected normalizer failure.',
      },
    }
  }
}
