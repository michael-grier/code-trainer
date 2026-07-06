import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { getLessonsForTrack, lessons, tracks } from '@/curriculum'

export function ProgressPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <Badge variant="outline">Progress</Badge>
          <h1 className="text-3xl font-semibold tracking-normal">
            Curriculum map
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Track completion, guided recommendation, focus lesson selection, and
            filtering will be wired to the curriculum and progress state next.
          </p>
        </div>
        <Button type="button" variant="outline">
          <Search className="size-4" />
          Filter lessons
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Completed', '0'],
          ['In progress', '0'],
          ['Untouched', String(lessons.length)],
          ['Ahead of path', '0'],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="text-2xl font-semibold">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Track overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {tracks.map((track) => (
            <div className="grid gap-3" key={track.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium">{track.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {track.lessonSlugs.length} lessons planned
                    </p>
                  </div>
                </div>
                <Badge variant="muted">0% complete</Badge>
              </div>
              <Progress value={0} />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {getLessonsForTrack(track.id).map((lesson) => (
                  <Link
                    className="rounded-md border px-3 py-2 text-sm outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    key={lesson.slug}
                    to={`/lesson/${lesson.slug}`}
                  >
                    <span className="block truncate font-medium">
                      {lesson.order}. {lesson.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {lesson.problems.length} problems
                    </span>
                  </Link>
                ))}
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
