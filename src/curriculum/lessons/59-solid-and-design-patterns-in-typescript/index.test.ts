import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { transform } from 'sucrase'
import { describe, expect, it } from 'vitest'

import { runStaticChecks } from '@/runtime/staticChecks'
import { runTestCases } from '@/runtime/testHarness'
import { runTypeCheck, type LibFileMap } from '@/runtime/typeGrader'

import { lesson } from './index'

const runnableProblems = lesson.problems.flatMap((problem) =>
  problem.kind === 'code' || problem.kind === 'debug' || problem.kind === 'refactor'
    ? [problem]
    : [],
)

// Compile a submission the same way the runtime runner does, then hand back
// its exported function. The module's top-level sample console.log runs on
// load, so a silent console is passed in to keep test output clean.
function loadFunction(code: string, functionName: string) {
  const compiled = transform(code, {
    transforms: ['typescript', 'imports'],
  }).code
  const module = { exports: {} as Record<string, unknown> }

  new Function('module', 'exports', 'console', compiled)(
    module,
    module.exports,
    { log: () => undefined },
  )

  const candidate = module.exports[functionName]

  if (typeof candidate !== 'function') {
    throw new Error(`code does not export function ${functionName}`)
  }

  return candidate as (...args: unknown[]) => unknown
}

// The same lib subset the browser type worker bundles, without DOM.
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

function startingCode(problem: (typeof runnableProblems)[number]) {
  return problem.kind === 'debug' ? problem.brokenCode : problem.starter
}

describe('solid and design patterns lesson', () => {
  it('progresses from the strategy table through the contract fix to the review and design', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'discount-strategy-table:refactor',
      'fix-trial-charge-contract:debug',
      'abstraction-judgment-review:written',
      'notification-module-design:design',
    ])
  })

  it('shapes every runnable problem for the runner', () => {
    for (const problem of runnableProblems) {
      expect(problem.prompt).toContain('Example:')
      expect(startingCode(problem)).toContain('console.log')
      expect(problem.tests.length).toBeGreaterThanOrEqual(5)

      for (const test of problem.tests) {
        expect(JSON.parse(JSON.stringify(test.args))).toEqual(test.args)
        expect(JSON.parse(JSON.stringify(test.expected))).toEqual(test.expected)
      }

      if (problem.kind === 'debug') {
        expect(problem.bugHints?.length).toBeGreaterThan(0)
      }

      if (problem.kind === 'refactor') {
        expect(problem.starter).toBe(problem.originalCode)
        expect(problem.goals.length).toBeGreaterThan(0)
      }
    }
  })

  it('grades each refactor with checks the original fails and the reference passes', () => {
    for (const problem of runnableProblems) {
      if (problem.kind !== 'refactor') continue

      const originalResults = runStaticChecks(
        problem.originalCode,
        problem.staticChecks,
      )
      expect(originalResults.some((result) => !result.passed)).toBe(true)

      const approachResults = runStaticChecks(
        lesson.approaches[problem.id]?.[0]?.code ?? '',
        problem.staticChecks,
      )
      expect(approachResults.every((result) => result.passed)).toBe(true)
    }
  })

  it('passes every test with the reference approach', async () => {
    for (const problem of runnableProblems) {
      const code = lesson.approaches[problem.id]?.[0]?.code ?? ''
      expect(code).toContain(`function ${problem.functionName}`)

      // Clone so a submission that mutates its arguments cannot corrupt the
      // fixtures the next run reads.
      const results = await runTestCases(
        loadFunction(code, problem.functionName),
        structuredClone(problem.tests),
      )

      for (const result of results) {
        expect(
          result.status,
          `${problem.id} / ${result.name}: ${result.error ?? ''}`,
        ).toBe('passed')
      }
    }
  })

  it('fails at least one test or check with each starting program', async () => {
    for (const problem of runnableProblems) {
      const code = startingCode(problem)
      const results = await runTestCases(
        loadFunction(code, problem.functionName),
        structuredClone(problem.tests),
      )
      const failsTests = results.some((result) => result.status !== 'passed')
      const failsChecks =
        problem.kind === 'refactor' &&
        runStaticChecks(code, problem.staticChecks).some(
          (result) => !result.passed,
        )

      expect(
        failsTests || failsChecks,
        `${problem.id} should not already pass`,
      ).toBe(true)
    }
  })

  it('grades the strategy table with the compiler, not only with text', () => {
    const refactor = lesson.problems.find(
      (problem) => problem.id === 'discount-strategy-table',
    )

    if (refactor?.kind !== 'refactor' || !refactor.typeFixture) {
      throw new Error('expected the discount refactor to carry a type fixture')
    }

    const reference = lesson.approaches[refactor.id]?.[0]?.code ?? ''
    const clean = runTypeCheck(
      { code: reference, typeFixture: refactor.typeFixture },
      libFiles,
    )
    expect(clean.diagnostics).toEqual([])
    expect(clean.passed).toBe(true)

    // Drop one strategy from the reference: the union-keyed table must now
    // fail to compile, which is the lesson's whole promise.
    const missingKind = reference.replace('  fixed: (rule) => rule.amountCents,\n', '')
    expect(missingKind).not.toBe(reference)

    const incomplete = runTypeCheck(
      { code: missingKind, typeFixture: refactor.typeFixture },
      libFiles,
    )
    expect(incomplete.passed).toBe(false)
    expect(
      incomplete.diagnostics.some((diagnostic) =>
        diagnostic.message.includes("'fixed'"),
      ),
    ).toBe(true)
  })

  it('ties written and design work back to the lesson rules', () => {
    const written = lesson.problems.filter(
      (problem) => problem.kind === 'written',
    )
    expect(written).toHaveLength(1)
    for (const problem of written) {
      expect(problem.referenceAnswer.length).toBeGreaterThan(300)
      expect(problem.rubric?.length).toBeGreaterThanOrEqual(3)
    }

    const design = lesson.problems.find((problem) => problem.kind === 'design')

    if (design?.kind !== 'design') {
      throw new Error('expected a design problem')
    }

    expect(design.scenario.length).toBeGreaterThan(100)
    expect(design.sections.length).toBeGreaterThanOrEqual(3)
    expect(
      design.sections.some((section) => section.type === 'tradeoff'),
    ).toBe(true)
    expect(design.rubric.length).toBeGreaterThanOrEqual(4)
    expect(design.referenceAnswer.length).toBeGreaterThan(500)
  })
})
