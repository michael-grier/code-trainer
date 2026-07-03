import { PanelLeft } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { primaryNavItems, trackPreviewItems } from '@/components/app/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/cn'

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="md:hidden" size="icon" type="button" variant="ghost">
          <PanelLeft className="size-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Code Trainer</SheetTitle>
          <SheetDescription>
            Navigate lessons, progress, and track previews.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <nav className="grid gap-1 p-3" aria-label="Primary navigation">
          {primaryNavItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground outline-none transition hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'bg-accent text-accent-foreground',
                )
              }
              end={item.to === '/'}
              key={item.to}
              to={item.to}
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Separator />
        <div className="grid gap-3 p-4">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Tracks
          </p>
          {trackPreviewItems.map((track) => (
            <div className="grid gap-1.5" key={track.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <track.icon className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{track.shortTitle}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {track.completedCount}/{track.lessonCount}
                </span>
              </div>
              <Progress value={0} />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

