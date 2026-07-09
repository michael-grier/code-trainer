import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'arrays-and-hashing',
  title: 'Arrays and Hashing',
  summary: 'Use arrays, objects, maps, and sets to solve frequency and lookup problems.',
  track: 'algorithms',
  order: 1,
  concept: Concept,
  problems: [
    {
      id: 'valid-anagram',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Valid anagram',
      prompt:
        'Implement `areAnagrams`. Return true when two lowercase strings contain the same characters with the same frequencies. Return false when length or character counts differ. Example: `areAnagrams("listen", "silent")` returns `true`; `areAnagrams("rat", "tarp")` returns `false`.',
      estimatedMinutes: 12,
      functionName: 'areAnagrams',
      starter: `export function areAnagrams(left: string, right: string): boolean {
  return false
}

console.log(areAnagrams('listen', 'silent'))
`,
      tests: [
        {
          name: 'matches reordered characters',
          args: ['listen', 'silent'],
          expected: true,
        },
        {
          name: 'handles repeated letters',
          args: ['aabbcc', 'abcabc'],
          expected: true,
        },
        {
          name: 'rejects different counts',
          args: ['aabb', 'abbb'],
          expected: false,
        },
        {
          name: 'rejects different lengths',
          args: ['rat', 'tarp'],
          expected: false,
        },
        {
          name: 'handles empty strings',
          args: ['', ''],
          expected: true,
        },
      ],
    },
    {
      id: 'group-anagrams',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Group anagrams',
      prompt:
        'Implement `groupAnagrams` for lowercase English words. Words with the same character frequencies belong in the same group. Preserve the order of groups by the first word that creates each group, and preserve word order inside each group. Example: `groupAnagrams(["eat", "tea", "bat"])` returns `[["eat", "tea"], ["bat"]]`.',
      estimatedMinutes: 16,
      functionName: 'groupAnagrams',
      starter: `export function groupAnagrams(words: string[]): string[][] {
  return []
}

console.log(groupAnagrams(['eat', 'tea', 'bat']))
`,
      tests: [
        {
          name: 'groups common anagrams',
          args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']],
          expected: [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']],
        },
        {
          name: 'keeps singleton groups',
          args: [['abc', 'def', 'cab']],
          expected: [['abc', 'cab'], ['def']],
        },
        {
          name: 'handles duplicate words',
          args: [['listen', 'silent', 'listen']],
          expected: [['listen', 'silent', 'listen']],
        },
        {
          name: 'handles empty input',
          args: [[]],
          expected: [],
        },
        {
          name: 'handles empty strings',
          args: [['', 'a', '']],
          expected: [['', ''], ['a']],
        },
      ],
    },
    {
      id: 'longest-consecutive-sequence',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Longest consecutive sequence',
      prompt:
        'Implement `longestConsecutive`. Given an unsorted array of numbers, return the length of the longest run of consecutive integer values. Aim for O(n) time by using a set and only starting scans at the first value in a run. Example: `longestConsecutive([100, 4, 200, 1, 3, 2])` returns `4` for the run `1, 2, 3, 4`.',
      estimatedMinutes: 18,
      functionName: 'longestConsecutive',
      starter: `export function longestConsecutive(nums: number[]): number {
  return 0
}

console.log(longestConsecutive([100, 4, 200, 1, 3, 2]))
`,
      tests: [
        {
          name: 'finds a middle run',
          args: [[100, 4, 200, 1, 3, 2]],
          expected: 4,
        },
        {
          name: 'ignores duplicate values',
          args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]],
          expected: 9,
        },
        {
          name: 'handles empty arrays',
          args: [[]],
          expected: 0,
        },
        {
          name: 'handles negative values',
          args: [[-2, -1, 0, 4]],
          expected: 3,
        },
        {
          name: 'handles repeated short runs',
          args: [[1, 2, 2, 3, 10, 11]],
          expected: 3,
        },
      ],
    },
    {
      id: 'hashing-tradeoffs-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the hashing choice',
      prompt:
        'You are given an interview prompt that asks for repeated membership or frequency checks. Explain how you would choose between an array scan, a Set, a Map, and a plain object. Include the edge cases you would test.',
      estimatedMinutes: 8,
      starter:
        'I would first look for repeated lookup or counting work. Then...',
      referenceAnswer:
        'A strong answer identifies repeated lookup or frequency checks as the signal for hashing. It keeps array scans for one-off or tiny inputs, uses Set for existence and deduplication, uses Map for counts or non-string keys, and reserves plain objects for simple string-keyed records when prototype concerns and missing defaults are handled. It mentions average O(1) lookup with extra memory, explains key construction costs, and tests empty input, duplicates, missing keys, negative numbers, and any case-sensitivity or normalization assumptions.',
      rubric: [
        {
          id: 'signal',
          label: 'Recognizes the signal',
          description:
            'Connects repeated lookup, deduplication, or counting to a hash-backed structure.',
        },
        {
          id: 'tradeoffs',
          label: 'Explains tradeoffs',
          description:
            'Compares runtime, memory, key shape, insertion order, and implementation simplicity.',
        },
        {
          id: 'edge-cases',
          label: 'Tests edge cases',
          description:
            'Names representative empty, duplicate, missing-key, and normalization cases.',
        },
      ],
    },
    {
      id: 'lookup-strategy-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Design a duplicate event filter',
      prompt:
        'Design a small in-memory duplicate filter for event IDs consumed from a stream.',
      estimatedMinutes: 12,
      scenario:
        'A client receives event objects with an id and createdAt timestamp. The UI should process each event ID once, remember recent IDs for a limited window, and avoid unbounded memory growth.',
      sections: [
        {
          id: 'requirements',
          type: 'short-answer',
          label: 'Requirements',
          prompt:
            'What behavior, constraints, and edge cases must this duplicate filter satisfy?',
        },
        {
          id: 'state',
          type: 'entity-list',
          label: 'State',
          prompt: 'List the state you would keep in memory.',
        },
        {
          id: 'algorithm',
          type: 'short-answer',
          label: 'Algorithm',
          prompt:
            'How would the filter check an incoming event, record it, and evict old entries?',
        },
        {
          id: 'primary-tradeoff',
          type: 'tradeoff',
          label: 'Primary tradeoff',
          prompt: 'Which tradeoff should drive the design discussion?',
          options: [
            'Memory',
            'Runtime',
            'Correctness window',
            'Implementation simplicity',
          ],
        },
      ],
      rubric: [
        {
          id: 'bounded-memory',
          label: 'Bounds memory',
          description:
            'Uses a retention policy such as TTL, max size, or windowed eviction.',
        },
        {
          id: 'correctness',
          label: 'Preserves duplicate behavior',
          description:
            'Explains how IDs are checked before processing and recorded afterward.',
        },
        {
          id: 'tradeoffs',
          label: 'Names tradeoffs',
          description:
            'Connects memory, runtime, and false duplicate or missed duplicate risks to the chosen window.',
        },
      ],
      referenceAnswer:
        'A solid design stores seen IDs in a Set or Map keyed by event ID, plus enough ordering metadata to evict old IDs. A Map from ID to timestamp can support membership checks and timestamp-based cleanup; a queue of IDs or timestamps can make eviction cheaper when events arrive roughly in order. The answer should define the retention window, handle duplicate IDs before processing side effects, record accepted IDs after processing starts or succeeds based on the product requirement, and explain the memory versus correctness tradeoff of forgetting old IDs.',
    },
  ],
  approaches: {
    'valid-anagram': [
      {
        name: 'Frequency map',
        code: `export function areAnagrams(left: string, right: string): boolean {
  // Different lengths cannot contain the same characters.
  if (left.length !== right.length) {
    return false
  }

  // First count the characters required from the left string.
  const counts = new Map<string, number>()

  for (const char of left) {
    counts.set(char, (counts.get(char) ?? 0) + 1)
  }

  // Then compare the right string against those required counts.
  for (const char of right) {
    // This character now needs one fewer match.
    const nextCount = (counts.get(char) ?? 0) - 1

    // A negative count means right used a character too many times.
    if (nextCount < 0) {
      return false
    }

    // Delete completed counts so counts only stores characters still needed.
    if (nextCount === 0) {
      counts.delete(char)
    } else {
      counts.set(char, nextCount)
    }
  }

  // No required characters remain unmatched.
  return counts.size === 0
}
`,
        explanation:
          'Count every character in the first string, then decrease those required counts while scanning the second string. A missing or negative count proves the strings are not anagrams.',
        complexity: 'O(n) time and O(k) space, where k is the number of distinct characters.',
      },
    ],
    'group-anagrams': [
      {
        name: 'Count signature',
        code: `function createSignature(word: string): string {
  // One slot per lowercase English letter.
  const counts = new Array<number>(26).fill(0)

  for (const char of word) {
    // "a" maps to 0, "b" maps to 1, and so on.
    counts[char.charCodeAt(0) - 97] += 1
  }

  // Serialize the counts so the signature can be a Map key.
  return counts.join('#')
}

export function groupAnagrams(words: string[]): string[][] {
  // Each signature owns one output group.
  const groups = new Map<string, string[]>()

  for (const word of words) {
    // Anagrams produce the same signature.
    const signature = createSignature(word)
    const group = groups.get(signature)

    // Append to preserve the original word order inside the group.
    if (group) {
      group.push(word)
    } else {
      groups.set(signature, [word])
    }
  }

  // Map values preserve first-seen group order.
  return [...groups.values()]
}
`,
        explanation:
          'Build a canonical key from the 26 lowercase character counts. Anagrams share the same key, and Map insertion order preserves the required group order.',
        complexity:
          'O(n * m) time and O(n * m) space, where n is the number of words and m is the average word length.',
      },
    ],
    'longest-consecutive-sequence': [
      {
        name: 'Set starts only',
        code: `export function longestConsecutive(nums: number[]): number {
  // Store one copy of each number so each value is checked at most once.
  const values = new Set(nums)
  let best = 0

  for (const value of values) {
    // Only start counting from the first value in a run.
    if (values.has(value - 1)) {
      continue
    }

    // Walk forward until the consecutive run ends.
    let length = 1
    let next = value + 1

    while (values.has(next)) {
      length += 1
      next += 1
    }

    // Keep the longest run found so far.
    best = Math.max(best, length)
  }

  return best
}
`,
        explanation:
          'Store each distinct number in a Set. Only start counting from values that have no predecessor, so each run is scanned once instead of restarting from every number.',
        complexity: 'O(n) average time and O(n) space.',
      },
    ],
  },
}
