import {
  isCodeRunResult,
  isRunnerConnectMessage,
  isRunnerPortRequest,
  isRunnerPortResponse,
  isTypeCheckResult,
  RUNNER_PROTOCOL_VERSION,
  type RunnerExecuteRequest,
  type RunnerKind,
  type RunnerPortResponse,
  type RunnerResultResponse,
} from './sandboxProtocol'
import type { CodeRunResult } from './types'

const MAX_ACTIVE_EXECUTIONS = 4
const MAX_REMEMBERED_REQUESTS = 1_000

type WorkerSourceRegistry = Partial<Record<RunnerKind, string>>

declare global {
  var __CODE_TRAINER_WORKER_SOURCES__: WorkerSourceRegistry | undefined
}

type ActiveExecution = {
  runner: RunnerKind
  worker?: Worker
  cancelled: boolean
}

const activeExecutions = new Map<string, ActiveExecution>()
const rememberedRequestIds = new Set<string>()
const requestIdOrder: string[] = []
const workerSourcePromises = new Map<RunnerKind, Promise<string>>()
const connectionNonce = window.location.hash.slice(1)

window.addEventListener('message', connectRunner)

function connectRunner(event: MessageEvent<unknown>) {
  if (
    event.source !== window.parent ||
    event.ports.length !== 1 ||
    !isRunnerConnectMessage(event.data) ||
    event.data.nonce !== connectionNonce
  ) {
    return
  }

  window.removeEventListener('message', connectRunner)
  const port = event.ports[0]
  port.addEventListener('message', (portEvent: MessageEvent<unknown>) => {
    handlePortMessage(port, portEvent.data)
  })
  port.addEventListener('messageerror', () => closeAllExecutions())
  port.start()
  postResponse(port, {
    type: 'ready',
    protocolVersion: RUNNER_PROTOCOL_VERSION,
  })
}

function handlePortMessage(port: MessagePort, value: unknown) {
  if (!isRunnerPortRequest(value)) {
    return
  }

  if (value.type === 'cancel') {
    cancelExecution(value.requestId)
    return
  }

  if (rememberedRequestIds.has(value.requestId)) {
    postError(port, value, 'Runner request IDs cannot be reused.')
    return
  }

  rememberRequestId(value.requestId)

  if (activeExecutions.size >= MAX_ACTIVE_EXECUTIONS) {
    postError(port, value, 'The runner is busy. Try again in a moment.')
    return
  }

  const execution: ActiveExecution = {
    runner: value.runner,
    cancelled: false,
  }
  activeExecutions.set(value.requestId, execution)
  void startExecution(port, value, execution)
}

async function startExecution(
  port: MessagePort,
  request: RunnerExecuteRequest,
  execution: ActiveExecution,
) {
  try {
    const worker = await createWorker(request.runner)
    execution.worker = worker

    if (execution.cancelled) {
      worker.terminate()
      return
    }

    worker.addEventListener('message', (event: MessageEvent<unknown>) => {
      handleWorkerMessage(port, request, worker, event.data)
    })
    worker.addEventListener('messageerror', () => {
      finishWithError(
        port,
        request,
        worker,
        'The runner produced an unreadable result.',
      )
    })
    worker.addEventListener('error', (event) => {
      finishWithError(
        port,
        request,
        worker,
        clampError(event.message || 'Runner execution failed.'),
      )
    })

    if (request.runner === 'javascript') {
      worker.postMessage({
        type: 'run',
        requestId: request.requestId,
        input: request.input,
      })
      return
    }

    if (request.runner === 'react') {
      worker.postMessage({
        type: 'run',
        requestId: request.requestId,
        input: request.input,
      })
      return
    }

    worker.postMessage({
      type: 'check',
      requestId: request.requestId,
      input: request.input,
    })
  } catch {
    finishWithError(
      port,
      request,
      execution.worker,
      'Unable to start the secure runner.',
    )
  }
}

async function createWorker(runner: RunnerKind) {
  const source = await loadWorkerSource(runner)
  const workerUrl = URL.createObjectURL(
    new Blob([source], { type: 'text/javascript' }),
  )
  const worker = new Worker(workerUrl, {
    name: `code-trainer-${runner}-runner`,
  })
  let revoked = false
  const revokeWorkerUrl = () => {
    if (revoked) {
      return
    }

    revoked = true
    URL.revokeObjectURL(workerUrl)
  }

  // WebKit consumes a blob worker URL asynchronously and fails if it is
  // revoked immediately after construction. The first event proves loading
  // finished; the timer covers workers that hang before posting anything.
  worker.addEventListener('message', revokeWorkerUrl, { once: true })
  worker.addEventListener('error', revokeWorkerUrl, { once: true })
  window.setTimeout(revokeWorkerUrl, 60_000)

  return worker
}

