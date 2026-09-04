import { LogIn, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAppAuth } from '@/state/authContext'

export function AuthButtons() {
  const auth = useAppAuth()

  if (auth.status === 'authenticated' && auth.user) {
    return (
      <Button disabled title={auth.user.email} type="button" variant="outline">
        <UserRound className="size-4" />
        <span className="hidden max-w-48 truncate sm:inline">
          {auth.user.email}
        </span>
      </Button>
    )
  }

  const isLoading = auth.status === 'loading' || auth.status === 'refreshing'
  const title =
    auth.status === 'unconfigured'
      ? 'Set VITE_CONVEX_URL and the auth proxy to enable account sync.'
      : isLoading
        ? 'Checking authentication state.'
        : 'Email sign-in is temporarily unavailable while account sync initializes.'

  return (
    <Button disabled title={title} type="button" variant="outline">
      <LogIn className="size-4" />
      <span className="hidden sm:inline">
        {isLoading ? 'Checking' : 'Sign in to sync'}
      </span>
    </Button>
  )
}
