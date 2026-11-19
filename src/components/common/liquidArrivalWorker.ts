import { generateLiquidArrivalField } from './liquidArrivalField'

interface FieldRequest {
  width: number
  height: number
  seed: number
  ampX: number
  ampY: number
}

interface WorkerScope {
  onmessage: ((event: MessageEvent<FieldRequest>) => void) | null
  postMessage: (message: unknown, transfer?: Transferable[]) => void
}

const workerScope = self as unknown as WorkerScope

workerScope.onmessage = (event) => {
  try {
    const field = generateLiquidArrivalField(
      event.data.width,
      event.data.height,
      event.data.seed,
      event.data.ampX,
      event.data.ampY,
    )
    workerScope.postMessage({
      columns: field.columns,
      rows: field.rows,
      values: field.values,
    }, [field.values.buffer])
  } catch (error) {
    workerScope.postMessage({ error: error instanceof Error ? error.message : 'Unable to calculate arrival field' })
  }
}
