import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'prefix-sums-and-difference-arrays',
  title: 'Prefix Sums and Difference Arrays',
  summary: 'Use cumulative totals to answer range questions and apply many range updates efficiently.',
  track: 'algorithms',
  order: 4,
  concept: Concept,
  problems: [
    {
      id: 'answer-range-sums',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Answer range sums',
      prompt:
        'Implement `answerRangeSums`. Given an array of numbers and inclusive zero-based queries `[left, right]`, return the sum for each queried range in the same order. Every query is valid. Build one prefix array instead of scanning each range. Example: `answerRangeSums([3, -2, 5, 1], [[0, 2], [1, 3], [2, 2]])` returns `[6, 4, 5]`.',
      estimatedMinutes: 12,
      functionName: 'answerRangeSums',
      starter: `export function answerRangeSums(
  nums: number[],
  queries: [number, number][],
): number[] {
  return []
}

console.log(answerRangeSums([3, -2, 5, 1], [[0, 2], [1, 3], [2, 2]]))
`,
      tests: [
        {
          name: 'answers overlapping ranges',
          args: [[3, -2, 5, 1], [[0, 2], [1, 3], [2, 2]]],
          expected: [6, 4, 5],
        },
        {
          name: 'answers the whole array',
          args: [[4, 1, -3, 7], [[0, 3]]],
          expected: [9],
        },
        {
          name: 'preserves query order',
          args: [[2, 4, 6, 8], [[2, 3], [0, 0], [1, 2]]],
          expected: [14, 2, 10],
        },
        {
          name: 'handles negative range sums',
          args: [[-5, 2, -4], [[0, 1], [1, 2]]],
          expected: [-3, -2],
        },
        {
          name: 'handles no queries',
          args: [[1, 2, 3], []],
          expected: [],
        },
        {
          name: 'handles an empty input with no queries',
          args: [[], []],
          expected: [],
        },
      ],
    },
    {
      id: 'count-target-sum-subarrays',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Count target-sum subarrays',
      prompt:
        'Implement `countTargetSumSubarrays`. Given an array that may contain positive, negative, and zero values, return the number of contiguous subarrays whose sum equals `target`. Use prefix-sum frequencies because this method works correctly when the input contains negative values. Example: `countTargetSumSubarrays([1, -1, 0], 0)` returns `3` for `[1, -1]`, `[1, -1, 0]`, and `[0]`.',
      estimatedMinutes: 18,
      functionName: 'countTargetSumSubarrays',
      starter: `export function countTargetSumSubarrays(
  nums: number[],
  target: number,
): number {
  return 0
}

console.log(countTargetSumSubarrays([1, -1, 0], 0))
`,
      tests: [
        {
          name: 'counts overlapping target sums',
          args: [[1, 1, 1], 2],
          expected: 2,
        },
        {
          name: 'handles negative values and zero',
          args: [[1, -1, 0], 0],
          expected: 3,
        },
        {
          name: 'counts repeated zero prefixes',
          args: [[0, 0, 0], 0],
          expected: 6,
        },
        {
          name: 'finds several target ranges',
          args: [[3, 4, 7, 2, -3, 1, 4, 2], 7],
          expected: 4,
        },
        {
          name: 'handles a single matching value',
          args: [[5], 5],
          expected: 1,
        },
        {
          name: 'handles empty arrays',
          args: [[], 0],
          expected: 0,
        },
      ],
    },
    {
      id: 'apply-range-updates',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Apply batched range updates',
      prompt:
        'Implement `applyRangeUpdates`. Start with an array of `length` zeroes. Each update is `[start, end, delta]` and adds `delta` to every index in the inclusive zero-based range from `start` through `end`. `length` is a non-negative integer, and every update is valid. Apply all updates with a difference array, then return the final values. Example: `applyRangeUpdates(5, [[1, 3, 2], [2, 4, 3], [0, 2, -2]])` returns `[-2, 0, 3, 5, 3]`.',
      estimatedMinutes: 18,
      functionName: 'applyRangeUpdates',
      starter: `export function applyRangeUpdates(
  length: number,
  updates: [number, number, number][],
): number[] {
  return []
}

console.log(applyRangeUpdates(5, [[1, 3, 2], [2, 4, 3], [0, 2, -2]]))
`,
      tests: [
        {
          name: 'combines overlapping updates',
          args: [5, [[1, 3, 2], [2, 4, 3], [0, 2, -2]]],
          expected: [-2, 0, 3, 5, 3],
        },
        {
          name: 'handles an update across the full array',
          args: [4, [[0, 3, 5]]],
          expected: [5, 5, 5, 5],
        },
        {
          name: 'handles single-index updates',
          args: [3, [[1, 1, 4], [1, 1, -1]]],
          expected: [0, 3, 0],
        },
        {
          name: 'combines positive and negative updates',
          args: [6, [[0, 2, 3], [2, 5, -2], [4, 4, 7]]],
          expected: [3, 3, 1, -2, 5, -2],
        },
        {
          name: 'returns zeroes when there are no updates',
          args: [3, []],
          expected: [0, 0, 0],
        },
        {
          name: 'handles an empty result',
          args: [0, []],
          expected: [],
        },
      ],
    },
    {
      id: 'cumulative-pattern-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Choose the cumulative pattern',
      prompt:
        'Compare prefix sums, a prefix-sum frequency map, a sliding window, and a difference array. For each one, describe the type of problem it solves, the invariant it maintains, and one assumption or boundary mistake you would check. The invariant should state exactly what the stored values represent.',
      estimatedMinutes: 10,
      starter:
        'I would start by asking whether the prompt repeats range queries, counts subarrays, moves one window, or batches range updates...',
      referenceAnswer:
        'A strong answer uses a prefix array for many range-sum queries when the input does not change: prefix[i] stores the sum before index i, so an inclusive [left, right] sum is prefix[right + 1] - prefix[left]. It uses a prefix-sum frequency map to count target-sum subarrays, including when values are negative: before adding the current prefix, the map records how many previous prefixes equal currentPrefix - target, and it starts with prefix 0 recorded once. It uses a sliding window when pointer movement has a predictable effect, such as removing a positive left value always decreasing the sum; negative values can make that movement rule incorrect. It uses a difference array for many range updates when only the final values are needed: add delta at start, subtract it after end, then calculate the prefix sum once. Important checks include the extra prefix zero, right + 1 for inclusive queries, counting before recording the current prefix, and placing the difference-array end marker after the inclusive end.',
      rubric: [
        {
          id: 'signals',
          label: 'Matches problems to patterns',
          description:
            'Separates repeated range queries, target-sum counting, moving windows, and batched range updates.',
        },
        {
          id: 'invariants',
          label: 'States the invariants',
          description:
            'Explains what each prefix, frequency map, window state, or difference marker represents.',
        },
        {
          id: 'boundaries',
          label: 'Checks boundaries and assumptions',
          description:
            'Identifies inclusive endpoints, the initial zero prefix, update end markers, and any requirement that values change in one direction.',
        },
      ],
    },
  ],
  approaches: {
    'answer-range-sums': [
      {
        name: 'Prefix array with an extra zero',
        code: `export function answerRangeSums(
  nums: number[],
  queries: [number, number][],
): number[] {
  // prefix[i] is the sum of values before index i.
  const prefix = new Array<number>(nums.length + 1).fill(0)

  for (let index = 0; index < nums.length; index += 1) {
    // Add this input value to the previous cumulative sum.
    prefix[index + 1] = prefix[index] + nums[index]
  }

  return queries.map(([left, right]) => {
    // Subtract the sum before left from the sum before right + 1.
    return prefix[right + 1] - prefix[left]
  })
}
`,
        explanation:
          'Store a leading zero so prefix[i] always means the sum before index i. For an inclusive range, subtract the sum before left from the sum before right + 1. The same formula works when left is zero.',
        complexity:
          'O(n + q) time and O(n) space, where n is the array length and q is the number of queries.',
      },
    ],
    'count-target-sum-subarrays': [
      {
        name: 'Prefix-sum frequencies',
        code: `export function countTargetSumSubarrays(
  nums: number[],
  target: number,
): number {
  // The empty prefix has sum zero and ends before the array starts.
  const frequencies = new Map<number, number>([[0, 1]])
  let prefix = 0
  let count = 0

  for (const num of nums) {
    // Add the current value to the sum from index zero.
    prefix += num

    // An earlier prefix of prefix - target creates a target-sum subarray.
    const requiredPrefix = prefix - target
    count += frequencies.get(requiredPrefix) ?? 0

    // Record this prefix only after counting subarrays ending here.
    frequencies.set(prefix, (frequencies.get(prefix) ?? 0) + 1)
  }

  return count
}
`,
        explanation:
          'If two prefix sums differ by target, the values between their indexes sum to target. Count how often each previous prefix occurred, query the required previous value before inserting the current prefix, and record the initial zero prefix so ranges starting at index zero are counted.',
        complexity: 'O(n) average time and O(n) space.',
      },
    ],
    'apply-range-updates': [
      {
        name: 'Difference markers and one final scan',
        code: `export function applyRangeUpdates(
  length: number,
  updates: [number, number, number][],
): number[] {
  // The extra slot can hold a stop marker after the last output index.
  const difference = new Array<number>(length + 1).fill(0)

  for (const [start, end, delta] of updates) {
    // Start applying delta at the inclusive left boundary.
    difference[start] += delta

    // Stop applying delta immediately after the inclusive right boundary.
    difference[end + 1] -= delta
  }

  const result = new Array<number>(length).fill(0)
  let running = 0

  for (let index = 0; index < length; index += 1) {
    // Integrate every marker that starts or stops at this index.
    running += difference[index]
    result[index] = running
  }

  return result
}
`,
        explanation:
          'Each update records the index where its value begins and the index after its value ends. Summing the difference markers from left to right calculates the combined value at every index. This avoids updating every covered array index for every update.',
        complexity:
          'O(u + n) time and O(n) space, where u is the number of updates and n is the result length.',
      },
    ],
  },
}
