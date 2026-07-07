import { describe, expect, it } from 'vitest'

import { allStaticChecksPassed, runStaticChecks } from './staticChecks'

describe('static checks', () => {
  it('evaluates text and line-count checks', () => {
    const results = runStaticChecks('const value = new Map()\nreturn value', [
      {
        kind: 'require-text',
        text: 'new Map',
        message: 'Use a map.',
      },
      {
        kind: 'forbid-text',
        text: 'var ',
        message: 'Avoid var.',
      },
      {
        kind: 'max-lines',
        max: 2,
        message: 'Keep it short.',
      },
    ])

    expect(results.map((result) => result.passed)).toEqual([
      true,
      true,
      true,
    ])
    expect(allStaticChecksPassed(results)).toBe(true)
  })

  it('ignores no-any matches inside comments and strings', () => {
    expect(
      runStaticChecks('const text = "any"\n// any\nconst value: unknown = 1', [
        { kind: 'no-any', message: 'Avoid any.' },
      ])[0].passed,
    ).toBe(true)

    expect(
      runStaticChecks('const value: any = 1', [
        { kind: 'no-any', message: 'Avoid any.' },
      ])[0].passed,
    ).toBe(false)
  })

  it('detects assignments and common mutating calls on configured targets', () => {
    expect(
      runStaticChecks('items.push(1)', [
        {
          kind: 'no-mutation',
          targets: ['items'],
          message: 'Do not mutate items.',
        },
      ])[0].passed,
    ).toBe(false)

    expect(
      runStaticChecks('return [...items, 1]', [
        {
          kind: 'no-mutation',
          targets: ['items'],
          message: 'Do not mutate items.',
        },
      ])[0].passed,
    ).toBe(true)

    expect(
      runStaticChecks('return items === otherItems', [
        {
          kind: 'no-mutation',
          targets: ['items'],
          message: 'Do not mutate items.',
        },
      ])[0].passed,
    ).toBe(true)
  })
})
