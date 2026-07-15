import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'big-o-analysis-and-tradeoffs',
  title: 'Big-O Analysis and Tradeoffs',
  summary:
    'Describe how work and storage grow with input size, then choose an implementation that meets the stated constraints.',
  track: 'algorithms',
  order: 19,
  concept: Concept,
  problems: [
    {
      id: 'detect-duplicate-value',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Remove repeated pair comparisons',
      prompt:
        'Implement `hasDuplicateValue`. Return whether any number occurs more than once. Aim for O(n) average time instead of comparing every pair. Do not modify the input. Example: `hasDuplicateValue([4, 2, 7, 2])` returns `true`, while `[4, 2, 7]` returns `false`.',
      estimatedMinutes: 11,
      functionName: 'hasDuplicateValue',
      starter: `export function hasDuplicateValue(values: number[]): boolean {
  return false
}

console.log(hasDuplicateValue([4, 2, 7, 2]))
`,
      tests: [
        {
          name: 'finds a repeated interior value',
          args: [[4, 2, 7, 2]],
          expected: true,
        },
        {
          name: 'rejects distinct values',
          args: [[4, 2, 7]],
          expected: false,
        },
        {
          name: 'finds repeated zero',
          args: [[0, 1, 0]],
          expected: true,
        },
        {
          name: 'finds repeated negative values',
          args: [[-3, 2, -3]],
          expected: true,
        },
        { name: 'handles one value', args: [[5]], expected: false },
        { name: 'handles no values', args: [[]], expected: false },
      ],
    },
    {
      id: 'maximum-single-trade-profit',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Replace all trade pairs with one scan',
      prompt:
        'Implement `maximumSingleTradeProfit`. `prices[i]` is a price at time `i`. Choose at most one buy followed by one later sell, and return the largest nonnegative profit. Return `0` when no profitable trade exists. Use O(n) time and O(1) extra space. Example: `[7, 1, 5, 3, 6, 4]` returns `5`.',
      estimatedMinutes: 15,
      functionName: 'maximumSingleTradeProfit',
      starter: `export function maximumSingleTradeProfit(prices: number[]): number {
  return 0
}

console.log(maximumSingleTradeProfit([7, 1, 5, 3, 6, 4]))
`,
      tests: [
        {
          name: 'finds the best later sale',
          args: [[7, 1, 5, 3, 6, 4]],
          expected: 5,
        },
        {
          name: 'returns zero for falling prices',
          args: [[7, 6, 4, 3, 1]],
          expected: 0,
        },
        {
          name: 'uses the earliest low price when optimal',
          args: [[1, 2, 3, 4]],
          expected: 3,
        },
        {
          name: 'updates the minimum before a later rise',
          args: [[5, 4, 1, 8]],
          expected: 7,
        },
        {
          name: 'handles one price',
          args: [[5]],
          expected: 0,
        },
        {
          name: 'handles no prices',
          args: [[]],
          expected: 0,
        },
      ],
    },
    {
      id: 'smallest-missing-positive',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Meet linear-time and constant-space constraints',
      prompt:
        'Implement `smallestMissingPositive`. `values` contains integers. Return the smallest positive integer absent from `values`. The function may modify `values`. Use O(n) time and O(1) extra space. Values may be negative, zero, duplicated, or larger than the array. Example: `smallestMissingPositive([3, 4, -1, 1])` returns `2`.',
      estimatedMinutes: 24,
      functionName: 'smallestMissingPositive',
      starter: `export function smallestMissingPositive(values: number[]): number {
  return 1
}

console.log(smallestMissingPositive([3, 4, -1, 1]))
`,
      tests: [
        {
          name: 'finds a missing value inside the array range',
          args: [[3, 4, -1, 1]],
          expected: 2,
        },
        {
          name: 'returns the value after a complete prefix',
          args: [[1, 2, 0]],
          expected: 3,
        },
        {
          name: 'returns one when every value is too large',
          args: [[7, 8, 9, 11, 12]],
          expected: 1,
        },
        {
          name: 'handles one present positive value',
          args: [[1]],
          expected: 2,
        },
        {
          name: 'places values that begin out of order',
          args: [[2, 1]],
          expected: 3,
        },
        {
          name: 'handles duplicate positive values',
          args: [[1, 1]],
          expected: 2,
        },
      ],
    },
    {
      id: 'complexity-tradeoff-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain runtime and space tradeoffs',
      prompt:
        'Analyze an algorithm clearly. Define its input-size variables, count its dominant work, distinguish nested from consecutive loops, include sorting and helper operations, state auxiliary space separately from output space, and explain when extra memory is justified by lower runtime.',
      estimatedMinutes: 11,
      starter:
        'I first define what each input-size variable measures, then count how many times the dominant operation can run.',
      referenceAnswer:
        'Define variables before using them, such as n for one array length or n and m for two independent inputs. Count the operation that grows most: one full scan is O(n), consecutive scans add to O(n + n) = O(n), and truly nested full scans multiply to O(n²). A loop that repeatedly halves an active interval is O(log n). Include library work such as O(n log n) comparison sorting and expected O(1) Set or Map lookup. State auxiliary space separately from returned output: a Set of all seen values is O(n), while a few numeric summaries are O(1). Extra memory is justified when constraints permit it and it replaces repeated work, such as using a Set to reduce pair comparisons from O(n²) to O(n) average time. Also state relevant assumptions, because hash operations are average-case and recursive call-stack depth counts as space.',
      rubric: [
        {
          id: 'variables',
          label: 'Defines input sizes',
          description:
            'Uses one variable for each independently growing input dimension.',
        },
        {
          id: 'dominant-work',
          label: 'Counts dominant work',
          description:
            'Distinguishes consecutive, nested, logarithmic, and sorting work.',
        },
        {
          id: 'space',
          label: 'States auxiliary space',
          description:
            'Includes collections and call-stack depth while separating required output.',
        },
        {
          id: 'tradeoff',
          label: 'Explains the tradeoff',
          description:
            'Connects added memory or mutation to a concrete runtime improvement.',
        },
      ],
    },
  ],
  approaches: {
    'detect-duplicate-value': [
      {
        name: 'Set of values already seen',
        code: `export function hasDuplicateValue(values: number[]): boolean {
  const seen = new Set<number>()

  for (const value of values) {
    if (seen.has(value)) {
      return true
    }

    seen.add(value)
  }

  return false
}
`,
        explanation:
          'A Set replaces comparisons against every earlier value with an average O(1) membership check. It uses additional memory proportional to the number of distinct values.',
        complexity: 'O(n) average time and O(n) space.',
      },
    ],
    'maximum-single-trade-profit': [
      {
        name: 'Minimum earlier price and best profit',
        code: `export function maximumSingleTradeProfit(prices: number[]): number {
  let minimumEarlierPrice = Infinity
  let bestProfit = 0

  for (const price of prices) {
    // Selling now pairs this price with the cheapest earlier buy.
    bestProfit = Math.max(bestProfit, price - minimumEarlierPrice)
    minimumEarlierPrice = Math.min(minimumEarlierPrice, price)
  }

  return bestProfit
}
`,
        explanation:
          'Every possible selling time needs only the cheapest price before it. Retaining that summary removes the nested scan over all buy-and-sell pairs.',
        complexity: 'O(n) time and O(1) space.',
      },
    ],
    'smallest-missing-positive': [
      {
        name: 'Place each relevant value at its matching index',
        code: `export function smallestMissingPositive(values: number[]): number {
  for (let index = 0; index < values.length; index += 1) {
    while (
      values[index] >= 1 &&
      values[index] <= values.length &&
      values[values[index] - 1] !== values[index]
    ) {
      // Value v belongs at index v - 1. Swap until this index is resolved.
      const destination = values[index] - 1
      const destinationValue = values[destination]
      values[destination] = values[index]
      values[index] = destinationValue
    }
  }

  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== index + 1) {
      return index + 1
    }
  }

  return values.length + 1
}
`,
        explanation:
          'For an array of length n, the answer lies from 1 through n + 1. Use indexes 0 through n - 1 as storage for values 1 through n, then find the first position without its matching value.',
        complexity: 'O(n) time and O(1) extra space.',
      },
    ],
  },
}
