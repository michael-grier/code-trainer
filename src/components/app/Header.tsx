import { Link } from 'react-router-dom'

import { AuthButtons } from '@/components/app/AuthButtons'
import { MobileNav } from '@/components/app/MobileNav'
import { SyncStatus } from '@/components/app/SyncStatus'
import { ThemeToggle } from '@/components/app/ThemeToggle'
import { Badge } from '@/components/ui/badge'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-5">
        <MobileNav />
        <Link
          className="rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
          to="/"
        >
          Code Trainer
        </Link>
        <Badge
          aria-label="Work in progress"
          className="border border-border px-1.5 sm:px-2"
          variant="muted"
        >
          <span className="sm:hidden">WIP</span>
          <span className="hidden sm:inline">Work in progress</span>
        </Badge>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:block">
            <SyncStatus />
          </div>
          <ThemeToggle />
          <AuthButtons />
        </div>
      </div>
    </header>
  )
}
