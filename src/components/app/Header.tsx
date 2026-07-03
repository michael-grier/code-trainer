import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AuthButtons } from '@/components/app/AuthButtons'
import { MobileNav } from '@/components/app/MobileNav'
import { SyncStatus } from '@/components/app/SyncStatus'
import { ThemeToggle } from '@/components/app/ThemeToggle'
import { Separator } from '@/components/ui/separator'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4">
        <MobileNav />
        <Link
          className="flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
          to="/"
        >
          <BookOpen className="size-5 text-primary" />
          <span>Code Trainer</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <SyncStatus />
          </div>
          <Separator className="hidden h-6 sm:block" orientation="vertical" />
          <ThemeToggle />
          <AuthButtons />
        </div>
      </div>
    </header>
  )
}

