import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  BacktrackingDiagram,
  BinarySearchDiagram,
  BinarySearchTreeDiagram,
  BinaryTreeDiagram,
  DifferenceArrayDiagram,
  GraphDiagram,
  HeapDiagram,
  LinkedListDiagram,
  QueueDequeDiagram,
  SlidingWindowDiagram,
  StackDiagram,
  TwoPointersDiagram,
  WeightedGraphDiagram,
} from './StructureDiagrams'

describe('structure diagrams', () => {
  it('renders each diagram as a labeled figure', () => {
    const markup = renderToStaticMarkup(
      <>
        <TwoPointersDiagram />
        <SlidingWindowDiagram />
        <DifferenceArrayDiagram />
        <BinarySearchDiagram />
        <StackDiagram />
        <QueueDequeDiagram />
        <LinkedListDiagram />
        <BinaryTreeDiagram />
        <BinarySearchTreeDiagram />
        <HeapDiagram />
        <GraphDiagram />
        <WeightedGraphDiagram />
        <BacktrackingDiagram />
      </>,
    )

    expect(markup.match(/<figure/g)).toHaveLength(13)
    expect(markup.match(/<figcaption/g)).toHaveLength(13)
    expect(markup).toContain('Opposing pointers begin at both ends.')
    expect(markup).toContain('The highlighted cells form one contiguous window.')
    expect(markup).toContain('A min-heap keeps each parent no larger')
    expect(markup).toContain('The head refers to the first node.')
    expect(markup).toContain('Every value in a left subtree is smaller')
    expect(markup).toContain('A weighted graph attaches a cost to each edge.')
    expect(markup).toContain('Each branch adds one choice.')
  })

  it('hides visual SVG details from assistive technology', () => {
    const markup = renderToStaticMarkup(<GraphDiagram />)

    expect(markup).toContain('<svg aria-hidden="true"')
    expect(markup).toContain('<figcaption')
    expect(markup).toContain('This directed graph has four vertices.')
  })
})
