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
import { getLessonsForTrack, lessons, tracks } from '@/curriculum'
import { useProgress } from '@/state/progressContext'
import { getProblemKey } from '@/state/progress'

export function HomePage() {
  const progress = useProgress()
  const recommendedLesson = progress.recommendedLesson ?? lessons[0]
  const activeLesson = progress.activeLesson ?? recommendedLesson
  const recommendedProblem = progress.getRecommendedProblem(activeLesson, progress.state)
  const totalCompletedLessons = tracks.reduce((total, track) => {
    const completion = progress.getTrackCompletion(track, lessons, progress.state)

    return total + completion.completedLessons
  }, 0)
  const overallPercent =
    lessons.length === 0 ? 0 : Math.round((totalCompletedLessons / lessons.length) * 100)
  const isSelfDirected = progress.state.learningPath.mode === 'self-directed'
  const continueLabel = isSelfDirected ? 'Continue focus' : 'Continue'

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
              <Link to={`/lesson/${activeLesson.slug}`}>
                <Play className="size-4" />
                {continueLabel}
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
                <h2 className="font-semibold">{activeLesson.title}</h2>
                <Badge variant="outline">
                  {isSelfDirected ? 'Focus' : 'Next'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {activeLesson.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to={`/lesson/${activeLesson.slug}`}>
                  Open lesson
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to={`/lesson/${activeLesson.slug}/problem/${recommendedProblem.id}`}
                >
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
              <span className="text-4xl font-semibold">{overallPercent}%</span>
              <span className="text-sm text-muted-foreground">
                {totalCompletedLessons} / {lessons.length} lessons
              </span>
            </div>
            <Progress value={overallPercent} />
            <p className="text-sm text-muted-foreground">
              {progress.syncStatus === 'guest'
                ? 'Guest progress is saved locally in this browser.'
                : 'Signed-in progress uses a local cache until cloud sync is wired.'}
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
            {trackPreviewItems.map((track) => (
              <TrackProgressPreview key={track.id} trackId={track.id} />
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

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Curriculum preview
          </h2>
          <p className="text-sm text-muted-foreground">
            All placeholder lessons are registered and ready for content.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {tracks.map((track) => (
            <Card key={track.id}>
              <CardHeader>
                <CardTitle className="text-base">{track.title}</CardTitle>
                <CardDescription>{track.summary}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {getLessonsForTrack(track.id).map((lesson) => (
                  <Link
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    key={lesson.slug}
                    to={`/lesson/${lesson.slug}`}
                  >
                    <span className="min-w-0 truncate">
                      {lesson.order}. {lesson.title}
                    </span>
                    <Badge
                      variant={
                        progress.getLessonCompletion(lesson, progress.state).isComplete
                          ? 'default'
                          : 'muted'
                      }
                    >
                      {
                        lesson.problems.filter(
                          (problem) =>
                            progress.state.completed[
                              getProblemKey(lesson.slug, problem.id)
                            ],
                        ).length
                      }
                      /{lesson.problems.length}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function TrackProgressPreview({ trackId }: { trackId: string }) {
  const progress = useProgress()
  const track = tracks.find((item) => item.id === trackId)
  const preview = trackPreviewItems.find((item) => item.id === trackId)

  if (!track || !preview) {
    return null
  }

  const completion = progress.getTrackCompletion(track, lessons, progress.state)

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>{preview.shortTitle}</span>
        <span className="text-muted-foreground">
          {completion.completedLessons}/{completion.totalLessons}
        </span>
      </div>
      <Progress value={completion.percent} />
    </div>
  )
}
