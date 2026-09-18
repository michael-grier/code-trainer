import { describe, expect, it } from 'vitest'

import { errorToMessage, formatValue, runTestCases } from './testHarness'
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

describe('formatValue', () => {
  it('shows Set contents and Map entries with their collection types', () => {
    expect(formatValue(new Set([100, 4, 4, 200]))).toBe('Set(3) {\n  100,\n  4,\n  200\n}')
    expect(formatValue(new Map([['a', 2], ['b', 1]]))).toBe('Map(2) {\n  "a" => 2,\n  "b" => 1\n}')
    expect(formatValue(new Set())).toBe('Set(0) {}')
    expect(formatValue(new Map())).toBe('Map(0) {}')
  })

  it('formats nested collections and object keys without losing their contents', () => {
    const value = { groups: new Map([[{ id: 1 }, new Set(['eat', 'tea'])]]) }
    expect(formatValue(value)).toBe(`{
  "groups": Map(1) {
    {
      "id": 1
    } => Set(2) {
      "eat",
      "tea"
    }
  }
}`)
  })

  it('marks actual cycles while displaying shared references in full', () => {
    const shared = { count: 1 }
    expect(formatValue([shared, shared])).toBe(`[
  {
    "count": 1
  },
  {
    "count": 1
  }
]`)
    const set = new Set<unknown>()
    const map = new Map<unknown, unknown>()
    set.add(map)
    map.set(set, map)
    expect(formatValue(set)).toBe('Set(1) {\n  Map(1) {\n    [Circular] => [Circular]\n  }\n}')
    const object: { self?: unknown } = {}
    object.self = object
    expect(formatValue(object)).toBe('{\n  "self": [Circular]\n}')
  })

  it('preserves values JSON would omit or change, including array holes', () => {
    expect(formatValue({ missing: undefined, numbers: [NaN, Infinity, -Infinity, -0, 2n] }))
      .toBe('{\n  "missing": undefined,\n  "numbers": [\n    NaN,\n    Infinity,\n    -Infinity,\n    -0,\n    2n\n  ]\n}')
    const sparse = new Array<unknown>(3)
    sparse[1] = undefined
    sparse[2] = null
    expect(formatValue(sparse)).toBe('[\n  <empty>,\n  undefined,\n  null\n]')
  })

  it('keeps ordinary JSON formatting and displays common built-in values', () => {
    const value = { name: 'hello\nworld', values: [true, null, 3], empty: {} }
    expect(formatValue(value)).toBe(JSON.stringify(value, null, 2))
    expect(formatValue([/ab+/gi, new TypeError('invalid input')]))
      .toBe('[\n  /ab+/gi,\n  TypeError: invalid input\n]')
    expect(formatValue(new Date('2026-01-01T00:00:00Z'))).toBe('"2026-01-01T00:00:00.000Z"')
    expect(formatValue(new Date(NaN))).toBe('Invalid Date')
    expect(formatValue(Symbol('key'))).toBe('Symbol(key)')
    expect(formatValue(function example() {})).toBe('[Function example]')
  })

  it('bounds large and deeply nested collection output', () => {
    expect(formatValue(new Set(['x'.repeat(MAX_RUNNER_TEXT_LENGTH * 2)])).length)
      .toBe(MAX_RUNNER_TEXT_LENGTH)
    let nested: unknown = 1
    for (let index = 0; index < 30; index += 1) nested = new Set([nested])
    expect(formatValue(nested)).toContain('[Max depth]')
  })

  it('limits traversal of repeatedly shared object graphs before clamping text', () => {
    let reads = 0
    let graph: unknown = {
      get value() {
        reads += 1
        return 'leaf'
      },
    }
    for (let depth = 0; depth < 16; depth += 1) graph = [graph, graph]

    expect(formatValue(graph).length).toBeLessThanOrEqual(MAX_RUNNER_TEXT_LENGTH)
    expect(reads).toBeGreaterThan(0)
    expect(reads).toBeLessThanOrEqual(MAX_RUNNER_TEXT_LENGTH)
  })

  it('stops reading wide collections once the shared traversal budget is spent', () => {
    let reads = 0
    const values = Array.from({ length: MAX_RUNNER_TEXT_LENGTH * 2 }, () => ({
      get value() {
        reads += 1
        return 'entry'
      },
    }))

    for (const collection of [values, new Set(values), new Map(values.map((value, index) => [index, value]))]) {
      reads = 0
      expect(formatValue(collection).length).toBeLessThanOrEqual(MAX_RUNNER_TEXT_LENGTH)
      expect(reads).toBeGreaterThan(0)
      expect(reads).toBeLessThanOrEqual(MAX_RUNNER_TEXT_LENGTH)
    }
  })
})
