import type { ReactTestCase, TestCase } from '@/curriculum/types'

import type { ReactRunInput } from './reactWorker'
import type { TypeCheckInput, TypeCheckResult } from './typeGrader'
import {
  MAX_RUNNER_TEXT_LENGTH,
  type CodeRunResult,
  type RuntimeWorkerInput,
} from './types'

export const RUNNER_PROTOCOL_VERSION = 1
export const MAX_RUNNER_CODE_LENGTH = 200_000
export const MAX_RUNNER_MESSAGE_BYTES = 1_000_000

const MAX_REQUEST_ID_LENGTH = 128
const MAX_TEST_CASES = 100
const MAX_VALUE_DEPTH = 32
const MAX_VALUE_NODES = 50_000

export type RunnerKind = 'javascript' | 'react' | 'typecheck'

export type JavaScriptRunnerRequest = {
  type: 'execute'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
  requestId: string
  runner: 'javascript'
  input: RuntimeWorkerInput
}

export type ReactRunnerRequest = {
  type: 'execute'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
  requestId: string
  runner: 'react'
  input: ReactRunInput
}

export type TypeCheckRunnerRequest = {
  type: 'execute'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
  requestId: string
  runner: 'typecheck'
  input: TypeCheckInput
}

export type RunnerExecuteRequest =
  | JavaScriptRunnerRequest
  | ReactRunnerRequest
  | TypeCheckRunnerRequest

export type RunnerCancelRequest = {
  type: 'cancel'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
  requestId: string
}

export type RunnerPortRequest = RunnerExecuteRequest | RunnerCancelRequest

export type RunnerReadyResponse = {
  type: 'ready'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
}

export type JavaScriptRunnerResult = {
  type: 'result'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
  requestId: string
  runner: 'javascript'
  result: CodeRunResult
}

export type ReactRunnerResult = {
  type: 'result'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
  requestId: string
  runner: 'react'
  result: CodeRunResult
}

export type TypeCheckRunnerResult = {
  type: 'result'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
  requestId: string
  runner: 'typecheck'
  result: TypeCheckResult
}

export type RunnerResultResponse =
  | JavaScriptRunnerResult
  | ReactRunnerResult
  | TypeCheckRunnerResult

export type RunnerErrorResponse = {
  type: 'error'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
  requestId: string
  runner: RunnerKind
  error: string
}

export type RunnerPortResponse =
  | RunnerReadyResponse
  | RunnerResultResponse
  | RunnerErrorResponse

export type RunnerConnectMessage = {
  type: 'connect-runner'
  protocolVersion: typeof RUNNER_PROTOCOL_VERSION
  nonce: string
}

