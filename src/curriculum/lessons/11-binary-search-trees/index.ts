import Concept from './concept.mdx'

import type { Lesson } from '../../types'

type TreeNodeData = {
  value: number
  left: TreeNodeData | null
  right: TreeNodeData | null
}

const treeType = `type TreeNode = {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}`

export const lesson: Lesson = {
  slug: 'binary-search-trees',
  title: 'Binary Search Trees',
  summary: 'Use subtree ordering to search, validate ranges, and read values in sorted order.',
  track: 'algorithms',
  order: 11,
  concept: Concept,
  problems: [
    {
      id: 'search-binary-search-tree',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Search a binary search tree',
      prompt:
        'Implement `containsBstValue`. The tree has unique numbers, every left-subtree value is smaller than its node, and every right-subtree value is larger. Return whether `target` exists. Use the ordering to choose one child at each step. Example: in a BST with root `8`, left child `3`, and right child `10`, `containsBstValue(root, 10)` returns `true`.',
      estimatedMinutes: 11,
      functionName: 'containsBstValue',
      starter: `${treeType}

export function containsBstValue(root: TreeNode | null, target: number): boolean {
  return false
}

const example: TreeNode = {
  value: 8,
  left: { value: 3, left: null, right: null },
  right: { value: 10, left: null, right: null },
}
console.log(containsBstValue(example, 10))
`,
      tests: [
        { name: 'finds the root', args: [bstExample(), 8], expected: true },
        { name: 'finds a left value', args: [bstExample(), 6], expected: true },
        { name: 'finds a right value', args: [bstExample(), 14], expected: true },
        { name: 'rejects a missing interior value', args: [bstExample(), 7], expected: false },
        { name: 'handles one node', args: [node(4), 2], expected: false },
        { name: 'handles an empty tree', args: [null, 4], expected: false },
      ],
    },
    {
      id: 'validate-binary-search-tree',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Validate the full BST invariant',
      prompt:
        'Implement `isValidBinarySearchTree`. Return `true` only when every node value is strictly within the range required by all of its ancestors. Duplicate values are invalid. Do not validate only against the parent. Example: a root `10` with left child `5` and right child `15` whose left child is `6` returns `false` because `6` is in the right subtree of `10`.',
      estimatedMinutes: 17,
      functionName: 'isValidBinarySearchTree',
      starter: `${treeType}

export function isValidBinarySearchTree(root: TreeNode | null): boolean {
  return false
}

const example: TreeNode = {
  value: 10,
  left: { value: 5, left: null, right: null },
  right: { value: 15, left: { value: 6, left: null, right: null }, right: null },
}
console.log(isValidBinarySearchTree(example))
`,
      tests: [
        { name: 'accepts a valid BST', args: [bstExample()], expected: true },
        { name: 'rejects a deep ancestor violation', args: [node(10, node(5), node(15, node(6)))], expected: false },
        { name: 'rejects a duplicate on the left', args: [node(4, node(4))], expected: false },
        { name: 'rejects a duplicate on the right', args: [node(4, null, node(4))], expected: false },
        { name: 'accepts negative values', args: [node(0, node(-3), node(2))], expected: true },
        { name: 'accepts an empty tree', args: [null], expected: true },
      ],
    },
    {
      id: 'kth-smallest-bst-value',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Find the kth-smallest value',
      prompt:
        'Implement `kthSmallestBstValue`. The input is a valid BST with unique values. Return the value at one-based sorted position `k`, or `null` when `k` is outside the tree size. Use iterative inorder traversal and stop when the kth node is visited. Example: for a BST containing `[1, 2, 3, 4, 5]`, `kthSmallestBstValue(root, 3)` returns `3`.',
      estimatedMinutes: 18,
      functionName: 'kthSmallestBstValue',
      starter: `${treeType}

export function kthSmallestBstValue(
  root: TreeNode | null,
  k: number,
): number | null {
  return null
}

console.log(kthSmallestBstValue({
  value: 3,
  left: { value: 1, left: null, right: { value: 2, left: null, right: null } },
  right: { value: 4, left: null, right: null },
}, 2))
`,
      tests: [
        { name: 'finds a middle rank', args: [bstExample(), 3], expected: 6 },
        { name: 'finds the smallest value', args: [bstExample(), 1], expected: 1 },
        { name: 'finds the largest value', args: [bstExample(), 6], expected: 14 },
        { name: 'handles one node', args: [node(9), 1], expected: 9 },
        { name: 'rejects a rank above the size', args: [node(2, node(1), node(3)), 4], expected: null },
        { name: 'rejects a non-positive rank', args: [bstExample(), 0], expected: null },
      ],
    },
    {
      id: 'bst-invariant-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain the BST invariant',
      prompt:
        'Explain why a BST node must satisfy bounds from every ancestor, how inorder traversal produces sorted values, and when BST operations can become O(n) instead of O(log n). State how duplicate values would affect your chosen invariant.',
      estimatedMinutes: 9,
      starter: 'Each recursive validation call receives the complete lower and upper bounds for its subtree.',
      referenceAnswer:
        'A node in a BST is constrained by every ancestor, not only its parent. Entering a left subtree updates the upper bound to the parent value; entering a right subtree updates the lower bound. With unique values, each node must be strictly between those bounds. Inorder traversal visits left subtree, node, then right subtree, which produces ascending values under the same invariant. Search is O(h) for tree height h. A balanced BST has O(log n) height, but insertion order can create a one-child chain with O(n) height. If duplicates are allowed, the prompt must state which side accepts equality and validation bounds must use that rule consistently.',
      rubric: [
        { id: 'ancestor-bounds', label: 'Uses ancestor bounds', description: 'Explains why parent-only comparisons are insufficient.' },
        { id: 'inorder', label: 'Explains inorder order', description: 'Connects left-node-right traversal to sorted output.' },
        { id: 'height', label: 'Relates runtime to height', description: 'Compares balanced and one-child tree shapes.' },
        { id: 'duplicates', label: 'States a duplicate rule', description: 'Defines whether and where equality is allowed.' },
      ],
    },
  ],
  approaches: {
    'search-binary-search-tree': [{
      name: 'Iterative ordered search',
      code: `${treeType}

export function containsBstValue(root: TreeNode | null, target: number): boolean {
  let current = root

  while (current) {
    if (current.value === target) return true

    // Ordering proves which one child can still contain target.
    current = target < current.value ? current.left : current.right
  }

  return false
}
`,
      explanation: 'Compare at the current node, then follow only the child whose allowed value range contains the target.',
      complexity: 'O(h) time and O(1) extra space for tree height h.',
    }],
    'validate-binary-search-tree': [{
      name: 'Recursive ancestor bounds',
      code: `${treeType}

export function isValidBinarySearchTree(root: TreeNode | null): boolean {
  const validate = (
    node: TreeNode | null,
    lower: number,
    upper: number,
  ): boolean => {
    if (!node) return true
    if (node.value <= lower || node.value >= upper) return false

    // Each child receives the new bound created by this node.
    return validate(node.left, lower, node.value) &&
      validate(node.right, node.value, upper)
  }

  return validate(root, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)
}
`,
      explanation: 'Pass the complete valid range into each subtree. Strict comparisons reject duplicate values and deep ancestor violations.',
      complexity: 'O(n) time and O(h) call-stack space.',
    }],
    'kth-smallest-bst-value': [{
      name: 'Iterative inorder traversal',
      code: `${treeType}

export function kthSmallestBstValue(
  root: TreeNode | null,
  k: number,
): number | null {
  if (k <= 0) return null

  const stack: TreeNode[] = []
  let current = root
  let visited = 0

  while (current || stack.length > 0) {
    while (current) {
      stack.push(current)
      current = current.left
    }

    current = stack.pop()!
    visited += 1
    if (visited === k) return current.value
    current = current.right
  }

  return null
}
`,
      explanation: 'Inorder traversal visits BST values in ascending order. Count visited nodes and stop at the requested one-based position.',
      complexity: 'O(h + k) time and O(h) space.',
    }],
  },
}

function node(value: number, left: TreeNodeData | null = null, right: TreeNodeData | null = null): TreeNodeData {
  return { value, left, right }
}

function bstExample() {
  return node(8, node(3, node(1), node(6)), node(10, null, node(14)))
}
