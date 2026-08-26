import { Link, NavLink } from 'react-router-dom'

import { primaryNavItems, trackPreviewItems } from '@/components/app/navigation'
import { lessons, tracks } from '@/curriculum'
import { cn } from '@/lib/cn'
import { useProgress } from '@/state/progressContext'

export function ProgressSidebar() {
  return (
    <aside className="hidden border-r px-3 py-5 md:block">
      <div className="sticky top-[4.75rem]">
        <PrimaryNavLinks />
        <div className="mt-7 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Tracks
        </div>
        <TrackNavList className="mt-2" />
      </div>
    </aside>
  )
}

export function PrimaryNavLinks() {
  return (
    <nav aria-label="Primary navigation" className="grid gap-0.5 text-sm">
      {primaryNavItems.map((item) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-1.5 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
              isActive && 'bg-accent font-medium text-accent-foreground',
            )
          }
          end={item.to === '/'}
          key={item.to}
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function TrackNavList({ className }: { className?: string }) {
  const progress = useProgress()

  return (
    <nav aria-label="Tracks" className={cn('grid gap-0.5 text-sm', className)}>
      {trackPreviewItems.map((item) => {
        const track = tracks.find((candidate) => candidate.id === item.id)
        const completion = track
          ? progress.getTrackCompletion(track, lessons, progress.state)
          : { completedLessons: 0, totalLessons: item.lessonCount }

        return (
          <Link
            className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            key={item.id}
            to="/progress"
          >
            <span className="truncate">{item.shortTitle}</span>
            <span className="text-xs tabular-nums">
              {completion.completedLessons}/{completion.totalLessons}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
