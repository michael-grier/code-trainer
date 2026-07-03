import { NavLink } from 'react-router-dom'

import {
  primaryNavItems,
  trackPreviewItems,
  workspaceSummaryItems,
} from '@/components/app/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/cn'

export function ProgressSidebar() {
  return (
    <aside className="hidden border-r bg-muted/20 p-3 md:block">
      <div className="sticky top-[4.25rem] grid gap-3">
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Learning workspace</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1">
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
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              Curriculum
              <Badge variant="muted">Preview</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
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
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              {workspaceSummaryItems.map((item) => (
                <div className="rounded-md border bg-background p-2" key={item.label}>
                  <item.icon className="mb-2 size-4 text-primary" />
                  <div className="text-lg font-semibold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}

