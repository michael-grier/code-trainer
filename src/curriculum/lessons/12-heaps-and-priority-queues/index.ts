import Concept from './concept.mdx'

import type { Lesson } from '../../types'

const numberHeapHelpers = `function pushMin(heap: number[], value: number): void {
  heap.push(value)
  let index = heap.length - 1

  while (index > 0) {
    const parent = Math.floor((index - 1) / 2)

    if (heap[parent] <= heap[index]) {
      break
    }

    const parentValue = heap[parent]
    heap[parent] = heap[index]
    heap[index] = parentValue
    index = parent
  }
}

function popMin(heap: number[]): number {
  const minimum = heap[0]
  const last = heap.pop()!

  if (heap.length === 0) {
    return minimum
  }

  heap[0] = last
  let index = 0

  while (true) {
    const left = index * 2 + 1
    const right = left + 1
    let smallest = index

    if (left < heap.length && heap[left] < heap[smallest]) {
      smallest = left
    }

    if (right < heap.length && heap[right] < heap[smallest]) {
      smallest = right
    }

    if (smallest === index) {
      break
    }

    const currentValue = heap[index]
    heap[index] = heap[smallest]
    heap[smallest] = currentValue
    index = smallest
  }

  return minimum
}`

export const lesson: Lesson = {
  slug: 'heaps-and-priority-queues',
  title: 'Heaps and Priority Queues',
  summary: 'Keep the next priority item at the root while updates cost logarithmic time.',
  track: 'algorithms',
  order: 12,
  concept: Concept,
  problems: [
    {
      id: 'kth-largest-value', kind: 'code', completionMode: 'all-tests-pass',
      title: 'Find the kth-largest value',
      prompt: 'Implement `kthLargestValue`. Given numbers and a valid one-based `k`, return the kth-largest value. Keep a min-heap of at most `k` values instead of sorting the full input. Example: `kthLargestValue([3, 2, 1, 5, 6, 4], 2)` returns `5`.',
      estimatedMinutes: 16, functionName: 'kthLargestValue',
      starter: `export function kthLargestValue(nums: number[], k: number): number {
  return 0
}

console.log(kthLargestValue([3, 2, 1, 5, 6, 4], 2))
`,
      tests: [
        { name: 'finds the second largest', args: [[3, 2, 1, 5, 6, 4], 2], expected: 5 },
        { name: 'handles duplicates', args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], expected: 4 },
        { name: 'finds the largest', args: [[7, 1, 9], 1], expected: 9 },
        { name: 'finds the smallest rank', args: [[7, 1, 9], 3], expected: 1 },
        { name: 'handles negative values', args: [[-5, -2, -9, -1], 2], expected: -2 },
        { name: 'handles one value', args: [[8], 1], expected: 8 },
      ],
    },
    {
      id: 'minimum-meeting-rooms', kind: 'code', completionMode: 'all-tests-pass',
      title: 'Calculate required meeting rooms',
      prompt: 'Implement `minimumMeetingRooms`. Each meeting is a half-open interval `[start, end)`. Return the minimum rooms needed so overlapping meetings use different rooms. A meeting ending at time `t` does not overlap one starting at `t`. Do not modify the input. Example: `minimumMeetingRooms([[0, 30], [5, 10], [15, 20]])` returns `2`.',
      estimatedMinutes: 18, functionName: 'minimumMeetingRooms',
      starter: `type Interval = [number, number]

export function minimumMeetingRooms(meetings: Interval[]): number {
  return 0
}

console.log(minimumMeetingRooms([[0, 30], [5, 10], [15, 20]]))
`,
      tests: [
        { name: 'counts overlapping meetings', args: [[[0, 30], [5, 10], [15, 20]]], expected: 2 },
        { name: 'reuses a room at the same endpoint', args: [[[7, 10], [2, 4], [4, 7]]], expected: 1 },
        { name: 'counts several simultaneous meetings', args: [[[1, 8], [2, 7], [3, 6], [9, 10]]], expected: 3 },
        { name: 'handles contained meetings', args: [[[0, 10], [2, 3], [4, 5]]], expected: 2 },
        { name: 'handles one meeting', args: [[[2, 6]]], expected: 1 },
        { name: 'handles no meetings', args: [[]], expected: 0 },
      ],
    },
    {
      id: 'merge-sorted-arrays', kind: 'code', completionMode: 'all-tests-pass',
      title: 'Merge several sorted arrays',
      prompt: 'Implement `mergeSortedArrays`. Each input array is sorted ascending. Return all values in ascending order. Use a min-priority queue containing at most one current value from each array. Preserve duplicate values. Example: `mergeSortedArrays([[1, 4, 7], [2, 5], [3, 6, 8]])` returns `[1, 2, 3, 4, 5, 6, 7, 8]`.',
      estimatedMinutes: 22, functionName: 'mergeSortedArrays',
      starter: `export function mergeSortedArrays(arrays: number[][]): number[] {
  return []
}

console.log(mergeSortedArrays([[1, 4, 7], [2, 5], [3, 6, 8]]))
`,
      tests: [
        { name: 'merges three arrays', args: [[[1, 4, 7], [2, 5], [3, 6, 8]]], expected: [1, 2, 3, 4, 5, 6, 7, 8] },
        { name: 'preserves duplicates', args: [[[1, 3], [1, 2], [2, 2]]], expected: [1, 1, 2, 2, 2, 3] },
        { name: 'handles empty arrays', args: [[[], [1, 2], []]], expected: [1, 2] },
        { name: 'handles negative values', args: [[[-5, -1], [-3, 0]]], expected: [-5, -3, -1, 0] },
        { name: 'handles one array', args: [[[2, 4, 6]]], expected: [2, 4, 6] },
        { name: 'handles no arrays', args: [[]], expected: [] },
      ],
    },
    {
      id: 'heap-selection-review', kind: 'written', completionMode: 'submitted-with-reference-review',
      title: 'Choose a heap strategy',
      prompt: 'Explain when to use a min-heap or max-heap, why a size-k heap solves top-k problems, how a comparator defines priority for records, and when sorting the complete input is simpler or more appropriate.',
      estimatedMinutes: 9,
      starter: 'I choose the heap root as the value that must be inspected or removed next.',
      referenceAnswer: 'A min-heap keeps the smallest priority at the root; a max-heap keeps the largest. For kth-largest or top-k-largest problems, a size-k min-heap stores the k largest values seen so far and exposes the smallest retained value for replacement. Record heaps need a complete comparator with deterministic tie-breakers. Insert and removal cost O(log h) for heap size h, while reading the root is O(1). Sorting all n values costs O(n log n) and is often simpler when every value is needed in order. A heap is useful when only a small top-k set, repeated next-priority removals, or an online stream is required.',
      rubric: [
        { id: 'root', label: 'Chooses root priority', description: 'Connects min or max order to the next required item.' },
        { id: 'top-k', label: 'Explains size-k retention', description: 'Explains why the root is the value replaced by a better candidate.' },
        { id: 'comparator', label: 'Defines record priority', description: 'Includes deterministic tie-breakers.' },
        { id: 'sorting', label: 'Compares with sorting', description: 'States when full sorting is simpler or required.' },
      ],
    },
  ],
  approaches: {
    'kth-largest-value': [{
      name: 'Size-k min-heap',
      code: `${numberHeapHelpers}

export function kthLargestValue(nums: number[], k: number): number {
  const heap: number[] = []

  for (const num of nums) {
    pushMin(heap, num)
    if (heap.length > k) popMin(heap)
  }

  return heap[0]
}
`,
      explanation: 'Keep only the k largest values seen. The heap root is the smallest retained value, which is the kth-largest after all input values are processed.',
      complexity: 'O(n log k) time and O(k) space.',
    }],
    'minimum-meeting-rooms': [{
      name: 'Min-heap of active end times',
      code: `type Interval = [number, number]

${numberHeapHelpers}

export function minimumMeetingRooms(meetings: Interval[]): number {
  const sorted = meetings.map(([start, end]): Interval => [start, end])
    .sort((left, right) => left[0] - right[0])
  const endTimes: number[] = []
  let maximumRooms = 0

  for (const [start, end] of sorted) {
    while (endTimes.length > 0 && endTimes[0] <= start) popMin(endTimes)
    pushMin(endTimes, end)
    maximumRooms = Math.max(maximumRooms, endTimes.length)
  }

  return maximumRooms
}
`,
      explanation: 'Process meetings by start time. Remove every meeting that already ended, add the current end time, and record the largest number of active meetings.',
      complexity: 'O(n log n) time and O(n) space.',
    }],
    'merge-sorted-arrays': [{
      name: 'Priority queue of current array values',
      code: `type Entry = {
  value: number
  arrayIndex: number
  itemIndex: number
}

export function mergeSortedArrays(arrays: number[][]): number[] {
  const heap: Entry[] = []
  const hasHigherPriority = (left: Entry, right: Entry): boolean => {
    if (left.value !== right.value) {
      return left.value < right.value
    }

    return left.arrayIndex < right.arrayIndex
  }

  const push = (entry: Entry): void => {
    heap.push(entry)
    let index = heap.length - 1

    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)

      if (hasHigherPriority(heap[parent], heap[index])) {
        break
      }

      const parentEntry = heap[parent]
      heap[parent] = heap[index]
      heap[index] = parentEntry
      index = parent
    }
  }

  const pop = (): Entry => {
    const minimum = heap[0]
    const last = heap.pop()!

    if (heap.length === 0) {
      return minimum
    }

    heap[0] = last
    let index = 0

    while (true) {
      const left = index * 2 + 1
      const right = left + 1
      let smallest = index

      if (
        left < heap.length &&
        hasHigherPriority(heap[left], heap[smallest])
      ) {
        smallest = left
      }

      if (
        right < heap.length &&
        hasHigherPriority(heap[right], heap[smallest])
      ) {
        smallest = right
      }

      if (smallest === index) {
        break
      }

      const currentEntry = heap[index]
      heap[index] = heap[smallest]
      heap[smallest] = currentEntry
      index = smallest
    }

    return minimum
  }

  arrays.forEach((array, arrayIndex) => {
    if (array.length > 0) {
      push({ value: array[0], arrayIndex, itemIndex: 0 })
    }
  })

  const result: number[] = []

  while (heap.length > 0) {
    const entry = pop()
    result.push(entry.value)
    const nextIndex = entry.itemIndex + 1

    if (nextIndex < arrays[entry.arrayIndex].length) {
      push({
        value: arrays[entry.arrayIndex][nextIndex],
        arrayIndex: entry.arrayIndex,
        itemIndex: nextIndex,
      })
    }
  }

  return result
}
`,
      explanation: 'Keep only the next unmerged value from each array. Removing one entry adds the next value from that same source array.',
      complexity: 'O(n log k) time and O(k) heap space for n total values and k arrays.',
    }],
  },
}
