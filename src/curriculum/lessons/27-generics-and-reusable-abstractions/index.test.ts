import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runTypeCheck, type LibFileMap } from '../../../runtime/typeGrader'

import { lesson } from './index'

// Load the same lib subset the browser type worker bundles: the ES lib chain
// and decorator libs, without DOM (see typeGrader.test.ts).
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

const typeCheckedProblems = lesson.problems.flatMap((problem) =>
  (problem.kind === 'code' || problem.kind === 'refactor') && problem.typeFixture
    ? [
        {
          id: problem.id,
          starter: problem.starter,
          typeFixture: problem.typeFixture,
          referenceCode: lesson.approaches[problem.id]?.[0]?.code ?? '',
        },
      ]
    : [],
)

describe('generics and reusable abstractions lesson', () => {
  it('progresses from refactoring through implementation to explanation', () => {
    expect(
      lesson.problems.map((problem) => `${problem.id}:${problem.kind}`),
    ).toEqual([
      'generic-first-or-default:refactor',
      'generic-pluck:code',
      'generic-index-by:code',
      'generic-tradeoffs-review:written',
    ])
  })

  it('provides complete runnable practice and reference approaches', () => {
    for (const problem of lesson.problems) {
      if (problem.kind === 'code') {
        expect(problem.prompt).toContain('Example:')
        expect(problem.starter).toContain('console.log')
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
      }

      if (problem.kind === 'refactor') {
        expect(problem.prompt).toContain('Example:')
        expect(problem.starter).toBe(problem.originalCode)
        expect(problem.tests.length).toBeGreaterThanOrEqual(5)
        expect(problem.goals.length).toBeGreaterThan(0)
        expect(problem.staticChecks.length).toBeGreaterThan(0)
      }

      if (problem.kind === 'code' || problem.kind === 'refactor') {
        expect(problem.typeFixture).toContain('@ts-expect-error')
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

  // The fixtures are hand-authored compiler contracts, so prove them against
  // the real grader: the reference approach must check clean, and the starter
  // must fail, otherwise the problem is either broken or already solved.
  describe.each(typeCheckedProblems)(
    'type fixture for $id',
    ({ starter, typeFixture, referenceCode }) => {
      it('accepts the reference approach', () => {
        const result = runTypeCheck({ code: referenceCode, typeFixture }, libFiles)

        expect(result.diagnostics).toEqual([])
        expect(result.passed).toBe(true)
      })

      it('rejects the unmodified starter', () => {
        const result = runTypeCheck({ code: starter, typeFixture }, libFiles)

        expect(result.passed).toBe(false)
      })
    },
  )
})