export function createRunnerRequestId() {
  if (!globalThis.crypto) {
    throw new Error('Secure random IDs are unavailable in this browser.')
  }

  if (globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  const randomBytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes, (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('')
}

export function getRunnerRequestError(value: unknown): string | undefined {
  if (!isRecord(value) || value.protocolVersion !== RUNNER_PROTOCOL_VERSION) {
    return 'Unsupported runner protocol message.'
  }

  if (value.type === 'cancel') {
    return isRequestId(value.requestId)
      ? undefined
      : 'Runner request ID is invalid.'
  }

  if (value.type !== 'execute' || !isRequestId(value.requestId)) {
    return 'Runner request is invalid.'
  }

  if (!hasSafeMessageSize(value)) {
    return 'Runner request is too large or contains unsupported values.'
  }

  switch (value.runner) {
    case 'javascript':
      return isJavaScriptInput(value.input)
        ? undefined
        : 'JavaScript runner input is invalid.'
    case 'react':
      return isReactInput(value.input)
        ? undefined
        : 'React runner input is invalid.'
    case 'typecheck':
      return isTypeCheckInput(value.input)
        ? undefined
        : 'Type-check runner input is invalid.'
    default:
      return 'Runner type is invalid.'
  }
}

export function isRunnerPortRequest(value: unknown): value is RunnerPortRequest {
  return getRunnerRequestError(value) === undefined
}

export function isRunnerConnectMessage(
  value: unknown,
): value is RunnerConnectMessage {
  return (
    isRecord(value) &&
    value.type === 'connect-runner' &&
    value.protocolVersion === RUNNER_PROTOCOL_VERSION &&
    isRequestId(value.nonce) &&
    hasSafeMessageSize(value)
  )
}

export function isRunnerPortResponse(value: unknown): value is RunnerPortResponse {
  if (
    !isRecord(value) ||
    value.protocolVersion !== RUNNER_PROTOCOL_VERSION ||
    !hasSafeMessageSize(value)
  ) {
    return false
  }

  if (value.type === 'ready') {
    return true
  }

  if (
    !isRequestId(value.requestId) ||
    !isRunnerKind(value.runner)
  ) {
    return false
  }

  if (value.type === 'error') {
    return isShortText(value.error)
  }

  if (value.type !== 'result') {
    return false
  }

  if (value.runner === 'typecheck') {
    return isTypeCheckResult(value.result)
  }

  return isCodeRunResult(value.result)
}

export function isCodeRunResult(value: unknown): value is CodeRunResult {
  if (
    !isRecord(value) ||
    !isCodeRunStatus(value.status) ||
    !isDuration(value.durationMs) ||
    !Array.isArray(value.tests) ||
    value.tests.length > MAX_TEST_CASES ||
    !Array.isArray(value.logs) ||
    value.logs.length > 100 ||
    (value.error !== undefined && !isShortText(value.error))
  ) {
    return false
  }

  return (
    value.tests.every((test) => {
      if (
        !isRecord(test) ||
        !isShortText(test.name) ||
        !isTestRunStatus(test.status) ||
        !isShortText(test.expected) ||
        !isShortText(test.actual) ||
        !isDuration(test.durationMs) ||
        !Array.isArray(test.logs) ||
        test.logs.length > 100 ||
        (test.error !== undefined && !isShortText(test.error))
      ) {
        return false
      }

      return test.logs.every(isConsoleMessage)
    }) && value.logs.every(isConsoleMessage)
  )
}

export function isTypeCheckResult(value: unknown): value is TypeCheckResult {
  return (
    isRecord(value) &&
    typeof value.passed === 'boolean' &&
    isShortText(value.compilerVersion) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.length <= MAX_TEST_CASES &&
    value.diagnostics.every(
      (diagnostic) =>
        isRecord(diagnostic) &&
        typeof diagnostic.line === 'number' &&
        Number.isInteger(diagnostic.line) &&
        diagnostic.line > 0 &&
        typeof diagnostic.column === 'number' &&
        Number.isInteger(diagnostic.column) &&
        diagnostic.column > 0 &&
        typeof diagnostic.code === 'number' &&
        Number.isInteger(diagnostic.code) &&
        isShortText(diagnostic.message) &&
        (diagnostic.source === 'solution' ||
          diagnostic.source === 'type-tests'),
    )
  )
}

function isJavaScriptInput(value: unknown): value is RuntimeWorkerInput {
  return (
    isRecord(value) &&
    isCode(value.code) &&
    isShortText(value.functionName) &&
    isOptionalTimeout(value.timeoutMs) &&
    Array.isArray(value.tests) &&
    value.tests.length <= MAX_TEST_CASES &&
    value.tests.every(isTestCase)
  )
}

function isReactInput(value: unknown): value is ReactRunInput {
  return (
    isRecord(value) &&
    isCode(value.code) &&
    isShortText(value.componentName) &&
    isOptionalTimeout(value.timeoutMs) &&
    Array.isArray(value.tests) &&
    value.tests.length <= MAX_TEST_CASES &&
    value.tests.every(isReactTestCase)
  )
}

function isTypeCheckInput(value: unknown): value is TypeCheckInput {
  return (
    isRecord(value) &&
    isCode(value.code) &&
    (value.typeFixture === undefined || isCode(value.typeFixture))
  )
}

function isTestCase(value: unknown): value is TestCase {
  return (
    isRecord(value) &&
    isShortText(value.name) &&
    Array.isArray(value.args) &&
    value.args.length <= 100 &&
    isCloneableValue(value.args) &&
    isCloneableValue(value.expected)
  )
}

function isReactTestCase(value: unknown): value is ReactTestCase {
  if (
    !isRecord(value) ||
    !isShortText(value.name) ||
    (value.props !== undefined &&
      (!isRecord(value.props) || !isCloneableValue(value.props))) ||
    !Array.isArray(value.expect) ||
    value.expect.length > 100 ||
    !value.expect.every(
      (expectation) =>
        isRecord(expectation) &&
        (expectation.type === 'text-present' ||
          expectation.type === 'text-absent') &&
        isShortText(expectation.text),
    )
  ) {
    return false
  }

  return (
    value.steps === undefined ||
    (Array.isArray(value.steps) &&
      value.steps.length <= 100 &&
      value.steps.every((step) => {
        if (!isRecord(step)) {
          return false
        }

        if (step.action === 'click') {
          return isShortText(step.text)
        }

        return (
          step.action === 'type' &&
          isShortText(step.into) &&
          isShortText(step.value)
        )
      }))
  )
}

function isConsoleMessage(value: unknown) {
  return (
    isRecord(value) &&
    (value.method === 'log' ||
      value.method === 'info' ||
      value.method === 'warn' ||
      value.method === 'error') &&
    Array.isArray(value.values) &&
    value.values.length <= 100 &&
    value.values.every(isShortText)
  )
}

function isCode(value: unknown) {
  return typeof value === 'string' && value.length <= MAX_RUNNER_CODE_LENGTH
}

function isShortText(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_RUNNER_TEXT_LENGTH
}

function isOptionalTimeout(value: unknown) {
  return (
    value === undefined ||
    (typeof value === 'number' &&
      Number.isFinite(value) &&
      value > 0 &&
      value <= 60_000)
  )
}

function isDuration(value: unknown) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 60_000
  )
}

