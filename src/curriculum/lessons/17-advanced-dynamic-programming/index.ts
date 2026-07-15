import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'advanced-dynamic-programming',
  title: 'Advanced Dynamic Programming',
  summary:
    'Use multiple state dimensions when one position is not enough to describe the remaining decision.',
  track: 'algorithms',
  order: 17,
  concept: Concept,
  problems: [
    {
      id: 'minimum-grid-path-sum',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find a minimum grid path sum',
      prompt:
        'Implement `minimumGridPathSum`. `grid` is a nonempty rectangular grid of nonnegative numbers. Start at the top-left cell and reach the bottom-right cell by moving only right or down. Return the smallest possible sum of visited cells, including both endpoints. Example: `minimumGridPathSum([[1, 3, 1], [1, 5, 1], [4, 2, 1]])` returns `7`.',
      estimatedMinutes: 17,
      functionName: 'minimumGridPathSum',
      starter: `export function minimumGridPathSum(grid: number[][]): number {
  return 0
}

console.log(minimumGridPathSum([[1, 3, 1], [1, 5, 1], [4, 2, 1]]))
`,
      tests: [
        {
          name: 'finds the cheapest route through a square grid',
          args: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]],
          expected: 7,
        },
        {
          name: 'handles one row',
          args: [[[1, 2, 3]]],
          expected: 6,
        },
        {
          name: 'handles one column',
          args: [[[2], [1], [4]]],
          expected: 7,
        },
        {
          name: 'handles one cell',
          args: [[[5]]],
          expected: 5,
        },
        {
          name: 'handles zero-cost cells',
          args: [[[0, 0], [3, 0]]],
          expected: 0,
        },
        {
          name: 'avoids an expensive middle cell',
          args: [[[1, 1, 1], [9, 9, 1], [1, 1, 1]]],
          expected: 5,
        },
      ],
    },
    {
      id: 'longest-common-subsequence',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Measure a longest common subsequence',
      prompt:
        'Implement `longestCommonSubsequenceLength`. The inputs contain English letters. A subsequence keeps character order but may skip characters. Return the maximum length of a string that is a subsequence of both inputs. Matching is case-sensitive. Example: `longestCommonSubsequenceLength("abcde", "ace")` returns `3`.',
      estimatedMinutes: 22,
      functionName: 'longestCommonSubsequenceLength',
      starter: `export function longestCommonSubsequenceLength(
  left: string,
  right: string,
): number {
  return 0
}

console.log(longestCommonSubsequenceLength('abcde', 'ace'))
`,
      tests: [
        {
          name: 'keeps matching characters in order',
          args: ['abcde', 'ace'],
          expected: 3,
        },
        {
          name: 'matches identical strings',
          args: ['abc', 'abc'],
          expected: 3,
        },
        {
          name: 'returns zero without common characters',
          args: ['abc', 'def'],
          expected: 0,
        },
        {
          name: 'handles one empty string',
          args: ['', 'abc'],
          expected: 0,
        },
        {
          name: 'does not reuse one matching character',
          args: ['aaaa', 'aa'],
          expected: 2,
        },
        {
          name: 'finds a subsequence across several skipped characters',
          args: ['AGGTAB', 'GXTXAYB'],
          expected: 4,
        },
      ],
    },
    {
      id: 'maximum-knapsack-value',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Choose one-use items within capacity',
      prompt:
        'Implement `maximumKnapsackValue`. `capacity` is a nonnegative integer. `weights` and `values` have the same length; `weights[i]` is a positive integer and `values[i]` is nonnegative. Each item may be selected at most once. Return the largest total value whose total weight is at most `capacity`. Example: capacity `5`, weights `[1, 2, 3]`, and values `[6, 10, 12]` return `22`.',
      estimatedMinutes: 24,
      functionName: 'maximumKnapsackValue',
      starter: `export function maximumKnapsackValue(
  capacity: number,
  weights: number[],
  values: number[],
): number {
  return 0
}

console.log(maximumKnapsackValue(5, [1, 2, 3], [6, 10, 12]))
`,
      tests: [
        {
          name: 'combines the best pair of items',
          args: [5, [1, 2, 3], [6, 10, 12]],
          expected: 22,
        },
        {
          name: 'chooses a different pair for a smaller capacity',
          args: [4, [1, 2, 3], [6, 10, 12]],
          expected: 18,
        },
        {
          name: 'does not reuse one item',
          args: [4, [2], [5]],
          expected: 5,
        },
        {
          name: 'returns zero when no item fits',
          args: [2, [3, 4], [5, 7]],
          expected: 0,
        },
        {
          name: 'handles zero capacity',
          args: [0, [1, 2], [4, 7]],
          expected: 0,
        },
        {
          name: 'chooses one more valuable exact-fit item',
          args: [5, [3, 2, 4, 5], [4, 3, 5, 8]],
          expected: 8,
        },
      ],
    },
    {
      id: 'advanced-dp-state-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Choose dimensions and traversal order',
      prompt:
        'Explain when a dynamic programming state needs two dimensions. Include how grid or string positions define a state, how dependencies determine fill order, why one-use knapsack updates capacity downward, and when storage can be compressed without changing the recurrence.',
      estimatedMinutes: 10,
      starter:
        'I add a state dimension only when the result changes independently with that part of the input.',
      referenceAnswer:
        'A state needs one coordinate for every independent position or resource required to describe the remaining result. Grid paths use row and column. Two-string problems use one prefix length from each string. Dependencies determine fill order: a grid state that reads top and left is filled from top-left toward bottom-right, while a prefix string table is filled after shorter prefixes. In one-use knapsack, capacity must move downward for each item. That makes every update read the previous item\'s result; moving upward would read a value updated by the same item and allow reuse. Storage can be compressed when the current row or state reads only a fixed number of earlier rows or values. Preserve the dependency direction during compression, and keep the full table when the actual path or selected items must be reconstructed.',
      rubric: [
        {
          id: 'state-dimensions',
          label: 'Defines each dimension',
          description:
            'Connects every coordinate to an independent input position or resource.',
        },
        {
          id: 'fill-order',
          label: 'Derives fill order',
          description:
            'Calculates states only after their required neighbors or prefixes.',
        },
        {
          id: 'capacity-direction',
          label: 'Explains downward capacity',
          description:
            'Shows how reverse iteration prevents one item from being reused.',
        },
        {
          id: 'compression',
          label: 'Preserves dependencies when compressing',
          description:
            'Reduces storage only when discarded states will not be read later.',
        },
      ],
    },
  ],
  approaches: {
    'minimum-grid-path-sum': [
      {
        name: 'One row of minimum path totals',
        code: `export function minimumGridPathSum(grid: number[][]): number {
  const columnCount = grid[0].length
  const minimumSums = Array<number>(columnCount).fill(Infinity)
  minimumSums[0] = 0

  for (let row = 0; row < grid.length; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const fromAbove = minimumSums[column]
      const fromLeft = column > 0 ? minimumSums[column - 1] : Infinity

      // This cell follows the cheaper route from above or the left.
      minimumSums[column] = grid[row][column] + Math.min(fromAbove, fromLeft)
    }
  }

  return minimumSums[columnCount - 1]
}
`,
        explanation:
          'Each cell can be entered only from above or the left. The current array entry still stores the result from above, while the previous entry already stores the current row result from the left.',
        complexity: 'O(rows × columns) time and O(columns) space.',
      },
    ],
    'longest-common-subsequence': [
      {
        name: 'Table of matching prefix lengths',
        code: `export function longestCommonSubsequenceLength(
  left: string,
  right: string,
): number {
  const lengths = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  )

  for (let leftLength = 1; leftLength <= left.length; leftLength += 1) {
    for (let rightLength = 1; rightLength <= right.length; rightLength += 1) {
      if (left[leftLength - 1] === right[rightLength - 1]) {
        // Matching final characters extend both shorter prefixes.
        lengths[leftLength][rightLength] =
          lengths[leftLength - 1][rightLength - 1] + 1
      } else {
        // Otherwise, skip the final character from one prefix.
        lengths[leftLength][rightLength] = Math.max(
          lengths[leftLength - 1][rightLength],
          lengths[leftLength][rightLength - 1],
        )
      }
    }
  }

  return lengths[left.length][right.length]
}
`,
        explanation:
          'One table cell stores the best subsequence length for one prefix of each string. Matching final characters extend the diagonal state; different characters use the better state after shortening either prefix.',
        complexity: 'O(left.length × right.length) time and space.',
      },
    ],
    'maximum-knapsack-value': [
      {
        name: 'Reverse capacity for each one-use item',
        code: `export function maximumKnapsackValue(
  capacity: number,
  weights: number[],
  values: number[],
): number {
  const bestValues = Array<number>(capacity + 1).fill(0)

  for (let item = 0; item < weights.length; item += 1) {
    const weight = weights[item]
    const value = values[item]

    // Move downward so this item cannot read a state it already updated.
    for (let currentCapacity = capacity; currentCapacity >= weight; currentCapacity -= 1) {
      bestValues[currentCapacity] = Math.max(
        bestValues[currentCapacity],
        bestValues[currentCapacity - weight] + value,
      )
    }
  }

  return bestValues[capacity]
}
`,
        explanation:
          'For each item, compare skipping it with adding it to a smaller-capacity result. Descending capacity ensures the smaller result came from earlier items, so the current item is used at most once.',
        complexity: 'O(items × capacity) time and O(capacity) space.',
      },
    ],
  },
}
