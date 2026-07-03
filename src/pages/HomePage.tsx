import { ArrowRight, BookOpen, ListChecks, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function HomePage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-2">
            <p className="text-sm font-medium text-primary">Dashboard</p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-normal">
              Practice interview skills with focused TypeScript and full-stack
              lessons.
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              The full curriculum, problem runtime, progress tracking, and sync
              workflow will be added in the next checkpoints.
            </p>
          </div>
          <Button asChild>
            <Link to="/progress">
              View progress
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Play className="size-4 text-primary" />
              Continue
            </CardTitle>
            <CardDescription>Guided path entry point</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This card will route to the recommended lesson or selected focus
            lesson once the curriculum registry is wired.
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
          <CardContent className="text-sm text-muted-foreground">
            Algorithms, JS/TS core, React/frontend, backend/data, and production
            readiness will appear here.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4 text-primary" />
              Progress
            </CardTitle>
            <CardDescription>Local-first completion state</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Guest progress will start in localStorage, with Clerk and Convex sync
            added behind the same progress API.
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

