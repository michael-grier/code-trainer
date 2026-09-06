import { createContext, useContext } from 'react'

import type { AppAuthSnapshot } from '@/state/authState'

export class AuthActionError extends Error {
  readonly code?: string
  readonly status?: number
  readonly retryAfterSeconds?: number

  constructor(
    message: string,
    details: { code?: string; status?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message)
    this.name = 'AuthActionError'
    this.code = details.code
    this.status = details.status
    this.retryAfterSeconds = details.retryAfterSeconds
  }
}

export type AppAuth = AppAuthSnapshot & {
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
  signOutAllDevices: () => Promise<void>
}

export const AuthContext = createContext<AppAuth | null>(null)

export function useAppAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAppAuth must be used within an auth provider.')
  }

  return value
}
