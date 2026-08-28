import type { ReactTestCase } from '@/curriculum/types'

import type {
  ReactRunInput,
  ReactWorkerRequest,
  ReactWorkerResponse,
} from './reactWorker'
import type { CodeRunResult, TestRunResult } from './types'

// Component tests pay a worker boot that includes React itself, so the
// budget is looser than the plain JS runner's.
const REACT_RUN_TIMEOUT_MS = 5_000

export function runReactTests(input: ReactRunInput): Promise<CodeRunResult> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve({
      status: 'error',
      durationMs: 0,
      tests: [],
      logs: [],
      error: 'Web Workers are not available in this environment.',
    })
  }

  const timeoutMs = input.timeoutMs ?? REACT_RUN_TIMEOUT_MS
  const startedAt = Date.now()
  const requestId = createRequestId()
  // One worker per run, terminated on completion or timeout, so a learner
  // component stuck in a render loop can always be killed.
  const worker = new Worker(new URL('./reactWorker.ts', import.meta.url), {
    name: 'code-trainer-react-runner',
    type: 'module',
  })

  return new Promise((resolve) => {
    const finish = (result: CodeRunResult) => {
      window.clearTimeout(timeoutId)
      worker.terminate()
      resolve(result)
    }

    const timeoutId = window.setTimeout(() => {
      finish(createTimeoutResult(input.tests, timeoutMs, Date.now() - startedAt))
    }, timeoutMs)

    worker.addEventListener(
      'message',
      (event: MessageEvent<ReactWorkerResponse>) => {
        const message = event.data

        if (message.requestId !== requestId) {
          return
        }

        if (message.type === 'result') {
          finish(message.result)
          return
        }

        finish({
          status: 'error',
          durationMs: Date.now() - startedAt,
          tests: [],
          logs: [],
          error: message.error,
        })
      },
    )

    worker.addEventListener('error', (event) => {
      finish({
        status: 'error',
        durationMs: Date.now() - startedAt,
        tests: [],
        logs: [],
        error: event.message,
      })
    })

    worker.postMessage({
      type: 'run',
      requestId,
      input,
    } satisfies ReactWorkerRequest)
  })
}

function createTimeoutResult(
  tests: ReactTestCase[],
  timeoutMs: number,
  durationMs: number,
): CodeRunResult {
  return {
    status: 'timeout',
    durationMs,
    tests: tests.map<TestRunResult>((test) => ({
      name: test.name,
      status: 'timeout',
      expected: '',
      actual: '',
      durationMs: timeoutMs,
      logs: [],
      error: `Execution timed out after ${timeoutMs}ms.`,
    })),
    logs: [],
    error: `Execution timed out after ${timeoutMs}ms.`,
  }
}

function createRequestId() {
  return globalThis.crypto?.randomUUID() ?? `${Date.now()}-${Math.random()}`
}
