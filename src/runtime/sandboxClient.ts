import type { ReactRunInput } from './reactWorker'
import {
  createRunnerRequestId,
  getRunnerRequestError,
  isRunnerPortResponse,
  RUNNER_PROTOCOL_VERSION,
  type JavaScriptRunnerRequest,
  type ReactRunnerRequest,
  type RunnerExecuteRequest,
  type RunnerKind,
  type RunnerResultResponse,
  type TypeCheckRunnerRequest,
} from './sandboxProtocol'
import type { TypeCheckInput, TypeCheckResult } from './typeGrader'
import type { CodeRunResult, RuntimeWorkerInput } from './types'

const FRAME_READY_TIMEOUT_MS = 10_000

type RunnerConnection = {
  iframe: HTMLIFrameElement
  port: MessagePort
  pending: Map<string, PendingRequest>
}

type PendingRequest = {
  runner: RunnerKind
  resolve: (response: RunnerResultResponse) => void
  reject: (error: Error) => void
  timeoutId: number
}

let connectionPromise: Promise<RunnerConnection> | undefined

export class RunnerSandboxTimeoutError extends Error {
  constructor() {
    super('Runner execution timed out.')
    this.name = 'RunnerSandboxTimeoutError'
  }
}

export function executeRunnerRequest(
  request: JavaScriptRunnerRequest,
  timeoutMs: number,
): Promise<CodeRunResult>
export function executeRunnerRequest(
  request: ReactRunnerRequest,
  timeoutMs: number,
): Promise<CodeRunResult>
export function executeRunnerRequest(
  request: TypeCheckRunnerRequest,
  timeoutMs: number,
): Promise<TypeCheckResult>
export async function executeRunnerRequest(
  request: RunnerExecuteRequest,
  timeoutMs: number,
): Promise<CodeRunResult | TypeCheckResult> {
  const requestError = getRunnerRequestError(request)

  if (requestError) {
    throw new Error(requestError)
  }

  const connection = await getConnectionWithinStartupBudget()

  return new Promise((resolve, reject) => {
    const finishWithError = (error: Error) => {
      const pending = connection.pending.get(request.requestId)

      if (!pending) {
        return
      }

      window.clearTimeout(pending.timeoutId)
      connection.pending.delete(request.requestId)
      reject(error)
    }

    const timeoutId = window.setTimeout(() => {
      try {
        connection.port.postMessage({
          type: 'cancel',
          protocolVersion: RUNNER_PROTOCOL_VERSION,
          requestId: request.requestId,
        })
      } finally {
        finishWithError(new RunnerSandboxTimeoutError())
      }
    }, timeoutMs)

    connection.pending.set(request.requestId, {
      runner: request.runner,
      resolve: (response) => resolve(response.result),
      reject,
      timeoutId,
    })

    try {
      connection.port.postMessage(request)
    } catch (error) {
      finishWithError(
        error instanceof Error
          ? error
          : new Error('Unable to send work to the secure runner.'),
      )
    }
  })
}

export function createJavaScriptRunnerRequest(
  input: RuntimeWorkerInput,
): JavaScriptRunnerRequest {
  return {
    type: 'execute',
    protocolVersion: RUNNER_PROTOCOL_VERSION,
    requestId: createRunnerRequestId(),
    runner: 'javascript',
    input,
  }
}

export function createReactRunnerRequest(
  input: ReactRunInput,
): ReactRunnerRequest {
  return {
    type: 'execute',
    protocolVersion: RUNNER_PROTOCOL_VERSION,
    requestId: createRunnerRequestId(),
    runner: 'react',
    input,
  }
}

export function createTypeCheckRunnerRequest(
  input: TypeCheckInput,
): TypeCheckRunnerRequest {
  return {
    type: 'execute',
    protocolVersion: RUNNER_PROTOCOL_VERSION,
    requestId: createRunnerRequestId(),
    runner: 'typecheck',
    input,
  }
}

async function getConnectionWithinStartupBudget() {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof MessageChannel === 'undefined' ||
    typeof Worker === 'undefined'
  ) {
    throw new Error('The secure code runner is not available in this environment.')
  }

  let timeoutId = 0

  try {
    return await Promise.race([
      getRunnerConnection(),
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new RunnerSandboxTimeoutError()),
          FRAME_READY_TIMEOUT_MS,
        )
      }),
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function getRunnerConnection() {
  connectionPromise ??= createRunnerConnection().catch((error) => {
    connectionPromise = undefined
    throw error
  })

  return connectionPromise
}

function createRunnerConnection(): Promise<RunnerConnection> {
  return new Promise((resolve, reject) => {
    const nonce = createRunnerRequestId()
    const iframe = document.createElement('iframe')
    const channel = new MessageChannel()
    const pending = new Map<string, PendingRequest>()
    let settled = false

    // The opaque-origin frame never joins the page's accessibility tree or
    // layout. It exists only to host network-denied worker execution.
    iframe.hidden = true
    iframe.tabIndex = -1
    iframe.title = 'Secure code runner'
    iframe.dataset.codeTrainerRunner = ''
    iframe.referrerPolicy = 'no-referrer'
    iframe.sandbox.add('allow-scripts')
    iframe.src = getSandboxFrameUrl(nonce)

    const failConnection = (error: Error) => {
      if (!settled) {
        settled = true
        channel.port1.close()
        iframe.remove()
        reject(error)
        return
      }

      for (const request of pending.values()) {
        window.clearTimeout(request.timeoutId)
        request.reject(error)
      }
      pending.clear()
      connectionPromise = undefined
      channel.port1.close()
      iframe.remove()
    }

    channel.port1.addEventListener('message', (event: MessageEvent<unknown>) => {
      const response = event.data

      if (!isRunnerPortResponse(response)) {
        return
      }

      if (response.type === 'ready') {
        if (settled) {
          return
        }

        settled = true
        resolve({ iframe, port: channel.port1, pending })
        return
      }

      const request = pending.get(response.requestId)

      // Completed IDs stay invalid because the parent removes them here and
      // the frame independently rejects reuse.
      if (!request || request.runner !== response.runner) {
        return
      }

      window.clearTimeout(request.timeoutId)
      pending.delete(response.requestId)

      if (response.type === 'error') {
        request.reject(new Error(response.error))
        return
      }

      request.resolve(response)
    })
    channel.port1.addEventListener('messageerror', () => {
      failConnection(new Error('The secure runner returned an unreadable message.'))
    })
    channel.port1.start()

    iframe.addEventListener('load', () => {
      try {
        iframe.contentWindow?.postMessage(
          {
            type: 'connect-runner',
            protocolVersion: RUNNER_PROTOCOL_VERSION,
            nonce,
          },
          '*',
          [channel.port2],
        )
      } catch (error) {
        failConnection(
          error instanceof Error
            ? error
            : new Error('Unable to initialize the secure runner.'),
        )
      }
    })
    iframe.addEventListener('error', () => {
      failConnection(new Error('Unable to load the secure runner.'))
    })

    document.body.appendChild(iframe)
  })
}

function getSandboxFrameUrl(nonce: string) {
  const basePath = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  const url = new URL(`${basePath}runner-sandbox.html`, window.location.origin)
  url.hash = nonce
  return url.href
}
