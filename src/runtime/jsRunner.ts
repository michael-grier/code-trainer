import type { TestCase } from '@/curriculum/types'

import { formatValue } from './testHarness'
import {
  DEFAULT_RUN_TIMEOUT_MS,
  type CodeRunResult,
  type RuntimeWorkerInput,
  type RuntimeWorkerRequest,
  type RuntimeWorkerResponse,
  type TestRunResult,
} from './types'

export function runTypeScriptTests(
  input: RuntimeWorkerInput,
): Promise<CodeRunResult> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve({
      status: 'error',
      durationMs: 0,
      tests: [],
      logs: [],
      error: 'Web Workers are not available in this environment.',
    })
  }

  const timeoutMs = input.timeoutMs ?? DEFAULT_RUN_TIMEOUT_MS
  const startedAt = getNow()
  const requestId = createRequestId()
  const worker = new Worker(new URL('./jsWorker.ts', import.meta.url), {
    name: 'code-trainer-ts-runner',
    type: 'module',
  })

  return new Promise((resolve) => {
    const finish = (result: CodeRunResult) => {
      window.clearTimeout(timeoutId)
      worker.terminate()
      resolve(result)
    }

    const timeoutId = window.setTimeout(() => {
      finish(createTimeoutResult(input.tests, timeoutMs, getElapsedMs(startedAt)))
    }, timeoutMs)

    worker.addEventListener('message', (event: MessageEvent<RuntimeWorkerResponse>) => {
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
        durationMs: getElapsedMs(startedAt),
        tests: [],
        logs: [],
        error: message.error,
      })
    })

    worker.addEventListener('error', (event) => {
      finish({
        status: 'error',
        durationMs: getElapsedMs(startedAt),
        tests: [],
        logs: [],
        error: event.message,
      })
    })

    const request: RuntimeWorkerRequest = {
      type: 'run',
      requestId,
      input,
    }

    worker.postMessage(request)
  })
}

function createTimeoutResult(
  tests: TestCase[],
  timeoutMs: number,
  durationMs: number,
): CodeRunResult {
  return {
    status: 'timeout',
    durationMs,
    tests: tests.map<TestRunResult>((test) => ({
      name: test.name,
      status: 'timeout',
      expected: formatValue(test.expected),
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

function getNow() {
  return globalThis.performance?.now() ?? Date.now()
}

function getElapsedMs(startedAt: number) {
  return Math.max(0, Math.round(getNow() - startedAt))
}
