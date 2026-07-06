import type { FunctionReference, FunctionType } from 'convex/server'

import type {
  CloudProblemProgressRecord,
  CloudProgressSnapshot,
} from '@/state/cloudProgress'

type FunctionArgs = Record<string, unknown>
type EmptyArgs = Record<string, never>

const functionName = Symbol.for('functionName')

function makeReference<
  Type extends FunctionType,
  Args extends FunctionArgs,
  ReturnType,
>(name: string) {
  return { [functionName]: name } as unknown as FunctionReference<
    Type,
    'public',
    Args,
    ReturnType
  >
}

export const progressApi = {
  getProgress: makeReference<'query', EmptyArgs, CloudProgressSnapshot>(
    'progress:getProgress',
  ),
  mergeProgress: makeReference<
    'mutation',
    { progress: CloudProgressSnapshot },
    null
  >('progress:mergeProgress'),
  upsertProblemProgress: makeReference<
    'mutation',
    { problem: CloudProblemProgressRecord },
    null
  >('progress:upsertProblemProgress'),
  updateLastVisited: makeReference<
    'mutation',
    { lessonSlug: string; problemId?: string; updatedAt: number },
    null
  >('progress:updateLastVisited'),
  clearUserProgress: makeReference<'mutation', EmptyArgs, null>(
    'progress:clearUserProgress',
  ),
}
