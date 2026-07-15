import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  ArrowMarker,
  DiagramFrame,
  Edge,
  RectangleNode,
} from './DiagramPrimitives'
import { useDiagramArrowId } from './useDiagramArrowId'

function DiagramFixture() {
  const arrowId = useDiagramArrowId('fixture-arrow')

  return (
    <DiagramFrame
      caption="A reusable box and arrow fixture."
      viewBox="0 0 320 120"
    >
      <ArrowMarker id={arrowId} />
      <RectangleNode label="source" x={20} y={30} />
      <Edge arrowId={arrowId} x1={116} x2={200} y1={58} y2={58} />
      <RectangleNode label="target" x={200} y={30} />
    </DiagramFrame>
  )
}

describe('diagram primitives', () => {
  it('renders a responsive, captioned diagram fixture', () => {
    const markup = renderToStaticMarkup(<DiagramFixture />)

    expect(markup).toContain('data-slot="structure-diagram"')
    expect(markup).toContain('<svg aria-hidden="true"')
    expect(markup).toContain('fixture-arrow-')
    expect(markup).toContain('source')
    expect(markup).toContain('target')
    expect(markup).toContain('A reusable box and arrow fixture.')
  })
})
