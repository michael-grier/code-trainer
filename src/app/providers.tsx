import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster richColors closeButton />
    </ThemeProvider>
  )
}

