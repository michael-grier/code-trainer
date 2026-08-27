import {
  Children,
  Fragment,
  isValidElement,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react'

import { TerminalTranscript } from '@/components/terminal/TerminalTranscript'
import { cn } from '@/lib/cn'

import { MdxCodeBlock } from './MdxCodeBlock'
import {
  AdvancedDynamicProgrammingDiagram,
  BacktrackingDiagram,
  BinarySearchDiagram,
  BinarySearchTreeDiagram,
  BinaryTreeDiagram,
  ComplexityGrowthDiagram,
  DifferenceArrayDiagram,
  DynamicProgrammingDiagram,
  GraphDiagram,
  GreedyAlgorithmDiagram,
  HeapDiagram,
  LinkedListDiagram,
  QueueDequeDiagram,
  ScopeChainDiagram,
  SlidingWindowDiagram,
  StackDiagram,
  TwoPointersDiagram,
  WeightedGraphDiagram,
} from './StructureDiagrams'

type MdxComponent = ComponentType<{
  components?: typeof mdxComponents
}>

type MdxProps = {
  component: ComponentType
}

const exampleLabelPattern = /^(Example (?:prompt|input|output)):\s*/

const mdxComponents = {
  AdvancedDynamicProgrammingDiagram,
  BacktrackingDiagram,
  BinarySearchDiagram,
  BinarySearchTreeDiagram,
  BinaryTreeDiagram,
  ComplexityGrowthDiagram,
  DifferenceArrayDiagram,
  DynamicProgrammingDiagram,
  GraphDiagram,
  GreedyAlgorithmDiagram,
  HeapDiagram,
  LinkedListDiagram,
  QueueDequeDiagram,
  ScopeChainDiagram,
  SlidingWindowDiagram,
  StackDiagram,
  TwoPointersDiagram,
  TerminalTranscript,
  WeightedGraphDiagram,
  h1: ({ className, ...props }: ComponentProps<'h1'>) => (
    <h1
      className={cn('mb-4 text-3xl font-semibold tracking-normal', className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentProps<'h2'>) => (
    <h2
      className={cn('mb-3 mt-8 text-xl font-semibold tracking-normal', className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentProps<'h3'>) => (
    <h3
      className={cn('mb-2 mt-6 text-base font-semibold tracking-normal', className)}
      {...props}
    />
  ),
  p: ({ className, children, ...props }: ComponentProps<'p'>) => {
    const exampleLabel = getExampleLabel(children)

    if (exampleLabel) {
      return (
        <p
          className={cn(
            'mb-4 rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-sm leading-6 text-foreground',
            className,
          )}
          {...props}
        >
          {renderExampleChildren(children, exampleLabel)}
        </p>
      )
    }

    return (
      <p className={cn('mb-4 leading-7 text-muted-foreground', className)} {...props}>
        {children}
      </p>
    )
  },
  ul: ({ className, ...props }: ComponentProps<'ul'>) => (
    <ul className={cn('mb-4 ml-5 list-disc space-y-2', className)} {...props} />
  ),
  ol: ({ className, ...props }: ComponentProps<'ol'>) => (
    <ol className={cn('mb-4 ml-5 list-decimal space-y-2', className)} {...props} />
  ),
  li: ({ className, ...props }: ComponentProps<'li'>) => (
    <li className={cn('leading-7 text-muted-foreground', className)} {...props} />
  ),
  blockquote: ({ className, ...props }: ComponentProps<'blockquote'>) => (
    <blockquote
      className={cn(
        'mb-4 border-l-4 border-primary/40 pl-4 text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
  pre: MdxCodeBlock,
  code: ({ className, ...props }: ComponentProps<'code'>) => (
    <code
      className={cn(
        'rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground',
        className,
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }: ComponentProps<'table'>) => (
    <div className="mb-4 overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }: ComponentProps<'th'>) => (
    <th className={cn('border px-3 py-2 text-left font-medium', className)} {...props} />
  ),
  td: ({ className, ...props }: ComponentProps<'td'>) => (
    <td className={cn('border px-3 py-2 text-muted-foreground', className)} {...props} />
  ),
  a: ({ className, ...props }: ComponentProps<'a'>) => (
    <a
      className={cn('font-medium text-primary underline-offset-4 hover:underline', className)}
      {...props}
    />
  ),
}

export function Mdx({ component }: MdxProps) {
  const Component = component as MdxComponent

  return (
    <article className="min-w-0 max-w-none">
      <Component components={mdxComponents} />
    </article>
  )
}

function getExampleLabel(children: ReactNode) {
  const text = getTextContent(children).trimStart()
  const match = text.match(exampleLabelPattern)

  return match?.[1]
}

function renderExampleChildren(children: ReactNode, label: string) {
  let replacedLabel = false

  return Children.toArray(children).map((child, index) => {
    if (!replacedLabel && typeof child === 'string') {
      const match = child.match(exampleLabelPattern)

      if (match) {
        replacedLabel = true

        const rest = child.slice(match[0].length)

        return (
          <Fragment key={`example-${label}-${index}`}>
            <span className="mr-2 inline-flex rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-normal text-primary">
              {label}
            </span>
            {rest ? rest : ' '}
          </Fragment>
        )
      }
    }

    return child
  })
}

function getTextContent(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }

  if (Array.isArray(children)) {
    return children.map(getTextContent).join('')
  }

  if (isValidElement(children)) {
    const element = children as ReactElement<{ children?: ReactNode }>

    return getTextContent(element.props.children)
  }

  return ''
}
