import type { ReactNode } from 'react'

type DiagramFrameProps = {
  caption: string
  children: ReactNode
  viewBox: string
}

type RectangleNodeProps = {
  label: string
  x: number
  y: number
}

type EdgeProps = {
  arrowId?: string
  label?: string
  labelX?: number
  labelY?: number
  x1: number
  x2: number
  y1: number
  y2: number
}

export function DiagramFrame({ caption, children, viewBox }: DiagramFrameProps) {
  return (
    <figure
      className="mb-6 overflow-hidden rounded-lg border bg-muted/30 p-3 sm:p-4"
      data-slot="structure-diagram"
    >
      <div className="overflow-x-auto">
        <svg
          aria-hidden="true"
          className="h-auto min-w-[26rem] w-full"
          focusable="false"
          viewBox={viewBox}
        >
          {children}
        </svg>
      </div>
      <figcaption className="mt-3 text-center text-sm leading-6 text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}

export function ArrowMarker({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        markerHeight="8"
        markerWidth="8"
        orient="auto-start-reverse"
        refX="7"
        refY="4"
        viewBox="0 0 8 8"
      >
        <path className="fill-muted-foreground" d="M 0 0 L 8 4 L 0 8 z" />
      </marker>
    </defs>
  )
}

export function RectangleNode({ label, x, y }: RectangleNodeProps) {
  return (
    <g>
      <rect
        className="fill-card stroke-primary"
        height="56"
        rx="8"
        strokeWidth="2"
        width="96"
        x={x}
        y={y}
      />
      <text
        className="fill-foreground font-mono text-base font-semibold"
        dominantBaseline="middle"
        textAnchor="middle"
        x={x + 48}
        y={y + 28}
      >
        {label}
      </text>
    </g>
  )
}

export function Edge({
  arrowId,
  label,
  labelX,
  labelY,
  x1,
  x2,
  y1,
  y2,
}: EdgeProps) {
  return (
    <g>
      <line
        className="stroke-muted-foreground"
        markerEnd={arrowId ? `url(#${arrowId})` : undefined}
        strokeWidth="2"
        x1={x1}
        x2={x2}
        y1={y1}
        y2={y2}
      />
      {label ? (
        <text
          className="fill-muted-foreground text-sm font-medium"
          dominantBaseline="middle"
          textAnchor="middle"
          x={labelX}
          y={labelY}
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}
