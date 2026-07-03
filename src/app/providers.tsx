import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { appEnv, isClerkConfigured, isConvexConfigured } from '@/lib/env'

type AppProvidersProps = {
  children: ReactNode
}

const convex = isConvexConfigured
  ? new ConvexReactClient(appEnv.convexUrl)
  : null

export function AppProviders({ children }: AppProvidersProps) {
  const content = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster closeButton richColors />
    </ThemeProvider>
  )

  if (!isClerkConfigured) {
    return content
  }

  if (!convex) {
    return (
      <ClerkProvider
        afterSignOutUrl="/"
        publishableKey={appEnv.clerkPublishableKey}
      >
        {content}
      </ClerkProvider>
    )
  }

  return (
    <ClerkProvider afterSignOutUrl="/" publishableKey={appEnv.clerkPublishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {content}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
