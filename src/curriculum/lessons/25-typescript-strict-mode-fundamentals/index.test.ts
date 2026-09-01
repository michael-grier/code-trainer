import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runTypeCheck, type LibFileMap } from '../../../runtime/typeGrader'

import { lesson } from './index'

// Same ES-only lib subset the browser type worker bundles; grading must not
// depend on DOM types. Mirrors src/runtime/typeGrader.test.ts.
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

describe('typescript strict-mode fundamentals lesson', () => {
  it('progresses from debugging through implementation to explanation', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'fix-silenced-lookup:debug',
      'read-unknown-setting:code',
      'type-the-order-boundary:refactor',
      'strictness-tradeoff-review:written',
    ])
  })

  it('provides complete runnable practice and reference approaches', () => {
    for (const problem of lesson.problems) {
      if (problem.kind === 'code') {
        expect(problem.prompt).toContain('Example:')
        expect(problem.starter).toContain('console.log')
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      }

      if (problem.kind === 'debug') {
        expect(problem.brokenCode).toContain('console.log')
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
        expect(problem.bugHints?.length).toBeGreaterThan(0)
      }

      if (problem.kind === 'refactor') {
        expect(problem.prompt).toContain('Example:')
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
        expect(problem.goals.length).toBeGreaterThan(0)
        expect(problem.staticChecks.length).toBeGreaterThan(0)
      }

      if (
        problem.kind === 'code' ||
        problem.kind === 'debug' ||
        problem.kind === 'refactor'
      ) {
        expect(lesson.approaches[problem.id]?.[0]?.code).toContain(
          `function ${problem.functionName}`,
        )
      }

      if (problem.kind === 'written') {
        expect(problem.referenceAnswer.length).toBeGreaterThan(200)
        expect(problem.rubric?.length).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('grades every reference approach clean against its type fixture', () => {
    for (const problem of lesson.problems) {
      if (
        problem.kind !== 'code' &&
        problem.kind !== 'debug' &&
        problem.kind !== 'refactor'
      ) {
        continue
      }

      expect(problem.typeFixture).toBeDefined()

      const code = lesson.approaches[problem.id]?.[0]?.code
      expect(code).toBeDefined()

      const result = runTypeCheck(
        { code: `${code}\n`, typeFixture: problem.typeFixture },
        libFiles,
      )

      expect(result.diagnostics, problem.id).toEqual([])
      expect(result.passed, problem.id).toBe(true)
    }
  })

  it('keeps the debug premise: the silenced broken code type-checks clean', () => {
    const debug = lesson.problems.find(
      (problem) => problem.id === 'fix-silenced-lookup',
    )

    if (debug?.kind !== 'debug') {
      throw new Error('expected the lookup debug problem')
    }

    // The exercise teaches that ! hides a runtime crash from the compiler,
    // so the broken code must produce no diagnostics at all.
    const result = runTypeCheck(
      { code: debug.brokenCode, typeFixture: debug.typeFixture },
      libFiles,
    )

    expect(result.diagnostics).toEqual([])
  })

  it('rejects the untouched any-typed refactor starter through its fixture markers', () => {
    const refactor = lesson.problems.find(
      (problem) => problem.id === 'type-the-order-boundary',
    )

    if (refactor?.kind !== 'refactor') {
      throw new Error('expected the order refactor problem')
    }

    // With an any parameter every fixture call compiles, so all three
    // expect-error markers must go unused and fail as TS2578. This
    // proves the markers actually enforce a precise Order type.
    const result = runTypeCheck(
      { code: refactor.starter, typeFixture: refactor.typeFixture },
      libFiles,
    )

    expect(result.passed).toBe(false)
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      2578, 2578, 2578,
    ])
  })
})
