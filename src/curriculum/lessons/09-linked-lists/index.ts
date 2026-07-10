import Concept from './concept.mdx'

import type { Lesson } from '../../types'

type ListNodeData = {
  value: number
  next: ListNodeData | null
}

export const lesson: Lesson = {
  slug: 'linked-lists',
  title: 'Linked Lists',
  summary: 'Change node links while preserving every reference that is still needed for traversal.',
  track: 'algorithms',
  order: 9,
  concept: Concept,
  problems: [
    {
      id: 'reverse-linked-list',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Reverse a linked list',
      prompt:
        'Implement `reverseLinkedList`. A node has `{ value, next }`, and `head` is the first node or `null`. Reverse every `next` link and return the new head. You may modify the input nodes. Example: `1 -> 2 -> 3 -> null` becomes `3 -> 2 -> 1 -> null`.',
      estimatedMinutes: 13,
      functionName: 'reverseLinkedList',
      starter: `type ListNode = {
  value: number
  next: ListNode | null
}

export function reverseLinkedList(head: ListNode | null): ListNode | null {
  return head
}

const example: ListNode = {
  value: 1,
  next: { value: 2, next: { value: 3, next: null } },
}
console.log(reverseLinkedList(example))
`,
      tests: [
        {
          name: 'reverses three nodes',
          args: [list(1, 2, 3)],
          expected: list(3, 2, 1),
        },
        {
          name: 'reverses two nodes',
          args: [list(4, 9)],
          expected: list(9, 4),
        },
        {
          name: 'keeps one node',
          args: [list(7)],
          expected: list(7),
        },
        {
          name: 'handles repeated values',
          args: [list(2, 2, 3)],
          expected: list(3, 2, 2),
        },
        {
          name: 'handles negative values',
          args: [list(-1, 0, 5)],
          expected: list(5, 0, -1),
        },
        {
          name: 'handles an empty list',
          args: [null],
          expected: null,
        },
      ],
    },
    {
      id: 'remove-nth-from-end',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Remove a node from the end',
      prompt:
        'Implement `removeNthFromEnd`. Given a linked-list head and a valid positive `n`, remove the node that is `n` positions from the end and return the resulting head. You may modify the input nodes. Use a dummy node and two pointers so the list is scanned once. Example: removing `n = 2` from `1 -> 2 -> 3 -> 4 -> 5 -> null` returns `1 -> 2 -> 3 -> 5 -> null`.',
      estimatedMinutes: 18,
      functionName: 'removeNthFromEnd',
      starter: `type ListNode = {
  value: number
  next: ListNode | null
}

export function removeNthFromEnd(
  head: ListNode | null,
  n: number,
): ListNode | null {
  return head
}

const example: ListNode = {
  value: 1,
  next: { value: 2, next: { value: 3, next: null } },
}
console.log(removeNthFromEnd(example, 2))
`,
      tests: [
        {
          name: 'removes a middle node counted from the end',
          args: [list(1, 2, 3, 4, 5), 2],
          expected: list(1, 2, 3, 5),
        },
        {
          name: 'removes the head',
          args: [list(1, 2, 3), 3],
          expected: list(2, 3),
        },
        {
          name: 'removes the tail',
          args: [list(1, 2, 3), 1],
          expected: list(1, 2),
        },
        {
          name: 'removes the only node',
          args: [list(8), 1],
          expected: null,
        },
        {
          name: 'removes the head of a two-node list',
          args: [list(4, 5), 2],
          expected: list(5),
        },
        {
          name: 'handles repeated values by position',
          args: [list(2, 2, 2, 2), 3],
          expected: list(2, 2, 2),
        },
      ],
    },
    {
      id: 'reorder-linked-list',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Reorder a linked list',
      prompt:
        'Implement `reorderLinkedList`. Reorder nodes from `first -> second -> ... -> last` into `first -> last -> second -> second-last -> ...`. Return the original head after changing links in place. Use a middle-node search, reverse the second half, then merge the two halves. Example: `1 -> 2 -> 3 -> 4 -> 5 -> null` becomes `1 -> 5 -> 2 -> 4 -> 3 -> null`.',
      estimatedMinutes: 23,
      functionName: 'reorderLinkedList',
      starter: `type ListNode = {
  value: number
  next: ListNode | null
}

export function reorderLinkedList(head: ListNode | null): ListNode | null {
  return head
}

const example: ListNode = {
  value: 1,
  next: {
    value: 2,
    next: { value: 3, next: { value: 4, next: null } },
  },
}
console.log(reorderLinkedList(example))
`,
      tests: [
        {
          name: 'reorders an odd-length list',
          args: [list(1, 2, 3, 4, 5)],
          expected: list(1, 5, 2, 4, 3),
        },
        {
          name: 'reorders an even-length list',
          args: [list(1, 2, 3, 4)],
          expected: list(1, 4, 2, 3),
        },
        {
          name: 'reorders six nodes',
          args: [list(1, 2, 3, 4, 5, 6)],
          expected: list(1, 6, 2, 5, 3, 4),
        },
        {
          name: 'keeps two nodes in order',
          args: [list(3, 7)],
          expected: list(3, 7),
        },
        {
          name: 'keeps one node',
          args: [list(9)],
          expected: list(9),
        },
        {
          name: 'handles an empty list',
          args: [null],
          expected: null,
        },
      ],
    },
    {
      id: 'linked-list-pointer-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain safe link changes',
      prompt:
        'Explain how you change linked-list pointers without losing access to unprocessed nodes. Include the role of a saved `next` reference, a dummy node, slow and fast pointers, and the mutation assumption you would state before coding.',
      estimatedMinutes: 9,
      starter:
        'Before changing current.next, I store its original next node so traversal can continue.',
      referenceAnswer:
        'Before assigning current.next during reversal, save the original next node in a local variable. Otherwise the only reference to the unprocessed part of the list may be lost. A dummy node provides a predecessor before the real head, so removing or inserting at the head uses the same link update as any other position. Slow and fast pointers create a known distance or locate a midpoint without storing every node. For removal from the end, advancing fast n nodes before moving both pointers keeps slow at the predecessor of the node to remove. The answer should state whether input nodes may be modified. If mutation is not allowed, allocate new nodes rather than changing next links on the input.',
      rubric: [
        {
          id: 'saved-next',
          label: 'Preserves traversal',
          description:
            'Stores the original next reference before changing a link.',
        },
        {
          id: 'dummy-node',
          label: 'Explains the dummy node',
          description:
            'Uses a predecessor node to make head changes follow the normal case.',
        },
        {
          id: 'pointer-gap',
          label: 'Explains pointer roles',
          description:
            'Connects slow and fast pointer movement to the required position.',
        },
        {
          id: 'mutation',
          label: 'States mutation rules',
          description:
            'Clarifies whether links on input nodes may be changed.',
        },
      ],
    },
  ],
  approaches: {
    'reverse-linked-list': [
      {
        name: 'Iterative link reversal',
        code: `type ListNode = {
  value: number
  next: ListNode | null
}

export function reverseLinkedList(head: ListNode | null): ListNode | null {
  let previous: ListNode | null = null
  let current = head

  while (current) {
    // Save the unprocessed list before changing current.next.
    const next = current.next

    // Point the current node toward the reversed part.
    current.next = previous
    previous = current
    current = next
  }

  return previous
}
`,
        explanation:
          'Track the reversed part with previous and the unprocessed part with current. Save current.next before changing it, then advance both references.',
        complexity: 'O(n) time and O(1) extra space.',
      },
    ],
    'remove-nth-from-end': [
      {
        name: 'Dummy node with a fixed pointer gap',
        code: `type ListNode = {
  value: number
  next: ListNode | null
}

export function removeNthFromEnd(
  head: ListNode | null,
  n: number,
): ListNode | null {
  // The dummy node provides a predecessor when the head is removed.
  const dummy: ListNode = { value: 0, next: head }
  let fast: ListNode = dummy
  let slow: ListNode = dummy

  for (let step = 0; step < n; step += 1) {
    fast = fast.next!
  }

  while (fast.next) {
    fast = fast.next
    slow = slow.next!
  }

  // slow is immediately before the node that must be removed.
  slow.next = slow.next!.next
  return dummy.next
}
`,
        explanation:
          'Start both pointers at a dummy node and move fast n nodes ahead. Moving both until fast reaches the tail leaves slow immediately before the node to remove.',
        complexity: 'O(n) time and O(1) extra space.',
      },
    ],
    'reorder-linked-list': [
      {
        name: 'Find, reverse, and alternate',
        code: `type ListNode = {
  value: number
  next: ListNode | null
}

export function reorderLinkedList(head: ListNode | null): ListNode | null {
  if (!head || !head.next) {
    return head
  }

  // Find the end of the first half.
  let slow = head
  let fast = head

  while (fast.next && fast.next.next) {
    slow = slow.next!
    fast = fast.next.next
  }

  // Separate and reverse the second half.
  let second = slow.next
  slow.next = null
  let previous: ListNode | null = null

  while (second) {
    const next = second.next
    second.next = previous
    previous = second
    second = next
  }

  // Insert one reversed node after each first-half node.
  let first: ListNode | null = head
  second = previous

  while (second) {
    const firstNext = first!.next
    const secondNext = second.next
    first!.next = second
    second.next = firstNext
    first = firstNext
    second = secondNext
  }

  return head
}
`,
        explanation:
          'Find the midpoint, disconnect and reverse the second half, then alternate nodes from the first half and reversed second half. Save both next references before changing either link.',
        complexity: 'O(n) time and O(1) extra space.',
      },
    ],
  },
}

function list(...values: number[]): ListNodeData | null {
  let head: ListNodeData | null = null

  for (let index = values.length - 1; index >= 0; index -= 1) {
    head = { value: values[index], next: head }
  }

  return head
}
