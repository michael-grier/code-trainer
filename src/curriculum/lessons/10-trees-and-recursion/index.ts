import Concept from './concept.mdx'

import type { Lesson } from '../../types'

type TreeNodeData = {
  value: number
  left: TreeNodeData | null
  right: TreeNodeData | null
}

export const lesson: Lesson = {
  slug: 'trees-and-recursion',
  title: 'Trees and Recursion',
  summary: 'Define what one recursive call returns, then combine the left and right subtree results at each node.',
  track: 'algorithms',
  order: 10,
  concept: Concept,
  problems: [
    {
      id: 'preorder-tree-values',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Traverse a tree in preorder',
      prompt:
        'Implement `preorderTreeValues`. A binary-tree node has `{ value, left, right }`, and the root may be `null`. Return values in root-left-right preorder. Example: for a tree with root `1`, children `2` and `3`, and children `4` and `5` under node `2`, return `[1, 2, 4, 5, 3]`.',
      estimatedMinutes: 12,
      functionName: 'preorderTreeValues',
      starter: `type TreeNode = {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

export function preorderTreeValues(root: TreeNode | null): number[] {
  return []
}

const example: TreeNode = {
  value: 1,
  left: { value: 2, left: null, right: null },
  right: { value: 3, left: null, right: null },
}
console.log(preorderTreeValues(example))
`,
      tests: [
        {
          name: 'visits root then left and right subtrees',
          args: [node(1, node(2, node(4), node(5)), node(3))],
          expected: [1, 2, 4, 5, 3],
        },
        {
          name: 'handles a left-only tree',
          args: [node(3, node(2, node(1)))],
          expected: [3, 2, 1],
        },
        {
          name: 'handles a right-only tree',
          args: [node(1, null, node(2, null, node(3)))],
          expected: [1, 2, 3],
        },
        {
          name: 'keeps repeated values',
          args: [node(2, node(2), node(2))],
          expected: [2, 2, 2],
        },
        {
          name: 'handles one node',
          args: [node(7)],
          expected: [7],
        },
        {
          name: 'handles an empty tree',
          args: [null],
          expected: [],
        },
      ],
    },
    {
      id: 'height-balanced-tree',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Check whether a tree is height-balanced',
      prompt:
        'Implement `isHeightBalanced`. A tree is height-balanced when, at every node, the left and right subtree heights differ by at most `1`. Return whether the full tree is balanced. Calculate each subtree height once; use `-1` to report an unbalanced subtree. Example: a root with one leaf on each side returns `true`, while a four-node left-only tree returns `false`.',
      estimatedMinutes: 18,
      functionName: 'isHeightBalanced',
      starter: `type TreeNode = {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

export function isHeightBalanced(root: TreeNode | null): boolean {
  return false
}

const example: TreeNode = {
  value: 1,
  left: { value: 2, left: null, right: null },
  right: { value: 3, left: null, right: null },
}
console.log(isHeightBalanced(example))
`,
      tests: [
        {
          name: 'accepts a balanced tree',
          args: [node(1, node(2, node(4), node(5)), node(3))],
          expected: true,
        },
        {
          name: 'rejects a long left-only branch',
          args: [node(1, node(2, node(3, node(4))))],
          expected: false,
        },
        {
          name: 'accepts a one-level difference',
          args: [node(1, node(2), null)],
          expected: true,
        },
        {
          name: 'detects imbalance below the root',
          args: [
            node(
              1,
              node(2, node(3, node(4))),
              node(5, null, node(6, null, node(7))),
            ),
          ],
          expected: false,
        },
        {
          name: 'accepts one node',
          args: [node(9)],
          expected: true,
        },
        {
          name: 'accepts an empty tree',
          args: [null],
          expected: true,
        },
      ],
    },
    {
      id: 'lowest-common-ancestor',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find the lowest common ancestor',
      prompt:
        'Implement `lowestCommonAncestorValue`. Tree values are unique, and two distinct target values are guaranteed to exist. Return the value of their lowest common ancestor: the deepest node whose subtree contains both targets. The tree is not necessarily a binary search tree. Example: if nodes `5` and `1` are the left and right children of root `3`, `lowestCommonAncestorValue(root, 5, 1)` returns `3`.',
      estimatedMinutes: 21,
      functionName: 'lowestCommonAncestorValue',
      starter: `type TreeNode = {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

export function lowestCommonAncestorValue(
  root: TreeNode | null,
  firstValue: number,
  secondValue: number,
): number | null {
  return null
}

const example: TreeNode = {
  value: 3,
  left: { value: 5, left: null, right: null },
  right: { value: 1, left: null, right: null },
}
console.log(lowestCommonAncestorValue(example, 5, 1))
`,
      tests: [
        {
          name: 'finds the root for targets on different sides',
          args: [ancestorExample(), 5, 1],
          expected: 3,
        },
        {
          name: 'returns an ancestor that is also a target',
          args: [ancestorExample(), 5, 4],
          expected: 5,
        },
        {
          name: 'finds a common ancestor inside the left subtree',
          args: [ancestorExample(), 6, 4],
          expected: 5,
        },
        {
          name: 'finds a common ancestor inside the right subtree',
          args: [ancestorExample(), 0, 8],
          expected: 1,
        },
        {
          name: 'handles a two-node tree',
          args: [node(1, node(2)), 1, 2],
          expected: 1,
        },
        {
          name: 'handles negative values',
          args: [node(-1, node(-2), node(4, node(0), node(8))), 0, 8],
          expected: 4,
        },
      ],
    },
    {
      id: 'recursive-tree-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Define the recursive contract',
      prompt:
        'Explain how you design a recursive tree function. State the base case, what one call returns, when child results are combined, why postorder is required for height calculations, and when recursion depth would make you choose an iterative traversal.',
      estimatedMinutes: 9,
      starter:
        'I first define the result for a null node, then state exactly what one call returns for a non-null subtree.',
      referenceAnswer:
        'Start with the null-node base case because it ends each branch and provides an identity value such as an empty array, height zero, or no matching node. Define one call as solving the problem for the subtree rooted at its node. Preorder performs node work before child calls; postorder obtains both child results before calculating the parent result. Height and balance require postorder because the parent depends on child heights. Lowest common ancestor returns a matching target or a matching subtree result; when both sides return a node, the current node is their lowest common ancestor. Recursive space is O(h) for tree height h. A highly unbalanced tree can create enough calls to exceed the JavaScript call-stack limit, so use an explicit stack or queue when input depth may be large.',
      rubric: [
        {
          id: 'base-case',
          label: 'Defines the base case',
          description:
            'States the result for a null node and explains why recursion stops.',
        },
        {
          id: 'return-contract',
          label: 'Defines one call',
          description:
            'States exactly what a call returns for one subtree.',
        },
        {
          id: 'traversal-order',
          label: 'Chooses traversal order',
          description:
            'Connects preorder or postorder to when the node result is calculated.',
        },
        {
          id: 'depth-risk',
          label: 'Accounts for recursion depth',
          description:
            'Relates call-stack space to tree height and identifies an iterative alternative.',
        },
      ],
    },
  ],
  approaches: {
    'preorder-tree-values': [
      {
        name: 'Recursive root-left-right traversal',
        code: `type TreeNode = {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

export function preorderTreeValues(root: TreeNode | null): number[] {
  const values: number[] = []

  const visit = (node: TreeNode | null): void => {
    if (!node) {
      return
    }

    // Record the node before traversing either child.
    values.push(node.value)
    visit(node.left)
    visit(node.right)
  }

  visit(root)
  return values
}
`,
        explanation:
          'The null base case ends a branch. Record each node before visiting its left and right children to produce root-left-right order.',
        complexity: 'O(n) time and O(h) call-stack space for tree height h.',
      },
    ],
    'height-balanced-tree': [
      {
        name: 'Postorder height with an imbalance result',
        code: `type TreeNode = {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

export function isHeightBalanced(root: TreeNode | null): boolean {
  const height = (node: TreeNode | null): number => {
    if (!node) {
      return 0
    }

    const leftHeight = height(node.left)

    if (leftHeight === -1) {
      return -1
    }

    const rightHeight = height(node.right)

    if (rightHeight === -1) {
      return -1
    }

    if (Math.abs(leftHeight - rightHeight) > 1) {
      return -1
    }

    return Math.max(leftHeight, rightHeight) + 1
  }

  return height(root) !== -1
}
`,
        explanation:
          'Calculate child heights before the parent height. Return -1 as soon as any subtree is unbalanced, so each node is processed once and no height is recalculated.',
        complexity: 'O(n) time and O(h) call-stack space.',
      },
    ],
    'lowest-common-ancestor': [
      {
        name: 'Return matching subtrees upward',
        code: `type TreeNode = {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

export function lowestCommonAncestorValue(
  root: TreeNode | null,
  firstValue: number,
  secondValue: number,
): number | null {
  const findAncestor = (node: TreeNode | null): TreeNode | null => {
    if (!node) {
      return null
    }

    if (node.value === firstValue || node.value === secondValue) {
      return node
    }

    const leftMatch = findAncestor(node.left)
    const rightMatch = findAncestor(node.right)

    if (leftMatch && rightMatch) {
      // Each target was found in a different child subtree.
      return node
    }

    // Return the one matching subtree, or null if neither side matched.
    return leftMatch ?? rightMatch
  }

  return findAncestor(root)?.value ?? null
}
`,
        explanation:
          'Return a target node when it is found. If both child calls return a node, the current node is the first node whose subtree contains both targets. Otherwise return the one non-null child result.',
        complexity: 'O(n) time and O(h) call-stack space.',
      },
    ],
  },
}

function node(
  value: number,
  left: TreeNodeData | null = null,
  right: TreeNodeData | null = null,
): TreeNodeData {
  return { value, left, right }
}

function ancestorExample(): TreeNodeData {
  return node(
    3,
    node(5, node(6), node(2, node(7), node(4))),
    node(1, node(0), node(8)),
  )
}
