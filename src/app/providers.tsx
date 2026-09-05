import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { ConvexReactClient } from 'convex/react'
import { ThemeProvider } from 'next-themes'
import type { ComponentProps, ReactNode } from 'react'
import { Toaster } from 'sonner'

import { authClient } from '@/lib/auth-client'
import { appEnv, isConvexConfigured } from '@/lib/env'
import { AppAuthProvider, UnconfiguredAuthProvider } from '@/state/authProviders'
import { ProgressProviderWithOptionalAuth } from '@/state/useProgress'

type AppProvidersProps = {
  children: ReactNode
}

const convex = isConvexConfigured
  ? new ConvexReactClient(appEnv.convexUrl)
  : null
type ProviderAuthClient = ComponentProps<
  typeof ConvexBetterAuthProvider
>['authClient']

// The component's published provider type resolves session data to `never`
// with Better Auth 1.6.30, although both packages share the same runtime API.
const providerAuthClient = authClient as unknown as ProviderAuthClient

function DataProviders({ children }: AppProvidersProps) {
  if (!convex) {
    return (
      <UnconfiguredAuthProvider>
        <ProgressProviderWithOptionalAuth>{children}</ProgressProviderWithOptionalAuth>
      </UnconfiguredAuthProvider>
    )
  }

  return (
    <ConvexBetterAuthProvider authClient={providerAuthClient} client={convex}>
      <AppAuthProvider>
        <ProgressProviderWithOptionalAuth>{children}</ProgressProviderWithOptionalAuth>
      </AppAuthProvider>
    </ConvexBetterAuthProvider>
  )
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DataProviders>{children}</DataProviders>
      <Toaster closeButton richColors />
    </ThemeProvider>
  )
}
