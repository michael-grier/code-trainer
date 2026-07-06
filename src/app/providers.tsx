import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ThemeProvider, useTheme } from 'next-themes'
import { useMemo, type ComponentProps, type ReactNode } from 'react'
import { Toaster } from 'sonner'

import { appEnv, isClerkConfigured, isConvexConfigured } from '@/lib/env'
import { ProgressProviderWithOptionalAuth } from '@/state/useProgress'

type AppProvidersProps = {
  children: ReactNode
}

type ClerkAppearance = NonNullable<
  ComponentProps<typeof ClerkProvider>['appearance']
>

const convex = isConvexConfigured
  ? new ConvexReactClient(appEnv.convexUrl)
  : null

function getClerkAppearance(resolvedTheme?: string): ClerkAppearance {
  const isDark = resolvedTheme === 'dark'

  return {
    captcha: {
      theme: isDark ? 'dark' : 'light',
    },
    elements: {
      card: {
        backgroundColor: 'var(--popover)',
        borderColor: 'var(--border)',
        color: 'var(--popover-foreground)',
      },
      cardBox: {
        boxShadow: isDark
          ? '0 24px 80px rgb(0 0 0 / 0.45)'
          : '0 24px 80px rgb(15 23 42 / 0.16)',
      },
      footerActionLink: {
        color: 'var(--primary)',
      },
      formButtonPrimary: {
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
      },
      formFieldInput: {
        backgroundColor: 'var(--background)',
        borderColor: 'var(--input)',
        color: 'var(--foreground)',
      },
      modalBackdrop: {
        backgroundColor: isDark
          ? 'rgb(0 0 0 / 0.64)'
          : 'rgb(15 23 42 / 0.36)',
      },
      modalContent: {
        colorScheme: isDark ? 'dark' : 'light',
      },
      rootBox: {
        colorScheme: isDark ? 'dark' : 'light',
      },
      userButtonPopoverActionButton: {
        color: 'var(--popover-foreground)',
        '&:hover': {
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-foreground)',
        },
      },
      userButtonPopoverCard: {
        backgroundColor: 'var(--popover)',
        borderColor: 'var(--border)',
        color: 'var(--popover-foreground)',
      },
    },
    variables: {
      borderRadius: '0.5rem',
      colorBackground: 'var(--popover)',
      colorBorder: 'var(--border)',
      colorDanger: 'var(--destructive)',
      colorForeground: 'var(--popover-foreground)',
      colorInput: 'var(--background)',
      colorInputForeground: 'var(--foreground)',
      colorMuted: 'var(--muted)',
      colorMutedForeground: 'var(--muted-foreground)',
      colorPrimary: 'var(--primary)',
      colorPrimaryForeground: 'var(--primary-foreground)',
      colorRing: 'var(--ring)',
      fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
      fontFamilyButtons:
        "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
    },
  }
}

function AuthAwareProviders({ children }: AppProvidersProps) {
  const { resolvedTheme } = useTheme()
  const clerkAppearance = useMemo(
    () => getClerkAppearance(resolvedTheme),
    [resolvedTheme],
  )

  const content = (
    <ProgressProviderWithOptionalAuth>{children}</ProgressProviderWithOptionalAuth>
  )

  if (!isClerkConfigured) {
    return content
  }

  if (!convex) {
    return (
      <ClerkProvider
        afterSignOutUrl="/"
        appearance={clerkAppearance}
        publishableKey={appEnv.clerkPublishableKey}
      >
        {content}
      </ClerkProvider>
    )
  }

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={clerkAppearance}
      publishableKey={appEnv.clerkPublishableKey}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {content}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthAwareProviders>{children}</AuthAwareProviders>
      <Toaster closeButton richColors />
    </ThemeProvider>
  )
}
