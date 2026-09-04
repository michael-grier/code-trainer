import { trackDefinitions } from '@/curriculum/tracks'
import type { Lesson, Track } from '@/curriculum/types'

const lessonModules = import.meta.glob<{ lesson: Lesson }>(
  './lessons/*/index.ts',
  { eager: true },
)

export const lessons = Object.values(lessonModules)
  .map((module) => module.lesson)
  .sort((a, b) => a.order - b.order)

export const lessonsBySlug = Object.fromEntries(
  lessons.map((lesson) => [lesson.slug, lesson]),
) as Record<string, Lesson>

export const tracks: Track[] = trackDefinitions.map((track) => ({
  ...track,
  lessonSlugs: lessons
    .filter((lesson) => lesson.track === track.id)
    .map((lesson) => lesson.slug),
}))

export function getLesson(slug: string | undefined) {
  return slug ? lessonsBySlug[slug] : undefined
}

export function getProblem(lesson: Lesson | undefined, problemId: string | undefined) {
  if (!lesson || !problemId) {
    return undefined
  }

  return lesson.problems.find((problem) => problem.id === problemId)
}

export function getLessonsForTrack(trackId: string) {
  return lessons.filter((lesson) => lesson.track === trackId)
}

export function getTrack(trackId: string | undefined) {
  return tracks.find((track) => track.id === trackId)
}

export { isLessonAvailable } from '@/curriculum/types'
export type { Lesson, Problem, Track } from '@/curriculum/types'
