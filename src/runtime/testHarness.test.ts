import { describe, expect, it } from 'vitest'

import { errorToMessage, runTestCases } from './testHarness'
import { MAX_RUNNER_TEXT_LENGTH, type ConsoleMessage } from './types'

describe('runTestCases', () => {
  it('marks passing and failing test cases', async () => {
    const results = await runTestCases((value) => value, [
      { name: 'passes', args: ['ready'], expected: 'ready' },
      { name: 'fails', args: ['actual'], expected: 'expected' },
    ])

    expect(results).toMatchObject([
      {
        name: 'passes',
        status: 'passed',
        actual: '"ready"',
        expected: '"ready"',
      },
      {
        name: 'fails',
        status: 'failed',
        actual: '"actual"',
        expected: '"expected"',
      },
    ])
  })

  it('captures thrown runtime errors as readable messages', async () => {
    const results = await runTestCases(() => {
      throw new Error('boom')
    }, [{ name: 'throws', args: [], expected: true }])

    expect(results[0]).toMatchObject({
      status: 'error',
      error: 'boom',
    })
  })

  it('attaches consumed logs to each test result', async () => {
    const logs: ConsoleMessage[] = []

    const results = await runTestCases(
      (value) => {
        logs.push({ method: 'log', values: [`value:${value}`] })
        return value
      },
      [{ name: 'logs', args: ['ready'], expected: 'ready' }],
      {
        consumeLogs: () => logs.splice(0, logs.length),
      },
    )

    expect(results[0].logs).toEqual([
      { method: 'log', values: ['value:ready'] },
    ])
  })

  it('bounds formatted values and errors for the sandbox protocol', async () => {
    const longValue = 'x'.repeat(MAX_RUNNER_TEXT_LENGTH * 2)
    const [result] = await runTestCases(
      () => longValue,
      [{ name: 'large output', args: [], expected: `${longValue}y` }],
    )

    expect(result.actual.length).toBe(MAX_RUNNER_TEXT_LENGTH)
    expect(result.expected.length).toBe(MAX_RUNNER_TEXT_LENGTH)
    expect(result.error?.length).toBe(MAX_RUNNER_TEXT_LENGTH)
    expect(errorToMessage(new Error(longValue)).length).toBe(
      MAX_RUNNER_TEXT_LENGTH,
    )
  })

  it('formats an Error whose message was changed to a non-string', () => {
    const error = new Error('original')
    Object.defineProperty(error, 'message', { value: 42 })

    expect(errorToMessage(error)).toBe('42')
  })
})
