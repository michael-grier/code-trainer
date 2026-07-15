import { useId, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

type DiagramFrameProps = {
  caption: string
  children: ReactNode
  viewBox: string
}

type CircleNodeProps = {
  label: string
  x: number
  y: number
}

type RectangleNodeProps = {
  label: string
  x: number
  y: number
}

type ArrayCellProps = {
  emphasized?: boolean
  index?: number
  label: string
  muted?: boolean
  width?: number
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

function DiagramFrame({ caption, children, viewBox }: DiagramFrameProps) {
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

function ArrowMarker({ id }: { id: string }) {
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

function CircleNode({ label, x, y }: CircleNodeProps) {
  return (
    <g>
      <circle
        className="fill-card stroke-primary"
        cx={x}
        cy={y}
        r="26"
        strokeWidth="2"
      />
      <text
        className="fill-foreground font-mono text-base font-semibold"
        dominantBaseline="middle"
        textAnchor="middle"
        x={x}
        y={y}
      >
        {label}
      </text>
    </g>
  )
}

function RectangleNode({ label, x, y }: RectangleNodeProps) {
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

function ArrayCell({
  emphasized = false,
  index,
  label,
  muted = false,
  width = 68,
  x,
  y,
}: ArrayCellProps) {
  return (
    <g>
      {index === undefined ? null : (
        <text
          className="fill-muted-foreground text-xs"
          textAnchor="middle"
          x={x + width / 2}
          y={y - 10}
        >
          {index}
        </text>
      )}
      <rect
        className={cn(
          'fill-card stroke-border',
          emphasized && 'fill-accent stroke-primary',
          muted && 'fill-muted stroke-border',
        )}
        height="52"
        rx="6"
        strokeWidth={emphasized ? 2 : 1.5}
        width={width}
        x={x}
        y={y}
      />
      <text
        className={cn(
          'fill-foreground font-mono text-sm font-semibold',
          muted && 'fill-muted-foreground',
        )}
        dominantBaseline="middle"
        textAnchor="middle"
        x={x + width / 2}
        y={y + 26}
      >
        {label}
      </text>
    </g>
  )
}

function Edge({
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

function useArrowId(prefix: string) {
  return `${prefix}-${useId().replaceAll(':', '')}`
}

export function TwoPointersDiagram() {
  const arrowId = useArrowId('two-pointers-arrow')
  const values = ['1', '2', '4', '6', '10']

  return (
    <DiagramFrame
      caption="Opposing pointers begin at both ends. A comparison determines which pointer moves and which values can be excluded."
      viewBox="0 0 620 185"
    >
      <ArrowMarker id={arrowId} />
      {values.map((value, index) => (
        <ArrayCell
          emphasized={index === 0 || index === values.length - 1}
          index={index}
          key={value}
          label={value}
          x={85 + index * 90}
          y={45}
        />
      ))}
      <Edge arrowId={arrowId} x1={119} x2={119} y1={148} y2={103} />
      <Edge arrowId={arrowId} x1={479} x2={479} y1={148} y2={103} />
      <text
        className="fill-muted-foreground text-sm font-medium"
        textAnchor="middle"
        x="119"
        y="170"
      >
        left
      </text>
      <text
        className="fill-muted-foreground text-sm font-medium"
        textAnchor="middle"
        x="479"
        y="170"
      >
        right
      </text>
    </DiagramFrame>
  )
}

export function SlidingWindowDiagram() {
  const values = ['2', '1', '5', '1', '3', '2']

  return (
    <DiagramFrame
      caption="The highlighted cells form one contiguous window. Moving the window removes a value from the left and adds a value on the right."
      viewBox="0 0 620 180"
    >
      {values.map((value, index) => (
        <ArrayCell
          emphasized={index >= 1 && index <= 3}
          index={index}
          key={`${value}-${index}`}
          label={value}
          x={50 + index * 86}
          y={42}
        />
      ))}
      <line
        className="stroke-primary"
        strokeWidth="2"
        x1="136"
        x2="376"
        y1="122"
        y2="122"
      />
      <line
        className="stroke-primary"
        strokeWidth="2"
        x1="136"
        x2="136"
        y1="112"
        y2="132"
      />
      <line
        className="stroke-primary"
        strokeWidth="2"
        x1="376"
        x2="376"
        y1="112"
        y2="132"
      />
      <text
        className="fill-primary text-sm font-semibold"
        textAnchor="middle"
        x="256"
        y="154"
      >
        current window
      </text>
    </DiagramFrame>
  )
}

export function DifferenceArrayDiagram() {
  const difference = ['0', '+3', '0', '0', '−3']
  const accumulated = ['0', '3', '3', '3', '0']

  return (
    <DiagramFrame
      caption="Adding 3 to indexes 1 through 3 requires two boundary changes. Accumulating the difference array applies 3 only inside that range."
      viewBox="0 0 620 250"
    >
      <text className="fill-muted-foreground text-sm font-medium" x="30" y="68">
        difference
      </text>
      <text className="fill-muted-foreground text-sm font-medium" x="30" y="164">
        accumulated
      </text>
      {difference.map((value, index) => (
        <ArrayCell
          emphasized={index === 1 || index === 4}
          index={index}
          key={`difference-${index}`}
          label={value}
          width={72}
          x={145 + index * 78}
          y={38}
        />
      ))}
      {accumulated.map((value, index) => (
        <ArrayCell
          emphasized={index >= 1 && index <= 3}
          key={`accumulated-${index}`}
          label={value}
          width={72}
          x={145 + index * 78}
          y={134}
        />
      ))}
      <text
        className="fill-primary text-sm font-semibold"
        textAnchor="middle"
        x="340"
        y="226"
      >
        update range [1, 3]
      </text>
    </DiagramFrame>
  )
}

export function BinarySearchDiagram() {
  const values = ['−4', '0', '3', '7', '12']

  return (
    <DiagramFrame
      caption="Binary search keeps an active interval. Comparing the middle value with the target removes one half from consideration."
      viewBox="0 0 620 190"
    >
      {values.map((value, index) => (
        <ArrayCell
          emphasized={index === 2}
          index={index}
          key={value}
          label={value}
          x={85 + index * 90}
          y={46}
        />
      ))}
      <line
        className="stroke-primary"
        strokeWidth="2"
        x1="85"
        x2="513"
        y1="122"
        y2="122"
      />
      <line
        className="stroke-primary"
        strokeWidth="2"
        x1="85"
        x2="85"
        y1="112"
        y2="132"
      />
      <line
        className="stroke-primary"
        strokeWidth="2"
        x1="513"
        x2="513"
        y1="112"
        y2="132"
      />
      <text className="fill-muted-foreground text-sm font-medium" x="76" y="156">
        left
      </text>
      <text
        className="fill-primary text-sm font-semibold"
        textAnchor="middle"
        x="299"
        y="156"
      >
        middle
      </text>
      <text
        className="fill-muted-foreground text-sm font-medium"
        textAnchor="end"
        x="522"
        y="156"
      >
        right
      </text>
    </DiagramFrame>
  )
}

export function StackDiagram() {
  const arrowId = useArrowId('stack-arrow')

  return (
    <DiagramFrame
      caption="Push and pop both use the top of the stack. The most recently added value is the first value removed."
      viewBox="0 0 620 275"
    >
      <ArrowMarker id={arrowId} />
      <ArrayCell emphasized label="3" width={120} x={250} y={35} />
      <ArrayCell label="2" width={120} x={250} y={91} />
      <ArrayCell label="1" width={120} x={250} y={147} />
      <line className="stroke-border" strokeWidth="2" x1="235" x2="235" y1="25" y2="215" />
      <line className="stroke-border" strokeWidth="2" x1="385" x2="385" y1="25" y2="215" />
      <line className="stroke-border" strokeWidth="2" x1="235" x2="385" y1="215" y2="215" />
      <Edge arrowId={arrowId} x1={175} x2={235} y1={61} y2={61} />
      <text className="fill-muted-foreground text-sm font-medium" x="105" y="66">
        push 3
      </text>
      <Edge arrowId={arrowId} x1={385} x2={445} y1={78} y2={78} />
      <text className="fill-muted-foreground text-sm font-medium" x="458" y="83">
        pop 3
      </text>
      <text
        className="fill-primary text-sm font-semibold"
        textAnchor="middle"
        x="310"
        y="249"
      >
        top is the only access point
      </text>
    </DiagramFrame>
  )
}

export function QueueDequeDiagram() {
  const arrowId = useArrowId('queue-arrow')

  return (
    <DiagramFrame
      caption="A queue removes from the front and adds at the back. A deque permits both operations at either end."
      viewBox="0 0 620 255"
    >
      <ArrowMarker id={arrowId} />
      <text className="fill-muted-foreground text-sm font-medium" x="30" y="65">
        queue
      </text>
      <ArrayCell label="A" x={180} y={35} />
      <ArrayCell label="B" x={252} y={35} />
      <ArrayCell label="C" x={324} y={35} />
      <Edge arrowId={arrowId} x1={180} x2={118} y1={61} y2={61} />
      <Edge arrowId={arrowId} x1={472} x2={396} y1={61} y2={61} />
      <text className="fill-muted-foreground text-xs" textAnchor="middle" x="115" y="92">
        remove front
      </text>
      <text className="fill-muted-foreground text-xs" textAnchor="middle" x="470" y="92">
        add back
      </text>
      <text className="fill-muted-foreground text-sm font-medium" x="30" y="168">
        deque
      </text>
      <ArrayCell label="A" x={180} y={138} />
      <ArrayCell label="B" x={252} y={138} />
      <ArrayCell label="C" x={324} y={138} />
      <Edge arrowId={arrowId} x1={118} x2={180} y1={151} y2={151} />
      <Edge arrowId={arrowId} x1={180} x2={118} y1={177} y2={177} />
      <Edge arrowId={arrowId} x1={396} x2={472} y1={151} y2={151} />
      <Edge arrowId={arrowId} x1={472} x2={396} y1={177} y2={177} />
      <text
        className="fill-primary text-sm font-semibold"
        textAnchor="middle"
        x="290"
        y="229"
      >
        add or remove at either end
      </text>
    </DiagramFrame>
  )
}

export function LinkedListDiagram() {
  const arrowId = useArrowId('linked-list-arrow')

  return (
    <DiagramFrame
      caption="The head refers to the first node. Each node refers to the next node, and the final reference is null."
      viewBox="0 0 620 150"
    >
      <ArrowMarker id={arrowId} />
      <text className="fill-muted-foreground text-sm font-medium" x="28" y="34">
        head
      </text>
      <Edge arrowId={arrowId} x1={58} x2={84} y1={42} y2={62} />
      <RectangleNode label="1" x={84} y={48} />
      <Edge arrowId={arrowId} x1={180} x2={240} y1={76} y2={76} />
      <RectangleNode label="2" x={240} y={48} />
      <Edge arrowId={arrowId} x1={336} x2={396} y1={76} y2={76} />
      <RectangleNode label="3" x={396} y={48} />
      <Edge arrowId={arrowId} x1={492} x2={548} y1={76} y2={76} />
      <text
        className="fill-muted-foreground font-mono text-base"
        dominantBaseline="middle"
        x="558"
        y="76"
      >
        null
      </text>
    </DiagramFrame>
  )
}

export function BinaryTreeDiagram() {
  return (
    <DiagramFrame
      caption="Each node can refer to a left child, a right child, both children, or neither child."
      viewBox="0 0 620 250"
    >
      <Edge x1={296} x2={205} y1={60} y2={118} />
      <Edge x1={324} x2={415} y1={60} y2={118} />
      <Edge x1={191} x2={140} y1={164} y2={205} />
      <Edge x1={219} x2={270} y1={164} y2={205} />
      <CircleNode label="1" x={310} y={42} />
      <CircleNode label="2" x={205} y={140} />
      <CircleNode label="3" x={415} y={140} />
      <CircleNode label="4" x={120} y={220} />
      <CircleNode label="5" x={290} y={220} />
    </DiagramFrame>
  )
}

export function BinarySearchTreeDiagram() {
  return (
    <DiagramFrame
      caption="Every value in a left subtree is smaller than its parent node, and every value in a right subtree is larger."
      viewBox="0 0 620 270"
    >
      <Edge x1={296} x2={205} y1={58} y2={112} />
      <Edge x1={324} x2={415} y1={58} y2={112} />
      <Edge x1={189} x2={135} y1={157} y2={205} />
      <Edge x1={221} x2={275} y1={157} y2={205} />
      <Edge x1={431} x2={485} y1={157} y2={205} />
      <CircleNode label="8" x={310} y={40} />
      <CircleNode label="3" x={205} y={135} />
      <CircleNode label="10" x={415} y={135} />
      <CircleNode label="1" x={115} y={225} />
      <CircleNode label="6" x={295} y={225} />
      <CircleNode label="14" x={505} y={225} />
      <text
        className="fill-muted-foreground text-sm font-medium"
        textAnchor="middle"
        x="232"
        y="80"
      >
        smaller
      </text>
      <text
        className="fill-muted-foreground text-sm font-medium"
        textAnchor="middle"
        x="388"
        y="80"
      >
        larger
      </text>
    </DiagramFrame>
  )
}

export function HeapDiagram() {
  const values = ['2', '4', '5', '9', '7']

  return (
    <DiagramFrame
      caption="A min-heap keeps each parent no larger than its children. The tree is stored level by level in an array, with the root at index 0."
      viewBox="0 0 620 335"
    >
      <Edge x1={296} x2={215} y1={58} y2={112} />
      <Edge x1={324} x2={405} y1={58} y2={112} />
      <Edge x1={199} x2={145} y1={157} y2={205} />
      <Edge x1={231} x2={285} y1={157} y2={205} />
      <CircleNode label="2" x={310} y={40} />
      <CircleNode label="4" x={215} y={135} />
      <CircleNode label="5" x={405} y={135} />
      <CircleNode label="9" x={125} y={225} />
      <CircleNode label="7" x={305} y={225} />
      <text className="fill-muted-foreground text-sm font-medium" x="34" y="306">
        array
      </text>
      {values.map((value, index) => (
        <ArrayCell
          emphasized={index === 0}
          index={index}
          key={value}
          label={value}
          width={72}
          x={120 + index * 76}
          y={272}
        />
      ))}
    </DiagramFrame>
  )
}

export function GraphDiagram() {
  const arrowId = useArrowId('graph-arrow')

  return (
    <DiagramFrame
      caption="This directed graph has four vertices. An arrow shows which vertex can be reached next."
      viewBox="0 0 620 250"
    >
      <ArrowMarker id={arrowId} />
      <Edge arrowId={arrowId} x1={175} x2={282} y1={72} y2={72} />
      <Edge arrowId={arrowId} x1={162} x2={282} y1={91} y2={178} />
      <Edge arrowId={arrowId} x1={327} x2={435} y1={88} y2={178} />
      <Edge arrowId={arrowId} x1={332} x2={435} y1={195} y2={195} />
      <CircleNode label="0" x={145} y={72} />
      <CircleNode label="1" x={310} y={72} />
      <CircleNode label="2" x={310} y={195} />
      <CircleNode label="3" x={465} y={195} />
    </DiagramFrame>
  )
}

export function WeightedGraphDiagram() {
  const arrowId = useArrowId('weighted-graph-arrow')

  return (
    <DiagramFrame
      caption="A weighted graph attaches a cost to each edge. Here, the route 0 → 1 → 2 costs 3, which is less than the direct cost of 5."
      viewBox="0 0 620 230"
    >
      <ArrowMarker id={arrowId} />
      <Edge
        arrowId={arrowId}
        label="2"
        labelX={300}
        labelY={56}
        x1={188}
        x2={422}
        y1={78}
        y2={78}
      />
      <Edge
        arrowId={arrowId}
        label="5"
        labelX={255}
        labelY={154}
        x1={177}
        x2={303}
        y1={96}
        y2={177}
      />
      <Edge
        arrowId={arrowId}
        label="1"
        labelX={405}
        labelY={154}
        x1={443}
        x2={357}
        y1={96}
        y2={177}
      />
      <CircleNode label="0" x={160} y={78} />
      <CircleNode label="1" x={450} y={78} />
      <CircleNode label="2" x={330} y={195} />
    </DiagramFrame>
  )
}

export function BacktrackingDiagram() {
  return (
    <DiagramFrame
      caption="Each branch adds one choice. After a branch is explored, that choice is removed before the next branch begins."
      viewBox="0 0 620 270"
    >
      <Edge
        label="add 1"
        labelX={240}
        labelY={93}
        x1={286}
        x2={205}
        y1={69}
        y2={120}
      />
      <Edge
        label="add 2"
        labelX={380}
        labelY={93}
        x1={334}
        x2={415}
        y1={69}
        y2={120}
      />
      <Edge
        label="add 2"
        labelX={190}
        labelY={187}
        x1={205}
        x2={205}
        y1={176}
        y2={215}
      />
      <RectangleNode label="[]" x={262} y={20} />
      <RectangleNode label="[1]" x={157} y={120} />
      <RectangleNode label="[2]" x={367} y={120} />
      <RectangleNode label="[1, 2]" x={157} y={210} />
    </DiagramFrame>
  )
}

export function DynamicProgrammingDiagram() {
  const arrowId = useArrowId('dynamic-programming-arrow')

  return (
    <DiagramFrame
      caption="The result for step 5 reuses the stored results for steps 3 and 4 instead of calculating those smaller problems again."
      viewBox="0 0 620 210"
    >
      <ArrowMarker id={arrowId} />
      <ArrayCell index={3} label="3 ways" width={112} x={90} y={45} />
      <ArrayCell index={4} label="5 ways" width={112} x={254} y={45} />
      <ArrayCell emphasized index={5} label="8 ways" width={112} x={418} y={125} />
      <Edge arrowId={arrowId} x1={190} x2={430} y1={99} y2={136} />
      <Edge arrowId={arrowId} x1={350} x2={450} y1={99} y2={129} />
    </DiagramFrame>
  )
}

export function AdvancedDynamicProgrammingDiagram() {
  const arrowId = useArrowId('advanced-dynamic-programming-arrow')
  const values = [
    ['1', '4', '5'],
    ['2', '7', '6'],
    ['6', '8', '7'],
  ]

  return (
    <DiagramFrame
      caption="A grid state has a row and column. This cell reads completed states from above and from the left."
      viewBox="0 0 620 255"
    >
      <ArrowMarker id={arrowId} />
      <text className="fill-muted-foreground text-sm font-medium" x="150" y="42">
        column
      </text>
      <text className="fill-muted-foreground text-sm font-medium" x="110" y="122">
        row
      </text>
      {values.flatMap((rowValues, row) =>
        rowValues.map((value, column) => (
          <ArrayCell
            emphasized={row === 2 && column === 2}
            key={`${row}-${column}`}
            label={value}
            width={64}
            x={210 + column * 72}
            y={30 + row * 60}
          />
        )),
      )}
      <Edge arrowId={arrowId} x1={386} x2={386} y1={142} y2={153} />
      <Edge arrowId={arrowId} x1={346} x2={353} y1={176} y2={176} />
      <text className="fill-muted-foreground text-xs" x="415" y="144">
        from above
      </text>
      <text className="fill-muted-foreground text-xs" x="274" y="221">
        from left
      </text>
    </DiagramFrame>
  )
}

export function GreedyAlgorithmDiagram() {
  return (
    <DiagramFrame
      caption="Selecting the compatible meeting that ends earliest leaves the largest remaining part of the timeline for later meetings."
      viewBox="0 0 620 245"
    >
      <line className="stroke-muted-foreground" strokeWidth="2" x1="75" x2="555" y1="200" y2="200" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((time) => (
        <g key={time}>
          <line
            className="stroke-muted-foreground"
            strokeWidth="1.5"
            x1={95 + time * 62}
            x2={95 + time * 62}
            y1="194"
            y2="206"
          />
          <text
            className="fill-muted-foreground text-xs"
            textAnchor="middle"
            x={95 + time * 62}
            y="225"
          >
            {time}
          </text>
        </g>
      ))}
      <rect className="fill-accent stroke-primary" height="30" rx="6" strokeWidth="2" width="124" x="157" y="35" />
      <rect className="fill-muted stroke-border" height="30" rx="6" strokeWidth="1.5" width="124" x="219" y="75" />
      <rect className="fill-accent stroke-primary" height="30" rx="6" strokeWidth="2" width="124" x="281" y="115" />
      <rect className="fill-accent stroke-primary" height="30" rx="6" strokeWidth="2" width="124" x="405" y="155" />
      <text className="fill-foreground text-xs font-medium" textAnchor="middle" x="219" y="55">
        select [1, 3)
      </text>
      <text className="fill-muted-foreground text-xs" textAnchor="middle" x="281" y="95">
        skip [2, 4)
      </text>
      <text className="fill-foreground text-xs font-medium" textAnchor="middle" x="343" y="135">
        select [3, 5)
      </text>
      <text className="fill-foreground text-xs font-medium" textAnchor="middle" x="467" y="175">
        select [5, 7)
      </text>
    </DiagramFrame>
  )
}

export function ComplexityGrowthDiagram() {
  return (
    <DiagramFrame
      caption="As input grows, constant and logarithmic work grow least, followed by linear, n log n, and quadratic work."
      viewBox="0 0 620 285"
    >
      <line className="stroke-muted-foreground" strokeWidth="2" x1="70" x2="560" y1="235" y2="235" />
      <line className="stroke-muted-foreground" strokeWidth="2" x1="70" x2="70" y1="35" y2="235" />
      <text className="fill-muted-foreground text-sm font-medium" textAnchor="middle" x="315" y="268">
        input size
      </text>
      <text className="fill-muted-foreground text-sm font-medium" transform="rotate(-90 24 135)" x="24" y="135">
        work
      </text>
      <path className="fill-none stroke-muted-foreground" d="M 80 215 L 535 215" strokeWidth="2" />
      <path className="fill-none stroke-primary" d="M 80 225 C 170 205, 300 188, 535 170" strokeWidth="2" />
      <path className="fill-none stroke-sky-500" d="M 80 225 L 535 105" strokeWidth="2" />
      <path className="fill-none stroke-amber-500" d="M 80 225 C 230 212, 390 170, 535 72" strokeWidth="2" />
      <path className="fill-none stroke-destructive" d="M 80 225 C 310 220, 465 145, 535 40" strokeWidth="2" />
      <text className="fill-muted-foreground text-xs font-medium" x="540" y="219">O(1)</text>
      <text className="fill-primary text-xs font-medium" x="540" y="174">O(log n)</text>
      <text className="fill-sky-600 text-xs font-medium dark:fill-sky-400" x="540" y="109">O(n)</text>
      <text className="fill-amber-600 text-xs font-medium dark:fill-amber-400" x="470" y="102">O(n log n)</text>
      <text className="fill-destructive text-xs font-medium" x="500" y="38">O(n²)</text>
    </DiagramFrame>
  )
}
