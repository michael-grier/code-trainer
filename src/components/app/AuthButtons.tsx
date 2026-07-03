import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react'
import { LogIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { isClerkConfigured } from '@/lib/env'

export function AuthButtons() {
  if (!isClerkConfigured) {
    return (
      <Button
        disabled
        title="Set VITE_CLERK_PUBLISHABLE_KEY to enable sign-in."
        type="button"
        variant="outline"
      >
        <LogIn className="size-4" />
        <span className="hidden sm:inline">Sign in to sync</span>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <Button type="button" variant="outline">
            <LogIn className="size-4" />
            <span className="hidden sm:inline">Sign in</span>
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button className="hidden sm:inline-flex" type="button">
            Join for sync
          </Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  )
}

