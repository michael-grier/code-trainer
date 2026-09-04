import type { FunctionReference } from 'convex/server'

import type { AppUser } from '@/state/authState'

type EmptyArgs = Record<string, never>

const functionName = Symbol.for('functionName')

function makeReference<ReturnType>(name: string) {
  return { [functionName]: name } as unknown as FunctionReference<
    'query',
    'public',
    EmptyArgs,
    ReturnType
  >
}

export const authApi = {
  getCurrentUser: makeReference<AppUser | null>('auth:getCurrentUser'),
}
