import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { transform } from 'sucrase'
import { describe, expect, it } from 'vitest'

import { deepEqual } from '@/runtime/deepEqual'
import {
  allStaticChecksPassed,
  runStaticChecks,
} from '@/runtime/staticChecks'
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

const gradedProblems = lesson.problems.flatMap((problem) =>
  problem.kind === 'code' || problem.kind === 'refactor' ? [problem] : [],
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

describe('error handling with result-style types lesson', () => {
  it('progresses from the conversion through tagged errors to the refactor and review', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'parse-price-result:code',
      'withdraw-typed-errors:code',
      'import-settings-result:refactor',
      'result-tradeoffs-review:written',
    ])
  })

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
    expect(gradedProblems).toHaveLength(3)

    for (const problem of gradedProblems) {
      expect(problem.prompt).toContain('Example:')
      expect(problem.starter).toContain('console.log')
      expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      expect(problem.typeFixture).toContain('declare const console')
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
    for (const problem of gradedProblems) {
      for (const test of problem.tests) {
        expect(JSON.parse(JSON.stringify(test.args))).toEqual(test.args)
        expect(JSON.parse(JSON.stringify(test.expected))).toEqual(test.expected)
      }
    }
  })

  it('holds reference approaches to the refactor goals and originals below them', () => {
    for (const problem of gradedProblems) {
      if (problem.kind !== 'refactor') {
        continue
      }

      const approachCode = lesson.approaches[problem.id]?.[0]?.code ?? ''

      expect(
        allStaticChecksPassed(
          runStaticChecks(approachCode, problem.staticChecks),
        ),
      ).toBe(true)

      // The starting point must not already satisfy the refactor's checks,
      // otherwise the problem could complete without the refactor.
      expect(
        allStaticChecksPassed(
          runStaticChecks(problem.originalCode, problem.staticChecks),
        ),
      ).toBe(false)
    }
  })

  it('passes each reference approach through the real type grader', () => {
    for (const problem of gradedProblems) {
      const approachCode = lesson.approaches[problem.id]?.[0]?.code ?? ''
      const result = runTypeCheck(
        { code: approachCode, typeFixture: problem.typeFixture },
        libFiles,
      )

      expect(result.diagnostics).toEqual([])
      expect(result.passed).toBe(true)
    }
  })

  it('fails each code starter against its hidden type fixture', () => {
    for (const problem of gradedProblems) {
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

  it('confirms every expected-error marker guards a line that really errors', () => {
    for (const problem of gradedProblems) {
      const fixture = problem.typeFixture ?? ''
      const markerCount = fixture
        .split('\n')
        .filter((line) => line.includes('@ts-expect-error')).length
      const unguardedFixture = fixture
        .split('\n')
        .filter((line) => !line.includes('@ts-expect-error'))
        .join('\n')

      const approachCode = lesson.approaches[problem.id]?.[0]?.code ?? ''
      const result = runTypeCheck(
        { code: approachCode, typeFixture: unguardedFixture },
        libFiles,
      )

      // With the markers stripped, each formerly guarded line must produce
      // its own diagnostic; otherwise a marker was suppressing nothing.
      expect(result.passed).toBe(false)
      expect(result.diagnostics.length).toBeGreaterThanOrEqual(markerCount)
      expect(markerCount).toBeGreaterThanOrEqual(2)
    }
  })

  it('satisfies every behavior test with the reference approach', () => {
    for (const problem of gradedProblems) {
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