function loadWorkerSource(runner: RunnerKind) {
  const existingSource = globalThis.__CODE_TRAINER_WORKER_SOURCES__?.[runner]
  if (existingSource) {
    return Promise.resolve(existingSource)
  }

  const existingPromise = workerSourcePromises.get(runner)
  if (existingPromise) {
    return existingPromise
  }

  const sourcePromise = new Promise<string>((resolve, reject) => {
    const script = document.createElement('script')
    // A classic script can load a trusted bundle into this opaque-origin
    // frame without granting the learner worker an application origin.
    script.src = new URL(
      `runner-assets/${runner}.js`,
      window.location.href,
    ).href
    script.addEventListener('load', () => {
      script.remove()
      const source = globalThis.__CODE_TRAINER_WORKER_SOURCES__?.[runner]

      if (source) {
        resolve(source)
        return
      }

      reject(new Error('The runner bundle did not register its source.'))
    })
    script.addEventListener('error', () => {
      script.remove()
      reject(new Error('Unable to load the runner bundle.'))
    })
    document.head.appendChild(script)
  }).catch((error) => {
    workerSourcePromises.delete(runner)
    throw error
  })

  workerSourcePromises.set(runner, sourcePromise)
  return sourcePromise
}

function handleWorkerMessage(
  port: MessagePort,
  request: RunnerExecuteRequest,
  worker: Worker,
  value: unknown,
) {
  const execution = activeExecutions.get(request.requestId)

  if (!execution || execution.worker !== worker || !isRecord(value)) {
    return
  }

  // Learner code shares a worker global with the harness and can call
  // postMessage. Only the unguessable current ID and a fully valid result can
  // leave the sandbox.
  if (value.requestId !== request.requestId) {
    return
  }

  if (value.type === 'error' && typeof value.error === 'string') {
    finishWithError(port, request, worker, clampError(value.error))
    return
  }

  if (value.type !== 'result') {
    finishWithError(port, request, worker, 'The runner result was invalid.')
    return
  }

  if (request.runner === 'typecheck') {
    if (!isTypeCheckResult(value.result)) {
      finishWithError(port, request, worker, 'The type-check result was invalid.')
      return
    }

    finishWithResult(port, request, worker, {
      type: 'result',
      protocolVersion: RUNNER_PROTOCOL_VERSION,
      requestId: request.requestId,
      runner: 'typecheck',
      result: value.result,
    })
    return
  }

  if (
    !isCodeRunResult(value.result) ||
    !matchesExpectedTests(request, value.result)
  ) {
    finishWithError(port, request, worker, 'The runner result was invalid.')
    return
  }

  const response: RunnerResultResponse = {
    type: 'result',
    protocolVersion: RUNNER_PROTOCOL_VERSION,
    requestId: request.requestId,
    runner: request.runner,
    result: value.result,
  }
  finishWithResult(port, request, worker, response)
}

function finishWithResult(
  port: MessagePort,
  request: RunnerExecuteRequest,
  worker: Worker,
  response: RunnerResultResponse,
) {
  if (!activeExecutions.delete(request.requestId)) {
    return
  }

  worker.terminate()

  if (!isRunnerPortResponse(response)) {
    postError(port, request, 'The runner result was too large.')
    return
  }

  postResponse(port, response)
}

function matchesExpectedTests(
  request: Exclude<RunnerExecuteRequest, { runner: 'typecheck' }>,
  result: CodeRunResult,
) {
  return (
    result.tests.length === request.input.tests.length &&
    result.tests.every(
      (test, index) => test.name === request.input.tests[index]?.name,
    )
  )
}

function finishWithError(
  port: MessagePort,
  request: RunnerExecuteRequest,
  worker: Worker | undefined,
  error: string,
) {
  if (!activeExecutions.delete(request.requestId)) {
    return
  }

  worker?.terminate()
  postError(port, request, error)
}

function postError(
  port: MessagePort,
  request: RunnerExecuteRequest,
  error: string,
) {
  postResponse(port, {
    type: 'error',
    protocolVersion: RUNNER_PROTOCOL_VERSION,
    requestId: request.requestId,
    runner: request.runner,
    error: clampError(error),
  })
}

function postResponse(port: MessagePort, response: RunnerPortResponse) {
  if (isRunnerPortResponse(response)) {
    port.postMessage(response)
  }
}

function cancelExecution(requestId: string) {
  const execution = activeExecutions.get(requestId)

  if (!execution) {
    return
  }

  execution.cancelled = true
  execution.worker?.terminate()
  activeExecutions.delete(requestId)
}

function closeAllExecutions() {
  for (const execution of activeExecutions.values()) {
    execution.cancelled = true
    execution.worker?.terminate()
  }
  activeExecutions.clear()
}

function rememberRequestId(requestId: string) {
  rememberedRequestIds.add(requestId)
  requestIdOrder.push(requestId)

  if (requestIdOrder.length <= MAX_REMEMBERED_REQUESTS) {
    return
  }

  const oldestRequestId = requestIdOrder.shift()
  if (oldestRequestId) {
    rememberedRequestIds.delete(oldestRequestId)
  }
}

function clampError(error: string) {
  return error.slice(0, 1_000)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
