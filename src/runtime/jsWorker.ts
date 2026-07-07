import { transform } from 'sucrase'

import {
  errorToMessage,
  formatValue,
  getStatusFromTestResults,
  runTestCases,
} from './testHarness'
import type { TestCandidate } from './testHarness'
import type {
  CodeRunResult,
  ConsoleMessage,
  ConsoleMethod,
  RuntimeWorkerRequest,
  RuntimeWorkerResponse,
} from './types'

type WorkerScope = {
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<RuntimeWorkerRequest>) => void,
  ) => void
  postMessage: (message: RuntimeWorkerResponse) => void
}

const workerScope = self as unknown as WorkerScope

workerScope.addEventListener('message', (event) => {
  if (event.data.type !== 'run') {
    return
  }

  void handleRun(event.data)
})

async function handleRun(message: RuntimeWorkerRequest) {
  const startedAt = getNow()

  try {
    const consoleCapture = createConsoleCapture()
    consoleCapture.install()

    try {
      const moduleUrl = createUserModuleUrl(message.input.code)
      const userModule = await import(/* @vite-ignore */ moduleUrl)
      URL.revokeObjectURL(moduleUrl)

      const candidateValue = (userModule as Record<string, unknown>)[
        message.input.functionName
      ]

      if (typeof candidateValue !== 'function') {
        throw new Error(
          `Expected exported function "${message.input.functionName}" to exist.`,
        )
      }

      const candidate = candidateValue as TestCandidate
      const loadLogs = consoleCapture.consume()
      const tests = await runTestCases(candidate, message.input.tests, {
        consumeLogs: consoleCapture.consume,
      })
      const result: CodeRunResult = {
        language: 'ts',
        status: getStatusFromTestResults(tests),
        durationMs: getElapsedMs(startedAt),
        tests,
        logs: loadLogs,
      }

      workerScope.postMessage({
        type: 'result',
        requestId: message.requestId,
        result,
      })
    } finally {
      consoleCapture.restore()
    }
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      requestId: message.requestId,
      error: errorToMessage(error),
    })
  }
}

function createUserModuleUrl(code: string) {
  const transformed = transform(code, {
    transforms: ['typescript'],
  }).code

  return URL.createObjectURL(
    new Blob([transformed], { type: 'text/javascript' }),
  )
}

function createConsoleCapture() {
  const messages: ConsoleMessage[] = []
  const originalConsole = {
    error: console.error,
    info: console.info,
    log: console.log,
    warn: console.warn,
  } satisfies Record<ConsoleMethod, (...values: unknown[]) => void>

  const append = (method: ConsoleMethod, values: unknown[]) => {
    if (messages.length >= 100) {
      return
    }

    messages.push({
      method,
      values: values.map(formatValue),
    })
  }

  return {
    consume: () => messages.splice(0, messages.length),
    install: () => {
      console.error = (...values: unknown[]) => append('error', values)
      console.info = (...values: unknown[]) => append('info', values)
      console.log = (...values: unknown[]) => append('log', values)
      console.warn = (...values: unknown[]) => append('warn', values)
    },
    restore: () => {
      console.error = originalConsole.error
      console.info = originalConsole.info
      console.log = originalConsole.log
      console.warn = originalConsole.warn
    },
  }
}

function getNow() {
  return globalThis.performance?.now() ?? Date.now()
}

function getElapsedMs(startedAt: number) {
  return Math.max(0, Math.round(getNow() - startedAt))
}
