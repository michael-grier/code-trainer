import type { TypeCheckInput, TypeCheckResult } from './typeGrader'
import type { TypeWorkerRequest, TypeWorkerResponse } from './typeWorker'

// Booting the compiler worker costs noticeably more than the JS runner
// (it parses the bundled lib files), so one worker is kept alive and reused
// across checks instead of spawning per request.
const TYPE_CHECK_TIMEOUT_MS = 15_000

let sharedWorker: Worker | undefined

export function runTypeCheckInWorker(
  input: TypeCheckInput,
): Promise<TypeCheckResult | { error: string }> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve({
      error: 'Web Workers are not available in this environment.',
    })
  }

  const requestId = createRequestId()
  const worker = getWorker()

  return new Promise((resolve) => {
    const finish = (result: TypeCheckResult | { error: string }) => {
      window.clearTimeout(timeoutId)
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      resolve(result)
    }

    const timeoutId = window.setTimeout(() => {
      // A hung compile leaves the shared worker unusable; discard it so the
      // next check boots a fresh one.
      discardWorker()
      finish({ error: `Type checking timed out after ${TYPE_CHECK_TIMEOUT_MS}ms.` })
    }, TYPE_CHECK_TIMEOUT_MS)

    const handleMessage = (event: MessageEvent<TypeWorkerResponse>) => {
      const message = event.data

      if (message.requestId !== requestId) {
        return
      }

      if (message.type === 'result') {
        finish(message.result)
        return
      }

      finish({ error: message.error })
    }

    const handleError = (event: ErrorEvent) => {
      discardWorker()
      finish({ error: event.message || 'Type checking failed.' })
    }

    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError)

    const request: TypeWorkerRequest = {
      type: 'check',
      requestId,
      input,
    }

    worker.postMessage(request)
  })
}

function getWorker() {
  if (!sharedWorker) {
    sharedWorker = new Worker(new URL('./typeWorker.ts', import.meta.url), {
      name: 'code-trainer-type-grader',
      type: 'module',
    })
  }

  return sharedWorker
}

function discardWorker() {
  sharedWorker?.terminate()
  sharedWorker = undefined
}

function createRequestId() {
  return globalThis.crypto?.randomUUID() ?? `${Date.now()}-${Math.random()}`
}
