import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'

import { SyntaxHighlightedCode } from '@/components/editor/SyntaxHighlightedCode'
import { cn } from '@/lib/cn'

export function MdxCodeBlock({
  children,
  className,
  ...props
}: ComponentProps<'pre'>) {
  const rawCode = getRawCode(children)

  if (!rawCode) {
    return (
      <pre
        className={cn(
          'mb-4 max-w-full overflow-x-auto rounded-md border bg-muted p-4 text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    )
  }

  return (
    <pre
      className={cn(
        'mb-4 max-w-full overflow-x-auto rounded-md border bg-muted p-4 text-sm leading-6',
        className,
      )}
      {...props}
    >
      <SyntaxHighlightedCode code={rawCode} />
    </pre>
  )
}

function getRawCode(children: ReactNode) {
  if (typeof children === 'string') {
    return children
  }

  const child = Children.toArray(children)[0]

  if (!isValidElement(child)) {
    return undefined
  }

  const codeElement = child as ReactElement<ComponentProps<'code'>>
  const codeChildren = codeElement.props.children

  if (typeof codeChildren === 'string') {
    return codeChildren
  }

  if (
    Array.isArray(codeChildren) &&
    codeChildren.every((part) => typeof part === 'string')
  ) {
    return codeChildren.join('')
  }

  return undefined
}
