import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'sorting-and-comparison-patterns',
  title: 'Sorting and Comparison Patterns',
  summary: 'Define deterministic ordering rules, then use the sorted order to simplify later comparisons.',
  track: 'algorithms',
  order: 6,
  concept: Concept,
  problems: [
    {
      id: 'rank-candidates',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Rank records with tie-breakers',
      prompt:
        'Implement `rankCandidates`. Each candidate has a distinct lowercase `name` and a numeric `score`. Return the names ordered by score from highest to lowest, then by name in ascending alphabetical order when scores are equal. Do not modify the input array. Example: `rankCandidates([{ name: "bea", score: 8 }, { name: "ari", score: 10 }, { name: "cal", score: 8 }])` returns `["ari", "bea", "cal"]`.',
      estimatedMinutes: 12,
      functionName: 'rankCandidates',
      starter: `type Candidate = {
  name: string
  score: number
}

export function rankCandidates(candidates: Candidate[]): string[] {
  return []
}

console.log(rankCandidates([
  { name: 'bea', score: 8 },
  { name: 'ari', score: 10 },
  { name: 'cal', score: 8 },
]))
`,
      tests: [
        {
          name: 'orders scores and alphabetical ties',
          args: [[
            { name: 'bea', score: 8 },
            { name: 'ari', score: 10 },
            { name: 'cal', score: 8 },
          ]],
          expected: ['ari', 'bea', 'cal'],
        },
        {
          name: 'orders several equal scores',
          args: [[
            { name: 'zoe', score: 4 },
            { name: 'amy', score: 4 },
            { name: 'max', score: 4 },
          ]],
          expected: ['amy', 'max', 'zoe'],
        },
        {
          name: 'handles negative scores',
          args: [[
            { name: 'low', score: -5 },
            { name: 'high', score: -1 },
            { name: 'mid', score: -3 },
          ]],
          expected: ['high', 'mid', 'low'],
        },
        {
          name: 'compares full names for ties',
          args: [[
            { name: 'anna', score: 7 },
            { name: 'anne', score: 7 },
            { name: 'ann', score: 7 },
          ]],
          expected: ['ann', 'anna', 'anne'],
        },
        {
          name: 'handles one candidate',
          args: [[{ name: 'solo', score: 2 }]],
          expected: ['solo'],
        },
        {
          name: 'handles an empty array',
          args: [[]],
          expected: [],
        },
      ],
    },
    {
      id: 'merge-overlapping-intervals',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Merge overlapping intervals',
      prompt:
        'Implement `mergeOverlappingIntervals`. Each interval is an inclusive pair `[start, end]` with `start <= end`. Return the combined non-overlapping intervals ordered by start. Inclusive intervals that share an endpoint overlap, so `[1, 4]` and `[4, 6]` become `[1, 6]`. Do not modify the input. Example: `mergeOverlappingIntervals([[5, 7], [1, 3], [2, 6]])` returns `[[1, 7]]`.',
      estimatedMinutes: 17,
      functionName: 'mergeOverlappingIntervals',
      starter: `type Interval = [number, number]

export function mergeOverlappingIntervals(
  intervals: Interval[],
): Interval[] {
  return []
}

console.log(mergeOverlappingIntervals([[5, 7], [1, 3], [2, 6]]))
`,
      tests: [
        {
          name: 'sorts and merges overlapping intervals',
          args: [[[5, 7], [1, 3], [2, 6]]],
          expected: [[1, 7]],
        },
        {
          name: 'merges intervals that share an endpoint',
          args: [[[1, 4], [4, 6]]],
          expected: [[1, 6]],
        },
        {
          name: 'keeps separated intervals',
          args: [[[8, 10], [1, 2], [4, 5]]],
          expected: [[1, 2], [4, 5], [8, 10]],
        },
        {
          name: 'handles contained intervals',
          args: [[[1, 10], [2, 3], [4, 8]]],
          expected: [[1, 10]],
        },
        {
          name: 'handles negative endpoints',
          args: [[[-3, -1], [-5, -4], [-2, 2]]],
          expected: [[-5, -4], [-3, 2]],
        },
        {
          name: 'handles an empty array',
          args: [[]],
          expected: [],
        },
      ],
    },
    {
      id: 'largest-concatenated-number',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Build the largest concatenated number',
      prompt:
        'Implement `largestConcatenatedNumber`. Given non-negative integers, arrange their decimal strings so their concatenation is as large as possible. Return the result as a string. For two strings `a` and `b`, compare `a + b` with `b + a`. Return `"0"` when every input value is zero. Example: `largestConcatenatedNumber([3, 30, 34, 5, 9])` returns `"9534330"`.',
      estimatedMinutes: 20,
      functionName: 'largestConcatenatedNumber',
      starter: `export function largestConcatenatedNumber(nums: number[]): string {
  return ''
}

console.log(largestConcatenatedNumber([3, 30, 34, 5, 9]))
`,
      tests: [
        {
          name: 'orders the standard mixed-length example',
          args: [[3, 30, 34, 5, 9]],
          expected: '9534330',
        },
        {
          name: 'orders two values',
          args: [[10, 2]],
          expected: '210',
        },
        {
          name: 'compares shared prefixes',
          args: [[121, 12]],
          expected: '12121',
        },
        {
          name: 'normalizes several zeroes',
          args: [[0, 0, 0]],
          expected: '0',
        },
        {
          name: 'handles repeated values',
          args: [[9, 9, 91]],
          expected: '9991',
        },
        {
          name: 'handles an empty array',
          args: [[]],
          expected: '',
        },
      ],
    },
    {
      id: 'comparator-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain a complete comparator',
      prompt:
        'Explain how to write a deterministic TypeScript comparator for records with a primary field and a tie-breaker. Include the meaning of negative, zero, and positive comparator results, why returning a boolean is incorrect, and how you would avoid modifying the caller\'s array.',
      estimatedMinutes: 9,
      starter:
        'The comparator first compares the primary field. When those values are equal, it applies the required tie-breaker.',
      referenceAnswer:
        'A comparator returns a negative number when the first item must be ordered before the second, zero when their order is equal under every stated rule, and a positive number when the first must be ordered after the second. A boolean is incorrect because true and false become 1 and 0 and do not represent all three outcomes. Compare the primary field first, then compare each tie-breaker only when earlier fields are equal. The rules must be consistent: comparing a with b and b with a must give opposite directions, equal values must remain equal, and if a sorts before b and b sorts before c, then a must sort before c. Since Array.prototype.sort modifies its array, create a copy with [...items] before sorting when the input must remain unchanged.',
      rubric: [
        {
          id: 'return-values',
          label: 'Defines comparator results',
          description:
            'Explains the negative, zero, and positive return values and rejects boolean comparators.',
        },
        {
          id: 'tie-breakers',
          label: 'Defines all tie-breakers',
          description:
            'Applies secondary rules only when the primary fields are equal.',
        },
        {
          id: 'mutation',
          label: 'Protects the input',
          description:
            'Copies the input before calling sort when mutation is not allowed.',
        },
      ],
    },
  ],
  approaches: {
    'rank-candidates': [
      {
        name: 'Primary comparison with an explicit tie-breaker',
        code: `type Candidate = {
  name: string
  score: number
}

export function rankCandidates(candidates: Candidate[]): string[] {
  // Copy the array because sort changes the array it receives.
  return [...candidates]
    .sort((left, right) => {
      // Order higher scores first.
      if (left.score !== right.score) {
        return right.score - left.score
      }

      // Equal scores use ascending name order.
      if (left.name < right.name) {
        return -1
      }

      if (left.name > right.name) {
        return 1
      }

      return 0
    })
    .map((candidate) => candidate.name)
}
`,
        explanation:
          'Compare the primary score first. Compare names only when scores are equal, and return zero only when both ordering fields are equal. Sort a copied array so the caller\'s order is not modified.',
        complexity: 'O(n log n) time and O(n) space for the copied array and output.',
      },
    ],
    'merge-overlapping-intervals': [
      {
        name: 'Sort by start, then merge once',
        code: `type Interval = [number, number]

export function mergeOverlappingIntervals(
  intervals: Interval[],
): Interval[] {
  // Copy each tuple so neither the outer array nor an inner tuple is modified.
  const sorted = intervals
    .map(([start, end]): Interval => [start, end])
    .sort((left, right) => left[0] - right[0] || left[1] - right[1])

  const merged: Interval[] = []

  for (const [start, end] of sorted) {
    const previous = merged[merged.length - 1]

    if (!previous || start > previous[1]) {
      // This interval begins after the previous interval ends.
      merged.push([start, end])
    } else {
      // The intervals overlap, so extend the previous end when needed.
      previous[1] = Math.max(previous[1], end)
    }
  }

  return merged
}
`,
        explanation:
          'Sorting by start places every possible overlap next to the interval already being built. Copy the tuples, then either append a separated interval or update the end of the previous merged interval.',
        complexity: 'O(n log n) time and O(n) space.',
      },
    ],
    'largest-concatenated-number': [
      {
        name: 'Compare both concatenation orders',
        code: `export function largestConcatenatedNumber(nums: number[]): string {
  const parts = nums.map(String)

  parts.sort((left, right) => {
    // Test which pair order produces the larger combined string.
    const leftFirst = left + right
    const rightFirst = right + left

    if (leftFirst === rightFirst) {
      return 0
    }

    return leftFirst > rightFirst ? -1 : 1
  })

  const result = parts.join('')

  // Several zero values should produce "0", not "000".
  return result.startsWith('0') ? '0' : result
}
`,
        explanation:
          'Numeric size alone does not determine the best order. For each pair, compare the two possible concatenations and place the order with the larger combined string first. Normalize an all-zero result to one zero.',
        complexity:
          'O(n log n * d) time and O(n * d) space, where d is the maximum number of digits in one value.',
      },
    ],
  },
}
