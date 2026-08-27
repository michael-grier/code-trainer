import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  runTypeCheck,
  TYPE_GRADER_COMPILER_VERSION,
  type LibFileMap,
} from './typeGrader'

// Load the same lib subset the browser worker bundles: the ES lib chain and
// the decorator libs, without DOM. Grading must not depend on DOM types.
const require = createRequire(import.meta.url)
const libDirectory = dirname(require.resolve('typescript/lib/typescript.js'))

const libFiles: LibFileMap = Object.fromEntries(
  readdirSync(libDirectory)
    .filter(
      (name) =>
        (name.startsWith('lib.es') || name.startsWith('lib.decorators')) &&
        name.endsWith('.d.ts'),
    )
    .map((name) => [name, readFileSync(join(libDirectory, name), 'utf8')]),
)

describe('runTypeCheck', () => {
  it('passes well-typed code and records the compiler version', () => {
    const result = runTypeCheck(
      {
        code: `export function double(value: number): number {
  return value * 2
}
`,
      },
      libFiles,
    )

    expect(result.passed).toBe(true)
    expect(result.diagnostics).toEqual([])
    expect(result.compilerVersion).toBe(TYPE_GRADER_COMPILER_VERSION)
  })

  it('reports a type error in the solution with its location', () => {
    const result = runTypeCheck(
      {
        code: `export function double(value: number): number {
  return String(value)
}
`,
      },
      libFiles,
    )

    expect(result.passed).toBe(false)
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]).toMatchObject({
      source: 'solution',
      line: 2,
      code: 2322,
    })
    expect(result.diagnostics[0].message).toContain('string')
  })

  it('checks strict-mode rules such as implicit any', () => {
    const result = runTypeCheck(
      { code: 'export function identity(value) {\n  return value\n}\n' },
      libFiles,
    )

    expect(result.passed).toBe(false)
    expect(result.diagnostics[0].code).toBe(7006)
  })

  it('accepts a fixture whose expectations hold', () => {
    const result = runTypeCheck(
      {
        code: `export function first<T>(values: T[]): T | undefined {
  return values[0]
}
`,
        typeFixture: `const inferred = first(['a', 'b'])
const check: string | undefined = inferred
void check

// @ts-expect-error first must reject a non-array input
first('not an array')
`,
      },
      libFiles,
    )

    expect(result.passed).toBe(true)
  })

  it('fails when the fixture finds a wrong inferred type, blaming the type tests region', () => {
    const result = runTypeCheck(
      {
        code: `export function first(values: string[]): string {
  return values[0] as string
}
`,
        typeFixture: `const inferred = first(['a'])
const check: number = inferred
void check
`,
      },
      libFiles,
    )

    expect(result.passed).toBe(false)
    expect(result.diagnostics[0]).toMatchObject({
      source: 'type-tests',
      line: 2,
    })
  })

  it('fails when a @ts-expect-error marker goes unused', () => {
    const result = runTypeCheck(
      {
        code: `export function pick(value: string | number): string | number {
  return value
}
`,
        typeFixture: `// @ts-expect-error pick should reject booleans
pick(true as unknown as string)
`,
      },
      libFiles,
    )

    expect(result.passed).toBe(false)
    expect(result.diagnostics[0].code).toBe(2578)
    expect(result.diagnostics[0].source).toBe('type-tests')
  })
})
