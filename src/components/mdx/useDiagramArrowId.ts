import { useId } from 'react'

export function useDiagramArrowId(prefix: string) {
  return `${prefix}-${useId().replaceAll(':', '')}`
}
