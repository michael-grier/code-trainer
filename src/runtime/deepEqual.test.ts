import { describe, expect, it } from 'vitest'

import { deepEqual } from './deepEqual'

describe('deepEqual', () => {
  it('matches primitives and NaN by value', () => {
    expect(deepEqual('value', 'value')).toBe(true)
    expect(deepEqual(1, '1')).toBe(false)
    expect(deepEqual(Number.NaN, Number.NaN)).toBe(true)
  })

  it('matches nested arrays and objects structurally', () => {
    expect(
      deepEqual(
        { items: [{ id: 'a', values: [1, 2, 3] }] },
        { items: [{ id: 'a', values: [1, 2, 3] }] },
      ),
    ).toBe(true)

    expect(
      deepEqual(
        { items: [{ id: 'a', values: [1, 2, 3] }] },
        { items: [{ id: 'a', values: [1, 3, 2] }] },
      ),
    ).toBe(false)
  })

  it('matches maps and sets without relying on insertion order', () => {
    const leftMap = new Map<unknown, unknown>([
      [{ id: 'first' }, [1, 2]],
      ['second', { ready: true }],
    ])
    const rightMap = new Map<unknown, unknown>([
      ['second', { ready: true }],
      [{ id: 'first' }, [1, 2]],
    ])

    expect(deepEqual(leftMap, rightMap)).toBe(true)
    expect(
      deepEqual(
        new Set([{ id: 1 }, { id: 2 }]),
        new Set([{ id: 2 }, { id: 1 }]),
      ),
    ).toBe(true)
  })

  it('handles circular object graphs', () => {
    const left: { value: string; self?: unknown } = { value: 'a' }
    const right: { value: string; self?: unknown } = { value: 'a' }

    left.self = left
    right.self = right

    expect(deepEqual(left, right)).toBe(true)
  })
})
