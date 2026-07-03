import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ListChecks,
  Play,
  Route,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { trackPreviewItems } from '@/components/app/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function HomePage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <section className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-2">
            <Badge variant="outline">Dashboard</Badge>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-normal md:text-4xl">
              Interview practice for full-stack TypeScript engineers.
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Start with the guided path, inspect your curriculum map, and later
              sync progress across devices without blocking guest learning.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/lesson/arrays-and-hashing">
                <Play className="size-4" />
                Continue
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/progress">
                View map
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="size-5 text-primary" />
              Guided recommendation
            </CardTitle>
            <CardDescription>
              Defaults to the first incomplete lesson in curriculum order.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="font-semibold">Arrays and Hashing</h2>
                <Badge variant="outline">Next</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Use arrays, maps, and sets to solve lookup and frequency
                problems. Curriculum content is registered in checkpoint 3.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/lesson/arrays-and-hashing">
                  Open lesson
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/lesson/arrays-and-hashing/problem/foundation">
                  Open workspace
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              Overall progress
            </CardTitle>
            <CardDescription>Guest local state is wired next.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-semibold">0%</span>
              <span className="text-sm text-muted-foreground">
                0 / 60 lessons
              </span>
            </div>
            <Progress value={0} />
            <p className="text-sm text-muted-foreground">
              The progress API will update this immediately as problems are
              completed.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Play className="size-4 text-primary" />
              Continue
            </CardTitle>
            <CardDescription>Recommended or focused lesson</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The primary action will prefer a self-directed focus lesson when one
            is selected, otherwise the guided recommendation.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-primary" />
              Tracks
            </CardTitle>
            <CardDescription>Five structured learning areas</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {trackPreviewItems.slice(0, 3).map((track) => (
              <div className="grid gap-1.5" key={track.id}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>{track.shortTitle}</span>
                  <span className="text-muted-foreground">
                    {track.lessonCount} lessons
                  </span>
                </div>
                <Progress value={0} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4 text-primary" />
              Problem modes
            </CardTitle>
            <CardDescription>Interactive by kind</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {['Code', 'Debug', 'Refactor', 'Trace', 'Written', 'Design'].map(
              (kind) => (
                <Badge key={kind} variant="muted">
                  {kind}
                </Badge>
              ),
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

