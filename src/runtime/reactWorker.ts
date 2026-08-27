import { parseHTML } from 'linkedom'

import type { ReactTestCase } from '@/curriculum/types'

import { errorToMessage, getStatusFromTestResults } from './testHarness'
import type { CodeRunResult } from './types'

export type ReactRunInput = {
  code: string
  componentName: string
  tests: ReactTestCase[]
  timeoutMs?: number
}

export type ReactWorkerRequest = {
  type: 'run'
  requestId: string
  input: ReactRunInput
}

export type ReactWorkerResponse =
  | { type: 'result'; requestId: string; result: CodeRunResult }
  | { type: 'error'; requestId: string; error: string }

// react-dom reads window and document when it loads, so the lightweight DOM
// must exist as globals before the harness (which imports react-dom) does.
// That ordering is why the harness arrives via dynamic import below.
const parsed = parseHTML('<!doctype html><html><body></body></html>')

Object.assign(globalThis, {
  window: parsed.window,
  document: parsed.document,
})

const domHandles = {
  document: parsed.document as Document,
  createEvent: (type: string) =>
    new (parsed.window as unknown as { Event: typeof Event }).Event(type, {
      bubbles: true,
    }),
}

const ready = (async () => {
  const react = await import('react')
  // Learner code compiles against this binding; see transpileReactCode.
  Object.assign(globalThis, { __REACT__: react })

  return import('./reactHarness')
})()

self.addEventListener('message', (event: MessageEvent<ReactWorkerRequest>) => {
  if (event.data.type !== 'run') {
    return
  }

  void handleRun(event.data)
})

async function handleRun(message: ReactWorkerRequest) {
  const startedAt = Date.now()

  try {
    const harness = await ready
    const Component = harness.loadReactComponent(
      message.input.code,
      message.input.componentName,
    )
    const tests = await harness.runReactTestCases(
      Component,
      message.input.tests,
      domHandles,
    )

    const result: CodeRunResult = {
      status: getStatusFromTestResults(tests),
      durationMs: Date.now() - startedAt,
      tests,
      logs: [],
    }

    self.postMessage({
      type: 'result',
      requestId: message.requestId,
      result,
    } satisfies ReactWorkerResponse)
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId: message.requestId,
      error: errorToMessage(error),
    } satisfies ReactWorkerResponse)
  }
}