function isRequestId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    value.length <= MAX_REQUEST_ID_LENGTH &&
    /^[a-zA-Z0-9-]+$/.test(value)
  )
}

function isRunnerKind(value: unknown): value is RunnerKind {
  return value === 'javascript' || value === 'react' || value === 'typecheck'
}

function isCodeRunStatus(value: unknown) {
  return (
    value === 'passed' ||
    value === 'failed' ||
    value === 'error' ||
    value === 'timeout'
  )
}

function isTestRunStatus(value: unknown) {
  return isCodeRunStatus(value)
}

function hasSafeMessageSize(value: unknown) {
  return isCloneableValue(value, MAX_RUNNER_MESSAGE_BYTES)
}

function isCloneableValue(
  root: unknown,
  byteLimit = MAX_RUNNER_MESSAGE_BYTES,
) {
  // Structured clone supports values such as undefined and bigint that JSON
  // does not. Walk the graph directly while bounding its size and depth.
  const ancestors = new WeakSet<object>()
  const pending: Array<
    | { value: unknown; depth: number }
    | { leave: object }
  > = [
    { value: root, depth: 0 },
  ]
  let bytes = 0
  let nodes = 0
  let scheduledNodes = 1

  while (pending.length > 0) {
    const item = pending.pop()

    if (!item) {
      break
    }

    if ('leave' in item) {
      ancestors.delete(item.leave)
      continue
    }

    nodes += 1
    if (nodes > MAX_VALUE_NODES || item.depth > MAX_VALUE_DEPTH) {
      return false
    }

    const value = item.value
    if (value === null || value === undefined) {
      bytes += 4
    } else if (typeof value === 'string') {
      bytes += value.length * 2
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      bytes += 16
    } else if (typeof value === 'object') {
      if (value instanceof ArrayBuffer) {
        bytes += value.byteLength
        if (bytes > byteLimit) {
          return false
        }
        continue
      }

      if (ArrayBuffer.isView(value)) {
        // SharedArrayBuffer views cannot cross this non-isolated boundary.
        if (!(value.buffer instanceof ArrayBuffer)) {
          return false
        }

        bytes += value.buffer.byteLength
        if (bytes > byteLimit) {
          return false
        }
        continue
      }

      if (value instanceof Date) {
        bytes += 16
        if (bytes > byteLimit) {
          return false
        }
        continue
      }

      if (value instanceof RegExp) {
        bytes += (value.source.length + value.flags.length) * 2
        if (bytes > byteLimit) {
          return false
        }
        continue
      }

      if (ancestors.has(value)) {
        return false
      }

      ancestors.add(value)
      pending.push({ leave: value })

      if (Array.isArray(value)) {
        if (scheduledNodes + value.length > MAX_VALUE_NODES) {
          return false
        }

        scheduledNodes += value.length
        for (let index = 0; index < value.length; index += 1) {
          bytes += String(index).length * 2
          pending.push({ value: value[index], depth: item.depth + 1 })
        }
      } else if (value instanceof Map) {
        const childCount = value.size * 2
        if (scheduledNodes + childCount > MAX_VALUE_NODES) {
          return false
        }

        scheduledNodes += childCount
        bytes += value.size * 16
        for (const [key, entry] of value) {
          pending.push({ value: key, depth: item.depth + 1 })
          pending.push({ value: entry, depth: item.depth + 1 })
        }
      } else if (value instanceof Set) {
        if (scheduledNodes + value.size > MAX_VALUE_NODES) {
          return false
        }

        scheduledNodes += value.size
        bytes += value.size * 8
        for (const entry of value) {
          pending.push({ value: entry, depth: item.depth + 1 })
        }
      } else {
        // Reject host objects whose structured-clone payload is hidden from
        // Object.entries, since their size cannot be bounded here.
        const prototype = Object.getPrototypeOf(value)
        if (prototype !== Object.prototype && prototype !== null) {
          return false
        }

        const entries = Object.entries(value)
        if (scheduledNodes + entries.length > MAX_VALUE_NODES) {
          return false
        }

        scheduledNodes += entries.length
        for (const [key, entry] of entries) {
          bytes += key.length * 2
          pending.push({ value: entry, depth: item.depth + 1 })
        }
      }
    } else {
      return false
    }

    if (bytes > byteLimit) {
      return false
    }
  }

  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
