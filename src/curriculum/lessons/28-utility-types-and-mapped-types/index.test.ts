import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { transform } from 'sucrase'
import { describe, expect, it } from 'vitest'

import { deepEqual } from '@/runtime/deepEqual'
import { runTypeCheck, type LibFileMap } from '@/runtime/typeGrader'

import { lesson } from './index'

// Load the same lib subset the browser type worker bundles, so these tests
// grade under exactly the configuration learners are graded under.
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

const runnableProblems = lesson.problems.filter(
  (problem) =>
    problem.kind === 'code' ||
    problem.kind === 'debug' ||
    problem.kind === 'refactor',
)

// Compile a reference approach the same way the runtime runner does, then
// hand back its exported solution function so tests can execute it.
function loadSolutionFunction(code: string, functionName: string) {
  const compiled = transform(code, {
    transforms: ['typescript', 'imports'],
  }).code
  const module = { exports: {} as Record<string, unknown> }

  new Function('module', 'exports', compiled)(module, module.exports)

  const solution = module.exports[functionName]

  if (typeof solution !== 'function') {
    throw new Error(`approach code does not export function ${functionName}`)
  }

  return solution as (...args: unknown[]) => unknown
}

describe('utility types and mapped types lesson', () => {
  it('progresses from deriving through mapping to refactoring', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'derive-settings-update:code',
      'map-changed-flags:code',
      'derive-account-projections:refactor',
      'derive-or-declare-review:written',
    ])
  })

  // The written review is excluded from runnableProblems, so it needs its
  // own check that the reference answer and rubric are actually filled in.
  it('closes with a written review that has a reference answer and rubric', () => {
    const written = lesson.problems.filter(
      (problem) => problem.kind === 'written',
    )

    expect(written).toHaveLength(1)
    for (const problem of written) {
      expect(problem.referenceAnswer.length).toBeGreaterThan(200)
      expect(problem.rubric?.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('provides complete runnable practice and reference approaches', () => {
    for (const problem of runnableProblems) {
      if (problem.kind !== 'code' && problem.kind !== 'refactor') {
        continue
      }

      expect(problem.prompt).toContain('Example:')
      expect(problem.starter).toContain('console.log')
      expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      expect(problem.typeFixture).toContain('@ts-expect-error')
      expect(lesson.approaches[problem.id]?.[0]?.code).toContain(
        `function ${problem.functionName}`,
      )

      if (problem.kind === 'refactor') {
        expect(problem.goals.length).toBeGreaterThan(0)
        expect(problem.staticChecks.length).toBeGreaterThan(0)
        expect(problem.starter).toBe(problem.originalCode)
      }
    }
  })

  it('keeps every test case JSON-serializable', () => {
    for (const problem of runnableProblems) {
      if (problem.kind !== 'code' && problem.kind !== 'refactor') {
        continue
      }

      for (const test of problem.tests) {
        expect(JSON.parse(JSON.stringify(test.args))).toEqual(test.args)
        expect(JSON.parse(JSON.stringify(test.expected))).toEqual(test.expected)
      }
    }
  })

  it('passes each reference approach through the real type grader', () => {
    for (const problem of runnableProblems) {
      if (problem.kind !== 'code' && problem.kind !== 'refactor') {
        continue
      }

      const approachCode = lesson.approaches[problem.id]?.[0]?.code
      expect(approachCode).toBeDefined()

      const result = runTypeCheck(
        { code: approachCode ?? '', typeFixture: problem.typeFixture },
        libFiles,
      )

      expect(result.diagnostics).toEqual([])
      expect(result.passed).toBe(true)
    }
  })

  it('fails each starter against its hidden type fixture', () => {
    for (const problem of runnableProblems) {
      // The refactor starter already satisfies the fixture; its gate is the
      // static derivation checks, so only the code starters must fail here.
      if (problem.kind !== 'code') {
        continue
      }

      const result = runTypeCheck(
        { code: problem.starter, typeFixture: problem.typeFixture },
        libFiles,
      )

      expect(result.passed).toBe(false)
    }
  })

  it('satisfies every behavior test with the reference approach', () => {
    for (const problem of runnableProblems) {
      if (problem.kind !== 'code' && problem.kind !== 'refactor') {
        continue
      }

      const solution = loadSolutionFunction(
        lesson.approaches[problem.id]?.[0]?.code ?? '',
        problem.functionName,
      )

      for (const test of problem.tests) {
        const actual = solution(...structuredClone(test.args))
        expect(
          deepEqual(actual, test.expected),
          `${problem.id} / ${test.name}`,
        ).toBe(true)
      }
    }
  })
})
