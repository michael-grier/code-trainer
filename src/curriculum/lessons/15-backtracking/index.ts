import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'backtracking',
  title: 'Backtracking',
  summary:
    'Build one partial result, explore each allowed next choice, then remove that choice before trying another.',
  track: 'algorithms',
  order: 15,
  concept: Concept,
  problems: [
    {
      id: 'generate-all-subsets',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Generate every subset',
      prompt:
        'Implement `generateAllSubsets`. `values` contains distinct numbers. Return every subset in the order produced by recording the current subset, then trying each remaining value from left to right. Preserve the input order within each subset. Example: `[1, 2]` returns `[[], [1], [1, 2], [2]]`.',
      estimatedMinutes: 14,
      functionName: 'generateAllSubsets',
      starter: `export function generateAllSubsets(values: number[]): number[][] {
  return []
}

console.log(generateAllSubsets([1, 2]))
`,
      tests: [
        {
          name: 'generates every subset in depth-first order',
          args: [[1, 2]],
          expected: [[], [1], [1, 2], [2]],
        },
        {
          name: 'generates eight subsets for three values',
          args: [[1, 2, 3]],
          expected: [
            [],
            [1],
            [1, 2],
            [1, 2, 3],
            [1, 3],
            [2],
            [2, 3],
            [3],
          ],
        },
        {
          name: 'handles one value',
          args: [[7]],
          expected: [[], [7]],
        },
        {
          name: 'handles no values',
          args: [[]],
          expected: [[]],
        },
        {
          name: 'preserves negative values',
          args: [[-2, 4]],
          expected: [[], [-2], [-2, 4], [4]],
        },
        {
          name: 'preserves the given input order',
          args: [[3, 1]],
          expected: [[], [3], [3, 1], [1]],
        },
      ],
    },
    {
      id: 'reusable-combination-sum',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Build sums with reusable values',
      prompt:
        'Implement `reusableCombinationSums`. `candidates` contains distinct positive numbers in ascending order. Return combinations whose sum is `target`. A candidate may be used several times. Keep each combination in ascending order and return combinations in depth-first search order. Example: `candidates = [2, 3, 6, 7]` and `target = 7` return `[[2, 2, 3], [7]]`.',
      estimatedMinutes: 20,
      functionName: 'reusableCombinationSums',
      starter: `export function reusableCombinationSums(
  candidates: number[],
  target: number,
): number[][] {
  return []
}

console.log(reusableCombinationSums([2, 3, 6, 7], 7))
`,
      tests: [
        {
          name: 'finds combinations with reuse and a single value',
          args: [[2, 3, 6, 7], 7],
          expected: [[2, 2, 3], [7]],
        },
        {
          name: 'finds several combinations in search order',
          args: [[2, 3, 5], 8],
          expected: [[2, 2, 2, 2], [2, 3, 3], [3, 5]],
        },
        {
          name: 'returns no combinations when the target cannot be formed',
          args: [[4, 6], 5],
          expected: [],
        },
        {
          name: 'reuses one candidate as needed',
          args: [[3], 9],
          expected: [[3, 3, 3]],
        },
        {
          name: 'does not use a candidate larger than the target',
          args: [[5, 8], 3],
          expected: [],
        },
        {
          name: 'returns the empty combination for a zero target',
          args: [[2, 3], 0],
          expected: [[]],
        },
      ],
    },
    {
      id: 'count-n-queens-arrangements',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Count valid queen arrangements',
      prompt:
        'Implement `countNQueensArrangements`. Place one queen in each row of an `n × n` board so that no two queens share a column or diagonal. Return the number of valid arrangements. `n` is a positive integer. Example: `n = 4` returns `2`.',
      estimatedMinutes: 24,
      functionName: 'countNQueensArrangements',
      starter: `export function countNQueensArrangements(n: number): number {
  return 0
}

console.log(countNQueensArrangements(4))
`,
      tests: [
        {
          name: 'counts both arrangements on a four by four board',
          args: [4],
          expected: 2,
        },
        {
          name: 'handles a one by one board',
          args: [1],
          expected: 1,
        },
        {
          name: 'finds no arrangement for two queens',
          args: [2],
          expected: 0,
        },
        {
          name: 'finds no arrangement for three queens',
          args: [3],
          expected: 0,
        },
        {
          name: 'counts arrangements for five queens',
          args: [5],
          expected: 10,
        },
        {
          name: 'counts arrangements for six queens',
          args: [6],
          expected: 4,
        },
      ],
    },
    {
      id: 'backtracking-state-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Define choices and restore state',
      prompt:
        'Explain how you design a backtracking search. Define the partial state, the next choices, the completion condition, which branches can stop early, why results need copies, and why each added choice must be removed before the next branch.',
      estimatedMinutes: 10,
      starter:
        'I first state what the current partial result represents and which choices are still allowed.',
      referenceAnswer:
        'A backtracking function represents one partial result, such as a subset, a sum, or queen placements for completed rows. At each call, list the choices that can legally extend that state. Record a result when the completion condition is met. Stop a branch when no later choice can make it valid, such as when an ascending positive candidate is larger than the remaining sum or a queen attacks an existing queen. When a mutable array represents the current result, store a copy because later changes would otherwise change every recorded reference. After exploring one choice, remove it and clear any related constraint state before trying the next choice. A start index prevents subset or combination orders from being generated more than once. Passing the same index allows reuse; passing the next index allows each value only once.',
      rubric: [
        {
          id: 'search-state',
          label: 'Defines the partial state',
          description:
            'States what one recursive call has already chosen and what remains.',
        },
        {
          id: 'completion-pruning',
          label: 'Defines completion and early stops',
          description:
            'Separates a complete result from a branch that cannot become valid.',
        },
        {
          id: 'result-copy',
          label: 'Copies recorded results',
          description:
            'Explains why mutable partial arrays must be copied before storage.',
        },
        {
          id: 'state-restoration',
          label: 'Restores each choice',
          description:
            'Removes array and constraint changes before exploring another branch.',
        },
      ],
    },
  ],
  approaches: {
    'generate-all-subsets': [
      {
        name: 'Record each partial subset',
        code: `export function generateAllSubsets(values: number[]): number[][] {
  const subsets: number[][] = []
  const current: number[] = []

  const search = (startIndex: number): void => {
    // Store a copy because current will change after this call.
    subsets.push([...current])

    for (let index = startIndex; index < values.length; index += 1) {
      current.push(values[index])
      search(index + 1)
      current.pop()
    }
  }

  search(0)
  return subsets
}
`,
        explanation:
          'Every partial selection is a valid subset, so record it at the start of each call. The start position ensures that each later value is considered once and subsets are not repeated in different orders.',
        complexity: 'O(n × 2ⁿ) time and O(n) search space, excluding output.',
      },
    ],
    'reusable-combination-sum': [
      {
        name: 'Reuse the current candidate index',
        code: `export function reusableCombinationSums(
  candidates: number[],
  target: number,
): number[][] {
  const combinations: number[][] = []
  const current: number[] = []

  const search = (startIndex: number, remaining: number): void => {
    if (remaining === 0) {
      combinations.push([...current])
      return
    }

    for (let index = startIndex; index < candidates.length; index += 1) {
      const candidate = candidates[index]

      if (candidate > remaining) {
        break
      }

      current.push(candidate)
      // Pass index, not index + 1, because this candidate can be reused.
      search(index, remaining - candidate)
      current.pop()
    }
  }

  search(0, target)
  return combinations
}
`,
        explanation:
          'The start position keeps combinations in ascending order and prevents reordered duplicates. Positive ascending candidates allow the loop to stop when one candidate exceeds the remaining sum.',
        complexity:
          'O(n^(t/m)) time in the worst case and O(t/m) search space, where t is the target and m is the smallest candidate.',
      },
    ],
    'count-n-queens-arrangements': [
      {
        name: 'Track attacked columns and diagonals',
        code: `export function countNQueensArrangements(n: number): number {
  const usedColumns = new Set<number>()
  const usedDownDiagonals = new Set<number>()
  const usedUpDiagonals = new Set<number>()

  const search = (row: number): number => {
    if (row === n) {
      return 1
    }

    let count = 0

    for (let column = 0; column < n; column += 1) {
      const downDiagonal = row - column
      const upDiagonal = row + column

      if (
        usedColumns.has(column) ||
        usedDownDiagonals.has(downDiagonal) ||
        usedUpDiagonals.has(upDiagonal)
      ) {
        continue
      }

      usedColumns.add(column)
      usedDownDiagonals.add(downDiagonal)
      usedUpDiagonals.add(upDiagonal)

      count += search(row + 1)

      usedColumns.delete(column)
      usedDownDiagonals.delete(downDiagonal)
      usedUpDiagonals.delete(upDiagonal)
    }

    return count
  }

  return search(0)
}
`,
        explanation:
          'Placing exactly one queen per row removes the need to track rows. Cells on one downward diagonal share row - column, and cells on one upward diagonal share row + column.',
        complexity: 'O(n!) time in the worst case and O(n) search space.',
      },
    ],
  },
}
