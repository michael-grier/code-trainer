import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { lesson } from './index'

import {
  allStaticChecksPassed,
  runStaticChecks,
} from '../../../runtime/staticChecks'
import { runTypeCheck, type LibFileMap } from '../../../runtime/typeGrader'

// Load the same lib subset the type worker bundles: the ES chain without DOM.
// This mirrors src/runtime/typeGrader.test.ts so fixtures are verified against
// the exact grader that will judge submissions.
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

// The three graded problems all carry a type fixture and a reference approach.
const gradedProblems = lesson.problems.flatMap((problem) =>
  problem.kind === 'code' || problem.kind === 'refactor' ? [problem] : [],
)

describe('narrowing, unions, and discriminated unions lesson', () => {
  it('progresses from narrowing through modeling to exhaustiveness and review', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'describe-union-fields:code',
      'refactor-request-state:refactor',
      'exhaustive-event-formatting:refactor',
      'impossible-states-review:written',
    ])
  })

  it('provides complete runnable practice and reference approaches', () => {
    expect(gradedProblems).toHaveLength(3)

    for (const problem of gradedProblems) {
      expect(problem.prompt).toContain('Example:')
      expect(problem.starter).toContain('console.log')
      expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      expect(lesson.approaches[problem.id]?.[0]?.code).toContain(
        `function ${problem.functionName}`,
      )
    }

    const written = lesson.problems.find((problem) => problem.kind === 'written')

    if (written?.kind !== 'written') {
      throw new Error('expected a written problem')
    }

    expect(written.referenceAnswer.length).toBeGreaterThan(200)
    expect(written.rubric?.length).toBeGreaterThanOrEqual(3)
  })

  it('gives every graded problem a fixture with expected-error markers and a console shim', () => {
    for (const problem of gradedProblems) {
      // The grader compiles without DOM libs, so the starter's console.log
      // sample call only type-checks through the fixture's shim.
      expect(problem.typeFixture).toContain('declare const console')
      expect(problem.typeFixture).toContain('@ts-expect-error')
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

  it('type-checks each reference approach cleanly against its fixture', () => {
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
})
