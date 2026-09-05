import { describe, expect, it } from 'vitest'

import {
  getRunnerRequestError,
  isRunnerPortResponse,
  MAX_RUNNER_CODE_LENGTH,
  MAX_RUNNER_MESSAGE_BYTES,
  RUNNER_PROTOCOL_VERSION,
} from './sandboxProtocol'

describe('runner sandbox protocol', () => {
  it('accepts a bounded JavaScript request', () => {
    expect(
      getRunnerRequestError({
        type: 'execute',
        protocolVersion: RUNNER_PROTOCOL_VERSION,
        requestId: 'request-1234',
        runner: 'javascript',
        input: {
          code: 'export function solve(value) { return value }',
          functionName: 'solve',
          tests: [{ name: 'returns input', args: [1], expected: 1 }],
        },
      }),
    ).toBeUndefined()
  })

  it('accepts shared references but rejects cyclic input', () => {
    const shared = { value: 1 }
    const createRequest = (args: unknown[]) => ({
      type: 'execute',
      protocolVersion: RUNNER_PROTOCOL_VERSION,
      requestId: 'request-1234',
      runner: 'javascript',
      input: {
        code: 'export function solve(value) { return value }',
        functionName: 'solve',
        tests: [{ name: 'returns input', args, expected: 1 }],
      },
    })

    expect(getRunnerRequestError(createRequest([shared, shared]))).toBeUndefined()

    const cyclic: { self?: unknown } = {}
    cyclic.self = cyclic
    expect(getRunnerRequestError(createRequest([cyclic]))).toBe(
      'Runner request is too large or contains unsupported values.',
    )
  })

  it('bounds structured-clone container payloads', () => {
    const createRequest = (value: unknown) => ({
      type: 'execute',
      protocolVersion: RUNNER_PROTOCOL_VERSION,
      requestId: 'request-1234',
      runner: 'javascript',
      input: {
        code: 'export function solve(value) { return value }',
        functionName: 'solve',
        tests: [{ name: 'returns input', args: [value], expected: value }],
      },
    })
    const oversizedError =
      'Runner request is too large or contains unsupported values.'

    expect(
      getRunnerRequestError(createRequest(new Map([['key', 'value']]))),
    ).toBeUndefined()
    expect(
      getRunnerRequestError(
        createRequest(
          new Map([['key', 'x'.repeat(MAX_RUNNER_MESSAGE_BYTES)]]),
        ),
      ),
    ).toBe(oversizedError)
    expect(
      getRunnerRequestError(
        createRequest(new ArrayBuffer(MAX_RUNNER_MESSAGE_BYTES + 1)),
      ),
    ).toBe(oversizedError)

    const oversizedBuffer = new ArrayBuffer(MAX_RUNNER_MESSAGE_BYTES + 1)
    expect(
      getRunnerRequestError(
        createRequest(new Uint8Array(oversizedBuffer, 0, 1)),
      ),
    ).toBe(oversizedError)
  })

  it('rejects oversized code before it reaches a worker', () => {
    expect(
      getRunnerRequestError({
        type: 'execute',
        protocolVersion: RUNNER_PROTOCOL_VERSION,
        requestId: 'request-1234',
        runner: 'typecheck',
        input: { code: 'x'.repeat(MAX_RUNNER_CODE_LENGTH + 1) },
      }),
    ).toBe('Type-check runner input is invalid.')
  })

  it('rejects malformed and oversized worker responses', () => {
    expect(
      isRunnerPortResponse({
        type: 'result',
        protocolVersion: RUNNER_PROTOCOL_VERSION,
        requestId: 'request-1234',
        runner: 'javascript',
        result: {
          status: 'passed',
          durationMs: 1,
          tests: [],
          logs: [],
          error: 'x'.repeat(1_001),
        },
      }),
    ).toBe(false)

    expect(
      isRunnerPortResponse({
        type: 'result',
        protocolVersion: RUNNER_PROTOCOL_VERSION,
        requestId: '../other-request',
        runner: 'javascript',
        result: {
          status: 'passed',
          durationMs: 1,
          tests: [],
          logs: [],
        },
      }),
    ).toBe(false)
  })
})
