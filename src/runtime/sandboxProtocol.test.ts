import { describe, expect, it } from 'vitest'

import {
  getRunnerRequestError,
  isRunnerPortResponse,
  MAX_RUNNER_CODE_LENGTH,
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
