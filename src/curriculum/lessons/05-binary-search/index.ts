import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'binary-search',
  title: 'Binary Search',
  summary: 'Use sorted data and monotonic conditions to remove half of the remaining candidates at each step.',
  track: 'algorithms',
  order: 5,
  concept: Concept,
  problems: [
    {
      id: 'find-sorted-index',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find a value in sorted data',
      prompt:
        'Implement `findSortedIndex`. Given a sorted ascending array of distinct numbers and a target, return the target index. Return `-1` when the target is absent. Use binary search. Example: `findSortedIndex([-4, 0, 3, 7, 12], 7)` returns `3`.',
      estimatedMinutes: 12,
      functionName: 'findSortedIndex',
      starter: `export function findSortedIndex(nums: number[], target: number): number {
  return -1
}

console.log(findSortedIndex([-4, 0, 3, 7, 12], 7))
`,
      tests: [
        {
          name: 'finds a value in the right half',
          args: [[-4, 0, 3, 7, 12], 7],
          expected: 3,
        },
        {
          name: 'finds the first value',
          args: [[2, 5, 9, 14], 2],
          expected: 0,
        },
        {
          name: 'finds the last value',
          args: [[2, 5, 9, 14], 14],
          expected: 3,
        },
        {
          name: 'returns -1 for a value between entries',
          args: [[1, 4, 8, 11], 6],
          expected: -1,
        },
        {
          name: 'handles one absent value',
          args: [[5], 3],
          expected: -1,
        },
        {
          name: 'handles an empty array',
          args: [[], 10],
          expected: -1,
        },
      ],
    },
    {
      id: 'first-value-at-least',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find the first qualifying value',
      prompt:
        'Implement `firstIndexAtLeast`. Given a sorted ascending array that may contain duplicates, return the first index whose value is greater than or equal to `target`. Return `-1` if no value qualifies. Example: `firstIndexAtLeast([1, 3, 3, 5, 8], 3)` returns `1`.',
      estimatedMinutes: 15,
      functionName: 'firstIndexAtLeast',
      starter: `export function firstIndexAtLeast(
  nums: number[],
  target: number,
): number {
  return -1
}

console.log(firstIndexAtLeast([1, 3, 3, 5, 8], 3))
`,
      tests: [
        {
          name: 'finds the first duplicate target',
          args: [[1, 3, 3, 5, 8], 3],
          expected: 1,
        },
        {
          name: 'finds the first greater value',
          args: [[1, 3, 3, 5, 8], 4],
          expected: 3,
        },
        {
          name: 'returns the first index when all values qualify',
          args: [[2, 4, 6], -1],
          expected: 0,
        },
        {
          name: 'finds the final index',
          args: [[2, 4, 6], 6],
          expected: 2,
        },
        {
          name: 'returns -1 when no value qualifies',
          args: [[2, 4, 6], 7],
          expected: -1,
        },
        {
          name: 'handles an empty array',
          args: [[], 3],
          expected: -1,
        },
      ],
    },
    {
      id: 'minimum-processing-rate',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find the minimum processing rate',
      prompt:
        'Implement `minimumProcessingRate`. Each positive number in `workloads` is the size of one job. At an integer rate of `rate`, a job takes `Math.ceil(job / rate)` hours, and jobs run one at a time. Return the smallest positive rate that finishes all jobs within `hours`. `hours` is at least the number of jobs. Return `0` for an empty workload. Example: `minimumProcessingRate([3, 6, 7, 11], 8)` returns `4`.',
      estimatedMinutes: 20,
      functionName: 'minimumProcessingRate',
      starter: `export function minimumProcessingRate(
  workloads: number[],
  hours: number,
): number {
  return 0
}

console.log(minimumProcessingRate([3, 6, 7, 11], 8))
`,
      tests: [
        {
          name: 'finds the minimum feasible rate',
          args: [[3, 6, 7, 11], 8],
          expected: 4,
        },
        {
          name: 'requires the largest job when hours equal job count',
          args: [[30, 11, 23, 4, 20], 5],
          expected: 30,
        },
        {
          name: 'finds a boundary between two rates',
          args: [[30, 11, 23, 4, 20], 6],
          expected: 23,
        },
        {
          name: 'handles equal small jobs',
          args: [[1, 1, 1], 3],
          expected: 1,
        },
        {
          name: 'divides one job across available hours',
          args: [[100], 4],
          expected: 25,
        },
        {
          name: 'handles an empty workload',
          args: [[], 5],
          expected: 0,
        },
      ],
    },
    {
      id: 'binary-search-boundary-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the search boundary',
      prompt:
        'Compare exact-value binary search with a search for the first value that satisfies a condition. Explain what the active interval contains, why each update removes only invalid candidates, and how you choose the initial lower and upper bounds.',
      estimatedMinutes: 9,
      starter:
        'For exact search, I use a closed interval that contains every index where the target may still be present.',
      referenceAnswer:
        'For exact search with a closed interval [left, right], every possible target index remains inside that interval. If nums[mid] is below target, sorted order proves that mid and every smaller index are invalid, so left becomes mid + 1. If nums[mid] is above target, mid and every larger index are invalid, so right becomes mid - 1. For the first qualifying value, use a half-open interval [left, right). When the condition is true at mid, mid may be the first valid index, so keep it by setting right = mid. When the condition is false, remove mid by setting left = mid + 1. For a numeric answer search, the bounds must include every possible answer, and the condition must change in one direction from false to true or from true to false.',
      rubric: [
        {
          id: 'interval',
          label: 'Defines the active interval',
          description:
            'States whether the interval is closed or half-open and what candidates it contains.',
        },
        {
          id: 'updates',
          label: 'Justifies each update',
          description:
            'Explains why sorted order or the condition removes the excluded candidates.',
        },
        {
          id: 'bounds',
          label: 'Chooses complete bounds',
          description:
            'Explains how the initial bounds include every possible index or numeric answer.',
        },
      ],
    },
  ],
  approaches: {
    'find-sorted-index': [
      {
        name: 'Closed-interval binary search',
        code: `export function findSortedIndex(nums: number[], target: number): number {
  // Every possible target index is inside [left, right].
  let left = 0
  let right = nums.length - 1

  while (left <= right) {
    // Select an index inside the active interval.
    const middle = left + Math.floor((right - left) / 2)

    if (nums[middle] === target) {
      return middle
    }

    if (nums[middle] < target) {
      // Sorted order removes middle and every smaller index.
      left = middle + 1
    } else {
      // Sorted order removes middle and every larger index.
      right = middle - 1
    }
  }

  return -1
}
`,
        explanation:
          'Keep a closed interval that contains every index where the target may still exist. Each comparison uses sorted order to remove the middle index and one side of the interval.',
        complexity: 'O(log n) time and O(1) extra space.',
      },
    ],
    'first-value-at-least': [
      {
        name: 'Half-open lower-bound search',
        code: `export function firstIndexAtLeast(
  nums: number[],
  target: number,
): number {
  // Search [left, right), where nums.length represents no valid index.
  let left = 0
  let right = nums.length

  while (left < right) {
    const middle = left + Math.floor((right - left) / 2)

    if (nums[middle] >= target) {
      // middle qualifies, but an earlier index may also qualify.
      right = middle
    } else {
      // middle does not qualify, so the answer must be after it.
      left = middle + 1
    }
  }

  return left === nums.length ? -1 : left
}
`,
        explanation:
          'Search for the boundary between values below target and values greater than or equal to target. Keep a qualifying middle index by moving right to middle, and remove a non-qualifying middle index by moving left past it.',
        complexity: 'O(log n) time and O(1) extra space.',
      },
    ],
    'minimum-processing-rate': [
      {
        name: 'Binary search over possible rates',
        code: `export function minimumProcessingRate(
  workloads: number[],
  hours: number,
): number {
  if (workloads.length === 0) {
    return 0
  }

  // Find the largest job without passing the array as function arguments.
  let low = 1
  let high = 0

  for (const workload of workloads) {
    high = Math.max(high, workload)
  }

  const canFinish = (rate: number): boolean => {
    let requiredHours = 0

    for (const workload of workloads) {
      requiredHours += Math.ceil(workload / rate)

      // More work cannot reduce the required number of hours.
      if (requiredHours > hours) {
        return false
      }
    }

    return true
  }

  while (low < high) {
    const middle = low + Math.floor((high - low) / 2)

    if (canFinish(middle)) {
      // middle meets the time limit, so test it and smaller rates.
      high = middle
    } else {
      // middle is too slow, so remove it and every slower rate.
      low = middle + 1
    }
  }

  return low
}
`,
        explanation:
          'The completion condition changes from false to true as the rate increases. Search for the first rate where the required hours are within the limit.',
        complexity:
          'O(n log m) time and O(1) extra space, where n is the number of jobs and m is the largest job size.',
      },
    ],
  },
}
